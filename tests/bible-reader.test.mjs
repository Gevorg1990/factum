import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const vueUrl = new URL('file://' + require.resolve('vue')).href
const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext } }).outputText).toString('base64')
const bibleUrl = moduleUrl(read('data/bible.ts'))
const parserUrl = moduleUrl(read('server/utils/bibleChapter.ts').replace("from '../../data/bible'", `from '${bibleUrl}'`))
const { bibleBooks, bibleChapterUrl } = await import(bibleUrl)
const { parseWordprojectChapter, parseEasternArmenianChapter, resolveBibleChapter } = await import(parserUrl)
const fixture = read('tests/fixtures/wordproject-psalm23.html')

// Representative markup; verse text: wordproject.org/bibles/hy/19/23.htm.
// Reuse permission: wordproject.org/contact/new/copyrights.htm.
test('all books map to a fixed source URL and invalid references never produce a URL', () => {
  for (const [index,book] of bibleBooks.entries()) {
    assert.equal(resolveBibleChapter(book.id, String(book.chapters)).sourceUrl, bibleChapterUrl(book,book.chapters))
  }
  for (const [book,chapter] of [['missing','1'],['genesis','0'],['genesis','51'],['genesis','1.5'],['genesis','1e2'],['genesis','../1'],['https://example.com','1'],[['genesis'],'1'],['genesis',['1']],['genesis',undefined]]) assert.equal(resolveBibleChapter(book,chapter),undefined)
})
test('scripture extraction excludes headings, nested navigation and page furniture', () => {
  const verses = parseWordprojectChapter(fixture)
  assert.equal(verses.length,6)
  assert.deepEqual(verses.map(verse=>verse.number),[1,2,3,4,5,6])
  assert.match(verses[0].text,/Տէրը իմ հովիւս է/)
  assert.match(verses[5].text,/Տէրոջը տունը/)
  assert.ok(verses.every(verse=>!/[<>]|Navigation|Footer|next chapter/.test(verse.text)))
})
test('nested inline spans, alternate attributes, entities and script removal preserve plain text', () => {
  const verses = parseWordprojectChapter(`<div class='other textBody'><p><span class="speaker"><span id='1' class='foo verse'>1</span> Հայերեն &amp; &#1377; &#x531; <em>խոսք</em><script>bad()</script><br><span class=verse id=2>2</span> Երկրորդ&nbsp;համար։</span></p></div>`)
  assert.equal(verses[0].text,'Հայերեն & ա Ա խոսք')
  assert.equal(verses[1].text,'Երկրորդ համար։')
})
test('unnumbered first verses and verse text inside markers retain all text', () => {
  const expected = [{number:1,text:'Առաջին համար։'}, {number:2,text:'Երկրորդ համար։'}]
  for (const first of [
    '<span class="verse">&nbsp;</span> Առաջին համար։',
    '<span class="verse" id="v1"></span> Առաջին համար։',
    '<span class="verse" id="1">Առաջին համար։</span>',
    'Առաջին համար։',
  ]) {
    assert.deepEqual(parseWordprojectChapter(`<div class="textBody"><p>${first}<br><span class="verse" id="2">2</span> Երկրորդ համար։</p></div>`),expected)
  }
  assert.throws(() => parseWordprojectChapter('<div class="textBody"><p><span class="verse">unexpected</span> Հայերեն։</p></div>'))
  assert.throws(() => parseWordprojectChapter('<div class="textBody"><p><span class="verse" id="1">1</span> Առաջին։<span class="verse" id="3">3</span> Երրորդ։</p></div>'))
})
test('changed or incomplete source pages fail instead of displaying unrelated text', () => {
  for (const html of ['<html>Error page</html>','<div class="textBody"><p>Not scripture</p></div>',fixture.replace('id="3">3','id="3">4'),fixture.replace(/<span class="verse" id="2">2<\/span>[^]*?(?=<span class="verse" id="3">)/,''),fixture.replace('id="1">1','id="1">2')]) assert.throws(()=>parseWordprojectChapter(html))
  assert.throws(()=>parseWordprojectChapter('x'.repeat(512001)))
})
test('endpoint validates before fetching and returns plain attributed text or a controlled upstream error', async t => {
  const errors = t.mock.method(console, 'error', () => {})
  let fetchCount = 0
  const chapterMarkup = '<div class="chapter">' + Array.from({length:6},(_,i)=>`<span class="verse v${i+1}" data-usfm="PSA.23.${i+1}"><span class="label">${i+1}</span><span class="content">Հայերեն համար ${i+1}։</span></span>`).join('') + '</div>'
  let source = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{pageProps:{chapterInfo:{content:chapterMarkup}}}})}</script>`
  let fetchError
  const dependencies = {
    defineCachedFunction: (fn,options) => { assert.equal(options.maxAge,86400); return fn },
    defineEventHandler: fn=>fn,
    getQuery: event=>event,
    createError: options=>Object.assign(new Error(options.statusMessage),options),
    isError: error=>error instanceof Error && typeof error.statusCode === 'number',
    $fetch: async url=>{ fetchCount++; if (fetchError) throw fetchError; assert.equal(url,bibleChapterUrl(bibleBooks.find(book=>book.id==='psalms'),23)); return source },
  }
  globalThis.__bibleEndpointTest = dependencies
  const endpointSource = `const {defineCachedFunction,defineEventHandler,getQuery,createError,isError,$fetch}=globalThis.__bibleEndpointTest;\n` + read('server/api/bible/chapter.get.ts').replace("from '../../utils/bibleChapter'",`from '${parserUrl}'`)
  const handler = (await import(moduleUrl(endpointSource))).default
  await assert.rejects(handler({book:'psalms',chapter:'151'}),{statusCode:400})
  assert.equal(fetchCount,0)
  const response = await handler({book:'psalms',chapter:'023'})
  assert.equal(response.chapter,23)
  assert.equal(response.translation,'Արևելահայերեն · Նոր վերանայված Արարատ')
  assert.equal(response.verses.length,6)
  source='<html>Network proxy error</html>'
  await assert.rejects(handler({book:'psalms',chapter:'23'}),{statusCode:502,data:{code:'BIBLE_SOURCE_FORMAT'}})
  fetchError = Object.assign(new Error('DNS lookup failed'), {code:'ENOTFOUND'})
  await assert.rejects(handler({book:'psalms',chapter:'23'}),{statusCode:502,data:{code:'BIBLE_SOURCE_UNAVAILABLE'}})
  assert.equal(errors.mock.callCount(),2)
})
test('reader keeps latest chapter, supports retry and cancels pending work on unmount', async t => {
  const { reactive,nextTick } = await import(vueUrl)
  const mounted=[],unmounted=[],requests=[],emitted=[]
  globalThis.__bibleReaderTest={mounted,unmounted,fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}))}
  const filename = fileURLToPath(new URL('components/BibleChapterReader.vue',root))
  const {descriptor,errors}=parse(read('components/BibleChapterReader.vue'),{filename})
  assert.deepEqual(errors,[])
  assert.deepEqual(compileTemplate({source:descriptor.template.content,filename,id:'reader-test'}).errors,[])
  assert.deepEqual(compileStyle({source:descriptor.styles[0].content,filename,id:'reader-test',scoped:true}).errors,[])
  let code=compileScript(descriptor,{id:'reader-test'}).content
    .replaceAll("from 'vue'",`from '${vueUrl}'`)
    .replaceAll("from 'lucide-vue-next'",`from '${new URL('file://'+require.resolve('lucide-vue-next')).href}'`)
    .replaceAll("from '~/data/bible'",`from '${bibleUrl}'`)
  code=`import {ref,shallowRef,watch,computed,nextTick} from '${vueUrl}';const onMounted=fn=>globalThis.__bibleReaderTest.mounted.push(fn);const onBeforeUnmount=fn=>globalThis.__bibleReaderTest.unmounted.push(fn);const $fetch=(...args)=>globalThis.__bibleReaderTest.fetch(...args);\n`+code
  const component=(await import(moduleUrl(code))).default
  const props=reactive({book:bibleBooks[0],chapter:1})
  const reader=component.setup(props,{expose(){},emit:(...args)=>emitted.push(args)})
  mounted.forEach(fn=>fn())
  reader.nextChapter()
  assert.deepEqual(emitted,[])
  const response=chapter=>({bookId:'genesis',chapter,translation:'Արևելահայերեն · Նոր վերանայված Արարատ',sourceUrl:bibleChapterUrl(bibleBooks[0],chapter),verses:[{number:1,text:'Հայերեն տեքստ։'}]})
  requests[0].resolve(response(1));await nextTick();await nextTick()
  assert.equal(reader.data.value.chapter,1)
  const originalDocument = globalThis.document
  t.after(() => {
    if (originalDocument === undefined) delete globalThis.document
    else globalThis.document=originalDocument
  })
  const body = {style:{overflow:'auto'}}
  globalThis.document = {body}
  let opened=0,closed=0,focused=0
  reader.fullscreenDialog.value = {showModal(){opened++},close(){closed++}}
  reader.fullscreenButton.value = {focus(){focused++}}
  await reader.openFullscreen()
  assert.equal(reader.isFullscreen.value,true)
  assert.equal(opened,1)
  assert.equal(body.style.overflow,'hidden')
  assert.equal(reader.data.value.chapter,1)
  reader.closeFullscreen()
  await nextTick()
  assert.equal(reader.isFullscreen.value,false)
  assert.equal(closed,1)
  assert.equal(body.style.overflow,'auto')
  assert.equal(focused,2)
  await reader.openFullscreen()
  reader.nextChapter()
  assert.deepEqual(emitted,[['completed'],['next']])
  emitted.length=0
  props.chapter=2;await nextTick()
  const old=requests[1]
  reader.nextChapter()
  assert.deepEqual(emitted,[])
  props.chapter=3;await nextTick()
  assert.equal(old.options.signal.aborted,true)
  old.resolve(response(2));await nextTick();await nextTick()
  assert.equal(reader.data.value,null)
  assert.equal(reader.loading.value,true)
  requests[2].resolve(response(3));await nextTick();await nextTick()
  assert.equal(reader.data.value.chapter,3)
  props.chapter=4;await nextTick()
  requests[3].reject(new Error('offline'));await nextTick();await nextTick()
  assert.equal(reader.failed.value,true)
  reader.nextChapter()
  assert.deepEqual(emitted,[])
  assert.equal(reader.sourceUrl.value,bibleChapterUrl(bibleBooks[0],4))
  assert.match(reader.failureMessage.value,/Wordproject|սկզբնաղբյուր/)
  const retry=reader.load()
  requests[4].resolve(response(4));await retry
  assert.equal(reader.failed.value,false)
  assert.equal(reader.data.value.chapter,4)
  props.chapter=5;await nextTick()
  const pending=requests[5]
  unmounted.forEach(fn=>fn())
  assert.equal(reader.isFullscreen.value,false)
  assert.equal(body.style.overflow,'auto')
  assert.equal(closed,2)
  assert.equal(pending.options.signal.aborted,true)
  pending.resolve(response(5));await nextTick();await nextTick()
  assert.equal(reader.data.value,null)
})

