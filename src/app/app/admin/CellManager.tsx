'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { renameCell, deleteCell } from './actions'
import { Pencil, Trash2, Check, X } from 'lucide-react'

interface Cell {
  id: string
  name: string
}

export default function CellManager({ cells }: { cells: Cell[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleEditClick = (cell: Cell) => {
    setEditingId(cell.id)
    setEditName(cell.name)
  }

  const handleSave = (cellId: string) => {
    if (!editName.trim()) return
    startTransition(async () => {
      const result = await renameCell(cellId, editName)
      if (result.error) {
        alert(result.error)
      } else {
        setEditingId(null)
      }
    })
  }

  const handleDelete = (cell: Cell) => {
    const confirmed = window.confirm(
      `'${cell.name}'을(를) 삭제하시겠습니까?\n소속 멤버의 셀 배정이 해제됩니다.`
    )
    if (!confirmed) return
    startTransition(async () => {
      const result = await deleteCell(cell.id)
      if (result.error) alert(result.error)
    })
  }

  if (cells.length === 0) {
    return <p className="text-sm text-muted-foreground">생성된 셀이 없습니다.</p>
  }

  return (
    <ul className="space-y-2">
      {cells.map((cell) => (
        <li key={cell.id} className="flex items-center gap-2">
          {editingId === cell.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave(cell.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                disabled={isPending}
              />
              <Button
                size="icon"
                variant="default"
                className="h-8 w-8 shrink-0"
                onClick={() => handleSave(cell.id)}
                disabled={isPending || !editName.trim()}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={() => setEditingId(null)}
                disabled={isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm flex-1">{cell.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => handleEditClick(cell)}
                disabled={isPending}
                title="이름 수정"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(cell)}
                disabled={isPending}
                title="셀 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
