import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ChevronLeft, History, ShieldAlert } from 'lucide-react'

export default async function AllUsersPage() {
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

  // Fetch all profiles with their memberships
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id, 
      name, 
      avatar_icon, 
      created_at,
      memberships:community_memberships(
        role,
        community:communities(name),
        cell:cells(name)
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/app/operator">
          <Button variant="outline" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">전체 가입자 목록</h1>
          <p className="text-muted-foreground text-sm">서비스에 가입한 모든 사용자와 소속 정보를 확인합니다.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>가입자 명단 (총 {profiles?.length || 0}명)</CardTitle>
          <CardDescription>가입일 기준 최신순으로 정렬되어 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>소속 정보 (공동체 / 직책 / 소속 셀)</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((profile: any) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{profile.avatar_icon || '👤'}</span>
                        <span className="font-medium">{profile.name || '이름 없음'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(profile.created_at), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      {profile.memberships && profile.memberships.length > 0 ? (
                        <div className="space-y-1">
                          {profile.memberships.map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="font-semibold text-primary">
                                {m.community?.name || '알 수 없음'}
                              </Badge>
                              {m.role === 'admin' ? (
                                <Badge variant="default" className="bg-destructive hover:bg-destructive text-[10px] h-5">관리자</Badge>
                              ) : m.role === 'sub_admin' ? (
                                <Badge variant="default" className="bg-orange-500 hover:bg-orange-500 text-[10px] h-5">부관리자</Badge>
                              ) : null}
                              <span className="text-muted-foreground text-xs">
                                {m.cell?.name ? `(${m.cell.name})` : '(셀 미배정)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">가입된 공동체 없음</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/app/history?userId=${profile.id}`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <History className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">기록</span>
                          </Button>
                        </Link>
                        <Link href={`/app/operator/users/${profile.id}`}>
                          <Button variant="destructive" size="sm" className="h-8 gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">관리</span>
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {profiles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      가입한 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
