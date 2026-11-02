export const shareableGames = {
  million: { title: 'FACTUM Million', total: 15 },
  genius: { title: 'FACTUM Genius', total: 10 },
  logic: { title: 'FACTUM Logic', total: 5 },
} as const

export type ShareableGame = keyof typeof shareableGames

export function parseGameResult(mode: string, score: string) {
  if (!Object.hasOwn(shareableGames, mode) || !/^(0|[1-9]\d*)$/.test(score)) return null
  const game = shareableGames[mode as ShareableGame]
  const value = Number(score)
  if (value > game.total) return null
  return { ...game, mode: mode as ShareableGame, score: value }
}

export function gameResultPath(mode: ShareableGame, score: number) {
  return `/games/results/${mode}/${score}`
}

export function facebookShareUrl(resultUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: resultUrl })}`
}
