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

  if (membership?.role !== 'admin') {
    return { error: '관리자 권한이 없습니다.' }
  }

  const { error } = await supabase
    .from('cells')
    .insert({ community_id: communityId, name })

  if (error) return { error: error.message }

  revalidatePath('/app/admin')
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

  if (!targetMembership) return { error: '멤버십을 찾을 수 없습니다.' }

  // Check if current user is admin of that community
  const { data: myMembership } = await supabase
    .from('community_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('community_id', targetMembership.community_id)
    .single()

  if (myMembership?.role !== 'admin') {
    return { error: '관리자 권한이 없습니다.' }
  }

  const { error } = await supabase
    .from('community_memberships')
    .update({ cell_id: cellId })
    .eq('id', membershipId)

  if (error) return { error: error.message }

  revalidatePath('/app/admin')
  return { success: true }
}

export async function assignShepherd(shepherdId: string, sheepId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('shepherd_relationships').insert({
    shepherd_id: shepherdId,
    sheep_id: sheepId
  })
  if (error) return { error: error.message }
  revalidatePath('/app/admin')
  return { success: true }
}

export async function removeShepherd(relId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('shepherd_relationships').delete().eq('id', relId)
  if (error) return { error: error.message }
  revalidatePath('/app/admin')
  return { success: true }
}

export async function updateTalentPolicy(policyId: string, amount: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('talent_policies').update({ talent_amount: amount }).eq('id', policyId)
  if (error) return { error: error.message }
  revalidatePath('/app/admin')
  return { success: true }
}
