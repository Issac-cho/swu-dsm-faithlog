'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Gift, Loader2 } from 'lucide-react'
import { claimPerfectWeekBonus } from './actions'

export default function ClaimBonusButton({ weekStart }: { weekStart: string }) {
  const [isPending, startTransition] = useTransition()
  const [claimed, setClaimed] = useState(false)

  const handleClaim = () => {
    startTransition(async () => {
      const result = await claimPerfectWeekBonus(weekStart)
      if (result.success) {
        setClaimed(true)
      } else {
        alert(result.error || '보상 수령에 실패했습니다.')
      }
    })
  }

  if (claimed) {
    return (
      <Button variant="secondary" className="w-full mt-4 font-bold bg-green-100 text-green-700 hover:bg-green-100 cursor-default" disabled>
        🎉 수령 완료!
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleClaim} 
      disabled={isPending} 
      className="w-full mt-4 font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white animate-pulse shadow-lg"
    >
      {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Gift className="w-5 h-5 mr-2" />}
      주간 올체크 보상 받기!
    </Button>
  )
}
