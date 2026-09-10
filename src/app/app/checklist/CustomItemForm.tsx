'use client'

import { useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addCustomItem } from './actions'

export default function CustomItemForm({ communityId }: { communityId: string }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (formData: FormData) => {
    const name = formData.get('name') as string
    if (!name.trim()) return

    startTransition(async () => {
      await addCustomItem(communityId, name.trim())
      formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <Input
        name="name"
        placeholder="예: 성경 암송, 선행, 감사 기록"
        disabled={isPending}
        required
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? '추가 중...' : '추가'}
      </Button>
    </form>
  )
}
