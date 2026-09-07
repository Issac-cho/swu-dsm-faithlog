'use client'

import { Button } from '@/components/ui/button'
import { leaveCommunity } from './actions'
import { useState } from 'react'

export default function LeaveCommunityButton({ communityName }: { communityName: string }) {
  const [isPending, setIsPending] = useState(false)

  const handleLeave = async () => {
    if (!confirm(`정말로 ${communityName} 공동체에서 탈퇴하시겠습니까?`)) return
    
    setIsPending(true)
    try {
      const res = await leaveCommunity()
      if (res?.error) {
        alert('오류가 발생했습니다: ' + res.error)
        setIsPending(false)
      }
    } catch (e: any) {
      alert('오류가 발생했습니다: ' + e.message)
      setIsPending(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      onClick={handleLeave} 
      disabled={isPending}
    >
      {isPending ? '처리중...' : '공동체 탈퇴하기'}
    </Button>
  )
}
