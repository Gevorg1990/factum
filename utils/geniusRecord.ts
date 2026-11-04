export const geniusRecordKey = 'factum-genius-record-v1'
const levels = ['easy', 'medium', 'hard'] as const
export type GeniusLevel = typeof levels[number]

export function parseGeniusRecord(raw: string | null) {
  let value: Record<string, unknown> = {}
  try {
    const parsed = JSON.parse(raw || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) value = parsed
  } catch { /* Treat invalid storage as an empty record. */ }
  const best = typeof value.best === 'number' && Number.isInteger(value.best) && value.best >= 0 && value.best <= 10 ? value.best : null
  const bestLevel = best !== null && levels.includes(value.bestLevel as GeniusLevel) ? value.bestLevel as GeniusLevel : null
  const completed = levels.filter(level => Array.isArray(value.completed) && value.completed.includes(level))
  return { best, bestLevel, completed }
}

export function clearGeniusBest(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  const previous = storage.getItem(geniusRecordKey)
  const record = parseGeniusRecord(previous)
  storage.setItem(geniusRecordKey, JSON.stringify({ completed: record.completed }))
  return previous
}
