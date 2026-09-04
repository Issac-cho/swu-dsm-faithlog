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
  { href: '/app/shepherd', label: '나의 양' },
]

export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[250px] sm:w-[300px]">
          <SheetHeader>
            <SheetTitle className="text-left">메뉴</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`text-lg font-medium transition-colors hover:text-primary ${
                  pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/app/admin"
                onClick={() => setOpen(false)}
                className={`text-lg font-medium transition-colors hover:text-primary ${
                  pathname === '/app/admin' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                관리자
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
