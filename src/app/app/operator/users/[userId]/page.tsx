import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function OperatorUserDetailPage({ params, searchParams }: { params: { userId: string }, searchParams: { communityId?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check operator
  const { data: operatorData } = await supabase
    .from('system_operators')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!operatorData) return <div className="p-4 text-center text-destructive">권한이 없습니다.</div>

  const targetUserId = params.userId
  const communityId = searchParams.communityId

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, created_at')
    .eq('id', targetUserId)
    .single()

  // Fetch Memberships
  const { data: memberships } = await supabase
    .from('community_memberships')
    .select('id, role, community:communities(name), cell:cells(name)')
    .eq('user_id', targetUserId)

  // Fetch Talent Transactions
  const { data: talentTx } = await supabase
    .from('talent_transactions')
    .select('amount, reason, created_at')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(50)

  const totalTalent = talentTx?.reduce((acc, curr) => acc + curr.amount, 0) || 0

  // Fetch Weekly Reflections
  const { data: reflections } = await supabase
    .from('weekly_reflections')
    .select('content_commit, content_review, created_at, week_start_date')
    .eq('user_id', targetUserId)
    .order('week_start_date', { ascending: false })
    .limit(10)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        {communityId ? (
          <Button variant="outline" asChild size="sm">
            <Link href={`/app/operator/communities/${communityId}/users`}>← 유저 목록</Link>
          </Button>
        ) : (
          <Button variant="outline" asChild size="sm">
            <Link href="/app/operator">← 운영자 홈</Link>
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{profile?.name} 님의 상세 정보</CardTitle>
            <CardDescription>가입일: {new Date(profile?.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold border-b pb-1 mb-2">소속 정보</h3>
              {memberships?.length === 0 ? (
                <p className="text-sm text-muted-foreground">소속된 공동체가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {memberships?.map(m => (
                    <li key={m.id} className="text-sm flex flex-col gap-1 bg-muted p-2 rounded">
                      <span className="font-bold">{(m.community as any)?.name}</span>
                      <div className="flex gap-2">
                        <span className="bg-primary/10 text-primary px-2 rounded-full text-xs">{m.role === 'admin' ? '관리자' : '일반'}</span>
                        <span className="text-muted-foreground">{(m.cell as any)?.name || '셀 미배정'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold border-b pb-1 mb-2">누적 달란트 (전체)</h3>
              <p className="text-2xl font-bold text-primary">{totalTalent.toLocaleString()} T</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 다짐/평가 (최대 10건)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {reflections?.length === 0 ? (
              <p className="text-sm text-muted-foreground">작성한 다짐/평가가 없습니다.</p>
            ) : (
              reflections?.map((r, i) => (
                <div key={i} className="bg-muted p-3 rounded-lg text-sm space-y-2">
                  <div className="font-bold text-xs text-muted-foreground">{r.week_start_date} 주간</div>
                  {r.content_commit && <div><span className="font-semibold">다짐:</span> {r.content_commit}</div>}
                  {r.content_review && <div className="text-primary"><span className="font-semibold">평가:</span> {r.content_review}</div>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 달란트 트랜잭션 (최대 50건)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>사유</TableHead>
                <TableHead className="text-right">변동 내역</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talentTx?.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</TableCell>
                  <TableCell>{tx.reason === 'CHECKLIST_COMPLETED' ? '체크리스트 달성' : tx.reason === 'CHECKLIST_UNCOMPLETED' ? '체크리스트 취소' : tx.reason}</TableCell>
                  <TableCell className={`text-right font-bold ${tx.amount > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} T
                  </TableCell>
                </TableRow>
              ))}
              {talentTx?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">내역이 없습니다.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
