import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default async function DirectoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch my membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('community_id, community:communities(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  // Fetch all members in this community
  const { data: members } = await supabase
    .from('community_memberships')
    .select('user_id, role, cell:cells(name), profile:profiles(name, avatar_icon)')
    .eq('community_id', membership.community_id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          주소록
        </h1>
        <p className="text-muted-foreground mt-1">
          {(membership.community as any)?.name} 공동체에 소속된 모든 유저입니다.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {members?.map(member => {
          const profile = member.profile as any
          const name = profile?.name || '이름 없음'
          const avatar = profile?.avatar_icon || '👤'
          const cellName = (member.cell as any)?.name

          return (
            <Card key={member.user_id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-3xl shadow-sm">
                  {avatar}
                </div>
                <div>
                  <div className="font-bold">{name}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    {member.role === 'admin' && (
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                        관리자
                      </span>
                    )}
                    <span>{cellName || '셀 미배정'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
