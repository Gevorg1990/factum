import type { InterestingFact } from '../data/facts'

/** Pick from the full catalog, preferring facts outside the last selection. */
export function selectHomeFacts(
  facts: InterestingFact[],
  previousIds: string[] = [],
  random: () => number = Math.random,
): InterestingFact[] {
  const pool = facts
  const shuffle = (items: InterestingFact[]) => {
    const result = [...items]
    for (let index = result.length - 1; index > 0; index--) {
      const next = Math.floor(random() * (index + 1))
      ;[result[index], result[next]] = [result[next]!, result[index]!]
    }
    return result
  }
  const previous = new Set(previousIds)
  const fresh = shuffle(pool.filter(fact => !previous.has(fact.id)))
  const repeated = shuffle(pool.filter(fact => previous.has(fact.id)))
  return [...fresh, ...repeated].slice(0, 5)
}
