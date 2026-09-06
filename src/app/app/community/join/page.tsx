import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import JoinCommunityClient from './JoinCommunityClient'

export default async function JoinCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('community_memberships')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) {
    redirect('/app/dashboard')
  }

  return <JoinCommunityClient />
}
