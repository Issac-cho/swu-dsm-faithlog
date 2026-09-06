'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function searchCommunities(query: string) {
  if (!query || query.trim() === '') return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('communities')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .limit(20)
  return data || []
}

export async function joinCommunityAction(communityId: string, passwordInput?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  // Check password
  const { data: community } = await supabase
    .from('communities')
    .select('join_password')
    .eq('id', communityId)
    .single()

  if (!community) return { error: '커뮤니티를 찾을 수 없습니다.' }

  if (community.join_password && community.join_password !== passwordInput) {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }

  const { error } = await supabase.from('community_memberships').insert({
    community_id: communityId,
    user_id: user.id,
    role: 'member'
  })

  if (error) {
    if (error.code === '23505') return { error: '이미 가입되어 있습니다.' }
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function createCommunityAction(name: string) {
  if (!name) return { error: '이름을 입력해주세요.' }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  const { data: community, error: createError } = await supabase
    .from('communities')
    .insert({ name })
    .select()
    .single()

  if (createError || !community) return { error: createError?.message || '생성 실패' }

  const { error: memberError } = await supabase.from('community_memberships').insert({
    community_id: community.id,
    user_id: user.id,
    role: 'admin',
  })

  if (memberError) return { error: memberError.message }

  revalidatePath('/app')
  return { success: true }
}
