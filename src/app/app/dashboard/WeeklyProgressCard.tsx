import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { calculateWeekProgress } from '@/utils/progress'
import { startOfWeek, format, addDays } from 'date-fns'
import ClaimBonusButton from './ClaimBonusButton'

export default async function WeeklyProgressCard({ userId, communityId }: { userId: string, communityId: string }) {
  const supabase = await createClient()

  // 1. Calculate current week progress
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const currentWeekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekDaysStr = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))

  const { data: allItems } = await supabase
    .from('checklist_items')
    .select('id, name, type, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .is('deleted_at', null)

  const { data: weekRecords } = await supabase
    .from('checklist_records')
    .select('checklist_item_id, record_date, completed')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('record_date', weekDaysStr[0])
    .lte('record_date', weekDaysStr[6])

  const progress = calculateWeekProgress(allItems || [], weekRecords || [], weekDaysStr)
  
  // 2. Check if current week bonus is claimed
  const { data: claimedCurrentWeek } = await supabase
    .from('talent_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .eq('reason', 'PERFECT_WEEK_BONUS')
    .contains('metadata', { week_start: currentWeekStartStr })
    .is('deleted_at', null)
    .maybeSingle()

  // 3. Find ANY past unclaimed weeks (retroactive check support)
  // We look back up to 2 weeks (since max retroactive is 7 days, checking 2 weeks back is enough)
  const pastUnclaimedWeeks: string[] = []
  
  for (let i = 1; i <= 2; i++) {
    const pastWeekStart = addDays(weekStart, -7 * i)
    const pastWeekStartStr = format(pastWeekStart, 'yyyy-MM-dd')
    const pastWeekDaysStr = Array.from({ length: 7 }).map((_, j) => format(addDays(pastWeekStart, j), 'yyyy-MM-dd'))
    
    // Check if it was claimed
    const { data: claimedPast } = await supabase
      .from('talent_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .eq('reason', 'PERFECT_WEEK_BONUS')
      .contains('metadata', { week_start: pastWeekStartStr })
      .is('deleted_at', null)
      .maybeSingle()
      
    if (!claimedPast) {
      // Check if it was perfect
      const { data: pastRecords } = await supabase
        .from('checklist_records')
        .select('checklist_item_id, record_date, completed')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('record_date', pastWeekDaysStr[0])
        .lte('record_date', pastWeekDaysStr[6])
        
      const pastProgress = calculateWeekProgress(allItems || [], pastRecords || [], pastWeekDaysStr)
      if (pastProgress.isPerfect && pastProgress.total > 0) {
        pastUnclaimedWeeks.push(pastWeekStartStr)
      }
    }
  }

  const roundedPercentage = Math.round(progress.percentage)

  return (
    <Card className="flex flex-col border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>주간 달성률 (올체크 도전!)</CardTitle>
        <CardDescription>{weekDaysStr[0]} ~ {weekDaysStr[6]}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        
        {pastUnclaimedWeeks.length > 0 && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded-md text-sm mb-2 shadow-sm">
            <p className="font-bold mb-1">🎁 앗! 미수령 보상이 있어요</p>
            <p>지난주 올체크 보상을 아직 받지 않으셨습니다.</p>
            <ClaimBonusButton weekStart={pastUnclaimedWeeks[0]} />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>이번 주 전체 진행률</span>
            <span className="font-bold text-primary">{roundedPercentage}%</span>
          </div>
          <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${roundedPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            ({progress.completed}/{progress.total} 항목 완료)
          </p>
        </div>

        {progress.isPerfect && progress.total > 0 && !claimedCurrentWeek && (
          <ClaimBonusButton weekStart={currentWeekStartStr} />
        )}
        
        {progress.isPerfect && progress.total > 0 && claimedCurrentWeek && (
          <div className="text-center py-2 text-sm font-bold text-green-600 bg-green-50 rounded-md">
            🎉 이번 주 올체크 보상 수령 완료!
          </div>
        )}
        
        {!progress.isPerfect && (
          <div className="text-center py-2 text-sm text-muted-foreground bg-background rounded-md border">
            100% 달성 시 보너스 달란트 지급!
          </div>
        )}

      </CardContent>
    </Card>
  )
}
