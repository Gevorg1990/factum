import { contentUrl } from './helpers/catalog.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript')
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const url=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')
const termsUrl=url(read('utils/searchTerms.ts')),recordsUrl=url(read('utils/searchRecords.ts')),atomUrl=url(read('data/atomArticle.ts'))
const bibleUrl=url(read('data/bible.ts'))
const monumentsUrl=url("export const personMonuments=[]")
const geographyPlacesUrl=url(read('data/geography/places.ts'))
const geographyRecordsUrl=url(read('data/geography/records.ts'))
const armeniaRegionsUrl=url(read('data/geography/armeniaRegions.ts'))
const highlightUrl=url(read('utils/searchHighlight.ts').replace("from './searchTerms'",`from '${termsUrl}'`))
const dbUrl=url('export const databaseEnabled=()=>false;export const db={}')
const subjectUrl=url(read('utils/searchSubjects.ts').replace("from '../data/content'",`from '${contentUrl}'`))
const {getSearchSubject}=await import(subjectUrl)
const {searchRecords}=await import(recordsUrl)
const {getSearchTerms}=await import(termsUrl)
const {highlightedParts}=await import(highlightUrl)
globalThis.__searchTest={defineEventHandler:fn=>fn,getQuery:event=>event,useRuntimeConfig:()=>({public:{directusUrl:''}}),$fetch:()=>{throw new Error('unexpected external request')}}
let source='const {defineEventHandler,getQuery,useRuntimeConfig,$fetch}=globalThis.__searchTest;'+read('server/api/search.get.ts')
for(const [path,module] of [['~/utils/searchSubjects',subjectUrl],['~/utils/searchTerms',termsUrl],['~/utils/searchRecords',recordsUrl],['~/data/content',contentUrl],['~/data/atomArticle',atomUrl],['~/data/bible',bibleUrl],['~/data/personMonuments',monumentsUrl],['~/data/geography/places',geographyPlacesUrl],['~/data/geography/records',geographyRecordsUrl],['~/data/geography/armeniaRegions',armeniaRegionsUrl]])source=source.replace(`from '${path}'`,`from '${module}'`)
source=source.replace("import('../utils/db')",`import('${dbUrl}')`)
const handler=(await import(url(source))).default

test('temperature finds the solution article through its detailed explanation',async()=>{
 for(const query of ['ջերմաստիճան','ՋԵՐՄԱՍՏԻՃԱՆ','ջերմաստիճանը',' ջերմաստիճան։ ']){
  const {items}=await handler({q:query})
  const solution=items.find(item=>item.url==='/articles/chemistry-intro-2')
  assert.ok(solution,query)
  assert.match(solution.description,/ջերմաստիճան/)
  assert.deepEqual(solution.subject,{name:'Քիմիա',url:'/subjects/chemistry'})
  assert.ok(!('content' in solution))
 }
})

test('body-only terms and extended atom article sections are searchable',async()=>{
 const sound=await handler({q:'նոսրացումների'})
 assert.deepEqual(sound.items.find(item=>item.url==='/articles/physics-intro-2')?.subject,{name:'Ֆիզիկա',url:'/subjects/physics'})
 const atom=await handler({q:'Ռեզերֆորդ'})
 assert.ok(atom.items.some(item=>item.url==='/articles/c1'))
})

test('title matches rank above body matches and a matching snippet is returned',()=>{
 const records=[
  {title:'Այլ թեմա',description:'Կարճ պատասխան։',content:'Սկիզբ։ '.repeat(80)+'Ջերմաստիճանը կարևոր է։ '+ 'Վերջ։ '.repeat(60),url:'/body',kind:'Հոդված'},
  {title:'Ջերմաստիճան',description:'Չափման մասին։',url:'/title',kind:'Հոդված'},
 ]
 const results=searchRecords(records,getSearchTerms('ջերմաստիճան'))
 assert.equal(results[0].url,'/title')
 assert.ok(!('subject' in results[0]))
 assert.match(results[1].description,/Ջերմաստիճանը/)
 assert.ok(results[1].description.length<=262)
 assert.deepEqual(searchRecords(records,[]),[])
})

