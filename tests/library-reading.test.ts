import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import {libraryBooks} from '../data/library/catalog'
import {parseReadingState,migrateVerseReading,readingLineChunks,latestReadingBookmark,readingPositionLabel,addBookmarkExcerpts} from '../utils/library/reading'
import {splitReadingPages,splitBookPages,readingPageTitle} from '../utils/library/navigation'

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

test('verse collections keep a complete poem per page and expose selectable titles',()=>{
 const text='Ժողովածու\nՀեղինակ\n\n1. Առաջին\n\nՏող մեկ\nՏող երկու\n\nԵրկրորդ տուն\n\n2. Երկրորդ\n\n'+ 'Երկար տող\n'.repeat(800)+'\n3. Երրորդ\n\nՎերջին տող'
 const pages=splitBookPages(text,'verse',100)
 assert.equal(pages.length,3)
 assert.deepEqual(pages.map(readingPageTitle),['Առաջին','Երկրորդ','Երրորդ'])
 assert.ok(pages[1]!.length>4400,'a long poem remains complete')
 assert.equal(pages.join('\n\n'),text.trim())
 assert.deepEqual(splitBookPages(text,'prose',100),splitReadingPages(text,100))
 assert.deepEqual(splitBookPages('Վերնագիր\n\nԱռաջին տուն\n\nԵրկրորդ տուն','verse'),['Վերնագիր\n\nԱռաջին տուն\n\nԵրկրորդ տուն'])
})
test('different lines on the same page retain independent bookmarks and resume position',()=>{
 const state=parseReadingState({page:4,line:12,bookmarks:[{page:4,line:12,note:'շարունակել'},{page:4,line:2,note:'հիշել'},{page:4,line:12,note:'կրկնություն'}]})
 assert.equal(state.line,12)
 assert.deepEqual(state.bookmarks.map(mark=>mark.line),[2,12])
 assert.equal(state.bookmarks[1]!.note,'շարունակել')
 assert.deepEqual(parseReadingState(JSON.parse(JSON.stringify(state))),state)
 assert.equal(parseReadingState({page:0,line:-2}).line,undefined)
})

test('old poetry page positions migrate to the same text and only migrate once',()=>{
 const text='1. Առաջին\n\n'+('առաջին տող\n'.repeat(250))+'\n2. Երկրորդ\n\n'+('երկրորդ տող\n'.repeat(250))+'\n3. Երրորդ\n\nավարտ'
 const old=splitReadingPages(text,4400),page=1,line=2,anchor=old[page]!.split('\n')[line]!
 const migrated=migrateVerseReading({page,line,updatedAt:42,bookmarks:[{page,line,note:'իմ նշումը',updatedAt:41}]},text)
 assert.equal(migrated.pagination,'poems-v1')
 assert.equal(splitBookPages(text,'verse')[migrated.page]!.split('\n')[migrated.line!],anchor)
 assert.equal(migrated.bookmarks[0]!.note,'իմ նշումը')
 assert.deepEqual(migrateVerseReading(migrated,text),migrated)
 assert.deepEqual(parseReadingState(JSON.parse(JSON.stringify(migrated))),migrated)
})

test('poem line bookmarks and notes remain independent when reopening the reader',()=>{
 const input={page:1,line:12,pagination:'poems-v1' as const,updatedAt:10,bookmarks:[{page:1,line:3,note:'առաջին նշում',updatedAt:2},{page:1,line:12,note:'երկրորդ նշում',updatedAt:3},{page:2,line:4,note:'մյուսը',updatedAt:4}]}
 assert.deepEqual(migrateVerseReading(input,''),input)
 assert.deepEqual(parseReadingState(JSON.parse(JSON.stringify(input))),input)
})

test('long standalone poems remain complete in one scrollable reading page',()=>{
 const text='ԱՆՈՒՇ\n\n'+('Սա պոեմի տողն է։\n'.repeat(3000))
 assert.deepEqual(splitBookPages(text,'poetry',4400),[text.trim()])
 const migrated=migrateVerseReading({page:3,updatedAt:1,bookmarks:[{page:3,note:'իմ նշումը',updatedAt:1}]},text,'poetry')
 assert.equal(migrated.page,0)
 assert.equal(migrated.bookmarks[0]!.page,0)
 assert.equal(migrated.bookmarks[0]!.note,'իմ նշումը')
})

test('small eager reading blocks preserve every line and exact bookmark anchors',()=>{
 const text='Նախաբան\n\n'+Array.from({length:3000},(_,i)=>`Տող ${i+1}`).join('\n')+'\n'
 const blocks=readingLineChunks(text)
 assert.ok(blocks.every(block=>block.length<=24))
 const lines=blocks.flat()
 assert.equal(lines.map(line=>line.text).join('\n'),text)
 assert.deepEqual(lines.map(line=>line.index),Array.from({length:lines.length},(_,i)=>i))
 assert.equal(lines[1986]!.text,text.split('\n')[1986])
 assert.equal(readingLineChunks(text,0).flat().length,lines.length)
})

test('resume uses the latest bookmark rather than the last viewed page or latest edited note',()=>{
 const state=parseReadingState({page:9,line:80,bookmarks:[{page:2,line:12,note:'խմբագրված ավելի ուշ',bookmarkedAt:100,updatedAt:900},{page:1,line:4,note:'վերջին էջանշանը',bookmarkedAt:200,updatedAt:200}]})
 assert.equal(latestReadingBookmark(state)?.page,1)
 assert.equal(latestReadingBookmark(state)?.line,4)
 assert.equal(latestReadingBookmark({...state,bookmarks:state.bookmarks.filter(mark=>mark.page!==1)})?.page,2)
 assert.equal(latestReadingBookmark({...state,bookmarks:[]}),undefined)
 assert.equal(latestReadingBookmark(undefined),undefined)
 assert.equal(latestReadingBookmark(parseReadingState({bookmarks:[{page:0,updatedAt:4},{page:2,updatedAt:7}]}))?.page,2)
})

test('bookmark hints use actual text rather than misleading file line numbers',()=>{
 const state=parseReadingState({page:0,line:4,updatedAt:15,bookmarks:[{page:0,line:4,note:'իմ նշումը',updatedAt:12,bookmarkedAt:10}]})
 const pages=['Վերնագիր\n\nԱռաջին տող\n\nՊահպանված խոսքերը այստեղ են։']
 const hydrated=addBookmarkExcerpts(state,pages)
 assert.equal(hydrated.bookmarks[0]!.excerpt,'Պահպանված խոսքերը այստեղ են։')
 assert.equal(hydrated.bookmarks[0]!.note,'իմ նշումը')
 assert.equal(hydrated.bookmarks[0]!.bookmarkedAt,10)
 assert.equal(hydrated.updatedAt,15)
 assert.equal(readingPositionLabel('poetry',hydrated.bookmarks[0]!),'«Պահպանված խոսքերը այստեղ են։»')
 assert.equal(readingPositionLabel('poetry',{page:0,line:17}),'Վերջին էջանշանից')
 assert.equal(addBookmarkExcerpts(hydrated,pages),hydrated)
 assert.deepEqual(parseReadingState(JSON.parse(JSON.stringify(hydrated))),hydrated)
})
