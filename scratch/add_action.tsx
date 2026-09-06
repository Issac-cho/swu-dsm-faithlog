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

  if (membership?.role !== 'admin') {
    return { error: '관리자 권한이 없습니다.' }
  }

  // Update password
  const { error } = await supabase
    .from('communities')
    .update({ join_password: password || null })
    .eq('id', communityId)

  if (error) return { error: error.message }

  revalidatePath('/app/admin')
  return { success: true }
}
