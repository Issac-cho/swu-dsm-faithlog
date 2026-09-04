import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ChecklistItemComponent from '@/app/app/checklist/ChecklistItem'

export default async function SheepChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheepId: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const resolvedParams = await params
  const sheepId = resolvedParams.sheepId
  const resolvedSearchParams = await searchParams
  const date = resolvedSearchParams.date || new Date().toISOString().split('T')[0]

  // Verify shepherd relationship
  const { data: rel } = await supabase
    .from('shepherd_relationships')
    .select('id')
    .eq('shepherd_id', user.id)
    .eq('sheep_id', sheepId)
    .single()

  if (!rel) {
    return <div className="p-4 text-destructive">접근 권한이 없습니다. (목자-양 관계가 아님)</div>
  }

  // Fetch sheep profile
  const { data: sheepProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', sheepId)
    .single()

  // Fetch sheep's items
  const { data: items } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('user_id', sheepId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fetch sheep's records for the date
  const { data: records } = await supabase
    .from('checklist_records')
    .select('*')
    .eq('user_id', sheepId)
    .eq('record_date', date)

  const recordsMap = records?.reduce((acc, record) => {
    acc[record.checklist_item_id] = record
    return acc
  }, {} as Record<string, any>) || {}

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{sheepProfile?.name} 님의 기록</h1>
          <p className="text-muted-foreground">{date}의 영성생활</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>체크리스트</CardTitle>
          <CardDescription>목자는 양의 기록을 조회할 수 있지만, 대신 체크해줄 수는 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pointer-events-none opacity-80">
          {items?.map((item) => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              date={date}
              record={recordsMap[item.id]}
            />
          ))}
          {(!items || items.length === 0) && (
            <p className="text-sm text-muted-foreground">체크리스트 항목이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
