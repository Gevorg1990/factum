import type { Person } from '../data/personTypes'

export const biographyVoices = { female: 'hy-AM-AnahitNeural', male: 'hy-AM-HaykNeural' } as const
export type BiographyVoice = keyof typeof biographyVoices

const romanCenturies = 'I II III IV V VI VII VIII IX X XI XII XIII XIV XV XVI XVII XVIII XIX XX XXI XXII XXIII XXIV XXV XXVI XXVII XXVIII XXIX XXX'.split(' ')
const centuryNames = 'առաջին երկրորդ երրորդ չորրորդ հինգերորդ վեցերորդ յոթերորդ ութերորդ իններորդ տասներորդ տասնմեկերորդ տասներկուերորդ տասներեքերորդ տասնչորսերորդ տասնհինգերորդ տասնվեցերորդ տասնյոթերորդ տասնութերորդ տասնիններորդ քսաներորդ քսանմեկերորդ քսաներկուերորդ քսաներեքերորդ քսանչորսերորդ քսանհինգերորդ քսանվեցերորդ քսանյոթերորդ քսանութերորդ քսանիններորդ երեսուներորդ'.split(' ')

export function speechCenturyText(text: string): string {
  return text.replace(/(?<![A-Za-zԱ-Ֆա-ֆև])([IVX]+)(?:\s*[–—-]\s*([IVX]+))?\s*(դար[ա-ֆ]*)/gu, (original, first: string, last: string | undefined, suffix: string) => {
    const from = centuryNames[romanCenturies.indexOf(first)]
    const to = last ? centuryNames[romanCenturies.indexOf(last)] : undefined
    if (!from || (last && !to)) return original
    return `${from}${to ? `–${to}` : ''} ${suffix}`
  })
}

export function biographyChunks(person: Partial<Person>): string[] {
  const paragraphs = [person.name || 'Կենսագրություն', person.bio || '',
    ...(person.biographySections || []).flatMap(section => [section.title, section.text]),
    ...(person.timeline?.length ? ['Կարևոր տարեթվեր', ...person.timeline.map(event => `${event.date}։ ${event.text}`)] : [])]
  const chunks: string[] = []
  let chunk = ''
  for (const paragraph of paragraphs) {
    for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
      const limit = chunks.length === 0 ? 320 : 1000
      if (chunk.trim() && chunk.length + word.length > limit) { chunks.push(chunk.trim()); chunk = '' }
      chunk += `${word} `
      // Start with one short sentence instead of synthesizing a minute of speech
      // before playback can begin. Following parts can load during this sentence.
      if (!chunks.length && chunk.trim().length >= 120 && /[։.!?]$/.test(word)) {
        chunks.push(chunk.trim())
        chunk = ''
      }
    }
    chunk += '\n'
  }
  if (chunk.trim()) chunks.push(chunk.trim())
  return chunks
}

export function biographySsml(text: string, voice: BiographyVoice): string {
  const escaped = speechCenturyText(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hy-AM"><voice name="${biographyVoices[voice]}"><prosody rate="-5%">${escaped}</prosody></voice></speak>`
}
