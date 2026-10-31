/**
 * Search meaningful Armenian keywords instead of common question words.
 * Examples: "Ի՞նչ է մոլեկուլը" -> ["մոլեկուլ"]
 *           "Ո՞վ է Վիկտոր Համբարձումյանը" -> ["վիկտոր", "համբարձումյան"]
 */
const questionWords = new Set([
  'ինչ', 'ինչը', 'նչ', 'ինչու', 'ինչպես', 'ով', 'ովքեր', 'որտեղ',
  'երբ', 'որ', 'որը', 'որոնք', 'որքան', 'քանի', 'արդյոք',
  'է', 'են', 'էր', 'էին', 'լինում', 'կոչվում', 'նշանակում',
  'մասին', 'կարող', 'եմ', 'ենք', 'դա', 'այդ', 'մի', 'և', 'ու'
])

export function getSearchTerms(query: string): string[] {
  const normalized = query.toLocaleLowerCase('hy-AM')
    // Armenian question mark «՞» appears inside words: «ի՞նչ» -> «ինչ».
    // Removing it (rather than replacing it with a space) avoids the fragment «նչ».
    .replace(/[՞՜՛]/gu, '')
    .replace(/[։,.:;!?«»"()\[\]]/gu, ' ')

  const words = normalized.split(/\s+/u).filter(Boolean)

  const meaningful = words.filter(word => word.length > 1 && !questionWords.has(word))
  const selected = meaningful.length ? meaningful : words.filter(word => word.length > 1)

  return [...new Set(selected.map(word => {
    // Armenian definite article, e.g. «մոլեկուլը» -> «մոլեկուլ».
    if (word.length > 4 && /[ըն]$/u.test(word)) return word.slice(0, -1)
    return word
  }))]
}
