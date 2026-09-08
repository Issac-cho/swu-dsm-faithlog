import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { startOfWeek, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import ReflectionForm from './ReflectionForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

  // Fetch this week's reflection for current user
  const { data: reflection } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('week_start_date', weekStartStr)
    .is('deleted_at', null)
    .single()

  // Fetch ALL reflections for the community this week
  const { data: allReflections, error: allReflectionsError } = await supabase
    .from('weekly_reflections')
    .select(`
      *,
      profiles:user_id (
        name,
        avatar_icon
      )
    `)
    .eq('community_id', membership.community_id)
    .eq('week_start_date', weekStartStr)
    .order('updated_at', { ascending: false })

  if (allReflectionsError) {
    console.error('Error fetching all reflections:', allReflectionsError)
  }

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
              placeholder="예) 이번 주는 매일 아침 10분씩 큐티를 하고, 셀 모임에 꼭 참석하겠습니다."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주간 평가</CardTitle>
            <CardDescription>주말이 되면 한 주를 돌아보며 성찰과 감사의 제목을 적어보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReflectionForm
              communityId={membership.community_id}
              weekStartDate={weekStartStr}
              type="review"
              initialContent={reflection?.review || ''}
              placeholder="예) 바쁜 일정 속에서도 수요일에 기도 시간을 가진 것이 참 감사했습니다."
            />
          </CardContent>
        </Card>
      </div>

      {/* Community Feed */}
      <div className="mt-12 space-y-6">
        <div>
          <h2 className="text-xl font-bold">공동체 나눔</h2>
          <p className="text-sm text-muted-foreground">우리 공동체 구성원들의 이번 주 다짐과 평가입니다.</p>
        </div>
        
        <div className="space-y-6 bg-muted/30 p-4 rounded-xl">
          {allReflections?.map((ref) => {
            const isMe = ref.user_id === user.id
            const profile = ref.profiles as any
            const name = profile?.name || '이름 없음'
            const avatar = profile?.avatar_icon || '👤'
            
            // Skip rendering if both are empty
            if (!ref.commitment && !ref.review) return null

            return (
              <div key={ref.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="w-10 h-10 border rounded-full shrink-0 flex items-center justify-center bg-muted text-xl shadow-sm">
                  {avatar}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-muted-foreground mb-1 px-1">{name}</span>
                  <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-background border rounded-tl-sm'
                  }`}>
                    {ref.commitment && (
                      <div className="mb-2 last:mb-0">
                        <span className="font-semibold text-xs opacity-70">다짐 :</span>
                        <div className="mt-0.5">{ref.commitment}</div>
                      </div>
                    )}
                    {ref.review && (
                      <div>
                        <span className="font-semibold text-xs opacity-70">평가 :</span>
                        <div className="mt-0.5">{ref.review}</div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {formatInTimeZone(new Date(ref.updated_at), 'Asia/Seoul', 'MM.dd HH:mm')}
                  </span>
                </div>
              </div>
            )
          })}
          
          {allReflectionsError && (
            <div className="text-red-500 p-4 border border-red-500 rounded bg-red-50">
              Error: {allReflectionsError.message}
              <br />
              Details: {allReflectionsError.details}
            </div>
          )}

          {(!allReflections || allReflections.length === 0 || allReflections.every(r => !r.commitment && !r.review)) && !allReflectionsError && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              아직 작성된 나눔이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
