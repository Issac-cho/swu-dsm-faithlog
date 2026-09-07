import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, LayoutGrid, ShieldAlert, Activity } from 'lucide-react'

export default async function OperatorHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check operator
  const { data: operatorData } = await supabase
    .from('system_operators')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!operatorData) {
    return (
      <div className="p-4 md:p-6 text-center text-destructive font-bold">
        시스템 운영자 권한이 없습니다.
      </div>
    )
  }

  // Fetch Global Stats
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalCommunities } = await supabase.from('communities').select('*', { count: 'exact', head: true })
  const { count: totalCells } = await supabase.from('cells').select('*', { count: 'exact', head: true })

  // Fetch All Communities with member count
  const { data: communities } = await supabase
    .from('communities')
    .select('id, name, join_password, created_at')
    .order('created_at', { ascending: true })

  // We need to count members per community manually since PostgREST count joins can be tricky
  // Let's just fetch all memberships and group them
  const { data: allMemberships } = await supabase
    .from('community_memberships')
    .select('community_id')

  const memberCounts: Record<string, number> = {}
  allMemberships?.forEach(m => {
    memberCounts[m.community_id] = (memberCounts[m.community_id] || 0) + 1
  })

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold text-destructive">시스템 운영자 대시보드</h1>
          <p className="text-muted-foreground">모든 공동체와 유저 데이터를 열람하고 통제합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Users className="w-8 h-8 text-destructive mb-2" />
            <div className="text-3xl font-bold">{totalUsers}명</div>
            <div className="text-sm text-muted-foreground">전체 누적 가입자</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <LayoutGrid className="w-8 h-8 text-primary mb-2" />
            <div className="text-3xl font-bold">{totalCommunities}개</div>
            <div className="text-sm text-muted-foreground">개설된 공동체</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Activity className="w-8 h-8 text-orange-500 mb-2" />
            <div className="text-3xl font-bold">{totalCells}개</div>
            <div className="text-sm text-muted-foreground">생성된 소그룹(셀)</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">공동체 목록</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {communities?.map(community => (
            <Card key={community.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{community.name}</span>
                  <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {memberCounts[community.id] || 0}명
                  </span>
                </CardTitle>
                <CardDescription>
                  가입 비밀번호: <strong className="text-foreground">{community.join_password || '없음'}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/app/operator/communities/${community.id}/users`}>
                    👥 유저 조회
                  </Link>
                </Button>
                <Button variant="destructive" className="flex-1" asChild>
                  <Link href={`/app/operator/communities/${community.id}/manage`}>
                    ⚙️ 강제 통제
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {communities?.length === 0 && (
            <p className="text-muted-foreground py-8 text-center col-span-2">생성된 공동체가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
