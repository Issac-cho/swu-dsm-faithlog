'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveReflection(
  communityId: string,
  weekStartDate: string,
  type: 'commitment' | 'review',
  content: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Upsert reflection
  const { error } = await supabase
    .from('weekly_reflections')
    .upsert({
      user_id: user.id,
      community_id: communityId,
      week_start_date: weekStartDate,
      [type]: content,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, community_id, week_start_date' })

  if (error) return { error: error.message }

  revalidatePath('/app/reflection')
  return { success: true }
}
