import { getSearchTerms } from './searchTerms'

export type HighlightPart = { text: string; matched: boolean }

/** Keep result text as Vue text nodes, never HTML supplied by a result. */
export function highlightedParts(value: string, query: string): HighlightPart[] {
  const text = String(value || '')
  const terms = getSearchTerms(query).filter(Boolean).sort((a, b) => b.length - a.length)
  if (!terms.length) return [{ text, matched: false }]
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
  const matcher = new RegExp(escaped.join('|'), 'giu')
  const parts: HighlightPart[] = []
  let cursor = 0
  for (const match of text.matchAll(matcher)) {
    const index = match.index ?? 0
    if (index > cursor) parts.push({ text: text.slice(cursor, index), matched: false })
    parts.push({ text: match[0], matched: true })
    cursor = index + match[0].length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), matched: false })
  return parts.length ? parts : [{ text, matched: false }]
}
