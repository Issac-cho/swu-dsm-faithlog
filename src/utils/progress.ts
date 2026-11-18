import { formatInTimeZone } from 'date-fns-tz'

export type ProgressItem = {
  id: string
  type: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}
export type ProgressRecord = {
  checklist_item_id: string
  record_date: string
  completed: boolean
  deleted_at?: string | null
}

export function getActiveItemsForDay(allItems: ProgressItem[], dayStr: string) {
  return allItems.filter(item => {
    const created = formatInTimeZone(new Date(item.created_at), 'Asia/Seoul', 'yyyy-MM-dd')
    if (created > dayStr) return false
    // A date-only record cannot distinguish changes within the same day.
    const endedAt = item.deleted_at || (!item.is_active ? item.updated_at : null)
    return !endedAt || formatInTimeZone(new Date(endedAt), 'Asia/Seoul', 'yyyy-MM-dd') >= dayStr
  })
}

export function calculateDayProgress(allItems: ProgressItem[], dayRecords: ProgressRecord[], dayStr: string) {
  const active = getActiveItemsForDay(allItems, dayStr)
  const ids = new Set(active.map(item => item.id))
  const completed = new Set(dayRecords.filter(record =>
    record.record_date === dayStr && record.completed && !record.deleted_at && ids.has(record.checklist_item_id)
  ).map(record => record.checklist_item_id)).size
  const total = active.length
  return { percentage: total ? completed / total * 100 : 0, total, completed }
}

export function calculateWeekProgress(allItems: ProgressItem[], weekRecords: ProgressRecord[], weekDaysStr: string[]) {
  const days = weekDaysStr.map(day => calculateDayProgress(allItems, weekRecords, day))
  const total = days.reduce((sum, day) => sum + day.total, 0)
  const completed = days.reduce((sum, day) => sum + day.completed, 0)
  return { percentage: total ? completed / total * 100 : 0, total, completed, isPerfect: total > 0 && completed === total }
}
