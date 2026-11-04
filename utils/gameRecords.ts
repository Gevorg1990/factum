import { shareableGames, parseResultLevel, type ShareableGame, type ResultLevel } from './gameResult'
import { geniusRecordKey, parseGeniusRecord, clearGeniusBest } from './geniusRecord'

const recordGames = ['million', 'genius', 'logic'] as const

export const gameRecordsKey = 'factum-game-records-v1'
export const gameRecordsEvent = 'factum-game-records-changed'
export type GameRecord = { mode: ShareableGame; score: number; level: ResultLevel | null }
type RecordStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export type RemovedGameRecord = { record: GameRecord; legacy: Record<string, string | null> }
const levels: ResultLevel[] = ['easy', 'medium', 'hard']

function browserStorage(): RecordStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}
function readStored(storage: RecordStorage): Record<string, unknown> {
  try {
    const parsed = JSON.parse(storage.getItem(gameRecordsKey) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}
function validRecord(mode: ShareableGame, value: unknown): GameRecord | null {
  if (!value || typeof value !== 'object') return null
  const { score, level } = value as Record<string, unknown>
  const game = shareableGames[mode]
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > game.total || score % game.step) return null
  return { mode, score, level: ['million', 'genius', 'logic'].includes(mode) ? parseResultLevel(level) : null }
}
function better(previous: GameRecord | null, next: GameRecord): GameRecord {
  if (!previous || next.score > previous.score || (next.score === previous.score && levels.indexOf(next.level!) > levels.indexOf(previous.level!))) return next
  return previous
}
function legacyKeys(mode: ShareableGame): string[] {
  if (mode === 'genius') return [geniusRecordKey]
  if (mode === 'million') return levels.map(level => `factum-million-best-v1-${level}`)
  return []
}
function legacyRecord(mode: ShareableGame, storage: RecordStorage): GameRecord | null {
  if (mode === 'genius') {
    const old = parseGeniusRecord(storage.getItem(geniusRecordKey))
    return old.best === null ? null : { mode, score: old.best, level: old.bestLevel }
  }
  if (mode !== 'million') return null
  let best: GameRecord | null = null
  for (const level of levels) {
    const raw = storage.getItem(`factum-million-best-v1-${level}`)
    if (raw === null || !/^(0|[1-9]\d*)$/.test(raw)) continue
    const record = validRecord(mode, { score: Number(raw), level })
    if (record) best = better(best, record)
  }
  return best
}
function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(gameRecordsEvent))
}

/** Legacy Genius and Million scores remain visible without replaying a game. */
export function readGameRecords(storage = browserStorage()): GameRecord[] {
  if (!storage) return []
  try {
    const saved = readStored(storage)
    return recordGames.flatMap(mode => {
      const record = Object.hasOwn(saved, mode) ? validRecord(mode, saved[mode]) : legacyRecord(mode, storage)
      return record ? [record] : []
    })
  } catch { return [] }
}

export function saveGameResult(mode: ShareableGame, score: number, level: ResultLevel | null = null, storage = browserStorage()): GameRecord | null {
  if (!(recordGames as readonly string[]).includes(mode)) return null
  const next = validRecord(mode, { score, level })
  if (!storage || !next) return null
  try {
    const previous = readGameRecords(storage).find(record => record.mode === mode) || null
    const best = better(previous, next)
    storage.setItem(gameRecordsKey, JSON.stringify({ ...readStored(storage), [mode]: best }))
    notify()
    return best
  } catch { return null }
}

export function removeGameRecord(mode: ShareableGame, storage = browserStorage()): RemovedGameRecord | null {
  if (!storage) throw new Error('Browser storage unavailable')
  const record = readGameRecords(storage).find(record => record.mode === mode)
  if (!record) return null
  const legacy = Object.fromEntries(legacyKeys(mode).map(key => [key, storage.getItem(key)]))
  // A tombstone prevents a deleted legacy score from reappearing on refresh.
  storage.setItem(gameRecordsKey, JSON.stringify({ ...readStored(storage), [mode]: null }))
  if (mode === 'genius') clearGeniusBest(storage)
  if (mode === 'million') legacyKeys(mode).forEach(key => storage.removeItem(key))
  notify()
  return { record, legacy }
}

export function restoreGameRecord(removed: RemovedGameRecord, storage = browserStorage()) {
  if (!storage) throw new Error('Browser storage unavailable')
  const current = readGameRecords(storage).find(record => record.mode === removed.record.mode) || null
  const best = better(current, removed.record)
  storage.setItem(gameRecordsKey, JSON.stringify({ ...readStored(storage), [best.mode]: best }))
  for (const [key, raw] of Object.entries(removed.legacy)) {
    if (raw === null) continue
    if (key === geniusRecordKey) {
      const existing = parseGeniusRecord(storage.getItem(key))
      const old = parseGeniusRecord(raw)
      storage.setItem(key, JSON.stringify({ completed: [...new Set([...existing.completed, ...old.completed])], best: best.score, bestLevel: best.level }))
    } else {
      const existing = Number(storage.getItem(key) || 0)
      storage.setItem(key, String(Math.max(existing, Number(raw))))
    }
  }
  notify()
}
