'use client'

import { useState, Suspense } from 'react'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function VerificationMessage() {
  const searchParams = useSearchParams()
  const isVerified = searchParams.get('verified') === 'true'

  if (!isVerified) return null

  return (
    <div className="mb-4 p-3 text-sm text-green-800 bg-green-100 rounded-md border border-green-200">
      이메일 인증이 성공적으로 완료되었습니다! 이제 로그인해 주세요.
    </div>
  )
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>SWU-DSM-FaithLog 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <Suspense fallback={null}>
              <VerificationMessage />
            </Suspense>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" placeholder="이메일 입력" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? '로그인 중...' : '로그인'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
