'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, TouchEvent, useState, useEffect } from 'react'

interface SwipeContainerProps {
  children: ReactNode
  prevUrl?: string
  nextUrl?: string
}

export default function SwipeContainer({ children, prevUrl, nextUrl }: SwipeContainerProps) {
  const router = useRouter()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [currentX, setCurrentX] = useState<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  
  // To handle the visual reset after routing
  const [offset, setOffset] = useState(0)

  // the required distance to be detected as a swipe
  const minSwipeDistance = 60

  const onTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setCurrentX(e.targetTouches[0].clientX)
    setIsSwiping(true)
    setOffset(0)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStart) return
    setCurrentX(e.targetTouches[0].clientX)
    const diff = e.targetTouches[0].clientX - touchStart
    
    // Add resistance when pulling without a target URL
    let pullDistance = diff
    if (diff > 0 && !prevUrl) pullDistance = diff * 0.2
    if (diff < 0 && !nextUrl) pullDistance = diff * 0.2
    
    setOffset(pullDistance)
  }

  const onTouchEnd = () => {
    if (!touchStart || currentX === null) {
      resetSwipe()
      return
    }

    const distance = touchStart - currentX
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && nextUrl) {
      // Swiped left, go to next
      setOffset(-window.innerWidth) // slide out left
      router.push(nextUrl)
    } else if (isRightSwipe && prevUrl) {
      // Swiped right, go to previous
      setOffset(window.innerWidth) // slide out right
      router.push(prevUrl)
    } else {
      // Not enough distance or no URL, snap back
      resetSwipe()
    }
  }

  const resetSwipe = () => {
    setTouchStart(null)
    setCurrentX(null)
    setIsSwiping(false)
    setOffset(0)
  }

  // Reset visual state when the children (the page content) change
  useEffect(() => {
    resetSwipe()
  }, [children])

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background hint indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4 z-0 opacity-50 select-none pointer-events-none">
        <span className={`text-sm font-semibold transition-opacity duration-300 ${offset > 20 ? 'opacity-100' : 'opacity-0'}`}>
          {prevUrl ? '이전으로' : ''}
        </span>
        <span className={`text-sm font-semibold transition-opacity duration-300 ${offset < -20 ? 'opacity-100' : 'opacity-0'}`}>
          {nextUrl ? '다음으로' : ''}
        </span>
      </div>

      <div 
        onTouchStart={onTouchStart} 
        onTouchMove={onTouchMove} 
        onTouchEnd={onTouchEnd}
        className="w-full relative z-10 bg-background"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
