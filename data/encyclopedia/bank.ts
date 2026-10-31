import type { Question } from '../content'

export type QuestionSource = { name: string; url: string }

/** Each row contains two separately authored, related questions and answers.
 * Keep row order stable: IDs are permanent saved-reading destinations.
 * Add new rows at the end, or add a new named bank when expanding a subject.
 */
export function questionPairs(subject: string, edition: string, source: QuestionSource, text: string): Question[] {
  return text.trim().split('\n').flatMap((line, index) => {
    const values = line.split('|').map(value => value.trim())
    if (values.length !== 4 || values.some(value => !value)) {
      throw new Error(`Invalid encyclopedia row: ${subject}/${edition}/${index + 1}`)
    }
    const [firstTitle, firstAnswer, secondTitle, secondAnswer] = values as [string, string, string, string]
    return [
      { id: `${subject}-${edition}-${index + 1}-a`, subject, title: firstTitle, answer: firstAnswer, detail: `${secondTitle} ${secondAnswer}`, source },
      { id: `${subject}-${edition}-${index + 1}-b`, subject, title: secondTitle, answer: secondAnswer, detail: `${firstTitle} ${firstAnswer}`, source },
    ]
  })
}
