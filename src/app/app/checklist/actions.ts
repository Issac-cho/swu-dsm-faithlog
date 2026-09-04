'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Toggle a checklist record
export async function toggleRecord(itemId: string, date: string, completed: boolean) {
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
