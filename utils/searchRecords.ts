export type SearchSubject = { name:string; url:string }
export type SearchRecord = { title:string; description:string; content?:string; url:string; kind:string; subject?:SearchSubject }
export type SearchResult = Omit<SearchRecord, 'content'> & { score:number }

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('hy-AM').replace(/[՞՜՛։,.]/gu, '').trim()
}

export function scoreSearchRecord(record: SearchRecord, terms: string[]) {
  const title = normalize(record.title)
  const text = normalize([record.title,record.description,record.content ?? ''].join(' '))
  return terms.reduce((score, term) => score + (title.includes(normalize(term)) ? 5 : text.includes(normalize(term)) ? 1 : 0), 0)
}

function descriptionSnippet(record: SearchRecord, terms: string[]) {
  const description = record.description
  if (!record.content || terms.some(term => normalize(description).includes(normalize(term)))) return description
  const text = record.content.replace(/\s+/gu, ' ').trim()
  const lower = text.toLocaleLowerCase('hy-AM')
  const positions = terms.map(term => lower.indexOf(term)).filter(index => index >= 0)
  const match = positions.length ? Math.min(...positions) : 0
  let start = Math.max(0,match - 70)
  if (start > 0) {
    const boundary = text.lastIndexOf(' ',start)
    if (boundary >= 0) start = boundary + 1
  }
  const end = Math.min(text.length,start + 260)
  return `${start ? '…' : ''}${text.slice(start,end)}${end < text.length ? '…' : ''}`
}

export function searchRecords(records: SearchRecord[], terms: string[], limit = 20): SearchResult[] {
  if (!terms.length) return []
  return records.map(record => ({record,score:scoreSearchRecord(record,terms)}))
    .filter(item => item.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0,limit)
    .map(({record,score}) => ({title:record.title,description:descriptionSnippet(record,terms),url:record.url,kind:record.kind,...(record.subject ? {subject:record.subject} : {}),score}))
}
