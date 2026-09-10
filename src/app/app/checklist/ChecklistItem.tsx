'use client'

import { useTransition, useOptimistic, useState, useEffect, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { toggleRecord, updateRecordMemo } from './actions'

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
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    record?.completed ?? false,
    (state, newValue: boolean) => newValue
  )

  const [memo, setMemo] = useState(record?.memo || '')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMemo(record?.memo || '')
  }, [record?.memo])

  const handleMemoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setMemo(val)
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        await updateRecordMemo(item.id, date, val)
      })
    }, 500)
  }

  const handleCheckedChange = (checked: boolean) => {
    startTransition(async () => {
      setOptimisticCompleted(checked)
      await toggleRecord(item.id, date, checked)
    })
  }

  return (
    <div className="flex flex-col space-y-2 p-3 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <Checkbox
          id={item.id}
          checked={optimisticCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isPending}
          className="w-6 h-6"
        />
        <label
          htmlFor={item.id}
          className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
            optimisticCompleted ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {item.name}
        </label>
        {item.type === 'CUSTOM' && (
          <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full ml-auto">
            커스텀
          </span>
        )}
      </div>

      {item.name === '통독' && (
        <div className="pl-9 pr-2">
          <Input
            placeholder="ex) 창세기 1~3장"
            value={memo}
            onChange={handleMemoChange}
            className="h-8 text-sm bg-background/50"
            disabled={isPending}
          />
        </div>
      )}
    </div>
  )
}
