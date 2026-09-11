import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { createCell } from './actions'
import CellAssigner from './CellAssigner'
import CellManager from './CellManager'
import AdminShepherdManager from './AdminShepherdManager'
import TalentPolicyManager from './TalentPolicyManager'
import ResetTalentsButton from './ResetTalentsButton'
import CommunitySettings from './CommunitySettings'
import RemoveMemberButton from './RemoveMemberButton'
import ChangeRoleButton from './ChangeRoleButton'

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
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!myMembership || !['admin', 'sub_admin'].includes(myMembership.role)) {
    return (
      <div className="p-4 md:p-6 text-center text-destructive">
        관리자 권한이 없습니다.
      </div>
    )
  }

  const communityId = myMembership.community_id
  // Fetch community details
  const { data: communityInfo } = await supabase
    .from('communities')
    .select('name, join_password')
    .eq('id', communityId)
    .single()

  const communityName = communityInfo?.name || ''
  const joinPassword = communityInfo?.join_password || ''

  // Fetch cells
  const { data: cells } = await supabase
    .from('cells')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })

  // Fetch all members in this community
  const { data: members } = await supabase
    .from('community_memberships')
    .select('id, user_id, role, cell_id, profile:profiles(name, avatar_icon)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })

  // Transform members for shepherd manager
  const flatMembers = members?.map(m => ({
    id: m.id,
    user_id: m.user_id,
    name: (m.profile as any)?.name || '이름 없음',
    avatar_icon: (m.profile as any)?.avatar_icon || '👤',
  })) || []

  // Fetch shepherd relationships for this community
  const memberIds = flatMembers.map(m => m.user_id)
  const { data: relationships } = await supabase
    .from('shepherd_relationships')
    .select('*')
    .in('shepherd_id', memberIds)

  // Fetch talent policies
  const { data: policies } = await supabase
    .from('talent_policies')
    .select('*')
    .eq('community_id', communityId)
    .order('checklist_name', { ascending: true })

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
        <p className="text-muted-foreground">{communityName} 공동체 관리</p>
      </div>

      <CommunitySettings communityId={communityId} initialPassword={joinPassword} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>셀 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => { 'use server'; await createCell(fd) }} className="flex gap-2">
              <input type="hidden" name="communityId" value={communityId} />
              <Input name="name" placeholder="새로운 셀 이름 (예: 1셀)" required />
              <Button type="submit">추가</Button>
            </form>
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">현재 셀 목록</h3>
              <CellManager cells={cells || []} />
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

                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => {
                  const profile = member.profile as any
                  const name = profile?.name || '이름 없음'
                  const avatar = profile?.avatar_icon || '👤'
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <span className="text-xl">{avatar}</span>
                        <span>{name}</span>
                      </TableCell>
                      <TableCell>
                        {member.role === 'admin' ? (
                          <span className="font-bold text-primary">관리자</span>
                        ) : member.role === 'sub_admin' ? (
                          <span className="font-semibold text-blue-600">부관리자</span>
                        ) : '일반 멤버'}
                      </TableCell>
                      <TableCell>
                        <CellAssigner
                          membershipId={member.id}
                          currentCellId={member.cell_id}
                          cells={cells || []}
                        />
                      </TableCell>

                      <TableCell className="space-x-1">
                        {myMembership.role === 'admin' && member.role !== 'admin' && (
                          <ChangeRoleButton
                            membershipId={member.id}
                            currentRole={member.role}
                            memberName={name}
                          />
                        )}
                        {(myMembership.role === 'admin' || member.role === 'member') && member.role !== 'admin' && (
                          <RemoveMemberButton 
                            membershipId={member.id} 
                            memberName={name} 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AdminShepherdManager members={flatMembers} relationships={relationships || []} />

        <TalentPolicyManager policies={policies || []} />

        {/* 달란트 초기화 */}
        <div className="md:col-span-2 border border-destructive/30 rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">달란트 전체 초기화</h3>
            <p className="text-xs text-muted-foreground mt-1">
              공동체 전체 멤버의 달란트를 0으로 초기화합니다. 체크리스트 기록은 보존됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <ResetTalentsButton communityId={communityId} />
        </div>
      </div>
    </div>
  )
}
