import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createCell } from './actions'
import CellAssigner from './CellAssigner'
import AdminShepherdManager from './AdminShepherdManager'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin access
  const { data: myMembership } = await supabase
    .from('community_memberships')
    .select('community_id, role, community:communities(name)')
    .eq('user_id', user.id)
    .single()

  if (!myMembership || myMembership.role !== 'admin') {
    return (
      <div className="p-4 md:p-6 text-center text-destructive">
        관리자 권한이 없습니다.
      </div>
    )
  }

  const communityId = myMembership.community_id
  const communityName = myMembership.community?.name || ''

  // Fetch cells
  const { data: cells } = await supabase
    .from('cells')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })

  // Fetch all members in this community
  const { data: members } = await supabase
    .from('community_memberships')
    .select('id, user_id, role, cell_id, profile:profiles(name)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })

  // Transform members for shepherd manager
  const flatMembers = members?.map(m => ({
    id: m.id,
    user_id: m.user_id,
    name: m.profile?.name || '이름 없음',
  })) || []

  // Fetch shepherd relationships for this community
  // We can get this by joining or simply getting all relationships where shepherd or sheep is in the community
  const memberIds = flatMembers.map(m => m.user_id)
  const { data: relationships } = await supabase
    .from('shepherd_relationships')
    .select('*')
    .in('shepherd_id', memberIds)

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
        <p className="text-muted-foreground">{communityName} 공동체 관리</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>셀 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCell} className="flex gap-2">
              <input type="hidden" name="communityId" value={communityId} />
              <Input name="name" placeholder="새로운 셀 이름 (예: 1셀)" required />
              <Button type="submit">추가</Button>
            </form>
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">현재 셀 목록</h3>
              {cells?.length === 0 ? (
                <p className="text-sm">생성된 셀이 없습니다.</p>
              ) : (
                <ul className="list-disc list-inside text-sm">
                  {cells?.map((cell) => (
                    <li key={cell.id}>{cell.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>공동체 인원 및 셀 배정</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>소속 셀</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profile?.name || '이름 없음'}
                    </TableCell>
                    <TableCell>
                      {member.role === 'admin' ? '관리자' : '일반 멤버'}
                    </TableCell>
                    <TableCell>
                      <CellAssigner
                        membershipId={member.id}
                        currentCellId={member.cell_id}
                        cells={cells || []}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AdminShepherdManager members={flatMembers} relationships={relationships || []} />

        {/* 달란트 정책 설정 (MVP) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>달란트 정책</CardTitle>
            <CardDescription>공동체의 기본 영성생활 항목 달성 시 지급되는 달란트를 설정합니다. (향후 업데이트 예정)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">현재 버전에선 DB 초기화 시 기본값(10점)이 자동 부여됩니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
