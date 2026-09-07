import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronRight } from 'lucide-react'

export default async function OperatorCommunityUsersPage({ params }: { params: { id: string } }) {
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
    return <div className="p-4 text-center text-destructive">권한이 없습니다.</div>
  }

  const communityId = params.id

  // Fetch Community Info
  const { data: community } = await supabase
    .from('communities')
    .select('name')
    .eq('id', communityId)
    .single()

  if (!community) return <div className="p-4 text-center">공동체를 찾을 수 없습니다.</div>

  // Fetch all members with their profile and cell info
  const { data: members } = await supabase
    .from('community_memberships')
    .select('id, user_id, role, created_at, cell:cells(name), profile:profiles(name, id)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/app/operator" className={buttonVariants({ variant: "outline", size: "sm" })}>
          ← 운영자 홈
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{community.name} - 유저 목록</h1>
          <p className="text-muted-foreground">총 {members?.length || 0}명의 유저가 소속되어 있습니다.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>직책</TableHead>
                <TableHead>소속 셀</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="text-right">상세 조회</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{(member.profile as any)?.name || '알 수 없음'}</TableCell>
                  <TableCell>
                    {member.role === 'admin' ? (
                      <span className="text-primary font-bold bg-primary/10 px-2 py-1 rounded-md text-xs">관리자</span>
                    ) : (
                      <span className="text-muted-foreground">일반</span>
                    )}
                  </TableCell>
                  <TableCell>{(member.cell as any)?.name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/app/operator/users/${member.user_id}?communityId=${communityId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      조회 <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {members?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    유저가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
