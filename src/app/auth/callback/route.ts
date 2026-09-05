import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 이메일 인증이 완료되었으므로 로그인 페이지에 인증 완료 파라미터를 붙여서 리다이렉트
  return NextResponse.redirect(`${requestUrl.origin}/login?verified=true`)
}
