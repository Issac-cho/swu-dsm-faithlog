/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const context = { exports: {}, require: name => dependencies[name], ...globals }
  vm.runInNewContext(source, context)
  return context.exports
}
const events = load('src/lib/analytics/events.ts')

test('telemetry batches events, excludes content, and preserves action results and errors', async () => {
  const batches = []
  const client = load('src/lib/analytics/client.ts', { './events': events }, {
    crypto: require('node:crypto').webcrypto,
    location: { pathname: '/app/checklist' },
    setTimeout: () => 1, clearTimeout: () => {},
    fetch: (_url, options) => { batches.push(JSON.parse(options.body)); return Promise.reject(new Error('offline')) },
  })
  const result = { success: true }
  assert.equal(await client.trackAction('toggleRecord', async () => result, 'check_complete'), result)
  await client.trackAction('saveReflection', async () => ({ error: 'private text' }), 'review_save')
  const failure = new Error('private error')
  await assert.rejects(client.trackAction('deleteCell', async () => { throw failure }), error => error === failure)
  assert.equal(batches.length, 0)
  client.flushAnalytics()
  await Promise.resolve()
  assert.deepEqual(batches[0].map(e => e.name), ['check_complete', 'save_failed', 'delete_failed'])
  assert.equal(JSON.stringify(batches).includes('private'), false)
  assert.equal(events.normalizePage('/app/shepherd/12345678-1234-1234-1234-123456789abc'), '/app/shepherd/:id')
})

test('ingestion requires same origin and authentication, validates payload and takes identity from session', async () => {
  let user = null
  let rows
  const route = load('src/app/api/analytics/route.ts', {
    '@/lib/analytics/events': events,
    '@/utils/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user } }) },
      from: () => ({ upsert: async data => { rows = data; return { error: null } } }),
    }) },
  }, { Response, URL })
  const event = { id: '12345678-1234-1234-1234-123456789abc', name: 'page_view', page: '/app/checklist', detail: '' }
  const request = (data, origin = 'https://faithlog.test') => ({
    url: 'https://faithlog.test/api/analytics', headers: new Headers({ origin }), text: async () => JSON.stringify(data),
  })
  assert.equal((await route.POST(request([event], 'https://other.test'))).status, 403)
  assert.equal((await route.POST(request([event]))).status, 401)
  user = { id: 'session-user' }
  assert.equal((await route.POST(request([{ ...event, detail: 'private memo' }]))).status, 400)
  assert.equal((await route.POST(request(Array(21).fill(event)))).status, 400)
  assert.equal((await route.POST(request([{ ...event, user_id: 'forged', created_at: '2000-01-01' }]))).status, 204)
  assert.equal(rows[0].user_id, 'session-user')
  assert.equal('created_at' in rows[0], false)
})
