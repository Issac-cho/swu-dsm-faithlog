/* eslint-disable @typescript-eslint/no-require-imports -- Node built-in test runner uses CommonJS. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

// Run the shared TypeScript calculation without adding a test runtime dependency.
const filename = path.resolve('src/utils/progress.ts')
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const loaded = new Module(filename, module)
loaded.filename = filename
loaded.paths = Module._nodeModulePaths(path.dirname(filename))
loaded._compile(compiled, filename)
const { getActiveItemsForDay, calculateDayProgress, calculateWeekProgress } = loaded.exports

const item = (overrides = {}) => ({ id: 'one', type: 'SYSTEM', is_active: true,
  created_at: '2026-11-14T15:00:00Z', updated_at: '2026-11-14T15:00:00Z', ...overrides })
const record = (overrides = {}) => ({ checklist_item_id: 'one', record_date: '2026-11-15', completed: true, ...overrides })

test('system and custom items both start on their Korean creation date', () => {
  for (const type of ['SYSTEM', 'CUSTOM']) {
    assert.equal(getActiveItemsForDay([item({ type })], '2026-11-14').length, 0)
    assert.equal(getActiveItemsForDay([item({ type })], '2026-11-15').length, 1)
  }
})
test('archived items retain history through the Korean deletion date', () => {
  const archived = item({ deleted_at: '2026-11-16T15:00:00Z' })
  assert.equal(getActiveItemsForDay([archived], '2026-11-16').length, 1)
  assert.equal(getActiveItemsForDay([archived], '2026-11-17').length, 1)
  assert.equal(getActiveItemsForDay([archived], '2026-11-18').length, 0)
})
test('inactive items use their last update as the available archive boundary', () => {
  const inactive = item({ is_active: false, updated_at: '2026-11-16T15:00:00Z' })
  assert.equal(getActiveItemsForDay([inactive], '2026-11-17').length, 1)
  assert.equal(getActiveItemsForDay([inactive], '2026-11-18').length, 0)
})
test('counts ignore deleted, wrong-date, unrelated and duplicate records', () => {
  const result = calculateDayProgress([item()], [record(), record(),
    record({ deleted_at: '2026-11-16T00:00:00Z' }),
    record({ record_date: '2026-11-16' }), record({ checklist_item_id: 'other' })], '2026-11-15')
  assert.deepEqual(result, { percentage: 100, total: 1, completed: 1 })
  assert.equal(calculateDayProgress([item()], [record({ deleted_at: '2026-11-16T00:00:00Z' })], '2026-11-15').completed, 0)
})
test('day and week use the same archive rules and empty weeks earn no bonus', () => {
  const archived = item({ deleted_at: '2026-11-15T12:00:00Z' })
  const days = ['2026-11-14', '2026-11-15', '2026-11-16']
  const week = calculateWeekProgress([archived], [record()], days)
  assert.equal(week.total, days.reduce((n, day) => n + calculateDayProgress([archived], [record()], day).total, 0))
  assert.equal(week.isPerfect, true)
  assert.equal(calculateWeekProgress([], [], days).isPerfect, false)
})
test('text colors retain at least 4.5:1 contrast in light and dark themes', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf8')
  const luminance = hex => {
    const c = hex.match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722
  }
  for (const block of [css.split(':root {')[1].split('.dark {')[0], css.split('.dark {')[1]]) {
    const color = key => block.match(new RegExp('--' + key + ': #([0-9a-fA-F]{6})'))[1]
    const contrast = (a, b) => { const x = luminance(color(a)), y = luminance(color(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
    assert.ok(contrast('primary', 'primary-foreground') >= 4.5)
    assert.ok(contrast('primary', 'background') >= 4.5)
    assert.ok(contrast('secondary', 'secondary-foreground') >= 4.5)
  }
})
