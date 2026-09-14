'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createCommunityAction } from '../join/actions'
import Link from 'next/link'

export default function CreateCommunityClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsPending(true)
    setError('')
    const res = await createCommunityAction(name.trim())
    if (res.error) {
      setError(res.error)
      setIsPending(false)
    } else {
      router.push('/app/admin')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">공동체 개설</h1>
        <p className="text-muted-foreground mt-1">새로운 공동체를 만들고 관리자가 됩니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공동체 이름 입력</CardTitle>
          <CardDescription>개설 후 관리자 페이지에서 비밀번호, 셀 등을 설정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="공동체 이름 입력"
              required
              disabled={isPending}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? '개설 중...' : '공동체 만들기'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          기존 공동체에 가입하시겠어요?{' '}
          <Link href="/app/community/join" className="text-primary underline underline-offset-4">
            공동체 가입하기
          </Link>
        </p>
      </div>
    </div>
  )
}
