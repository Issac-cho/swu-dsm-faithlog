'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

type NavItem = {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: '/app/dashboard', label: '대시보드' },
  { href: '/app/checklist', label: '체크리스트' },
  { href: '/app/history', label: '기록' },
  { href: '/app/reflection', label: '다짐/평가' },
  { href: '/app/cell', label: '우리 셀' },
  { href: '/app/shepherd', label: '목양' },
  { href: '/app/settings', label: '설정' },
]

export default function MobileNav({ isAdmin, isOperator }: { isAdmin: boolean, isOperator?: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="md:hidden inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-[250px] sm:w-[300px] p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-2xl font-bold">메뉴</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`text-lg font-medium transition-colors hover:bg-muted p-3 rounded-md ${
                  pathname === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t">
                <Link
                  href="/app/admin"
                  onClick={() => setOpen(false)}
                  className={`block text-lg font-medium transition-colors hover:bg-muted p-3 rounded-md ${
                    pathname === '/app/admin' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  관리자
                </Link>
              </div>
            )}
            {isOperator && (
              <div className="pt-2">
                <Link
                  href="/app/operator"
                  onClick={() => setOpen(false)}
                  className={`block text-lg font-bold transition-colors p-3 rounded-md ${
                    pathname.startsWith('/app/operator') ? 'bg-destructive/10 text-destructive' : 'text-destructive hover:bg-destructive/5'
                  }`}
                >
                  👑 시스템 운영자
                </Link>
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
