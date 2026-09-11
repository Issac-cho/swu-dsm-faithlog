'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw } from 'lucide-react'
import { resetCommunityTalents } from './actions'

export default function ResetTalentsButton({ communityId }: { communityId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleReset = () => {
    const confirmed = window.confirm(
      '공동체 전체 달란트를 초기화하시겠습니까?\n체크리스트 기록은 보존됩니다. 이 작업은 되돌릴 수 없습니다.'
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await resetCommunityTalents(communityId)
      if (result.error) {
        alert('초기화 실패: ' + result.error)
      } else {
        alert('달란트가 초기화되었습니다.')
      }
    })
  }

  return (
    <Button
      variant="destructive"
      onClick={handleReset}
      disabled={isPending}
      className="w-full sm:w-auto"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <RotateCcw className="w-4 h-4 mr-2" />
      )}
      달란트 전체 초기화
    </Button>
  )
}
