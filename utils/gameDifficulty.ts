export const gameDifficulties = [
  { id: 'easy', title: 'Հեշտ', icon: '🌱' },
  { id: 'medium', title: 'Միջին', icon: '⚡' },
  { id: 'hard', title: 'Դժվար', icon: '🔥' },
] as const

export type GameDifficulty = typeof gameDifficulties[number]['id']
export type ProgressiveGame = 'genius' | 'logic' | 'million'

const progressKey = 'factum-game-difficulty-progress-v1'

export function difficultyIndex(level: string | undefined): number {
  return gameDifficulties.findIndex(item => item.id === level)
}

export function difficultyTitle(level: GameDifficulty): string {
  return gameDifficulties.find(item => item.id === level)!.title
}

export function unlockedDifficultyIndex(game: ProgressiveGame): number {
  if (!import.meta.client) return 0

  try {
    const saved = JSON.parse(localStorage.getItem(progressKey) || '{}') as Record<string, unknown>
    const value = saved[game]
    return typeof value === 'number' && Number.isInteger(value)
      ? Math.min(gameDifficulties.length - 1, Math.max(0, value))
      : 0
  } catch {
    return 0
  }
}

export function saveDifficultyProgress(game: ProgressiveGame, passed: GameDifficulty): number {
  if (!import.meta.client) return 0

  const current = unlockedDifficultyIndex(game)
  const passedIndex = difficultyIndex(passed)
  const next = Math.min(gameDifficulties.length - 1, Math.max(current, passedIndex + 1))

  try {
    const saved = JSON.parse(localStorage.getItem(progressKey) || '{}') as Record<string, unknown>
    localStorage.setItem(progressKey, JSON.stringify({ ...saved, [game]: next }))
  } catch {
    // The current session can continue even if browser storage is unavailable.
  }

  return next
}

export function requiredCorrectAnswers(total: number): number {
  return Math.ceil(total * 0.8)
}
