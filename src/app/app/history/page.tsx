import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { startOfWeek, addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export default async function HistoryPage() {
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

  // Weekly History Logic
  // Sunday start week (0)
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
  const weekDaysStr = weekDays.map(d => format(d, 'yyyy-MM-dd'))
  const weekRangeStr = `${format(weekDays[0], 'yyyy.MM.dd')} ~ ${format(weekDays[6], 'yyyy.MM.dd')}`
  const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: weekRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', user.id)
    .gte('record_date', weekDaysStr[0])
    .lte('record_date', weekDaysStr[6])

  // Map records for O(1) lookup
  const recordMap = new Map<string, boolean>()
  weekRecords?.forEach(record => {
    recordMap.set(`${record.checklist_item_id}-${record.record_date}`, record.completed)
  })

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">기록 및 통계</h1>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
          <TabsTrigger value="yearly">연간</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
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
                  {items?.map(item => (
                    <tr key={item.id}>
                      <td className="border p-2 font-medium text-sm text-center">{item.name}</td>
                      {weekDaysStr.map(dateStr => {
                        const completed = recordMap.get(`${item.id}-${dateStr}`)
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
                  {(!items || items.length === 0) && (
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
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          {/* 빈 페이지 */}
        </TabsContent>

        <TabsContent value="yearly" className="mt-6">
          {/* 빈 페이지 */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
