import { millionaireQuestionPairs, type MillionaireQuestion } from '../data/factum_millionaire_45'

export type MillionQuestion = MillionaireQuestion
export type MillionTier = 'easy' | 'medium' | 'hard'
export const millionQuestions = millionaireQuestionPairs.flatMap(level => level.flatMap(pair => [pair.primary, pair.replacement]))
export const millionTiers: MillionTier[] = ['easy', 'medium', 'hard']

function randomizeAnswers(item: MillionQuestion, random: () => number): MillionQuestion {
  const options = item.answers.map((answer, index) => ({ answer, index }))
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[options[i], options[j]] = [options[j]!, options[i]!]
  }
  return { ...item, answers: options.map(option => option.answer) as MillionQuestion['answers'], correct: options.findIndex(option => option.index === item.correct) }
}

/** Each numbered slot draws one variant and reserves its counterpart for the swap. */
export function createMillionRound(level: MillionTier, random: () => number = Math.random): {
  questions: MillionQuestion[]
  replacements: MillionQuestion[]
} {
  const levelIndex = millionTiers.indexOf(level)
  const questions: MillionQuestion[] = []
  const replacements: MillionQuestion[] = []
  for (const { primary, replacement: alternative } of millionaireQuestionPairs[levelIndex]!) {
    const [chosen, reserved] = random() < .5 ? [primary, alternative] : [alternative, primary]
    questions.push(randomizeAnswers(chosen!, random))
    replacements.push(randomizeAnswers(reserved!, random))
  }
  return { questions, replacements }
}
