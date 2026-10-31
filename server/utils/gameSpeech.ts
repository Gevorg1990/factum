import { capitalPairs } from '../../data/capitalQuiz'
import { periodicElements } from '../../data/periodicTable'
import { symbolSpeechAliases } from '../../utils/elementQuiz'

export function gameSpeechText(input: { topic?: unknown; reference?: unknown; direction?: unknown } | null | undefined): string | undefined {
  if (!input || typeof input.reference !== 'string' || !['forward', 'reverse'].includes(String(input.direction))) return
  if (input.topic === 'geography') {
    const pair = capitalPairs.find(pair => pair.countryCode === input.reference)
    if (!pair) return
    return input.direction === 'forward' ? `${pair.country}։ Ո՞րն է այս երկրի մայրաքաղաքը։` : `${pair.capital}։ Ո՞ր երկրի մայրաքաղաքն է։`
  }
  if (input.topic === 'chemistry') {
    const element = periodicElements.find(element => String(element.number) === input.reference)
    if (!element) return
    return input.direction === 'forward' ? `${symbolSpeechAliases(element.symbol)[0]}։ Ո՞ր քիմիական տարրի նշանն է։` : `${element.name}։ Ո՞րն է այս տարրի քիմիական նշանը։`
  }
}
