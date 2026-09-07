'use client'

import { Button } from '@/components/ui/button'
import { removeMember } from './actions'
import { useState } from 'react'

export default function RemoveMemberButton({ membershipId, memberName }: { membershipId: string, memberName: string }) {
  const [isPending, setIsPending] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`정말로 ${memberName}님을 공동체에서 내보내시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
    
    setIsPending(true)
    try {
      await removeMember(membershipId)
      alert('성공적으로 내보냈습니다.')
    } catch (e: any) {
      alert('오류가 발생했습니다: ' + e.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleRemove} 
      disabled={isPending}
    >
      {isPending ? '처리중' : '내보내기'}
    </Button>
  )
}
