import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, addMonths, subMonths, addYears, subYears, format, isSameMonth, subDays, eachDayOfInterval } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HistoryTabs from './HistoryTabs'
import DateJumpHeader from './DateJumpHeader'

function DonutChart({ percentage }: { percentage: number }) {
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-8 h-8 mx-auto">
      <svg className="w-8 h-8 transform -rotate-90">
        <circle
          className="text-muted-foreground/20"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="16"
          cy="16"
        />
        {percentage > 0 && (
          <circle
            className="text-primary transition-all duration-500 ease-in-out"
            strokeWidth="4"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="16"
            cy="16"
          />
        )}
      </svg>
    </div>
  )
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string; userId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const activeTab = resolvedSearchParams.tab || 'weekly'
  const targetUserId = resolvedSearchParams.userId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date()
  const todayInKST = formatInTimeZone(today, 'Asia/Seoul', 'yyyy-MM-dd')
  
  // Determine whose data we are looking at
  const queryUserId = targetUserId || user.id

  // If looking at someone else, fetch their name
  let targetUserName = ''
  if (targetUserId && targetUserId !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', targetUserId)
      .single()
    if (profile) {
      targetUserName = profile.name
    }
  }

  // Check my membership (to ensure I'm logged in and in a community)
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  // Common data
  const { data: allItems } = await supabase
    .from('checklist_items')
    .select('id, name, type, is_active, created_at, updated_at, sort_order')
    .eq('user_id', queryUserId)
    .order('sort_order', { ascending: true })

  const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Target date for both tabs
  const dateParam = resolvedSearchParams.date || todayInKST
  const targetDate = new Date(`${dateParam}T12:00:00Z`)


  // --- WEEKLY TAB LOGIC ---
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
  const weekDaysStr = weekDays.map(d => format(d, 'yyyy-MM-dd'))
  const weekRangeStr = `${format(weekDays[0], 'yyyy.MM.dd')} ~ ${format(weekDays[6], 'yyyy.MM.dd')}`
  
  const prevWeekStr = format(subDays(weekStart, 7), 'yyyy-MM-dd')
  const nextWeekStr = format(addDays(weekStart, 7), 'yyyy-MM-dd')

  const activeWeeklyItems = allItems?.filter(item => item.is_active) || []

  const { data: weekRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', queryUserId)
    .gte('record_date', weekDaysStr[0])
    .lte('record_date', weekDaysStr[6])

  const weeklyRecordMap = new Map<string, boolean>()
  weekRecords?.forEach(record => {
    weeklyRecordMap.set(`${record.checklist_item_id}-${record.record_date}`, record.completed)
  })

  // --- MONTHLY TAB LOGIC ---
  const currentMonthDate = targetDate
  
  const prevMonthStr = format(subMonths(currentMonthDate, 1), 'yyyy-MM-dd')
  const nextMonthStr = format(addMonths(currentMonthDate, 1), 'yyyy-MM-dd')

  const monthStart = startOfMonth(currentMonthDate)
  const monthEnd = endOfMonth(currentMonthDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const { data: monthRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', queryUserId)
    .gte('record_date', format(calendarStart, 'yyyy-MM-dd'))
    .lte('record_date', format(calendarEnd, 'yyyy-MM-dd'))

  const monthlyProgressMap = new Map<string, { percentage: number; total: number }>()

  calendarDays.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const activeItemsForDay = allItems?.filter(item => {
      if (item.type === 'SYSTEM') return true
      const createdStr = formatInTimeZone(new Date(item.created_at), 'Asia/Seoul', 'yyyy-MM-dd')
      const updatedStr = formatInTimeZone(new Date(item.updated_at), 'Asia/Seoul', 'yyyy-MM-dd')
      if (createdStr > dayStr) return false
      if (!item.is_active && updatedStr < dayStr) return false
      return true
    }) || []

    const total = activeItemsForDay.length
    const dayRecords = monthRecords?.filter(r => r.record_date === dayStr && r.completed) || []
    const completed = dayRecords.filter(r => activeItemsForDay.some(ai => ai.id === r.checklist_item_id)).length
    
    const percentage = total > 0 ? (completed / total) * 100 : 0
    monthlyProgressMap.set(dayStr, { percentage, total })
  })

  // --- YEARLY TAB LOGIC ---
  const currentYearDate = targetDate
  
  const prevYearStr = format(subYears(currentYearDate, 1), 'yyyy-MM-dd')
  const nextYearStr = format(addYears(currentYearDate, 1), 'yyyy-MM-dd')

  const yearStart = startOfYear(currentYearDate)
  const yearEnd = endOfYear(currentYearDate)
  const yearlyCalendarStart = startOfWeek(yearStart, { weekStartsOn: 0 })
  const yearlyCalendarEnd = endOfWeek(yearEnd, { weekStartsOn: 0 })

  const yearlyDays = eachDayOfInterval({ start: yearlyCalendarStart, end: yearlyCalendarEnd })

  let yearRecords: any[] = []
  if (activeTab === 'yearly') {
    const { data } = await supabase
      .from('checklist_records')
      .select('checklist_item_id, record_date, completed')
      .eq('user_id', queryUserId)
      .gte('record_date', format(yearlyCalendarStart, 'yyyy-MM-dd'))
      .lte('record_date', format(yearlyCalendarEnd, 'yyyy-MM-dd'))
      .limit(10000)
    yearRecords = data || []
  }

  const yearlyProgressMap = new Map<string, { percentage: number; total: number }>()

  if (activeTab === 'yearly') {
    yearlyDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const activeItemsForDay = allItems?.filter(item => {
        if (item.type === 'SYSTEM') return true
        const createdStr = formatInTimeZone(new Date(item.created_at), 'Asia/Seoul', 'yyyy-MM-dd')
        const updatedStr = formatInTimeZone(new Date(item.updated_at), 'Asia/Seoul', 'yyyy-MM-dd')
        if (createdStr > dayStr) return false
        if (!item.is_active && updatedStr < dayStr) return false
        return true
      }) || []

      const total = activeItemsForDay.length
      const dayRecords = yearRecords?.filter(r => r.record_date === dayStr && r.completed) || []
      const completed = dayRecords.filter(r => activeItemsForDay.some(ai => ai.id === r.checklist_item_id)).length
      
      const percentage = total > 0 ? (completed / total) * 100 : 0
      yearlyProgressMap.set(dayStr, { percentage, total })
    })
  }

  const yearlyWeeks = []
  for (let i = 0; i < yearlyDays.length; i += 7) {
    yearlyWeeks.push(yearlyDays.slice(i, i + 7))
  }

  const buildUrl = (tab: string, date: string) => {
    let url = `?tab=${tab}&date=${date}`
    if (targetUserId) {
      url += `&userId=${targetUserId}`
    }
    return url
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{targetUserName ? `${targetUserName} 님의 기록` : '기록 및 통계'}</h1>
      </div>

      <div className="w-full">
        <HistoryTabs currentTab={activeTab} />

        <div className="mt-6">
          {activeTab === 'weekly' && (
            <div className="space-y-4">
              <DateJumpHeader
                type="weekly"
                currentYear={targetDate.getFullYear()}
                currentMonth={targetDate.getMonth() + 1}
                currentDay={targetDate.getDate()}
                prevUrl={buildUrl('weekly', prevWeekStr)}
                nextUrl={buildUrl('weekly', nextWeekStr)}
                label={weekRangeStr}
              />
              <div className="overflow-x-auto select-none">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted/50 w-24"></th>
                      {headers.map((h, i) => (
                        <th key={i} className="border p-2 text-center font-medium bg-muted/50 w-10">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeWeeklyItems.map(item => (
                      <tr key={item.id}>
                        <td className="border p-2 font-medium text-sm text-center">{item.name}</td>
                        {weekDaysStr.map(dateStr => {
                          const completed = weeklyRecordMap.get(`${item.id}-${dateStr}`)
                          const isPast = dateStr < todayInKST

                          let cellContent = ''
                          if (completed) {
                            cellContent = 'o'
                          } else if (isPast) {
                            cellContent = 'x'
                          }

                          return (
                            <td key={dateStr} className="border p-2 text-center font-medium">
                              {cellContent === 'o' && <span className="text-green-600">o</span>}
                              {cellContent === 'x' && <span className="text-red-500">x</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    {activeWeeklyItems.length === 0 && (
                      <tr>
                        <td colSpan={8} className="border p-4 text-center text-sm text-muted-foreground">
                          설정된 영성생활 항목이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="space-y-4 select-none">
              <DateJumpHeader
                type="monthly"
                currentYear={targetDate.getFullYear()}
                currentMonth={targetDate.getMonth() + 1}
                currentDay={targetDate.getDate()}
                prevUrl={buildUrl('monthly', prevMonthStr)}
                nextUrl={buildUrl('monthly', nextMonthStr)}
                label={`${format(currentMonthDate, 'yyyy')}년 ${format(currentMonthDate, 'M')}월`}
              />

              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-7 bg-muted/50 border-b">
                  {headers.map((h, i) => (
                    <div key={i} className="p-2 text-center font-medium text-sm">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd')
                    const isCurrentMonth = isSameMonth(day, currentMonthDate)
                    const data = monthlyProgressMap.get(dayStr)
                    const progress = data?.percentage || 0
                    const hasItems = (data?.total || 0) > 0
                    
                    return (
                      <Link 
                        key={i} 
                        href={buildUrl('weekly', dayStr)}
                        className={`border-b border-r min-h-[80px] p-1 flex flex-col items-center hover:bg-muted/30 transition-colors ${!isCurrentMonth ? 'bg-muted/20 opacity-50' : ''}`}
                      >
                        <div className="text-xs text-center text-muted-foreground mb-1 w-full">
                          {format(day, 'd')}
                        </div>
                        {hasItems && <DonutChart percentage={progress} />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yearly' && (
            <div className="space-y-6 select-none pb-12">
              <DateJumpHeader
                type="yearly"
                currentYear={targetDate.getFullYear()}
                currentMonth={targetDate.getMonth() + 1}
                currentDay={targetDate.getDate()}
                prevUrl={buildUrl('yearly', prevYearStr)}
                nextUrl={buildUrl('yearly', nextYearStr)}
                label={`${format(currentYearDate, 'yyyy')}년`}
              />
              
              <div className="flex flex-col gap-1.5 items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-10"></div>
                  {headers.map((h, i) => (
                    <div key={i} className="w-7 h-7 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {h}
                    </div>
                  ))}
                </div>
                
                {yearlyWeeks.map((week, i) => {
                  const firstDayOfMonth = week.find(d => d.getDate() === 1 && d.getFullYear() === currentYearDate.getFullYear())
                  const monthLabel = firstDayOfMonth ? format(firstDayOfMonth, 'MMM').toUpperCase() : ''
                  
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-10 text-[10px] font-bold text-muted-foreground text-right pr-2">
                        {monthLabel}
                      </div>
                      {week.map((day, j) => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const isCurrentYear = day.getFullYear() === currentYearDate.getFullYear()
                        
                        if (!isCurrentYear) {
                          return <div key={j} className="w-7 h-7 bg-transparent" />
                        }
                        
                        const data = yearlyProgressMap.get(dayStr)
                        const percentage = data?.percentage || 0
                        const hasItems = (data?.total || 0) > 0
                        let bgColor = 'bg-[#FFFFFF] border-border/50 border'
                        if (hasItems) {
                          if (percentage === 0) bgColor = 'bg-[#FFFFFF] border-border/50 border'
                          else if (percentage <= 10) bgColor = 'bg-[#FFF9FB] border-border/50 border'
                          else if (percentage <= 20) bgColor = 'bg-[#FFF3F7] border-border/50 border'
                          else if (percentage <= 30) bgColor = 'bg-[#FFEEF4] border-border/50 border'
                          else if (percentage <= 40) bgColor = 'bg-[#FDE1E9] border-border/50 border'
                          else if (percentage <= 50) bgColor = 'bg-[#FACDD9] border-border/50 border'
                          else if (percentage <= 60) bgColor = 'bg-[#F6B5C7] border-border/50 border'
                          else if (percentage <= 70) bgColor = 'bg-[#F29BB3] border-border/50 border'
                          else if (percentage <= 80) bgColor = 'bg-[#EE809F] border-border/50 border'
                          else if (percentage <= 90) bgColor = 'bg-[#EB6D94] border-border/50 border'
                          else bgColor = 'bg-[#E85D8C] border-border/50 border'
                        }
                        
                        return (
                          <div 
                            key={j}
                            className={`w-7 h-7 rounded-sm ${bgColor}`}
                            title={`${dayStr}: ${Math.round(percentage)}%`}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
