import { parseEasternArmenianChapter, resolveBibleChapter } from '../../utils/bibleChapter'
import type { BibleChapterData } from '../../../shared/types/bibleReader'

const loadChapter = defineCachedFunction(async (bookId: string, chapter: string): Promise<BibleChapterData> => {
  const request = resolveBibleChapter(bookId,chapter)
  if (!request) throw new Error('Invalid Bible chapter')
  let html: string
  try {
    html = await $fetch<string>(request.sourceUrl, { responseType:'text', timeout:12000, retry:1 })
  } catch (error) {
    console.error('[bible] Source request failed', request.sourceUrl, error)
    throw createError({ statusCode:502, statusMessage:'Bible source unavailable', data:{ code:'BIBLE_SOURCE_UNAVAILABLE' } })
  }

  try {
    return { bookId:request.book.id, chapter:request.chapter, translation:'Արևելահայերեն · Նոր վերանայված Արարատ', sourceUrl:request.sourceUrl, verses:parseEasternArmenianChapter(html,request.book.code,request.chapter) }
  } catch (error) {
    console.error('[bible] Source parsing failed', request.sourceUrl, error)
    throw createError({ statusCode:502, statusMessage:'Bible source format unavailable', data:{ code:'BIBLE_SOURCE_FORMAT' } })
  }
}, { maxAge:86400, swr:false, name:'bible-eastern-armenian-nvaa-v1', getKey:(bookId: string, chapter: string) => `${bookId}-${chapter}` })

export default defineEventHandler(async event => {
  const {book,chapter} = getQuery(event)
  const request = resolveBibleChapter(book,chapter)
  if (!request) throw createError({statusCode:400,statusMessage:'Invalid Bible book or chapter'})
  try {
    return await loadChapter(request.book.id,String(request.chapter))
  } catch (error) {
    if (isError(error)) throw error
    console.error('[bible] Chapter loading failed', request.sourceUrl, error)
    throw createError({statusCode:502,statusMessage:'Bible chapter temporarily unavailable',data:{code:'BIBLE_CHAPTER_UNAVAILABLE'}})
  }
})
