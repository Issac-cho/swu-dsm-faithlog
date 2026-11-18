'use client'

import { trackAction } from '@/lib/analytics/client'

import { useTransition, useOptimistic, useState, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toggleRecord, updateRecordMemo, deleteCustomItem } from './actions'

export default function ChecklistItemComponent({ item, record, date }: {
  item: { id: string; name: string; type: string }
  record?: { completed: boolean; memo?: string | null }
  date: string
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    record?.completed ?? false, (_state, value: boolean) => value
  )
  const [memo, setMemo] = useState(record?.memo || '')
  const savedMemo = useRef((record?.memo || '').trim())
  const [memoError, setMemoError] = useState('')
  const [checkError, setCheckError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [saved, setSaved] = useState(false)
  const [retryChecked, setRetryChecked] = useState(false)

  const saveMemo = () => {
    const value = memo.trim()
    if (isPending || value === savedMemo.current) return
    setMemoError('')
    setSaved(false)
    startTransition(async () => {
      try {
        const result = await trackAction('updateRecordMemo', () => updateRecordMemo(item.id, date, value), item.name === '통독' ? 'reading_memo_save' : 'application_memo_save')
        if (result.error) { setMemoError('메모 저장에 실패했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.'); return }
        savedMemo.current = value
        setSaved(true)
      } catch {
        setMemoError('메모를 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.')
      }
    })
  }

  const saveChecked = (checked: boolean) => {
    setCheckError('')
    setSaved(false)
    setRetryChecked(checked)
    startTransition(async () => {
      setOptimisticCompleted(checked)
      try {
        const result = await trackAction('toggleRecord', () => toggleRecord(item.id, date, checked), checked ? 'check_complete' : 'check_uncomplete')
        if (result.error) { setCheckError('체크를 저장하지 못해 이전 상태로 돌아갔습니다. 다시 시도해 주세요.'); return }
        setSaved(true)
      } catch {
        setCheckError('체크를 저장하지 못해 이전 상태로 돌아갔습니다. 연결을 확인해 주세요.')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`'${item.name}' 항목을 삭제하시겠습니까? (과거 기록은 보존됩니다)`)) return
    setDeleteError('')
    startTransition(async () => {
      try {
        const result = await trackAction('deleteCustomItem', () => deleteCustomItem(item.id))
        if (result.error) setDeleteError('항목을 삭제하지 못했습니다. 다시 시도해 주세요.')
      } catch {
        setDeleteError('연결을 확인하고 삭제를 다시 시도해 주세요.')
      }
    })
  }

  return (
    <div className="rounded-md p-3 hover:bg-muted/50" aria-busy={isPending}>
      <div className="flex items-center gap-2">
        <Checkbox id={item.id} aria-label={item.name} checked={optimisticCompleted}
          onCheckedChange={saveChecked} disabled={isPending} className="h-6 w-6 shrink-0" />
        <label htmlFor={item.id} className={`flex min-h-11 min-w-0 flex-1 items-center break-words text-base font-medium ${optimisticCompleted ? 'text-muted-foreground line-through' : ''}`}>
          {item.name}
        </label>
        {item.type === 'CUSTOM' && (
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}
            aria-label={`${item.name} 항목 삭제`} className="shrink-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {(item.name === '통독' || item.name === '적용') && (
        <div className="mt-1 pl-8">
          <Input aria-label={`${item.name} 메모`} value={memo} disabled={isPending}
            onChange={e => { setMemo(e.target.value); setSaved(false); setMemoError('') }}
            onBlur={saveMemo} className="w-full bg-background/50 text-base" />
          <p className="mt-1 text-xs text-muted-foreground">입력을 마치고 다른 곳을 누르면 저장됩니다.</p>
        </div>
      )}
      <p role="status" className="mt-1 text-xs text-muted-foreground">{isPending ? '저장 중…' : saved ? '저장됨' : ''}</p>
      {checkError && <div role="alert" className="text-sm text-destructive">{checkError}<Button variant="outline" disabled={isPending} onClick={() => saveChecked(retryChecked)}>체크 다시 저장</Button></div>}
      {memoError && <div role="alert" className="text-sm text-destructive">{memoError}<Button variant="outline" disabled={isPending} onClick={saveMemo}>메모 다시 저장</Button></div>}
      {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
    </div>
  )
}
