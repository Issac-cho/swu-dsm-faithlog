import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ChecklistItemComponent from './ChecklistItem'
import CustomItemForm from './CustomItemForm'
import WeekDayNav from './WeekDayNav'
import { formatInTimeZone } from 'date-fns-tz'
import { format, subDays } from 'date-fns'

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const resolvedParams = await searchParams
  
  // Use KST for today's date
  const todayInKST = formatInTimeZone(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')
  
  // 7-day rolling window: 6 days ago ~ today
  const [y, m, d] = todayInKST.split('-').map(Number)
  const localToday = new Date(y, m - 1, d)
  const minDate = format(subDays(localToday, 6), 'yyyy-MM-dd')
  
  // Build the 7-day array (oldest → today)
  const recentDays = Array.from({ length: 7 }).map((_, i) =>
    format(subDays(localToday, 6 - i), 'yyyy-MM-dd')
  )

  // Validate requested date — must be within [today-6, today]
  const requestedDate = resolvedParams.date
  const date = (requestedDate && requestedDate >= minDate && requestedDate <= todayInKST)
    ? requestedDate
    : todayInKST

  // Get active membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  // Check for active bonus policy on the selected date
  const { data: activeBonus } = await supabase
    .from('talent_policies')
    .select('bonus_title, bonus_start_date, bonus_end_date')
    .eq('community_id', membership.community_id)
    .eq('is_bonus', true)
    .lte('bonus_start_date', date)
    .gte('bonus_end_date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get items
  const { data: items } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  // Get records for the selected date
  const { data: records } = await supabase
    .from('checklist_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_date', date)

  const recordsMap = records?.reduce((acc, record) => {
    acc[record.checklist_item_id] = record
    return acc
  }, {} as Record<string, any>) || {}

  const isToday = date === todayInKST

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">체크리스트</h1>
        <p className="text-muted-foreground">
          {isToday ? '오늘의 신앙생활' : `${date} 신앙생활`}
        </p>
      </div>

      {/* 7-Day Rolling Navigator */}
      <WeekDayNav recentDays={recentDays} selectedDate={date} todayStr={todayInKST} />

      <Card className={`relative overflow-hidden transition-all duration-300 ${activeBonus ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md ring-1 ring-yellow-400/50' : ''}`}>
        {activeBonus && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm animate-pulse">
            보너스 기간!
          </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle>{isToday ? '오늘의 기록' : `${date} 기록`}</CardTitle>
              <CardDescription>매일의 신앙생활을 기록하고 달란트를 받으세요.</CardDescription>
            </div>
            {activeBonus && (
              <div className="text-right flex-shrink-0 mt-3 sm:mt-0 pr-1">
                <div className="text-sm font-bold text-yellow-700 flex items-center justify-end">
                  ✨ {activeBonus.bonus_title} ✨
                </div>
                <div className="text-[10px] text-yellow-700/70 font-medium">
                  {activeBonus.bonus_start_date} ~ {activeBonus.bonus_end_date}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {items?.map((item) => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              date={date}
              record={recordsMap[item.id]}
            />
          ))}
          {(!items || items.length === 0) && (
            <p className="text-sm text-muted-foreground">체크리스트가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>커스텀 항목 추가</CardTitle>
          <CardDescription>개인적으로 관리하고 싶은 신앙생활을 추가하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomItemForm communityId={membership.community_id} />
        </CardContent>
      </Card>
    </div>
  )
}
