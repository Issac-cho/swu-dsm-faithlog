import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import BackButton from '@/components/BackButton'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch operator status
  const { data: operatorData } = await supabase
    .from('system_operators')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  
  const isOperator = !!operatorData

  // Fetch membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('*, community:communities(name), cell:cells(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <BackButton />
          <Link href="/app/dashboard" className="font-semibold text-lg">
            슈데페
          </Link>
          <nav className="hidden md:flex gap-4 ml-6 text-sm font-medium">
            <Link href="/app/dashboard" className="hover:text-primary">대시보드</Link>
            <Link href="/app/checklist" className="hover:text-primary">체크리스트</Link>
            <Link href="/app/history" className="hover:text-primary">기록</Link>
            <Link href="/app/reflection" className="hover:text-primary">다짐/평가</Link>
            <Link href="/app/cell" className="hover:text-primary">우리 셀</Link>
            <Link href="/app/shepherd" className="hover:text-primary">목양</Link>
            <Link href="/app/directory" className="hover:text-primary">주소록</Link>
            {['admin', 'sub_admin'].includes(membership?.role) && (
              <Link href="/app/admin" className="text-primary hover:underline">관리자</Link>
            )}
            {isOperator && (
              <Link href="/app/operator" className="text-destructive font-bold hover:underline">👑 시스템 운영자</Link>
            )}
            <Link href="/app/settings" className="hover:text-primary">내 정보</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden sm:block">
            {membership ? `${membership.community?.name} ${membership.cell?.name || '(셀 미배정)'}` : '소속 없음'}
          </div>
          <MobileNav isAdmin={['admin', 'sub_admin'].includes(membership?.role)} isOperator={isOperator} />
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  )
}
