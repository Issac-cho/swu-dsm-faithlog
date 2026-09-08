import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ChecklistItemComponent from './ChecklistItem'
import CustomItemForm from './CustomItemForm'
import { formatInTimeZone } from 'date-fns-tz'

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const resolvedParams = await searchParams
  
  // Use KST for today's date
  const todayInKST = formatInTimeZone(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')
  const date = resolvedParams.date || todayInKST

  // Get active membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/app/community/join')
  }

  // Get items
  const { data: items } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('community_id', membership.community_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  // Get records for the selected date
  const { data: records } = await supabase
    .from('checklist_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_date', date)

  const recordsMap = records?.reduce((acc, record) => {
    acc[record.checklist_item_id] = record
    return acc
  }, {} as Record<string, any>) || {}

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">체크리스트</h1>
          <p className="text-muted-foreground">{date}의 영성생활</p>
        </div>
        {/* TODO: Date picker for previous days */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 기록</CardTitle>
          <CardDescription>매일의 영성생활을 기록하고 달란트를 받으세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
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

      <Card>
        <CardHeader>
          <CardTitle>커스텀 항목 추가</CardTitle>
          <CardDescription>개인적으로 관리하고 싶은 영성생활을 추가하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomItemForm communityId={membership.community_id} />
        </CardContent>
      </Card>
    </div>
  )
}
