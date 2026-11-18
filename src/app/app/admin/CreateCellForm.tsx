'use client'

import { useTransition, useState } from 'react'
import { createCell } from './actions'
import { trackAction } from '@/lib/analytics/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateCellForm({ communityId }: { communityId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  return (
    <form onSubmit={event => {
      event.preventDefault()
      const form = event.currentTarget
      const data = new FormData(form)
      setError('')
      startTransition(async () => {
        try {
          const result = await trackAction('createCell', () => createCell(data))
          if (result.error) setError(result.error)
          else form.reset()
        } catch { setError('셀을 추가하지 못했습니다. 다시 시도해주세요.') }
      })
    }} className="space-y-2">
      <div className="flex gap-2">
        <input type="hidden" name="communityId" value={communityId} />
        <Input name="name" aria-label="새로운 셀 이름" placeholder="새로운 셀 이름" required disabled={pending} />
        <Button type="submit" disabled={pending}>{pending ? '추가 중…' : '추가'}</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
