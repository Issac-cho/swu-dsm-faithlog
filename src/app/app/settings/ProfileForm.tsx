'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateProfile } from './actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
  '🐌', '🐞', '🐜', '🐢', '🐍', '🐙', '🦑', '🦐', '🦀', '🐡',
  '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓'
]

export default function ProfileForm({ 
  initialName, 
  initialAvatar 
}: { 
  initialName: string
  initialAvatar: string | null 
}) {
  const [name, setName] = useState(initialName || '')
  const [avatarIcon, setAvatarIcon] = useState(initialAvatar || '👤')
  const [isPending, setIsPending] = useState(false)
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('avatarIcon', avatarIcon)
    
    const res = await updateProfile(formData)
    if (res.error) {
      alert(res.error)
    } else {
      alert('프로필이 성공적으로 업데이트 되었습니다.')
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        {/* Emoji Selector */}
        <Dialog open={isEmojiModalOpen} onOpenChange={setIsEmojiModalOpen}>
          <DialogTrigger asChild>
            <button 
              type="button" 
              className="w-24 h-24 text-5xl bg-muted rounded-full flex items-center justify-center hover:ring-4 hover:ring-primary/20 transition-all cursor-pointer shadow-sm relative group"
            >
              {avatarIcon}
              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">변경</span>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>프로필 이모지 선택</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setAvatarIcon('👤')
                  setIsEmojiModalOpen(false)
                }}
                className={`text-3xl p-2 rounded-xl hover:bg-muted transition-colors ${avatarIcon === '👤' ? 'bg-primary/20 ring-2 ring-primary' : ''}`}
              >
                👤
              </button>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setAvatarIcon(emoji)
                    setIsEmojiModalOpen(false)
                  }}
                  className={`text-3xl p-2 rounded-xl hover:bg-muted transition-colors ${avatarIcon === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">이름</label>
        <Input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해주세요"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
        {isPending ? '저장 중...' : '프로필 저장'}
      </Button>
    </form>
  )
}
