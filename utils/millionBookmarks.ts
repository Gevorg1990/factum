import { millionaireQuestionPairs, type MillionaireQuestion as MillionQuestion } from '../data/factum_millionaire_45'

/** Identify the question and correct text, independent of shuffled answer positions. */
export function millionBookmarkId(question: MillionQuestion): string {
  const text = JSON.stringify([question.question, question.answers[question.correct]])
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return `million-${(hash >>> 0).toString(36)}`
}
const questions = millionaireQuestionPairs.flatMap(level => level.flatMap(pair => [pair.primary, pair.replacement]))
const bookmarks = new Map(questions.map(question => [millionBookmarkId(question), question]))
export function findMillionBookmark(id: string): MillionQuestion | undefined { return bookmarks.get(id) }
