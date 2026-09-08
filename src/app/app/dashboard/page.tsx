import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatInTimeZone } from 'date-fns-tz'
import { startOfWeek, format, addDays } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('community_memberships')
    .select('id, community_id, role, community:communities(name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  const today = new Date()
  const todayInKST = formatInTimeZone(today, 'Asia/Seoul', 'yyyy-MM-dd')
  
  // 1. Fetch today's checklist stats
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('is_active', true)
    .is('deleted_at', null)

  const itemIds = items?.map(i => i.id) || []

  const { data: todayRecords } = await supabase
    .from('checklist_records')
    .select('id')
    .eq('user_id', user.id)
    .in('checklist_item_id', itemIds.length > 0 ? itemIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('record_date', todayInKST)
    .eq('completed', true)

  const totalItems = items?.length || 0
  const completedItems = todayRecords?.length || 0
  const todayProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // 2. Fetch Cell Rankings using the RPC function
  let cellRankings = []
  const { data: rankingData, error: rankingError } = await supabase.rpc('get_cell_talent_totals', {
    p_community_id: membership.community_id
  })
  
  if (!rankingError && rankingData) {
    // Sort by total_talent descending
    cellRankings = rankingData.sort((a: any, b: any) => b.total_talent - a.total_talent)
  }

  // 3. Fetch Weekly Reflection
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const { data: reflection } = await supabase
    .from('weekly_reflections')
    .select('commitment')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('week_start_date', weekStartStr)
    .is('deleted_at', null)
    .single()

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">{(membership.community as any)?.name} 공동체에서의 영성생활</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 오늘의 체크리스트 요약 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>오늘의 체크리스트</CardTitle>
            <CardDescription>{todayInKST}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행률</span>
                <span className="font-bold">{todayProgress}% ({completedItems}/{totalItems})</span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-in-out" 
                  style={{ width: `${todayProgress}%` }}
                />
              </div>
            </div>
            <Link href="/app/checklist" className="w-full">
              <Button className="w-full">체크리스트 작성하기</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 이번 주 다짐 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>이번 주 다짐</CardTitle>
            <CardDescription>잊지 말고 실천해보세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg flex-1">
              {reflection?.commitment ? (
                <p className="text-sm whitespace-pre-wrap">{reflection.commitment}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">이번 주 다짐을 아직 작성하지 않았습니다.</p>
              )}
            </div>
            <Link href="/app/reflection" className="w-full">
              <Button variant="outline" className="w-full">다짐/평가 보러가기</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 셀 랭킹 (달란트) */}
        <Card className="flex flex-col md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>공동체 셀 랭킹</CardTitle>
            <CardDescription>우리 셀의 달란트 현황입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {cellRankings.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 랭킹 정보가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {cellRankings.map((cell: any, idx: number) => (
                  <li key={cell.cell_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold w-5 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium">{cell.cell_name}</span>
                    </div>
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                      {cell.total_talent} T
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
