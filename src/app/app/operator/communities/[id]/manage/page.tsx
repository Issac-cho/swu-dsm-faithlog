import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { createCell } from '@/app/app/admin/actions'
import CellAssigner from '@/app/app/admin/CellAssigner'
import AdminShepherdManager from '@/app/app/admin/AdminShepherdManager'
import TalentPolicyManager from '@/app/app/admin/TalentPolicyManager'
import CommunitySettings from '@/app/app/admin/CommunitySettings'
import RemoveMemberButton from '@/app/app/admin/RemoveMemberButton'

export default async function OperatorCommunityManagePage({ params }: { params: { id: string } }) {
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

  const communityId = params.id

  // Fetch community details
  const { data: communityInfo } = await supabase
    .from('communities')
    .select('name, join_password')
    .eq('id', communityId)
    .single()

  if (!communityInfo) return <div className="p-4 text-center">공동체를 찾을 수 없습니다.</div>

  // Fetch cells
  const { data: cells } = await supabase
    .from('cells')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })

  // Fetch all members
  const { data: members } = await supabase
    .from('community_memberships')
    .select('id, user_id, role, cell_id, profile:profiles(name)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })

  const flatMembers = members?.map(m => ({
    id: m.id,
    user_id: m.user_id,
    name: (m.profile as any)?.name || '이름 없음',
  })) || []

  const memberIds = flatMembers.map(m => m.user_id)
  
  let relationships: any[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('shepherd_relationships')
      .select('*')
      .in('shepherd_id', memberIds)
    relationships = data || []
  }

  // Fetch talent policies
  const { data: policies } = await supabase
    .from('talent_policies')
    .select('*')
    .eq('community_id', communityId)
    .order('checklist_name', { ascending: true })

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" asChild size="sm">
          <Link href="/app/operator">← 운영자 홈</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{communityInfo.name} - 강제 통제 모드</h1>
          <p className="text-destructive font-medium text-sm">운영자 권한으로 외부에서 공동체 설정을 직접 변경 중입니다.</p>
        </div>
      </div>

      <CommunitySettings communityId={communityId} initialPassword={communityInfo.join_password || ''} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>새 셀 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => { 'use server'; await createCell(fd) }} className="flex gap-2">
              <input type="hidden" name="communityId" value={communityId} />
              <Input name="name" placeholder="새로운 셀 이름 (예: 1조)" required />
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
                  <TableHead>관리 (강퇴)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {(member.profile as any)?.name || '이름 없음'}
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
                    <TableCell>
                      {/* Operator can remove anyone, even admins? The RemoveMemberButton deletes membership. */}
                      <RemoveMemberButton 
                        membershipId={member.id} 
                        memberName={(member.profile as any)?.name || '이름 없음'} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AdminShepherdManager members={flatMembers} relationships={relationships} />

        <TalentPolicyManager policies={policies || []} />
      </div>
    </div>
  )
}
