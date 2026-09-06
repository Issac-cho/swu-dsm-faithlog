'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { searchCommunities, joinCommunityAction, createCommunityAction } from './actions'

export default function JoinCommunityClient() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string, name: string }[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<{ id: string, name: string } | null>(null)
  const [password, setPassword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    setIsSearching(true)
    setError('')
    const res = await searchCommunities(query)
    setResults(res)
    setIsSearching(false)
    setSelectedCommunity(null)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCommunity) return
    setError('')
    const res = await joinCommunityAction(selectedCommunity.id, password)
    if (res.error) {
      setError(res.error)
    } else {
      router.push('/app/dashboard')
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const res = await createCommunityAction(name)
    if (res.error) {
      alert(res.error)
    } else {
      router.push('/app/admin')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">공동체 가입</h1>
        <p className="text-muted-foreground">가입할 공동체를 검색하여 선택해주세요.</p>
        
        <form onSubmit={handleSearch} className="flex gap-2 mt-6">
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="공동체 이름 검색" 
            required 
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? '검색 중...' : '검색'}
          </Button>
        </form>

        <div className="grid gap-4 mt-6">
          {results.map((community) => (
            <Card key={community.id} className={selectedCommunity?.id === community.id ? 'border-primary' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => setSelectedCommunity(community)}>
                <CardTitle>{community.name}</CardTitle>
                <CardDescription>이 공동체에 가입하려면 클릭하세요.</CardDescription>
              </CardHeader>
              {selectedCommunity?.id === community.id && (
                <CardContent>
                  <form onSubmit={handleJoin} className="flex flex-col gap-2">
                    <Input 
                      type="password" 
                      placeholder="가입 비밀번호 (설정된 경우)" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit">가입 요청하기</Button>
                  </form>
                </CardContent>
              )}
            </Card>
          ))}
          {results.length === 0 && query && !isSearching && (
            <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="pt-8 border-t">
        <h2 className="text-xl font-bold mb-4">새로운 공동체 만들기</h2>
        <Card>
          <CardHeader>
            <CardTitle>공동체 개설</CardTitle>
            <CardDescription>새로운 공동체를 만들고 관리자가 됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-2">
              <Input 
                name="name" 
                placeholder="공동체 이름 입력" 
                required 
              />
              <Button type="submit">만들기</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
