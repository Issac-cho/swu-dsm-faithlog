'use client'

import { useTransition } from 'react'
import { assignUserToCell } from './actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Cell = { id: string; name: string }

export default function CellAssigner({
  membershipId,
  currentCellId,
  cells,
}: {
  membershipId: string
  currentCellId: string | null
  cells: Cell[]
}) {
  const [isPending, startTransition] = useTransition()

  const handleValueChange = (val: string) => {
    startTransition(async () => {
      const cellId = val === 'none' ? null : val
      await assignUserToCell(membershipId, cellId)
    })
  }

  return (
    <Select
      value={currentCellId || 'none'}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="셀 선택">
          {currentCellId ? cells.find(c => c.id === currentCellId)?.name : '셀 미배정'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">셀 미배정</SelectItem>
        {cells.map((cell) => (
          <SelectItem key={cell.id} value={cell.id}>
            {cell.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
