'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, TouchEvent, useState } from 'react'

interface SwipeContainerProps {
  children: ReactNode
  prevUrl?: string
  nextUrl?: string
}

export default function SwipeContainer({ children, prevUrl, nextUrl }: SwipeContainerProps) {
  const router = useRouter()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && nextUrl) {
      // Swiped left, go to next
      router.push(nextUrl)
    }
    if (isRightSwipe && prevUrl) {
      // Swiped right, go to previous
      router.push(prevUrl)
    }
  }

  return (
    <div 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
      className="w-full"
    >
      {children}
    </div>
  )
}
