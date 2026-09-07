import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'

export default async function CellPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch my cell
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('cell_id, community_id, cell:cells(name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  const todayInKST = formatInTimeZone(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')
  
  let members: any[] = []
  let talentSums: Record<string, number> = {}
  let totalCellTalent = 0

  if (membership.cell_id) {
    const { data } = await supabase
      .from('community_memberships')
      .select('user_id, profile:profiles(name)')
      .eq('cell_id', membership.cell_id)
      
    members = data || []

    if (members.length > 0) {
      const userIds = members.map(m => m.user_id)
      const { data: talents } = await supabase
        .from('talent_transactions')
        .select('user_id, amount')
        .eq('community_id', membership.community_id)
        .in('user_id', userIds)

      talents?.forEach(t => {
        talentSums[t.user_id] = (talentSums[t.user_id] || 0) + t.amount
        totalCellTalent += t.amount
      })
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">우리 셀</h1>
          <p className="text-muted-foreground">
            {membership.cell_id ? `${(membership.cell as any)?.name} 식구들의 영성생활 기록을 확인합니다.` : '아직 소속된 셀이 없습니다.'}
          </p>
        </div>
        {membership.cell_id && (
          <div className="text-right">
            <span className="text-sm text-muted-foreground">우리 셀 총 달란트</span>
            <div className="text-xl font-bold text-primary">{totalCellTalent.toLocaleString()} T</div>
          </div>
        )}
      </div>

      {membership.cell_id && (
        <div className="grid gap-4">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">셀원이 없습니다.</p>
          ) : (
            members.map(member => {
              const userTalent = talentSums[member.user_id] || 0
              return (
                <Card key={member.user_id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>
                        {(member.profile as any)?.name}
                        {member.user_id === user.id && <span className="text-sm font-normal text-muted-foreground ml-2">(나)</span>}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Link href={`/app/history?userId=${member.user_id}&date=${todayInKST}`} className="text-primary hover:underline">
                          체크리스트 기록 보기
                        </Link>
                      </CardDescription>
                    </div>
                    <div className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {userTalent.toLocaleString()} T
                    </div>
                  </CardHeader>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
