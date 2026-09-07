import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ProfileForm from './ProfileForm'
import LeaveCommunityButton from './LeaveCommunityButton'
import { UserCircle, Shield, Users } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_icon, created_at')
    .eq('id', user.id)
    .single()

  // Fetch membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('role, community:communities(name), cell:cells(name)')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-primary" />
          내 정보
        </h1>
        <p className="text-muted-foreground mt-1">프로필을 꾸미고 소속 정보를 확인하세요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 프로필</CardTitle>
          <CardDescription>나를 표현할 이모지와 이름을 설정해 보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm 
            initialName={profile?.name || ''} 
            initialAvatar={profile?.avatar_icon} 
          />
        </CardContent>
      </Card>

      {membership && (
        <Card>
          <CardHeader>
            <CardTitle>소속 정보</CardTitle>
            <CardDescription>현재 활동 중인 공동체 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 bg-muted p-4 rounded-xl">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">공동체</p>
                <p className="font-bold text-lg">{(membership.community as any)?.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 border p-3 rounded-xl">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">직책</p>
                  <p className="font-bold">{membership.role === 'admin' ? '관리자' : '일반'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 border p-3 rounded-xl">
                <div className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full font-bold text-xs">C</div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">소속 셀</p>
                  <p className="font-bold">{(membership.cell as any)?.name || '미배정'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {membership && membership.role !== 'admin' && (
        <Card className="border-destructive/20 bg-destructive/5 mt-12">
          <CardHeader>
            <CardTitle className="text-destructive">위험 구역 (Danger Zone)</CardTitle>
            <CardDescription>공동체에서 탈퇴하면 관련된 모든 정보(목양, 달란트 등)가 초기화될 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveCommunityButton communityName={(membership.community as any)?.name || '공동체'} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
