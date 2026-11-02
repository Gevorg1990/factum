import { matchesArmenianAnswer, normalizeCapitalAnswer } from './capitalQuiz'
export type VoiceQuestion = {
  prompt: string
  expected: string
  aliases: string[]
  promptEn: string
  summary: string
  reference: string
  direction: 'forward' | 'reverse'
}

const armenianLetters: Record<string, string> = {
  ա: 'a', բ: 'b', գ: 'g', դ: 'd', ե: 'e', զ: 'z', է: 'e', ը: 'y', թ: 't', ժ: 'zh',
  ի: 'i', լ: 'l', խ: 'kh', ծ: 'ts', կ: 'k', հ: 'h', ձ: 'dz', ղ: 'gh', ճ: 'ch', մ: 'm',
  յ: 'y', ն: 'n', շ: 'sh', ո: 'o', չ: 'ch', պ: 'p', ջ: 'j', ռ: 'r', ս: 's', վ: 'v',
  տ: 't', ր: 'r', ց: 'ts', ւ: 'v', փ: 'p', ք: 'k', և: 'ev', օ: 'o', ֆ: 'f',
}
function romanizedNameKeys(name: string): string[] {
  if (!/[Ա-Ֆա-ֆև]/u.test(name)) return []
  const armenian = name.toLocaleLowerCase()
  const romanized = armenian.replace(/ու/g, 'u').replace(/[ա-ֆև]/gu, letter => armenianLetters[letter] || letter)
  const variants = [romanized]
  if (armenian.startsWith('ո')) variants.push('v' + romanized)
  if (armenian.startsWith('ե')) variants.push('y' + romanized)
  return variants.map(normalizeCapitalAnswer)
}
function matchesAnswer(candidate: Pick<VoiceQuestion, 'expected' | 'aliases'>, normalized: string): boolean {
  const values = [candidate.expected, ...candidate.aliases]
  if (values.some(value => matchesArmenianAnswer(value, normalized))) return true
  // Only known names are converted. Symbols keep their standard Latin spelling;
  // unknown speech is left editable rather than guessed from the right answer.
  return /^[a-z]+$/i.test(normalized) && values.some(value => romanizedNameKeys(value).includes(normalized))
}
export function isVoiceAnswerCorrect(question: VoiceQuestion, answer: string) {
  const normalized = normalizeCapitalAnswer(answer)
  return !!normalized && matchesAnswer(question, normalized)
}

// Match against the full answer catalog, never just the expected answer, so a
// recognized wrong city/country stays wrong. Unknown speech remains editable.
export function formatVoiceTranscript(transcript: string, candidates: Pick<VoiceQuestion, 'expected' | 'aliases'>[], language: string): string {
  const text = transcript.trim()
  if (language !== 'hy-AM') return text
  const normalized = normalizeCapitalAnswer(text)
  if (!normalized) return text
  // Prefer exact aliases before phonetic spellings, particularly for symbols.
  const exact = candidates.find(candidate => [candidate.expected, ...candidate.aliases].some(value => normalizeCapitalAnswer(value) === normalized))
  if (exact) return exact.expected
  const matches = candidates.filter(candidate => matchesAnswer(candidate, normalized))
  const match = matches.length === 1 ? matches[0] : undefined
  return match?.expected || text
}
