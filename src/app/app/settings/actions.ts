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
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'Not in a community' }
  if (membership.role === 'admin') return { error: '관리자는 공동체를 탈퇴할 수 없습니다.' }

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