test('word stems match inflected Armenian text and only matching letters are highlighted',()=>{
 const terms=getSearchTerms('լուծույթներից')
 assert.deepEqual(terms,['լուծույթ'])
 assert.ok(searchRecords([{title:'Լուծույթը',description:'Նյութերի խառնուրդ',url:'/article',kind:'Հոդված'}],terms).length)
 assert.deepEqual(highlightedParts('Լուծույթները', 'լուծույթներից'),[
  {text:'Լուծույթ',matched:true},{text:'ները',matched:false},
 ])
})

test('all matches remain accessible by paging through server results',async()=>{
 const first=await handler({q:'ություն',limit:5,offset:0})
 const second=await handler({q:'ություն',limit:5,offset:5})
 assert.equal(first.items.length,5)
 assert.ok(first.total>5)
 assert.notDeepEqual(first.items.map(item=>item.title),second.items.map(item=>item.title))
})

test('empty and unrelated requests do not produce arbitrary results',async()=>{
 assert.deepEqual((await handler({q:''})).items,[])
 assert.deepEqual((await handler({q:'zzzzzzzzzzzzz'})).items,[])
})


test('history links identify the matching event, and fact links identify the matching fact',async()=>{
 const history=await handler({q:'Ավարայր'})
 const avarayr=history.items.find(item=>item.kind==='Պատմություն')
 assert.ok(avarayr)
 const target=new URL(avarayr.url,'https://factum.local')
 assert.equal(target.pathname,'/history')
 assert.equal(target.searchParams.get('event'),'451')
 assert.deepEqual(avarayr.subject,{name:'Հայոց պատմություն',url:'/history'})
 const {facts}=await import(contentUrl)
 const result=await handler({q:facts[0].title})
 const fact=result.items.find(item=>item.kind==='Փաստ')
 assert.ok(new URL(fact.url,'https://factum.local').searchParams.get('fact'))
})

test('section labels are resolved from older result URLs without metadata',()=>{
 assert.deepEqual(getSearchSubject('/articles/chemistry-intro-2'),{name:'Քիմիա',url:'/subjects/chemistry'})
 assert.deepEqual(getSearchSubject('/history?event=451'),{name:'Հայոց պատմություն',url:'/history'})
 assert.deepEqual(getSearchSubject('/people/einstein'),{name:'Նշանավոր մարդիկ',url:'/people'})
 assert.equal(getSearchSubject('/articles/missing'),undefined)
})

test('rendered search results show the subject even when cached API data lacks metadata',async t=>{
 const {parse,compileScript}=require('@vue/compiler-sfc')
 const vueUrl=new URL('file://'+require.resolve('vue')).href
 const {createSSRApp,defineComponent,h,ref}=await import(vueUrl)
 const {renderToString}=require('@vue/server-renderer')
 globalThis.__searchRender={data:ref({items:[{title:'Ի՞նչ է լուծույթը',description:'Կարճ պատասխան',url:'/articles/chemistry-intro-2',kind:'Հոդված'}]}),pending:ref(false),error:ref(null)}
 t.after(()=>{delete globalThis.__searchRender})
 const {descriptor}=parse(read('pages/search.vue'))
 let code=compileScript(descriptor,{id:'search-render-test',inlineTemplate:true}).content
  .replaceAll("from 'vue'",`from '${vueUrl}'`).replaceAll('from "vue"',`from '${vueUrl}'`)
  .replace("from '~/utils/searchHighlight'",`from '${highlightUrl}'`).replace("from '~/utils/searchSubjects'",`from '${subjectUrl}'`)
 code=`import {ref,computed,watch} from '${vueUrl}';const useRoute=()=>({query:{q:'ջերմաստիճան'}});const useFetch=async()=>globalThis.__searchRender;`+code
 const component=(await import(url(code))).default
 const app=createSSRApp(component)
 app.component('NuxtLink',defineComponent({props:{to:String},setup(props,{slots}){return()=>h('a',{href:props.to},slots.default?.())}}))
 const html=await renderToString(app)
 assert.match(html,/Հոդված/)
 assert.match(html,/Քիմիա/)
 assert.match(html,/href="\/subjects\/chemistry"/)
})

