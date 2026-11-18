'use client'

import { trackAction } from '@/lib/analytics/client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addCustomItem } from './actions'

export default function CustomItemForm({ communityId }: { communityId: string }) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim() || isPending) return
    setError('')
    setSaved(false)
    startTransition(async () => {
      try {
        const result = await trackAction('addCustomItem', () => addCustomItem(communityId, name.trim()))
        if (result.error) { setError(result.error); return }
        setName('')
        setSaved(true)
      } catch {
        setError('항목을 추가하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="custom-item-name" className="text-sm font-medium">개인 항목 이름</label>
      <div className="flex gap-2">
        <Input id="custom-item-name" name="name" value={name}
          onChange={e => { setName(e.target.value); setError(''); setSaved(false) }}
          aria-invalid={!!error} aria-describedby={error ? 'custom-item-error' : undefined}
          disabled={isPending} required />
        <Button type="submit" disabled={isPending || !name.trim()}>{isPending ? '추가 중…' : '추가'}</Button>
      </div>
      {error && <p id="custom-item-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <p role="status" className="text-sm text-muted-foreground">{saved ? '항목을 추가했습니다.' : ''}</p>
    </form>
  )
}
