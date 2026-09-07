import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import LeaveCommunityButton from './LeaveCommunityButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('community_memberships')
    .select('role, community:communities(name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/app/community/join')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">내 정보 및 설정</h1>
        <p className="text-muted-foreground">계정 및 공동체 설정을 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공동체 탈퇴</CardTitle>
          <CardDescription>
            현재 소속된 <strong>{(membership.community as any)?.name}</strong> 공동체에서 탈퇴합니다.
            탈퇴 후에도 기록은 보존되지만, 공동체 대시보드와 나눔 피드에는 접근할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membership.role === 'admin' ? (
            <p className="text-sm text-destructive font-medium">
              관리자는 공동체를 탈퇴할 수 없습니다. 관리자 권한을 위임한 후 탈퇴해 주세요.
            </p>
          ) : (
            <LeaveCommunityButton communityName={(membership.community as any)?.name} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
