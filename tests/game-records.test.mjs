import test from 'node:test'
import assert from 'node:assert/strict'
import { moduleUrl } from './helpers/catalog.mjs'
const { saveGameResult, readGameRecords, removeGameRecord, restoreGameRecord, gameRecordsKey } = await import(moduleUrl(new URL('../utils/gameRecords.ts', import.meta.url)))
function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}
test('the three homepage games persist their best result; equal scores prefer the harder level', () => {
  const saved = storage()
  for (const [mode, score] of [['million', 15], ['genius', 10], ['logic', 8]]) {
    saveGameResult(mode, score, 'easy', saved)
    saveGameResult(mode, 0, 'hard', saved)
    assert.equal(readGameRecords(saved).find(record => record.mode === mode).score, score)
  }
  saveGameResult('logic', 8, 'hard', saved)
  saveGameResult('logic', 8, 'medium', saved)
  assert.equal(readGameRecords(saved).find(record => record.mode === 'logic').level, 'hard')
  assert.equal(readGameRecords(saved).length, 3)
  assert.equal(saveGameResult('geography', 1000, null, saved), null)
  assert.equal(saveGameResult('chemistry', 1000, null, saved), null)
})
test('existing Genius and Million records appear without a new game', () => {
  const saved = storage({
    'factum-genius-record-v1': '{"best":10,"bestLevel":"hard","completed":["easy","medium","hard"]}',
    'factum-million-best-v1-easy': '15',
    'factum-million-best-v1-medium': '12',
  })
  assert.deepEqual(readGameRecords(saved), [
    { mode: 'million', score: 15, level: 'easy' },
    { mode: 'genius', score: 10, level: 'hard' },
  ])
})
test('deletion survives refresh, preserves unlocked stages and other games, and supports undo', () => {
  const saved = storage({
    'factum-genius-record-v1': '{"best":10,"bestLevel":"hard","completed":["easy","medium","hard"]}',
    'factum-million-best-v1-easy': '15',
    'factum-million-mode-progress-v2': '2',
    'factum-logic-completed-levels-v1': '["easy"]',
  })
  saveGameResult('logic', 9, 'easy', saved)
  const removed = removeGameRecord('million', saved)
  assert.ok(!readGameRecords(saved).some(record => record.mode === 'million'))
  assert.equal(saved.getItem('factum-million-best-v1-easy'), null)
  assert.equal(saved.getItem('factum-million-mode-progress-v2'), '2')
  restoreGameRecord(removed, saved)
  assert.equal(readGameRecords(saved).find(record => record.mode === 'million').score, 15)
  const removedGenius = removeGameRecord('genius', saved)
  assert.equal(readGameRecords(saved).some(record => record.mode === 'genius'), false)
  assert.deepEqual(JSON.parse(saved.getItem('factum-genius-record-v1')).completed, ['easy', 'medium', 'hard'])
  restoreGameRecord(removedGenius, saved)
  assert.equal(readGameRecords(saved).find(record => record.mode === 'genius').level, 'hard')
  assert.equal(readGameRecords(saved).find(record => record.mode === 'logic').score, 9)
  assert.equal(saved.getItem('factum-logic-completed-levels-v1'), '["easy"]')
})
test('invalid and unavailable storage cannot create misleading records or break a game', () => {
  const saved = storage({ [gameRecordsKey]: '{"logic":{"score":11},"chemistry":{"score":150},"unknown":{"score":1}}' })
  assert.deepEqual(readGameRecords(saved), [])
  assert.equal(saveGameResult('geography', 150, null, saved), null)
  const blocked = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') } }
  assert.deepEqual(readGameRecords(blocked), [])
  assert.equal(saveGameResult('genius', 10, 'hard', blocked), null)
  assert.deepEqual(readGameRecords(storage({ [gameRecordsKey]: 'null' })), [])
})

test('profile records exclude geography and chemistry even if older storage contains them', () => {
  const saved = storage({ [gameRecordsKey]: JSON.stringify({
    geography: { score: 1000 }, chemistry: { score: 1000 }, logic: { score: 10, level: 'hard' },
  }) })
  assert.deepEqual(readGameRecords(saved), [{ mode: 'logic', score: 10, level: 'hard' }])
})
