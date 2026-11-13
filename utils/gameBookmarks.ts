import { geniusStatements } from '~/data/geniusStatements'
import { logicPuzzles } from '~/data/logicPuzzles'

export type SavedGameQuestion = {
  id: string
  game: 'genius' | 'logic'
  gameTitle: string
  question: string
  answers: string[]
  correct: number
  explanation: string
}

function bookmarkId(game: SavedGameQuestion['game'], question: string): string {
  let hash = 2166136261
  for (let i = 0; i < question.length; i++) hash = Math.imul(hash ^ question.charCodeAt(i), 16777619)
  return `game-${game}-${(hash >>> 0).toString(36)}`
}

const savedGameQuestions: SavedGameQuestion[] = [
  ...geniusStatements.map(item => ({
    id: bookmarkId('genius', item.statement),
    game: 'genius' as const,
    gameTitle: 'COGNITIO Genius',
    question: item.statement,
    answers: ['Ճիշտ է', 'Սխալ է'],
    correct: item.correct ? 0 : 1,
    explanation: item.explanation,
  })),
  ...logicPuzzles.map(item => ({
    id: bookmarkId('logic', item.question),
    game: 'logic' as const,
    gameTitle: 'COGNITIO Logic',
    question: item.question,
    answers: item.answers,
    correct: item.correct,
    explanation: item.explanation,
  })),
]

export function gameBookmarkId(game: SavedGameQuestion['game'], question: string): string {
  return bookmarkId(game, question)
}

export function findGameBookmark(id: string): SavedGameQuestion | undefined {
  return savedGameQuestions.find(item => item.id === id)
}
