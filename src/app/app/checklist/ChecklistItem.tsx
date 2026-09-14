'use client'

import { useTransition, useOptimistic, useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { toggleRecord, updateRecordMemo, deleteCustomItem } from './actions'

export default function ChecklistItemComponent({
  item,
  record,
  date,
}: {
  item: { id: string; name: string; type: string }
  record?: { completed: boolean, memo?: string | null }
  date: string
}) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    record?.completed ?? false,
    (state, newValue: boolean) => newValue
  )

  const [memo, setMemo] = useState(record?.memo || '')

  useEffect(() => {
    setMemo(record?.memo || '')
  }, [record?.memo])

  const handleMemoBlur = () => {
    const trimmed = memo.trim()
    // Only save if the value actually changed from what's in the DB
    if (trimmed === (record?.memo || '').trim()) return

    startTransition(async () => {
      await updateRecordMemo(item.id, date, trimmed)
    })
  }

  const handleCheckedChange = (checked: boolean) => {
    startTransition(async () => {
      setOptimisticCompleted(checked)
      await toggleRecord(item.id, date, checked)
    })
  }

  const handleDelete = () => {
    if (!confirm(`'${item.name}' 항목을 삭제하시겠습니까? (과거 기록은 보존됩니다)`)) return
    
    setIsDeleting(true)
    startTransition(async () => {
      const res = await deleteCustomItem(item.id)
      if (res.error) {
        alert(res.error)
        setIsDeleting(false)
      }
    })
  }

  return (
    <div className={`flex items-center p-3 rounded-md hover:bg-muted/50 transition-colors ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Checkbox
          id={item.id}
          checked={optimisticCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isPending || isDeleting}
          className="w-6 h-6 shrink-0"
        />
        <label
          htmlFor={item.id}
          className={`text-base font-medium leading-none shrink-0 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
            optimisticCompleted ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {item.name}
        </label>

        {item.name === '통독' && (
          <div className="flex-1 px-2 min-w-0">
            <Input
              placeholder="ex) 창세기 1~3장"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={handleMemoBlur}
              className="h-8 text-xs bg-background/50 w-full"
              disabled={isDeleting}
            />
          </div>
        )}
      </div>

      {item.type === 'CUSTOM' && (
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
            커스텀
          </span>
          <button 
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors disabled:opacity-50"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
