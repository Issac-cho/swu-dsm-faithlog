'use client'

import { normalizePage, type EventName } from './events'

type Event = { id: string; name: EventName; page: string; detail: string }
let queue: Event[] = []
let timer: ReturnType<typeof setTimeout> | undefined

export function flushAnalytics() {
  if (timer) clearTimeout(timer)
  timer = undefined
  if (!queue.length) return
  const events = queue
  queue = []
  // Delivery is best effort so telemetry never delays a user action.
  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(events),
    keepalive: true,
  }).catch(() => {})
}

export function trackEvent(name: EventName, detail = '') {
  try {
    queue.push({ id: crypto.randomUUID(), name, page: normalizePage(location.pathname), detail })
    if (queue.length >= 20) flushAnalytics()
    else if (!timer) timer = setTimeout(flushAnalytics, 3000)
  } catch {}
}

export async function trackAction<T>(action: string, run: () => Promise<T>, success?: EventName): Promise<T> {
  try {
    const result = await run()
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      trackEvent(/delete|remove/i.test(action) ? 'delete_failed' : 'save_failed', action)
    } else if (success) {
      trackEvent(success)
    }
    return result
  } catch (error) {
    trackEvent(/delete|remove/i.test(action) ? 'delete_failed' : 'save_failed', action)
    throw error
  }
}
