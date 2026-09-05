'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // 대시보드에서는 뒤로가기 버튼을 숨깁니다
  if (pathname === '/app/dashboard') {
    return null
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => router.back()}
      className="mr-2"
      aria-label="뒤로 가기"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}