test('history page opens and scrolls to the event supplied by a search link',async t=>{
 const {parse,compileScript}=require('@vue/compiler-sfc')
 const vueUrl=new URL('file://'+require.resolve('vue')).href
 const {reactive,nextTick}=await import(vueUrl)
 const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame}
 const frames=new Map(),scrolled=[],unmounted=[]
 let nextFrame=0
 const route=reactive({query:{event:'451'}})
 globalThis.__historyTest={route,unmounted}
 globalThis.document={getElementById:id=>({scrollIntoView:()=>scrolled.push(id)})}
 globalThis.window={matchMedia:()=>({matches:false})}
 globalThis.requestAnimationFrame=fn=>{const id=++nextFrame;frames.set(id,fn);return id}
 globalThis.cancelAnimationFrame=id=>frames.delete(id)
 t.after(()=>{unmounted.forEach(fn=>fn());Object.assign(globalThis,original);delete globalThis.__historyTest})
 const detailsUrl=url(read('data/historyDetails.ts'))
 const {descriptor}=parse(read('pages/history.vue').replace("const timeline = await usePublishedContent('EVENT', legacyTimeline)", 'const timeline = legacyTimeline'))
 let code=compileScript(descriptor,{id:'history-navigation-test'}).content
  .replaceAll("from 'vue'",`from '${vueUrl}'`)
  .replace("from '~/data/content'",`from '${contentUrl}'`).replace("from '~/data/historyDetails'",`from '${detailsUrl}'`)
 code=`import {ref,computed,watch,nextTick} from '${vueUrl}';const usePublishedContent=async(_,items)=>items;const useRoute=()=>globalThis.__historyTest.route;const useNuxtApp=()=>({hook:()=>()=>{}});const onMounted=()=>{};const onBeforeUnmount=fn=>globalThis.__historyTest.unmounted.push(fn);`+code
 const page=await (await import(url(code))).default.setup({},{expose(){}})
 const flushFrames=()=>{while(frames.size){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn())}}
 await page.jumpToEvent();flushFrames()
 assert.ok(page.expanded.value.includes('451'))
 assert.equal(scrolled.at(-1),'event-451')
 route.query.event='մ.թ.ա. 782'
 await nextTick();await nextTick();flushFrames()
 assert.ok(page.expanded.value.includes('մ.թ.ա. 782'))
 assert.equal(scrolled.at(-1),'event-մ-թ-ա-782')
})


test('enriched encyclopedia lessons cover every subject and their examples are searchable', async () => {
 const {questions,subjects}=await import(contentUrl)
 const lessons=questions.filter(question=>question.sections?.length===2 && question.example && question.takeaway && question.source)
 assert.ok(lessons.length>=subjects.length)
 assert.equal(new Set(questions.map(question=>question.id)).size,questions.length)
 for(const subject of subjects){
  const lesson=lessons.find(question=>question.subject===subject.slug)
  assert.ok(lesson,subject.slug)
  assert.equal(lesson.sections.length,2)
  assert.ok(lesson.example && lesson.takeaway && lesson.detail)
  assert.equal(new URL(lesson.source.url).protocol,'https:')
 }
 const {items}=await handler({q:'TTL'})
 assert.ok(items.some(item=>item.url==='/articles/technology-dns'))
 const example=await handler({q:'վեցանիստ'})
 assert.ok(example.items.some(item=>item.url==='/articles/mathematics-probability'))
})


test('search indexes retained biographies and excludes people without local portraits', async () => {
 const {items}=await handler({q:'Բյուրականի աստղադիտարան'})
 assert.ok(items.some(item=>item.url==='/people/hambardzumyan'))
 for(const q of ['Վազգեն Սարգսյան','Առնո Բաբաջանյան','Մխիթարյան']) {
  const result=await handler({q})
  assert.ok(!result.items.some(item=>item.kind==='Գործիչ'))
  assert.ok(!result.items.some(item=>['/people/vazgen-sargsyan','/people/babajanyan','/people/mkhitaryan'].includes(item.url)))
 }
})
