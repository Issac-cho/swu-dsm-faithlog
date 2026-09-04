'use client'

import { useTransition, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assignShepherd, removeShepherd } from './actions'

type Member = { id: string; name: string; user_id: string }
type Relationship = { id: string; shepherd_id: string; sheep_id: string }

export default function AdminShepherdManager({
  members,
  relationships,
}: {
  members: Member[]
  relationships: Relationship[]
}) {
  const [isPending, startTransition] = useTransition()
  const [shepherdId, setShepherdId] = useState<string>('')
  const [sheepId, setSheepId] = useState<string>('')

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shepherdId || !sheepId || shepherdId === sheepId) return

    startTransition(async () => {
      await assignShepherd(shepherdId, sheepId)
      setShepherdId('')
      setSheepId('')
    })
  }

  const handleRemove = (relId: string) => {
    startTransition(async () => {
      await removeShepherd(relId)
    })
  }

  return (
    <Card className="mt-6 md:col-span-2">
      <CardHeader>
        <CardTitle>목자-양 관계 관리</CardTitle>
        <CardDescription>공동체 내의 목자와 양 관계를 설정하고 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAssign} className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">목자 선택</label>
            <Select value={shepherdId} onValueChange={setShepherdId} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="목자 선택">
                  {shepherdId ? members.find(m => m.user_id === shepherdId)?.name : '목자 선택'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">양 선택</label>
            <Select value={sheepId} onValueChange={setSheepId} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="양 선택">
                  {sheepId ? members.find(m => m.user_id === sheepId)?.name : '양 선택'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending || !shepherdId || !sheepId}>연결하기</Button>
        </form>

        <div className="space-y-4">
          <h3 className="font-medium">현재 연결된 관계</h3>
          {relationships.length === 0 ? (
            <p className="text-sm text-muted-foreground">설정된 관계가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {relationships.map(rel => {
                const shepherd = members.find(m => m.user_id === rel.shepherd_id)
                const sheep = members.find(m => m.user_id === rel.sheep_id)
                return (
                  <li key={rel.id} className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm">
                      <strong className="text-primary">{shepherd?.name || '알 수 없음'}</strong> (목자) 
                      <span className="mx-2 text-muted-foreground">→</span>
                      <strong>{sheep?.name || '알 수 없음'}</strong> (양)
                    </span>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRemove(rel.id)}
                      disabled={isPending}
                    >
                      삭제
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
