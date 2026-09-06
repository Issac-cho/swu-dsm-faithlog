'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateCommunityPassword } from './actions'

export default function CommunitySettings({ communityId, initialPassword }: { communityId: string, initialPassword?: string | null }) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>공동체 설정</CardTitle>
        <CardDescription>가입 비밀번호를 설정하세요. (비워두면 비밀번호 없이 가입 가능)</CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          className="flex gap-2 max-w-sm" 
          action={async (fd) => {
            const res = await updateCommunityPassword(fd)
            if (res.success) {
              window.alert('가입 비밀번호가 변경되었습니다.')
            } else {
              window.alert(res.error || '오류가 발생했습니다.')
            }
          }}
        >
          <input type="hidden" name="communityId" value={communityId} />
          <Input 
            name="password" 
            placeholder="가입 비밀번호" 
            defaultValue={initialPassword || ''}
          />
          <Button type="submit">저장</Button>
        </form>
      </CardContent>
    </Card>
  )
}
