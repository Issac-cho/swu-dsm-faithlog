import { createClient } from '@/utils/supabase/server'
import { eventNames, actionNames, normalizePage } from '@/lib/analytics/events'

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, { status: 403 })
  const body = await request.text()
  if (body.length > 16000) return new Response(null, { status: 413 })
  let events: unknown
  try { events = JSON.parse(body) } catch { return new Response(null, { status: 400 }) }
  if (!Array.isArray(events) || events.length < 1 || events.length > 20) return new Response(null, { status: 400 })
  const valid = events.every(e =>
    e && typeof e.id === 'string' && /^[0-9a-f-]{36}$/i.test(e.id) &&
    eventNames.includes(e.name) && typeof e.page === 'string' &&
    /^\/app(?:\/[a-zA-Z0-9_:-]+)*$/.test(e.page) && e.page.length <= 160 &&
    typeof e.detail === 'string' && (
      ['save_failed', 'delete_failed'].includes(e.name) ? actionNames.includes(e.detail) :
      e.name === 'history_tab' ? ['weekly', 'monthly', 'yearly'].includes(e.detail) :
      e.name === 'other_history_open' ? ['cell', 'shepherd', 'directory'].includes(e.detail) :
      e.detail === ''
    )
  )
  if (!valid) return new Response(null, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(null, { status: 401 })
  const { error } = await supabase.from('usage_events').upsert(events.map(e => ({
    id: e.id, user_id: user.id, name: e.name, page: normalizePage(e.page), detail: e.detail,
  })), { onConflict: 'id', ignoreDuplicates: true })
  if (error) return new Response(null, { status: 503 })
  return new Response(null, { status: 204 })
}
