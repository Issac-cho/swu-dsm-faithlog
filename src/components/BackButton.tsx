'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // 대시보드에서는 뒤로가기 버튼을 숨깁니다.
  if (pathname === '/app/dashboard') {
    return null
  }

  const handleBack = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length > 2) {
      // depth가 2보다 크면 상위 폴더로 이동 (예: /app/shepherd/123 -> /app/shepherd)
      // 단, /app/community/join 의 상위는 없으므로 대시보드로 이동
      if (segments[1] === 'community') {
        router.push('/app/dashboard')
      } else {
        segments.pop()
        router.push('/' + segments.join('/'))
      }
    } else {
      // /app/history 등 1차 메뉴에서는 항상 대시보드로 이동
      router.push('/app/dashboard')
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleBack}
      className="mr-2"
      aria-label="뒤로 가기"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}
