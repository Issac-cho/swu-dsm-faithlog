'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Create a new cell
export async function createCell(formData: FormData) {
  const name = formData.get('name') as string
  const communityId = formData.get('communityId') as string

  if (!name || !communityId) return { error: '이름과 공동체 ID가 필요합니다.' }

  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('community_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .single()

  if (!['admin', 'sub_admin'].includes(membership?.role)) {
    return { error: '관리자 권한이 없습니다.' }
  }

  const { error } = await supabase
    .from('cells')
    .insert({ community_id: communityId, name })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

// Assign user to a cell
export async function assignUserToCell(membershipId: string, cellId: string | null) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get the target membership to know which community it belongs to
  const { data: targetMembership } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('id', membershipId)
    .single()

  if (!targetMembership) return { error: '멤버를 찾을 수 없습니다.' }

  // Check if current user is admin of that community
  const { data: myMembership } = await supabase
    .from('community_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('community_id', targetMembership.community_id)
    .single()

  if (!['admin', 'sub_admin'].includes(myMembership?.role)) {
    return { error: '관리자 권한이 없습니다.' }
  }

  const { error } = await supabase
    .from('community_memberships')
    .update({ cell_id: cellId })
    .eq('id', membershipId)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function assignShepherd(shepherdId: string, sheepId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('shepherd_relationships').insert({
    shepherd_id: shepherdId,
    sheep_id: sheepId
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function removeShepherd(relId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('shepherd_relationships').delete().eq('id', relId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateTalentPolicy(policyId: string, amount: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('talent_policies').update({ talent_amount: amount }).eq('id', policyId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateCommunityPassword(formData: FormData) {
  const password = formData.get('password') as string
  const communityId = formData.get('communityId') as string

  if (!communityId) return { error: '커뮤니티 ID가 없습니다.' }

  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('community_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .single()

  if (!['admin', 'sub_admin'].includes(membership?.role)) {
    return { error: '관리자 권한이 없습니다.' }
  }

  // Update password
  const { error } = await supabase
    .from('communities')
    .update({ join_password: password || null })
    .eq('id', communityId)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
export async function removeMember(membershipId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('community_memberships').delete().eq('id', membershipId)
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}


export async function changeMemberRole(membershipId: string, newRole: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  const { data: targetMembership } = await supabase.from('community_memberships').select('community_id, role').eq('id', membershipId).single();
  if (!targetMembership) return { error: '멤버를 찾을 수 없습니다.' };
  
  const { data: operatorData } = await supabase.from('system_operators').select('user_id').eq('user_id', user.id).maybeSingle();
  const isOperator = !!operatorData;
  
  const { data: myMembership } = await supabase.from('community_memberships').select('role').eq('user_id', user.id).eq('community_id', targetMembership.community_id).maybeSingle();
  if (myMembership?.role !== 'admin' && !isOperator) return { error: '직책 임명/해제는 최고 관리자 또는 운영자만 가능합니다.' };
  if (targetMembership.role === 'admin' && newRole !== 'admin') return { error: '최고 관리자의 직책은 변경할 수 없습니다.' };
  const { error } = await supabase.from('community_memberships').update({ role: newRole }).eq('id', membershipId);
  if (error) return { error: error.message };
  revalidatePath('/app/admin');
  revalidatePath('/app/operator');
  return { success: true };
}