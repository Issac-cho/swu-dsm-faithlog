'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { saveReflection } from './actions'

export default function ReflectionForm({
  communityId,
  weekStartDate,
  type,
  initialContent,
  placeholder,
}: {
  communityId: string
  weekStartDate: string
  type: 'commitment' | 'review'
  initialContent: string
  placeholder: string
}) {
  const [content, setContent] = useState(initialContent)
  const [isPending, startTransition] = useTransition()
  const [isSaved, setIsSaved] = useState(false)

  // Reset saved status when content changes
  useEffect(() => {
    if (content !== initialContent) {
      setIsSaved(false)
    }
  }, [content, initialContent])

  const handleSave = () => {
    if (!content.trim()) return

    startTransition(async () => {
      await saveReflection(communityId, weekStartDate, type, content)
      setIsSaved(true)
    })
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-3 rounded-md border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending || content === initialContent}>
          {isPending ? '저장 중...' : isSaved ? '저장됨' : '저장하기'}
        </Button>
      </div>
    </div>
  )
}
