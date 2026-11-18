import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const labels: Record<string, string> = {
  check_complete: '체크 완료', check_uncomplete: '체크 해제',
  reading_memo_save: '통독 메모 저장', application_memo_save: '적용 메모 저장',
  commitment_save: '주간 다짐 저장', review_save: '주간 평가 저장',
  history_tab: '기록 탭 전환', other_history_open: '다른 사람 기록 열기',
  save_failed: '저장 실패', delete_failed: '삭제 실패',
  weekly: '주간', monthly: '월간', yearly: '연간',
  cell: '우리 셀', shepherd: '목양', directory: '주소록',
  toggleRecord: '체크', updateRecordMemo: '메모', deleteCustomItem: '개인 항목',
  addCustomItem: '개인 항목 추가', saveReflection: '다짐·평가', updateProfile: '프로필',
  renameCell: '셀 이름', deleteCell: '셀', createCell: '셀 추가',
  assignUserToCell: '셀 배정', assignShepherd: '목양 연결', removeShepherd: '목양 연결',
  updateTalentPolicy: '달란트 정책', updateCommunityPassword: '가입 비밀번호',
  removeMember: '구성원', changeMemberRole: '역할', resetCommunityTalents: '달란트 초기화',
  createBonusPolicy: '보너스 정책 추가', deleteBonusPolicy: '보너스 정책',
  leaveCommunity: '공동체 탈퇴', claimPerfectWeekBonus: '올체크 보너스',
  '/app/dashboard': '대시보드', '/app/checklist': '체크리스트',
  '/app/history': '기록', '/app/reflection': '주간 다짐·평가',
  '/app/cell': '우리 셀', '/app/shepherd': '목양', '/app/directory': '주소록',
  '/app/settings': '내 정보', '/app/admin': '관리자', '/app/operator': '운영자',
  '/app/operator/analytics': '사용 분석',
}
type Summary = {
  visitors: number; views: number; failures: number
  pages: { page: string; count: number; visitors: number }[]
  actions: { name: string; detail: string; count: number; users: number }[]
  daily: { day: string; visitors: number; views: number; failures: number }[]
  recent_failures: { name: string; detail: string; page: string; created_at: string }[]
}

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<{ days?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: operator } = await supabase.from('system_operators')
    .select('user_id').eq('user_id', user.id).maybeSingle()
  if (!operator) redirect('/app/dashboard')
  const params = await searchParams
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30
  const { data, error } = await supabase.rpc('get_usage_summary', { p_days: days })
  const summary = data as Summary | null

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Link href="/app/operator" className="text-sm text-primary hover:underline">운영자 페이지로</Link>
      <h1 className="text-2xl font-bold">사용 분석</h1>
      <p className="text-sm text-muted-foreground">한국 시간 기준 · 로그인한 사용자 · 수집 시작 이후의 데이터</p>
      <nav aria-label="분석 기간" className="flex gap-2">
        {[7, 30, 90].map(period => (
          <Link key={period} href={'?days=' + period} aria-current={days === period ? 'page' : undefined}
            className={'rounded-md border px-4 py-2 text-sm ' + (days === period ? 'bg-primary text-primary-foreground' : '')}>
            최근 {period}일
          </Link>
        ))}
      </nav>
      {error || !summary ? (
        <p role="alert" className="text-destructive">분석 데이터를 불러오지 못했습니다. 분석 SQL 적용 여부와 DB 연결을 확인해주세요.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[['방문자', summary.visitors + '명'], ['페이지 조회', summary.views + '회'], ['저장·삭제 실패', summary.failures + '회']].map(([title, value]) => (
              <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
            ))}
          </div>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">페이지별 방문</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-2">페이지</th><th>방문자</th><th>조회</th></tr></thead>
              <tbody>{summary.pages.map(row => <tr key={row.page} className="border-b"><td className="p-2">{labels[row.page] || row.page}</td><td>{row.visitors}명</td><td>{row.count}회</td></tr>)}</tbody>
            </table></div>
            {!summary.pages.length && <p className="text-sm text-muted-foreground">수집된 방문 기록이 없습니다.</p>}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">기능별 사용과 실패</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-2">행동</th><th>사용자</th><th>횟수</th></tr></thead>
              <tbody>{summary.actions.map(row => <tr key={row.name + row.detail} className="border-b"><td className="p-2">{labels[row.name]}{row.detail && ' · ' + (labels[row.detail] || row.detail)}</td><td>{row.users}명</td><td>{row.count}회</td></tr>)}</tbody>
            </table></div>
            {!summary.actions.length && <p className="text-sm text-muted-foreground">수집된 사용 기록이 없습니다.</p>}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">일별 추이</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-2">날짜</th><th>방문자</th><th>조회</th><th>실패</th></tr></thead>
              <tbody>{summary.daily.map(row => <tr key={row.day} className="border-b"><td className="p-2">{row.day}</td><td>{row.visitors}명</td><td>{row.views}회</td><td>{row.failures}회</td></tr>)}</tbody>
            </table></div>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">최근 실패 · 최대 30건</h2>
            <ul className="space-y-2 text-sm">{summary.recent_failures.map((row, index) => <li key={index}>
              {formatInTimeZone(row.created_at, 'Asia/Seoul', 'MM/dd HH:mm')} · {labels[row.page] || row.page} · {labels[row.name]} · {labels[row.detail] || row.detail}
            </li>)}</ul>
            {!summary.recent_failures.length && <p className="text-sm text-muted-foreground">기록된 실패가 없습니다.</p>}
          </section>
          <p className="text-xs text-muted-foreground">기능 사용은 성공 결과를 기준으로 집계합니다. 방문자는 기간 내 중복을 제외합니다. 운영자 활동도 포함되며, 통신이 끊기거나 페이지를 바로 닫으면 일부 이벤트가 누락될 수 있습니다.</p>
        </>
      )}
    </div>
  )
}
