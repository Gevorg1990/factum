import { periodicElements } from '../data/periodicTable'
import type { VoiceQuestion } from './voiceQuiz'

const letters: Record<string, string[]> = {
  A: ['էյ', 'ա', 'ay'], B: ['բի', 'բե', 'bee'], C: ['սի', 'ցե', 'see'], D: ['դի', 'դե', 'dee'],
  E: ['ի', 'ե', 'ee'], F: ['էֆ', 'ef'], G: ['ջի', 'գե', 'gee'], H: ['էյչ', 'հաշ', 'aitch'],
  I: ['այ', 'ի', 'eye'], J: ['ջեյ', 'յոտ', 'jay'], K: ['քեյ', 'կա', 'kay', 'կ', 'կը'], L: ['էլ', 'el'],
  M: ['էմ', 'em'], N: ['էն', 'en'], O: ['օ', 'ո', 'oh'], P: ['փի', 'պի', 'պե', 'pee'],
  Q: ['քյու', 'cue'], R: ['ար', 'էր', 'ar'], S: ['էս', 'ess'], T: ['թի', 'տի', 'տե', 'tee'],
  U: ['յու', 'ու', 'you'], V: ['վի', 'վե', 'vee'], W: ['դաբլյու', 'double you'],
  X: ['էքս', 'ex'], Y: ['ուայ', 'why'], Z: ['զեդ', 'զի', 'zed', 'zee'],
}
export function symbolSpeechAliases(symbol: string): string[] {
  return [...symbol.toUpperCase()].reduce<string[]>((prefixes, letter) => prefixes.flatMap(prefix => (letters[letter] ?? [letter]).map(spoken => `${prefix} ${spoken}`.trim())), [''])
}
const commonNumbers = new Set([...Array.from({length: 20}, (_, i) => i + 1), 26, 29, 30, 47, 50, 53, 79, 80, 82, 92])
export function createElementRounds(mode: 'capital' | 'country' | 'mixed', allElements = false): VoiceQuestion[] {
  const pool = periodicElements.filter(element => allElements || commonNumbers.has(element.number))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  const firstDirection = Math.random() < .5 ? 0 : 1
  return pool.slice(0, 10).map((element, index) => {
    const direction = mode === 'mixed' ? ((index + firstDirection) % 2 ? 'forward' : 'reverse') : mode === 'capital' ? 'forward' : 'reverse'
    return {
      direction,
      prompt: direction === 'forward' ? element.symbol : element.name,
      expected: direction === 'forward' ? element.name : element.symbol,
      aliases: direction === 'forward' ? [element.nameEn] : symbolSpeechAliases(element.symbol),
      promptEn: direction === 'forward' ? element.symbol.toUpperCase().split('').join(' ') : element.nameEn,
      summary: `${element.symbol} — ${element.name} · ատոմային համար՝ ${element.number}`,
      reference: String(element.number),
    }
  })
}
