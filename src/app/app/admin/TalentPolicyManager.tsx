'use client'

import { useState } from 'react'
import { updateTalentPolicy } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Policy {
  id: string
  checklist_name: string
  talent_amount: number
}

export default function TalentPolicyManager({ policies }: { policies: Policy[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [isPending, setIsPending] = useState(false)

  const handleEditClick = (policy: Policy) => {
    setEditingId(policy.id)
    setEditAmount(policy.talent_amount)
  }

  const handleSave = async (policyId: string) => {
    setIsPending(true)
    const result = await updateTalentPolicy(policyId, editAmount)
    setIsPending(false)
    if (result.success) {
      setEditingId(null)
    } else {
      alert('저장에 실패했습니다: ' + result.error)
    }
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>달란트 정책</CardTitle>
        <CardDescription>공동체의 기본 영성생활 항목 달성 시 지급되는 달란트 양을 책정합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <p className="text-sm text-muted-foreground">설정된 달란트 정책이 없습니다.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>영성생활 항목</TableHead>
                <TableHead>달란트 지급량 (T)</TableHead>
                <TableHead className="w-[100px]">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(policy => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.checklist_name}</TableCell>
                  <TableCell>
                    {editingId === policy.id ? (
                      <Input 
                        type="number" 
                        value={editAmount} 
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        className="w-24"
                        min={0}
                      />
                    ) : (
                      <span>{policy.talent_amount}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === policy.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(policy.id)} disabled={isPending}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={isPending}>취소</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => handleEditClick(policy)}>수정</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