test('Eastern Armenian content preserves nested text and excludes notes, labels and headings', () => {
  const html = `<div class="chapter" data-usfm="GEN.1"><div class="heading">Վերնագիր</div>
    <span class="verse v1" data-usfm="GEN.1.1"><span class="label">1</span><span class="content">Առաջին <i>համար</i>։<span class="note"><span class="content">Ծանոթագրություն</span></span></span></span>
    <span class="verse v1" data-usfm="GEN.1.1"><span class="content"> Շարունակություն։</span></span>
    <span class="verse v2" data-usfm="GEN.1.2"><span class="label">2</span><span class="content">Երկրորդ &amp; համար։</span></span></div>`
  const expected = [{number:1,text:'Առաջին համար։ Շարունակություն։'}, {number:2,text:'Երկրորդ & համար։'}]
  assert.deepEqual(parseEasternArmenianChapter(html,'GEN',1),expected)
  const page = `<script type="application/json" id="__NEXT_DATA__">${JSON.stringify({props:{pageProps:{chapterInfo:{content:html}}}})}</script>`
  assert.deepEqual(parseEasternArmenianChapter(page,'GEN',1),expected)
  const rendered = html.replace(/class="(verse|label|content|note|heading)([^\"]*)"/g, (_,name,rest) => `class="ChapterContent_${name}__aB123${rest}"`)
  const currentPage = `<html><body><nav><span>Navigation</span></nav>${rendered}<script>self.__next_f.push([1,"irrelevant page data"])</script><footer><span>Footer</span></footer></body></html>`
  assert.deepEqual(parseEasternArmenianChapter(currentPage,'GEN',1),expected)
  assert.deepEqual(parseEasternArmenianChapter(rendered.replace(/ChapterContent_verse__aB123/g,'another-verse-style'),'GEN',1),expected)
  assert.throws(()=>parseEasternArmenianChapter(page,'EXO',1))
  assert.throws(()=>parseEasternArmenianChapter(page,'GEN',2))
  assert.throws(()=>parseEasternArmenianChapter(html.replace('GEN.1.2','GEN.1.3'),'GEN',1))
  assert.throws(()=>parseEasternArmenianChapter('<html>Unavailable</html>','GEN',1))
  assert.throws(()=>parseEasternArmenianChapter('<script id="__NEXT_DATA__">{}</script>','GEN',1))
  assert.throws(()=>parseEasternArmenianChapter('x'.repeat(4000001),'GEN',1))
  assert.throws(()=>parseEasternArmenianChapter(rendered.replace('GEN.1.2','EXO.1.2'),'GEN',1))
})

