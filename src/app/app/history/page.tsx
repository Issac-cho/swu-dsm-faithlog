import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addMonths, subMonths, format, isSameMonth, eachDayOfInterval } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HistoryTabs from './HistoryTabs'

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
  searchParams: Promise<{ tab?: string; month?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const activeTab = resolvedSearchParams.tab || 'weekly'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date()
  const todayInKST = formatInTimeZone(today, 'Asia/Seoul', 'yyyy-MM-dd')
  
  // Check membership
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
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  // --- WEEKLY TAB LOGIC ---
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
  const weekDaysStr = weekDays.map(d => format(d, 'yyyy-MM-dd'))
  const weekRangeStr = `${format(weekDays[0], 'yyyy.MM.dd')} ~ ${format(weekDays[6], 'yyyy.MM.dd')}`
  const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const activeWeeklyItems = allItems?.filter(item => item.is_active) || []

  const { data: weekRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', user.id)
    .gte('record_date', weekDaysStr[0])
    .lte('record_date', weekDaysStr[6])

  const weeklyRecordMap = new Map<string, boolean>()
  weekRecords?.forEach(record => {
    weeklyRecordMap.set(`${record.checklist_item_id}-${record.record_date}`, record.completed)
  })

  // --- MONTHLY TAB LOGIC ---
  const currentMonthParam = resolvedSearchParams.month || formatInTimeZone(today, 'Asia/Seoul', 'yyyy-MM')
  const currentMonthDate = new Date(`${currentMonthParam}-01T12:00:00Z`)
  
  const prevMonthStr = format(subMonths(currentMonthDate, 1), 'yyyy-MM')
  const nextMonthStr = format(addMonths(currentMonthDate, 1), 'yyyy-MM')

  const monthStart = startOfMonth(currentMonthDate)
  const monthEnd = endOfMonth(currentMonthDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const { data: monthRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', user.id)
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

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">기록 및 통계</h1>
      </div>

      <div className="w-full">
        <HistoryTabs currentTab={activeTab} />

        <div className="mt-6">
          {activeTab === 'weekly' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">{weekRangeStr}</h2>
              <div className="overflow-x-auto">
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
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-muted-foreground">
                  {format(currentMonthDate, 'yyyy')}년
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`?tab=monthly&month=${prevMonthStr}`}>
                    <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
                  </Link>
                  <h2 className="text-xl font-bold w-12 text-center">{format(currentMonthDate, 'M')}월</h2>
                  <Link href={`?tab=monthly&month=${nextMonthStr}`}>
                    <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
                  </Link>
                </div>
                <div className="w-10"></div> {/* Spacer for alignment */}
              </div>

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
                      <div key={i} className={`border-b border-r min-h-[80px] p-1 ${!isCurrentMonth ? 'bg-muted/20 opacity-50' : ''}`}>
                        <div className="text-xs text-center text-muted-foreground mb-1">
                          {format(day, 'd')}
                        </div>
                        {hasItems && <DonutChart percentage={progress} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yearly' && (
            <div className="p-8 text-center text-muted-foreground border rounded-md">
              연간 통계 기능은 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
