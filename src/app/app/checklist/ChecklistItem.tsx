'use client'

import { useTransition, useOptimistic } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleRecord } from './actions'

export default function ChecklistItemComponent({
  item,
  record,
  date,
}: {
  item: { id: string; name: string; type: string }
  record?: { completed: boolean }
  date: string
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    record?.completed ?? false,
    (state, newValue: boolean) => newValue
  )

  const handleCheckedChange = (checked: boolean) => {
    startTransition(async () => {
      setOptimisticCompleted(checked)
      await toggleRecord(item.id, date, checked)
    })
  }

  return (
    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
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
  )
}
