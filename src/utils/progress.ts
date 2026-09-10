import { formatInTimeZone } from 'date-fns-tz'

export function getActiveItemsForDay(allItems: any[], dayStr: string) {
  return allItems?.filter(item => {
    const createdStr = formatInTimeZone(new Date(item.created_at), 'Asia/Seoul', 'yyyy-MM-dd')
    if (createdStr > dayStr) return false
    
    const updatedStr = formatInTimeZone(new Date(item.updated_at), 'Asia/Seoul', 'yyyy-MM-dd')
    if (!item.is_active && updatedStr < dayStr) return false
    return true
  }) || []
}

export function calculateDayProgress(allItems: any[], dayRecords: any[], dayStr: string) {
  const activeItemsForDay = getActiveItemsForDay(allItems, dayStr)
  const total = activeItemsForDay.length
  
  if (total === 0) return { percentage: 0, total: 0, completed: 0 }
  
  const completed = dayRecords.filter(r => 
    r.record_date === dayStr && 
    r.completed && 
    activeItemsForDay.some(ai => ai.id === r.checklist_item_id)
  ).length
  
  const percentage = (completed / total) * 100
  return { percentage, total, completed }
}

export function calculateWeekProgress(allItems: any[], weekRecords: any[], weekDaysStr: string[]) {
  let totalWeekItems = 0
  let totalCompletedWeekItems = 0
  
  for (const dayStr of weekDaysStr) {
    // Only count days up to today? 
    // Wait, if it's in the future, activeItemsForDay might be > 0.
    // If we want 100% week progress, they must complete all days Mon-Sun.
    // So future days will just have 0 completed, reducing the week progress from 100%. That's correct for Perfect Week!
    const { total, completed } = calculateDayProgress(allItems, weekRecords, dayStr)
    totalWeekItems += total
    totalCompletedWeekItems += completed
  }

  const percentage = totalWeekItems > 0 ? (totalCompletedWeekItems / totalWeekItems) * 100 : 0
  return {
    percentage,
    total: totalWeekItems,
    completed: totalCompletedWeekItems,
    isPerfect: totalWeekItems > 0 && totalCompletedWeekItems === totalWeekItems
  }
}
