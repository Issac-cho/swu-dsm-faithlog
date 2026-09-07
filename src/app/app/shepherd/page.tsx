import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'

export default async function ShepherdPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch my sheep
  const { data: sheepRels } = await supabase
    .from('shepherd_relationships')
    .select('sheep_id, profile:profiles!shepherd_relationships_sheep_id_fkey(name, avatar_icon)')
    .eq('shepherd_id', user.id)

  // Fetch my shepherds
  const { data: shepherdRels } = await supabase
    .from('shepherd_relationships')
    .select('shepherd_id, profile:profiles!shepherd_relationships_shepherd_id_fkey(name, avatar_icon)')
    .eq('sheep_id', user.id)

  const hasSheep = sheepRels && sheepRels.length > 0
  const hasShepherds = shepherdRels && shepherdRels.length > 0
  const todayInKST = formatInTimeZone(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">목양</h1>
        <p className="text-muted-foreground">목자와 양들의 영성생활 기록을 확인합니다.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">나의 목자</h2>
        <div className="grid gap-4">
          {!hasShepherds ? (
            <p className="text-muted-foreground text-sm">연결된 목자가 없습니다.</p>
          ) : shepherdRels.map(rel => {
                const profile = rel.profile as any
                const name = profile?.name || '이름 없음'
                const avatar = profile?.avatar_icon || '👤'
                return (
                  <Card key={rel.shepherd_id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{avatar}</span>
                        <span>{name}</span>
                      </CardTitle>
                      <CardDescription>
                        <Link href={`/app/history?userId=${rel.shepherd_id}&date=${todayInKST}`} className="text-primary hover:underline">
                          체크리스트 기록 보기
                        </Link>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })
          }
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">나의 양</h2>
        <div className="grid gap-4">
          {!hasSheep ? (
            <p className="text-muted-foreground text-sm">연결된 양이 없습니다.</p>
          ) : sheepRels.map(rel => {
                const profile = rel.profile as any
                const name = profile?.name || '이름 없음'
                const avatar = profile?.avatar_icon || '👤'
                return (
                  <Card key={rel.sheep_id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{avatar}</span>
                        <span>{name}</span>
                      </CardTitle>
                      <CardDescription>
                        <Link href={`/app/history?userId=${rel.sheep_id}&date=${todayInKST}`} className="text-primary hover:underline">
                          체크리스트 기록 보기
                        </Link>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
