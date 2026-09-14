'use client'

import { useState, useEffect } from 'react'
import { updateTalentPolicy, createBonusPolicy, deleteBonusPolicy } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { format, endOfDay } from 'date-fns'

interface Policy {
  id: string
  checklist_name: string
  talent_amount: number
  is_bonus: boolean
  bonus_start_date: string | null
  bonus_end_date: string | null
  claim_deadline: string | null
}

const SYSTEM_ITEMS = ['통독', '기도', '큐티', '적용']

export default function TalentPolicyManager({ policies, communityId }: { policies: Policy[], communityId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [isPending, setIsPending] = useState(false)

  // Bonus Form State
  const [bonusItem, setBonusItem] = useState(SYSTEM_ITEMS[0])
  const [bonusAmount, setBonusAmount] = useState<number>(20)
  const [bonusStartDate, setBonusStartDate] = useState<string>('')
  const [bonusEndDate, setBonusEndDate] = useState<string>('')
  const [sameAsBonusPeriod, setSameAsBonusPeriod] = useState(true)
  const [customDeadline, setCustomDeadline] = useState<string>('') // format: YYYY-MM-DDTHH:mm

  // Split policies
  const basePolicies = policies.filter(p => !p.is_bonus)
  const bonusPolicies = policies.filter(p => p.is_bonus)

  const handleEditClick = (policy: Policy) => {
    setEditingId(policy.id)
    setEditAmount(policy.talent_amount)
  }

  const handleSaveBase = async (policyId: string) => {
    setIsPending(true)
    const result = await updateTalentPolicy(policyId, editAmount)
    setIsPending(false)
    if (result.success) {
      setEditingId(null)
    } else {
      alert('저장에 실패했습니다: ' + result.error)
    }
  }

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bonusStartDate || !bonusEndDate) {
      alert('보너스 기간을 입력해주세요.')
      return
    }

    let finalDeadline = customDeadline
    
    if (sameAsBonusPeriod) {
      // Calculate end of day for bonusEndDate
      const end = endOfDay(new Date(bonusEndDate))
      // e.g. "2026-09-16T23:59:59+09:00"
      finalDeadline = end.toISOString()
    } else {
      if (!customDeadline) {
        alert('보너스 수령 기한을 입력해주세요.')
        return
      }
      finalDeadline = new Date(customDeadline).toISOString()
    }

    setIsPending(true)
    const result = await createBonusPolicy(
      communityId,
      bonusItem,
      bonusAmount,
      bonusStartDate,
      bonusEndDate,
      finalDeadline
    )
    setIsPending(false)

    if (result.success) {
      setBonusStartDate('')
      setBonusEndDate('')
      setCustomDeadline('')
      setSameAsBonusPeriod(true)
    } else {
      alert('보너스 정책 생성 실패: ' + result.error)
    }
  }

  const handleDeleteBonus = async (policyId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setIsPending(true)
    const result = await deleteBonusPolicy(policyId, communityId)
    setIsPending(false)
    if (!result.success) {
      alert('삭제 실패: ' + result.error)
    }
  }

  // Auto-calculate deadline string for display when checkbox is checked
  useEffect(() => {
    if (sameAsBonusPeriod && bonusEndDate) {
      try {
        const end = endOfDay(new Date(bonusEndDate))
        setCustomDeadline(format(end, "yyyy-MM-dd'T'HH:mm"))
      } catch (e) {
        // ignore
      }
    }
  }, [sameAsBonusPeriod, bonusEndDate])

  return (
    <div className="md:col-span-2 space-y-6">
      {/* Base Policies */}
      <Card>
        <CardHeader>
          <CardTitle>기본 달란트 정책</CardTitle>
          <CardDescription>공동체의 기본 영성생활 항목 달성 시 지급되는 달란트 양을 책정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {basePolicies.length === 0 ? (
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
                {basePolicies.map(policy => {
                  const displayName = policy.checklist_name === 'PERFECT_WEEK_BONUS' 
                    ? '주간 올체크 보상' 
                    : policy.checklist_name;
                  
                  return (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{displayName}</TableCell>
                      <TableCell>
                        {editingId === policy.id ? (
                          <Input 
                            type="number" 
                            value={editAmount} 
                            onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        ) : (
                          <span>{policy.talent_amount} T</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === policy.id ? (
                          <div className="space-x-2">
                            <Button size="sm" onClick={() => handleSaveBase(policy.id)} disabled={isPending}>저장</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={isPending}>취소</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(policy)}>수정</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bonus Policies */}
      <Card>
        <CardHeader>
          <CardTitle>보너스 기간 설정</CardTitle>
          <CardDescription>
            특정 기간 동안 체크리스트 기록(record_date)에 적용될 최종 달란트 지급량을 설정합니다. 
            해당 기록을 수령 기한 내에 체크해야 보너스가 지급되며, 기한이 지나면 기본 달란트로 지급됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCreateBonus} className="grid gap-4 bg-muted/30 p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>대상 항목 (기본 항목만 가능)</Label>
                <Select value={bonusItem} onValueChange={(val) => setBonusItem(val as string)} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="항목 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ITEMS.map(item => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>최종 지급량 (T)</Label>
                <div className="text-xs text-muted-foreground mb-1">※ 기존 지급량에 더하는 값이 아닌, 이 기간의 <b>최종 지급액</b>입니다.</div>
                <Input 
                  type="number" 
                  value={bonusAmount} 
                  onChange={(e) => setBonusAmount(parseInt(e.target.value) || 0)}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>보너스 기간 시작일</Label>
                <Input 
                  type="date" 
                  value={bonusStartDate}
                  onChange={(e) => setBonusStartDate(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>보너스 기간 종료일</Label>
                <Input 
                  type="date" 
                  value={bonusEndDate}
                  onChange={(e) => setBonusEndDate(e.target.value)}
                  disabled={isPending}
                  required
                  min={bonusStartDate}
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox 
                  id="sameAsBonus" 
                  checked={sameAsBonusPeriod} 
                  onCheckedChange={(checked) => setSameAsBonusPeriod(checked as boolean)}
                  disabled={isPending}
                />
                <Label htmlFor="sameAsBonus" className="cursor-pointer">보너스 기간과 동일 (종료일 23:59:59)</Label>
              </div>
              
              <Label>보너스 수령 기한</Label>
              <Input 
                type="datetime-local" 
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                disabled={sameAsBonusPeriod || isPending}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">이 시각 이후에 체크하면 기본 달란트로 지급됩니다.</p>
            </div>

            <Button type="submit" disabled={isPending} className="mt-2 w-full md:w-auto md:justify-self-end">
              보너스 정책 추가
            </Button>
          </form>

          {/* List of existing bonus policies */}
          {bonusPolicies.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead>지급량</TableHead>
                  <TableHead>보너스 기간 (record_date)</TableHead>
                  <TableHead>수령 기한</TableHead>
                  <TableHead className="w-[80px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonusPolicies.map(policy => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.checklist_name}</TableCell>
                    <TableCell>{policy.talent_amount} T</TableCell>
                    <TableCell>
                      {policy.bonus_start_date} ~ {policy.bonus_end_date}
                    </TableCell>
                    <TableCell>
                      {policy.claim_deadline ? format(new Date(policy.claim_deadline), 'yyyy-MM-dd HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteBonus(policy.id)} disabled={isPending}>
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
