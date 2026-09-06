import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { startOfWeek, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import ReflectionForm from './ReflectionForm'

export default async function ReflectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  // Calculate current week's Sunday
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  // Fetch this week's reflection
  const { data: reflection } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('week_start_date', weekStartStr)
    .single()

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">주간 다짐 및 평가</h1>
        <p className="text-muted-foreground">{formatInTimeZone(weekStart, 'Asia/Seoul', 'yyyy년 MM월 dd일')} 시작 주간</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>주간 다짐</CardTitle>
            <CardDescription>이번 주 영성생활의 목표와 다짐을 적어보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReflectionForm
              communityId={membership.community_id}
              weekStartDate={weekStartStr}
              type="commitment"
              initialContent={reflection?.commitment || ''}
              placeholder="예: 이번 주는 매일 아침 10분씩 큐티를 하고, 셀 모임에 꼭 참석하겠습니다."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주간 평가</CardTitle>
            <CardDescription>주말에 지난 한 주를 돌아보며 성찰과 감사의 제목을 적어보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReflectionForm
              communityId={membership.community_id}
              weekStartDate={weekStartStr}
              type="review"
              initialContent={reflection?.review || ''}
              placeholder="예: 바쁜 일정 속에서도 수요일에 기도 시간을 가진 것이 참 감사했습니다."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
