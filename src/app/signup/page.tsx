'use client'

import { useState } from 'react'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>새로운 계정을 생성하여 시작하세요</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 (실명)</Label>
              <Input id="name" name="name" placeholder="홍길동" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" placeholder="이메일 입력" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (6자 이상)</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? '가입 중...' : '회원가입'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
