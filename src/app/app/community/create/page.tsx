import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CreateCommunityClient from './CreateCommunityClient'

export default async function CreateCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Already in a community → redirect
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) redirect('/app/dashboard')

  return <CreateCommunityClient />
}
