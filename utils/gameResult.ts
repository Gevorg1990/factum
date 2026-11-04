export const resultLevels = { easy: 'Հեշտ', medium: 'Միջին', hard: 'Դժվար' } as const
export type ResultLevel = keyof typeof resultLevels

export function parseResultLevel(value: unknown): ResultLevel | null {
  return typeof value === 'string' && Object.hasOwn(resultLevels, value) ? value as ResultLevel : null
}

export const shareableGames = {
  million: { title: 'FACTUM Million', total: 15, step: 1, playPath: '/games/million', image: '/images/million-art.jpg' },
  genius: { title: 'FACTUM Genius', total: 10, step: 1, playPath: '/games/genius', image: '/images/genius-art.jpg' },
  logic: { title: 'FACTUM Logic', total: 10, step: 1, playPath: '/games/logic', image: '/images/logic-art.jpg' },
  geography: { title: 'Երկիր և մայրաքաղաք', total: 1000, step: 100, playPath: '/globe#capital-quiz-title', image: '/images/geography-art.jpg' },
  chemistry: { title: 'Քիմիական տարրեր', total: 1000, step: 100, playPath: '/periodic-table#element-quiz-title', image: '/images/chemistry-art.jpg' },
} as const

export type ShareableGame = keyof typeof shareableGames

export function parseGameResult(mode: string, score: string) {
  if (!Object.hasOwn(shareableGames, mode) || !/^(0|[1-9]\d*)$/.test(score)) return null
  const game = shareableGames[mode as ShareableGame]
  const value = Number(score)
  if (value > game.total || value % game.step !== 0) return null
  return { ...game, mode: mode as ShareableGame, score: value }
}

export function gameResultPath(mode: ShareableGame, score: number, level?: ResultLevel | null) {
  const path = `/games/results/${mode}/${score}`
  return (mode === 'genius' || mode === 'logic') && level ? `${path}?level=${level}` : path
}

export function facebookShareUrl(resultUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: resultUrl })}`
}
