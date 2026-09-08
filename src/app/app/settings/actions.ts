'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function leaveCommunity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch user's membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('id, role, community_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'Not in a community' }
  if (membership.role === 'admin') return { error: '관리자는 공동체를 탈퇴할 수 없습니다.' }

  const communityId = membership.community_id;

  // Soft delete checklist items
  await supabase
    .from('checklist_items')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .is('deleted_at', null);

  // Soft delete talent_transactions
  await supabase
    .from('talent_transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .is('deleted_at', null);

  // Soft delete weekly_reflections
  await supabase
    .from('weekly_reflections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .is('deleted_at', null);

  // Delete membership
  const { error } = await supabase
    .from('community_memberships')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true, redirectUrl: '/app/community/join' }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const avatarIcon = formData.get('avatarIcon') as string

  if (!name || name.trim().length === 0) {
    return { error: '이름을 입력해주세요.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ name: name.trim(), avatar_icon: avatarIcon })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
