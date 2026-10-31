export type BibleVerse = { number: number; text: string }
export type BibleChapterData = {
  bookId: string
  chapter: number
  translation: string
  sourceUrl: string
  verses: BibleVerse[]
}
