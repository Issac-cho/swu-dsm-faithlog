'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { startOfWeek, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

function isDateInCurrentWeek(dateStr: string): boolean {
  const today = new Date()
  const todayInKST = formatInTimeZone(today, 'Asia/Seoul', 'yyyy-MM-dd')
  
  const [year, month, day] = todayInKST.split('-').map(Number)
  const localToday = new Date(year, month - 1, day)
  
  const weekStart = startOfWeek(localToday, { weekStartsOn: 0 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  return dateStr >= weekStartStr && dateStr <= todayInKST
}

// Toggle a checklist record
export async function toggleRecord(itemId: string, date: string, completed: boolean) {
  if (!isDateInCurrentWeek(date)) return { error: '수정 가능한 기간이 지났거나 유효하지 않은 날짜입니다.' }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('toggle_checklist_record', {
    p_item_id: itemId,
    p_date: date,
    p_completed: completed
  })

  if (error) return { error: error.message }

  revalidatePath('/app/checklist')
  revalidatePath('/app/dashboard')
  return { success: true }
}

// Update checklist record memo
export async function updateRecordMemo(itemId: string, date: string, memo: string) {
  if (!isDateInCurrentWeek(date)) return { error: '수정 가능한 기간이 지났거나 유효하지 않은 날짜입니다.' }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if record exists
  const { data: existing } = await supabase
    .from('checklist_records')
    .select('id')
    .eq('user_id', user.id)
    .eq('checklist_item_id', itemId)
    .eq('record_date', date)
    .single()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('checklist_records')
      .update({ memo, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    
    if (error) return { error: error.message }
  } else {
    // Insert new with completed = false
    const { error } = await supabase
      .from('checklist_records')
      .insert({
        user_id: user.id,
        checklist_item_id: itemId,
        record_date: date,
        completed: false,
        memo
      })
      
    if (error) return { error: error.message }
  }

  revalidatePath('/app/checklist')
  revalidatePath('/app/history')
  return { success: true }
}

// Add a custom item
export async function addCustomItem(communityId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get max sort_order
  const { data: items } = await supabase
    .from('checklist_items')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = items && items.length > 0 ? items[0].sort_order + 1 : 5

  const { error } = await supabase.from('checklist_items').insert({
    user_id: user.id,
    community_id: communityId,
    name,
    type: 'CUSTOM',
    sort_order: nextOrder
  })

  if (error) return { error: error.message }
  
  revalidatePath('/app/checklist')
  return { success: true }
}

// Disable a custom item (instead of deleting to keep history)
export async function disableCustomItem(itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('checklist_items')
    .update({ is_active: false })
    .eq('id', itemId)
    .eq('type', 'CUSTOM') // ensure only custom can be deleted

  if (error) return { error: error.message }
  
  revalidatePath('/app/checklist')
  return { success: true }
}
