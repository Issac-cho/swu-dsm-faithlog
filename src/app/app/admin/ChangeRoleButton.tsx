'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { changeMemberRole } from './actions'
import { useRouter } from 'next/navigation'

export default function ChangeRoleButton({ 
  membershipId, 
  currentRole, 
  memberName 
}: { 
  membershipId: string, 
  currentRole: string, 
  memberName: string 
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRoleChange = async () => {
    const isPromoting = currentRole === 'member'
    const newRole = isPromoting ? 'sub_admin' : 'member'
    const actionText = isPromoting ? '부관리자로 임명' : '일반 멤버로 강등'
    
    if (!confirm(`${memberName}님을 ${actionText}하시겠습니까?`)) return

    setLoading(true)
    try {
      const res = await changeMemberRole(membershipId, newRole)
      if (res?.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    } catch (e: any) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (currentRole === 'admin') return null

  return (
    <Button 
      variant={currentRole === 'sub_admin' ? 'outline' : 'secondary'} 
      size="sm" 
      onClick={handleRoleChange}
      disabled={loading}
      className="mr-2"
    >
      {currentRole === 'sub_admin' ? '해제' : '임명'}
    </Button>
  )
}
