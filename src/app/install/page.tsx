import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

export default function InstallGuidePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">📱 앱 설치 가이드</h1>
          <p className="text-muted-foreground mt-2">
            앱스토어 다운로드 없이, 사용하시는 웹 브라우저에서 바로 스마트폰 바탕화면에 앱을 설치할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">🍎 아이폰 (Safari 브라우저)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-2 text-sm md:text-base leading-relaxed">
            <p>1. Safari 앱을 열고 현재 주소(swu-dsm-faithlog.vercel.app)에 접속합니다.</p>
            <p>2. 화면 하단 중앙에 있는 <strong>공유 버튼(네모 안에서 위로 향하는 화살표 모양)</strong>을 클릭합니다.</p>
            <p>3. 메뉴를 아래로 조금 내려서 <strong>[홈 화면에 추가]</strong>를 클릭합니다.</p>
            <p>4. 우측 상단의 '추가'를 누르면 바탕화면에 앱이 설치됩니다!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">🌐 안드로이드 (Chrome 브라우저)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-2 text-sm md:text-base leading-relaxed">
            <p>1. Chrome 앱을 열고 접속합니다.</p>
            <p>2. 접속 직후 주소창 오른쪽이나 화면 아래에 나타나는 <strong>[설치]</strong> 또는 <strong>[홈 화면에 추가]</strong> 팝업을 클릭합니다.</p>
            <p>3. 팝업이 나타나지 않는다면, 우측 상단의 점 3개 메뉴(⋮)를 누른 뒤 <strong>[홈 화면에 추가]</strong>를 클릭합니다.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">🌌 안드로이드 (삼성 브라우저)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-2 text-sm md:text-base leading-relaxed">
            <p>1. 삼성 인터넷 앱을 열고 접속합니다.</p>
            <p>2. 주소창 오른쪽 끝을 확인했을 때 <strong>다운로드 아이콘(아래 화살표 모양)</strong>이 보인다면 클릭합니다.</p>
            <p>3. 만약 보이지 않는다면, 화면 오른쪽 아래의 <strong>메뉴 버튼(삼선 모양 ☰)</strong>을 누릅니다.</p>
            <p>4. 메뉴 창에서 <strong>[현재 페이지 추가]</strong>를 선택하고 <strong>[앱 설치]</strong> 또는 <strong>[홈 화면]</strong>을 선택합니다.</p>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Link href="/login" className={buttonVariants({ className: "w-full md:w-auto px-12" })}>
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
