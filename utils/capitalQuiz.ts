import type { CapitalPair } from '~/data/capitalQuiz'
export type CapitalQuizMode = 'capital' | 'country' | 'mixed'
export type CapitalQuestion = { pair: CapitalPair; direction: 'capital' | 'country' }

export function normalizeCapitalAnswer(value: string): string {
  return value.normalize('NFKD').toLocaleLowerCase().replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '')
}
export function matchesArmenianAnswer(value: string, normalized: string): boolean {
  const base = normalizeCapitalAnswer(value)
  if (base === normalized) return true
  // Accept articles and spoken copulas only after a complete known Armenian name.
  // Do not stem arbitrary words, Latin spellings, or single-letter symbols.
  if (!/^[ա-ֆև]{3,}$/u.test(base)) return false
  return ['ը', 'ն', 'նա', 'նէ', 'է', 'ա', 'ըէ'].some(suffix => normalized === base + suffix)
}
export function isCapitalAnswerCorrect(question: CapitalQuestion, value: string): boolean {
  const expected = question.direction === 'capital'
    ? [question.pair.capital, ...question.pair.capitalAliases]
    : [question.pair.country, ...question.pair.countryAliases]
  const normalized = normalizeCapitalAnswer(value)
  return !!normalized && expected.some(answer => matchesArmenianAnswer(answer, normalized))
}
export function createCapitalRounds(pool: CapitalPair[], mode: CapitalQuizMode): CapitalQuestion[] {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  const firstDirection = Math.random() < .5 ? 0 : 1
  return shuffled.slice(0, 10).map((pair, index) => ({ pair, direction: mode === 'mixed' ? ((index + firstDirection) % 2 ? 'capital' : 'country') : mode }))
}
