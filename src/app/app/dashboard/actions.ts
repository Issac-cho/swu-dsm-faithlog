'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateWeekProgress } from '@/utils/progress'
import { format, addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export async function claimPerfectWeekBonus(weekStartStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Validate community membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'No active community' }

  // 2. Double check if already claimed
  const { data: existing } = await supabase
    .from('talent_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('reason', 'PERFECT_WEEK_BONUS')
    .contains('metadata', { week_start: weekStartStr })
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) return { error: 'Already claimed' }

  // 3. Re-verify the week was actually perfect
  const weekStart = new Date(weekStartStr)
  const weekDaysStr = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  
  const { data: allItems } = await supabase
    .from('checklist_items')
    .select('id, name, type, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)

  const { data: weekRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('record_date', weekDaysStr[0])
    .lte('record_date', weekDaysStr[6])

  const progress = calculateWeekProgress(allItems || [], weekRecords || [], weekDaysStr)
  
  if (!progress.isPerfect) {
    return { error: '이번 주 올체크를 달성하지 못했습니다.' }
  }

  // 4. Get the bonus amount from policies
  const { data: policy } = await supabase
    .from('talent_policies')
    .select('talent_amount')
    .eq('community_id', membership.community_id)
    .eq('checklist_name', 'PERFECT_WEEK_BONUS')
    .single()

  const amount = policy?.talent_amount || 50

  // 5. Insert transaction (RPC not strictly needed since we can just insert and trigger updates user profile? 
  // Wait, insert into talent_transactions needs to update profiles.talents. 
  // Let's use the existing RPC if there is one, or just insert and let the trigger handle it.
  // Wait, we have a trigger `update_user_talents_on_transaction`!
  const { error: insertError } = await supabase
    .from('talent_transactions')
    .insert({
      user_id: user.id,
      community_id: membership.community_id,
      amount,
      reason: 'PERFECT_WEEK_BONUS',
      metadata: { week_start: weekStartStr }
    })

  if (insertError) return { error: insertError.message }

  revalidatePath('/app/dashboard')
  revalidatePath('/app/history')
  return { success: true }
}
