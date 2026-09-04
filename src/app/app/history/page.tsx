import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { startOfWeek, addDays, format, subDays, getDay } from 'date-fns'
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
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  // Weekly History Logic
  // Monday start week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
  const weekDaysStr = weekDays.map(d => format(d, 'yyyy-MM-dd'))

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
        <p className="text-muted-foreground">나의 영성생활 발자취를 돌아봅니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>이번 주 기록</CardTitle>
          <CardDescription>이번 주 월요일부터 일요일까지의 진행 상황입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left font-medium bg-muted/50">항목</th>
                  {weekDays.map(d => (
                    <th key={d.toString()} className={`border p-2 text-center font-medium ${format(d, 'yyyy-MM-dd') === todayInKST ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      {format(d, 'MM/dd')}
                      <div className="text-xs text-muted-foreground font-normal">
                        {['일', '월', '화', '수', '목', '금', '토'][getDay(d)]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items?.map(item => (
                  <tr key={item.id}>
                    <td className="border p-2 font-medium">{item.name}</td>
                    {weekDaysStr.map(dateStr => {
                      const completed = recordMap.get(`${item.id}-${dateStr}`)
                      return (
                        <td key={dateStr} className="border p-2 text-center">
                          {completed ? (
                            <span className="text-green-600 font-bold">O</span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* TODO: Add Monthly, Quarterly, Yearly views here */}
      <Card>
        <CardHeader>
          <CardTitle>월간/연간 통계 (준비 중)</CardTitle>
          <CardDescription>달력 및 Heatmap 형태의 시각화가 곧 제공될 예정입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">이 기능은 다음 업데이트에서 제공됩니다.</p>
        </CardContent>
      </Card>
    </div>
  )
}
