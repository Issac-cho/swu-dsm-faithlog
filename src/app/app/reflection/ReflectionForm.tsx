'use client'

import { trackAction } from '@/lib/analytics/client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { saveReflection } from './actions'

export default function ReflectionForm({
  communityId,
  weekStartDate,
  type,
  initialContent,
}: {
  communityId: string
  weekStartDate: string
  type: 'commitment' | 'review'
  initialContent: string
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
      const res = await trackAction('saveReflection', () => saveReflection(communityId, weekStartDate, type, content), type === 'commitment' ? 'commitment_save' : 'review_save')
      if (res.error) {
        alert('저장에 실패했습니다: ' + res.error)
        setIsSaved(false)
      } else {
        setIsSaved(true)
      }
    })
  }

  return (
    <div className="flex gap-3 items-stretch">
      <textarea
        aria-label={type === 'commitment' ? '주간 다짐' : '주간 평가'}
        className="flex-1 h-20 p-3 rounded-md border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
      />
      <Button 
        onClick={handleSave} 
        disabled={isPending || content === initialContent}
        className="h-20 px-4 whitespace-nowrap"
      >
        {isPending ? '저장중..' : isSaved ? '저장됨' : '저장하기'}
      </Button>
    </div>
  )
}
