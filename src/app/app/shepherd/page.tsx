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
  const { data: relationships } = await supabase
    .from('shepherd_relationships')
    .select('sheep_id, profile:profiles!shepherd_relationships_sheep_id_fkey(name)')
    .eq('shepherd_id', user.id)

  const hasSheep = relationships && relationships.length > 0
  const todayInKST = formatInTimeZone(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">나의 양</h1>
        <p className="text-muted-foreground">내가 돌보고 있는 양들의 영성생활을 확인합니다.</p>
      </div>

      <div className="grid gap-4">
        {!hasSheep ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">현재 연결된 양이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          relationships.map(rel => (
            <Card key={rel.sheep_id}>
              <CardHeader>
                <CardTitle>{rel.profile?.name}</CardTitle>
                <CardDescription>
                  <Link href={`/app/shepherd/${rel.sheep_id}?date=${todayInKST}`} className="text-primary hover:underline">
                    체크리스트 보기
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
