import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import {libraryBooks} from '../data/library/catalog'
import {parseReadingState} from '../utils/library/reading'
import {splitReadingPages} from '../utils/library/navigation'

test('reading position and notes round-trip without mixing books or retaining malformed storage',()=>{
 const saved={page:3,updatedAt:100,bookmarks:[{page:3,note:'Շարունակել այստեղից։',updatedAt:101},{page:1,note:'Հիշել այս հատվածը։',updatedAt:99}]}
 const restored=parseReadingState(JSON.parse(JSON.stringify(saved)))
 assert.equal(restored.page,3);assert.deepEqual(restored.bookmarks.map(b=>b.page),[1,3]);assert.equal(restored.bookmarks[1]!.note,saved.bookmarks[0]!.note)
 for(const value of [null,[],{page:-1,bookmarks:'invalid'},{page:NaN,bookmarks:[{page:-2},{page:1.5},null]}])assert.deepEqual(parseReadingState(value),{page:0,bookmarks:[],updatedAt:0})
 const duplicate=parseReadingState({bookmarks:[{page:2,note:'a'.repeat(1200)},{page:2,note:'duplicate'}]})
 assert.equal(duplicate.bookmarks.length,1);assert.equal(duplicate.bookmarks[0]!.note.length,1000)
})

test('every active book has a real matching cover, a complete Armenian text, and bounded reader pages',()=>{
 assert.equal(new Set(libraryBooks.map(book=>book.id)).size,libraryBooks.length)
 for(const book of libraryBooks){
  assert.equal(book.language,'Հայերեն');assert.ok(book.file.endsWith('-hy.txt'));assert.ok(existsSync('public'+book.cover));assert.ok(book.coverSource.startsWith('https://'))
  const text=readFileSync('public'+book.file,'utf8')
  assert.ok(text.length>4000);assert.ok((text.match(/[Ա-Ֆա-ֆև]/g)?.length||0)>text.length*.4)
  assert.doesNotMatch(text,/mw-parser-output|JavaScript seems|Wikipedia|Հիմնական ընտրացանկ/)
  const pages=splitReadingPages(text,4400)
  assert.ok(pages.length>1);assert.ok(pages.every(page=>page.length<=4400));assert.ok(pages[0]!.trim());assert.ok(pages.at(-1)!.trim())
 }
})