test('captured Bible.com chapter markup with prefixed classes yields all 31 verses', () => {
  // Actual Genesis 1 page structure; verse text replaced with synthetic text.
  const html = read('tests/fixtures/bible-com-eastern-genesis1.html')
  const verses = parseEasternArmenianChapter(html,'GEN',1)
  assert.deepEqual(verses.map(verse=>verse.number),Array.from({length:31},(_,i)=>i+1))
  assert.ok(verses.every(verse=>verse.text.startsWith('Հայերեն տեքստ։')))
  assert.ok(verses.every(verse=>!/[<>]|#1\.26|26\s/.test(verse.text)))
})

test('read chapter disclosure lists valid chapters and opens a selected chapter in the reader',async t=>{
  const {ref,nextTick}=await import(vueUrl)
  const originalDocument=globalThis.document,originalWindow=globalThis.window
  const scrolled=[]
  const progress={read:ref(['bible-genesis-1','bible-genesis-2','bible-john-3','bible-genesis-2','bible-genesis-51','c1']),saved:ref([]),markRead(){},removeRead(id){progress.read.value=progress.read.value.filter(key=>key!==id)},toggleSaved(){}}
  globalThis.__readChapterProgress=progress
  globalThis.document={getElementById:id=>({scrollIntoView:()=>scrolled.push(id),focus(){}})}
  globalThis.window={matchMedia:()=>({matches:false})}
  t.after(()=>{globalThis.document=originalDocument;globalThis.window=originalWindow;delete globalThis.__readChapterProgress})
  const {descriptor}=parse(read('pages/bible.vue'))
  assert.deepEqual(compileTemplate({source:descriptor.template.content,filename:'bible.vue',id:'bible-read-test'}).errors,[])
  let code=compileScript(descriptor,{id:'bible-read-test'}).content
    .replaceAll("from 'vue'",`from '${vueUrl}'`)
    .replaceAll("from 'lucide-vue-next'",`from '${new URL('file://'+require.resolve('lucide-vue-next')).href}'`)
    .replaceAll("from '~/data/bible'",`from '${bibleUrl}'`)
  code=`import {ref,computed,watch,nextTick} from '${vueUrl}';const useHead=()=>{};const useProgress=()=>globalThis.__readChapterProgress;const useRoute=()=>({query:{}});const useSavedScroll=()=>{};const onMounted=()=>{};`+code
  const page=(await import(moduleUrl(code))).default.setup({},{expose(){}})
  assert.equal(page.readCount.value,3)
  assert.deepEqual(page.readChapterGroups.value.map(group=>[group.book.id,group.chapters]),[['genesis',[1,2]],['john',[3]]])
  page.showReadChapters.value=true
  page.removeRead('bible-genesis-2')
  assert.equal(page.readCount.value,2)
  assert.deepEqual(page.readChapterGroups.value[0].chapters,[1])
  assert.equal(page.showReadChapters.value,true)
  page.openReadChapter('john',3)
  await nextTick()
  assert.equal(page.selected.value.id,'john')
  assert.equal(page.chapter.value,3)
  assert.equal(page.testament.value,'new')
  assert.equal(page.showReadChapters.value,false)
  assert.ok(scrolled.includes('bible-reader'))
  page.removeRead('bible-john-3')
  assert.equal(page.isRead.value,false)
  progress.read.value=[...progress.read.value,'bible-exodus-20']
  assert.equal(page.readCount.value,2)
  assert.ok(page.readChapterGroups.value.some(group=>group.book.id==='exodus'&&group.chapters.includes(20)))
  page.showReadChapters.value=true
  progress.read.value=[]
  assert.equal(page.showReadChapters.value,false)
  assert.equal(page.readCount.value,0)
  assert.deepEqual(page.readChapterGroups.value,[])
})
