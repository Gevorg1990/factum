import test from 'node:test'
import assert from 'node:assert/strict'
import { geniusRecordKey, parseGeniusRecord, clearGeniusBest } from '../utils/geniusRecord.ts'

test('reads the actual best difficulty and never invents a level for legacy records', () => {
  assert.deepEqual(parseGeniusRecord('{"best":10,"bestLevel":"hard","completed":["easy","hard"]}'), {
    best: 10, bestLevel: 'hard', completed: ['easy', 'hard'],
  })
  assert.deepEqual(parseGeniusRecord('{"best":10,"completed":["easy","medium","hard"]}'), {
    best: 10, bestLevel: null, completed: ['easy', 'medium', 'hard'],
  })
  for (const raw of [null, 'null', '[]', 'broken', '{"best":11}', '{"best":"10"}']) {
    assert.equal(parseGeniusRecord(raw).best, null)
  }
  assert.equal(parseGeniusRecord('{"best":0,"bestLevel":"easy"}').best, 0)
  assert.equal(parseGeniusRecord('{"best":10,"bestLevel":"__proto__"}').bestLevel, null)
})

test('deleting a best score survives reload, preserves completed levels, and can be undone', () => {
  const original = JSON.stringify({ best: 10, bestLevel: 'hard', completed: ['easy', 'medium', 'hard'] })
  const values = new Map([[geniusRecordKey, original], ['factum-game-difficulty-progress-v1', '{"genius":2}']])
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const previous = clearGeniusBest(storage)
  assert.equal(previous, original)
  assert.deepEqual(parseGeniusRecord(storage.getItem(geniusRecordKey)), {
    best: null, bestLevel: null, completed: ['easy', 'medium', 'hard'],
  })
  assert.equal(values.get('factum-game-difficulty-progress-v1'), '{"genius":2}')
  storage.setItem(geniusRecordKey, previous)
  assert.equal(parseGeniusRecord(storage.getItem(geniusRecordKey)).bestLevel, 'hard')
  assert.equal(parseGeniusRecord(storage.getItem(geniusRecordKey)).best, 10)
})
