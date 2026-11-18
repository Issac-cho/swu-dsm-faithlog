'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { flushAnalytics, trackEvent } from '@/lib/analytics/client'

export default function AnalyticsTracker({ userId }: { userId: string }) {
  const pathname = usePathname()
  const previous = useRef('')
  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    trackEvent('page_view')
  }, [pathname])
  useEffect(() => {
    const onHidden = () => { if (document.visibilityState === 'hidden') flushAnalytics() }
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (!link) return
      const url = new URL(link.href)
      const target = url.searchParams.get('userId')
      const isSheep = /^\/app\/shepherd\/[^/]+$/.test(url.pathname)
      if (url.origin === location.origin && (
        (url.pathname === '/app/history' && target && target !== userId) || isSheep
      )) trackEvent('other_history_open', pathname.startsWith('/app/cell') ? 'cell' : pathname.startsWith('/app/shepherd') ? 'shepherd' : 'directory')
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', flushAnalytics)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', flushAnalytics)
      document.removeEventListener('click', onClick)
    }
  }, [pathname, userId])
  return null
}
