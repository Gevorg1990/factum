import { bibleBooks, bibleChapterUrl } from '../../data/bible'
import type { BibleVerse } from '../../shared/types/bibleReader'

export function resolveBibleChapter(bookId: unknown, chapterInput: unknown) {
  if (typeof bookId !== 'string' || typeof chapterInput !== 'string' || !/^\d{1,3}$/.test(chapterInput)) return undefined
  const index = bibleBooks.findIndex(book => book.id === bookId)
  const book = bibleBooks[index]
  const chapter = Number(chapterInput)
  if (!book || chapter < 1 || chapter > book.chapters) return undefined
  return { book, chapter, sourceUrl: bibleChapterUrl(book, chapter) }
}

function attribute(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i'))
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? ''
}
function textBody(html: string) {
  const openings = /<div\b([^>]*)>/gi
  let opening: RegExpExecArray | null
  while ((opening = openings.exec(html))) {
    if (attribute(opening[1]!, 'id').toLowerCase() !== 'textbody' && !attribute(opening[1]!, 'class').toLowerCase().split(/\s+/).includes('textbody')) continue
    const start = openings.lastIndex
    const tags = /<div\b[^>]*>|<\/div\s*>/gi
    tags.lastIndex = start
    let depth = 1
    let tag: RegExpExecArray | null
    while ((tag = tags.exec(html))) {
      depth += /^<\//.test(tag[0]) ? -1 : 1
      if (!depth) return html.slice(start, tag.index)
    }
    throw new Error('Incomplete scripture container')
  }
  throw new Error('Scripture container not found')
}
function plainText(html: string): string {
  const named: Record<string,string> = { amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',ndash:'–',mdash:'—',hellip:'…' }
  return html.replace(/<[^>]*>/g, ' ').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity: string, value: string) => {
    if (!value.startsWith('#')) return named[value.toLowerCase()] ?? entity
    const code = value[1]?.toLowerCase() === 'x' ? Number.parseInt(value.slice(2),16) : Number.parseInt(value.slice(1),10)
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\ufffd'
  }).replace(/\s+/g, ' ').trim()
}

/** Extract verse text only; upstream HTML is never rendered or returned. */
export function parseWordprojectChapter(html: string): BibleVerse[] {
  if (html.length > 512000) throw new Error('Chapter response too large')
  const cleaned = html.replace(/<!--[^]*?-->/g,'').replace(/<(script|style|noscript)\b[^>]*>[^]*?<\/\1\s*>/gi,'')
  const body = textBody(cleaned)
  const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)].map(match => match[1]!).filter(paragraph => [...paragraph.matchAll(/<span\b([^>]*)>/gi)].some(match => attribute(match[1]!, 'class').toLowerCase().split(/\s+/).includes('verse')))
  const scope = paragraphs.length ? paragraphs.join('\n') : body
  const markers = [...scope.matchAll(/<span\b([^>]*)>/gi)]
    .filter(match => attribute(match[1]!, 'class').toLowerCase().split(/\s+/).includes('verse'))
    .map((match, index) => {
      const start = match.index! + match[0].length
      const closing = /<\/span\s*>/gi
      closing.lastIndex = start
      const end = closing.exec(scope)
      if (!end) throw new Error('Incomplete verse marker')
      const label = plainText(scope.slice(start, end.index))
      const id = attribute(match[1]!, 'id')
      const idNumber = id.match(/^(?:v(?:erse)?[-_]?)?(\d+)$/i)?.[1]
      // Some editions leave the first verse label blank, or put its text
      // inside the span rather than after it. Keep that text in the verse.
      const containsText = /\p{Script=Armenian}/u.test(label)
      const number = /^\d+$/.test(label) ? Number(label)
        : idNumber ? Number(idNumber)
          : index === 0 && !label ? 1 : NaN
      return { index: match.index!, end: containsText ? start : closing.lastIndex, number }
    })
  if (!markers.length) throw new Error('Scripture verses not found')
  const verses: BibleVerse[] = []
  // A chapter may start with unnumbered verse text before the marker for 2.
  if (markers[0]!.number === 2) {
    const first = plainText(scope.slice(0, markers[0]!.index))
    if (first && /\p{Script=Armenian}/u.test(first)) verses.push({ number:1, text:first })
  }
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]!
    const number = marker.number
    const text = plainText(scope.slice(marker.end, markers[i + 1]?.index ?? scope.length))
    if (!Number.isInteger(number) || number !== verses.length + 1 || !text || !/\p{Script=Armenian}/u.test(text)) {
      throw new Error(`Invalid or incomplete scripture verses: expected ${verses.length + 1}, received ${number}; text length ${text.length}; Armenian text ${/\p{Script=Armenian}/u.test(text)}`)
    }
    verses.push({number,text})
  }
  return verses
}

/** Read only the selected chapter's verse content, excluding notes and headings. */
export function parseEasternArmenianChapter(page: string, bookCode: string, chapter: number): BibleVerse[] {
  if (page.length > 4000000) throw new Error('Chapter response too large')
  const script = [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .find(match => attribute(match[1]!, 'id') === '__NEXT_DATA__')
  let html = page
  if (script) {
    const payload = JSON.parse(script[2]!)
    html = payload?.props?.pageProps?.chapterInfo?.content
    if (typeof html !== 'string') throw new Error('Chapter content not found')
  }
  html = html.replace(/<!--[^]*?-->/g, '').replace(/<(script|style|noscript)\b[^>]*>[^]*?<\/\1\s*>/gi, '')
  const frames: { content: boolean; excluded: boolean; verse?: number }[] = []
  const verses = new Map<number, string[]>()
  for (const token of html.matchAll(/<\/?span\b[^>]*>|<[^>]*>|[^<]+/gi)) {
    const value = token[0]
    if (/^<span\b/i.test(value)) {
      const attrs = value.slice(5, -1)
      const classes = attribute(attrs, 'class').split(/\s+/)
      // Bible.com renders CSS-module names on current reading pages, while
      // older embedded chapter HTML uses plain USFM class names.
      const hasClass = (name: string) => classes.some(value => value === name || new RegExp(`(?:^|_)${name}(?:__|$)`).test(value))
      const parent = frames.at(-1)
      let verse = parent?.verse
      const reference = attribute(attrs, 'data-usfm').split('.')
      if (hasClass('verse') || reference.length === 3) {
        if (reference.length !== 3 || reference[0] !== bookCode || Number(reference[1]) !== chapter || !/^\d+$/.test(reference[2]!)) throw new Error('Unexpected verse reference')
        verse = Number(reference[2])
        if (!verses.has(verse)) verses.set(verse, [])
      }
      frames.push({ verse, content: Boolean(parent?.content || hasClass('content')), excluded: Boolean(parent?.excluded || ['note', 'label', 'heading'].some(hasClass)) })
    } else if (/^<\/span\s*>/i.test(value)) {
      if (!frames.length) throw new Error('Unexpected closing span')
      frames.pop()
    } else {
      const frame = frames.at(-1)
      if (frame?.verse && frame.content && !frame.excluded) verses.get(frame.verse)?.push(value)
    }
  }
  if (frames.length || !verses.size) throw new Error(`Incomplete chapter content: ${verses.size} verses, ${frames.length} unclosed spans`)
  return [...verses].map(([number, parts], index) => {
    const text = plainText(parts.join('').replace(/<br\b[^>]*>/gi, ' ').replace(/<[^>]*>/g, ''))
    if (number !== index + 1 || !/\p{Script=Armenian}/u.test(text)) throw new Error('Invalid or incomplete scripture verses')
    return {number, text}
  })
}
