import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {moduleUrl} from './helpers/catalog.mjs'
const root=new URL('../',import.meta.url)
const load=p=>import(moduleUrl(new URL(p,root)))
const {literatureQuestions}=await load('data/encyclopedia/literature.ts')
const {literatureEnrichments}=await load('data/encyclopedia/literatureEnrichments.ts')
const content=await load('data/content.ts')
test('the supplied replacement has 58 distinct questions and all four expansions match the intended concepts',()=>{
 assert.equal(literatureQuestions.length,58)
 assert.equal(new Set(literatureQuestions.map(q=>q.id)).size,58)
 assert.equal(new Set(literatureQuestions.map(q=>q.title)).size,58)
 const concepts={'literature-foundation-a-1-a':'Ի՞նչ է գրականությունը','literature-foundation-a-3-b':'Ի՞նչ է վեպը','literature-foundation-a-9-a':'Ի՞նչ է սյուժեն','literature-foundation-a-17-a':'Ի՞նչ է փոխաբերությունը'}
 assert.equal(Object.keys(literatureEnrichments).length,4)
 for(const [id,title] of Object.entries(concepts)){
  assert.equal(literatureQuestions.find(q=>q.id===id)?.title,title)
  const article=content.allEncyclopediaQuestions.find(q=>q.id===id)
  assert.equal(article.detail,literatureEnrichments[id].detail)
  assert.equal(article.sections.length,2);assert.ok(article.example);assert.ok(article.takeaway)
 }
})
test('the richest ten new literature articles are visible while the full edition remains available',()=>{
 const visible=content.questions.filter(q=>q.subject==='literature')
 assert.equal(visible.length,10)
 assert.ok(visible.every(q=>q.id.startsWith('literature-foundation-a-')))
 assert.equal(visible.filter(q=>q.sections?.length).length,4)
 for(const subject of content.subjects.filter(s=>!['literature','health','finance'].includes(s.slug)))assert.ok(content.questions.filter(q=>q.subject===subject.slug).length<=10)
 const metaphor=visible.find(q=>q.title==='Ի՞նչ է փոխաբերությունը')
 assert.ok(metaphor.example.includes('Ժամանակը գետ է'))
})
test('old article identifiers stay in a separate lazy-loaded edition; the source folder is preserved',async()=>{
 const {legacyLiteratureQuestions}=await load('data/encyclopedia/literatureLegacy.ts')
 assert.equal(legacyLiteratureQuestions.length,48)
 assert.ok(legacyLiteratureQuestions.some(q=>q.id==='literature-intro-a-11-b'))
 const article=readFileSync(new URL('pages/articles/[id].vue',root),'utf8')
 assert.ok(article.includes("await import('~/data/encyclopedia/literatureLegacy')"))
 assert.ok(!readFileSync(new URL('data/content.ts',root),'utf8').includes('literatureLegacy'))
 assert.equal(readFileSync(new URL('data/encyclopedia/literature.ts',root),'utf8'),readFileSync(new URL('data-test/literatureQuestions.ts',root),'utf8'))
 assert.equal(readFileSync(new URL('data/encyclopedia/literatureEnrichments.ts',root),'utf8'),readFileSync(new URL('data-test/literatureEnrichments.ts',root),'utf8'))
})
test('the literature page shows ten selected articles and searches their expanded examples',async()=>{
 const {createRequire}=await import('node:module'),{runInNewContext}=await import('node:vm')
 const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript'),{parse,compileScript}=require('@vue/compiler-sfc')
 const descriptor=parse(readFileSync(new URL('pages/subjects/[slug].vue',root),'utf8')).descriptor
 const js=ts.transpileModule(compileScript(descriptor,{id:'literature-test'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const saved=vue.ref([]),read=vue.ref([]),scope={...vue,exports:{},useRoute:()=>({params:{slug:'literature'}}),useProgress:()=>({read,saved,markRead:id=>{read.value=[...read.value,id]},toggleSaved(){}}),require:name=>name==='vue'?vue:content}
 runInNewContext(js,scope)
 const page=scope.exports.default.setup({}, {expose(){}})
 assert.equal(page.displayed.value.length,10)
 page.limit.value+=20;assert.equal(page.displayed.value.length,10)
 page.limit.value+=20;assert.equal(page.displayed.value.length,10)
 page.searchQuery.value='Ժամանակը գետ է';assert.equal(page.limit.value,20)
 assert.equal(page.displayed.value.length,1);assert.equal(page.displayed.value[0].id,'literature-foundation-a-17-a')
 page.searchQuery.value='';saved.value=['literature-foundation-a-3-b'];page.filter.value='saved';assert.equal(page.displayed.value.length,1)
 page.toggleQuestion(saved.value[0]);assert.equal(page.readCount.value,1)
})
test('article routes load the archive only for old bookmarks and keep new explanations intact',async()=>{
 const {createRequire}=await import('node:module'),{runInNewContext}=await import('node:vm')
 const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript'),{parse}=require('@vue/compiler-sfc')
 const {legacyLiteratureQuestions}=await load('data/encyclopedia/literatureLegacy.ts')
 let source=parse(readFileSync(new URL('pages/articles/[id].vue',root),'utf8')).descriptor.scriptSetup.content.replace(/^import .*$/gm,'')
 source=source.replace("import('~/data/encyclopedia/literatureLegacy')",'loadLegacy()').replace("import('~/data/encyclopedia/healthLegacy')",'loadHealthLegacy()')
 for(const id of ['literature-foundation-a-1-a','literature-intro-a-11-b']){
  let requests=0
  const scope={...vue,...content,useRoute:()=>({params:{id},hash:'#saved-article'}),useProgress:()=>({saved:vue.ref([]),markRead(){},toggleSaved(){}}),useHead(){},useSavedScroll(){},onMounted(){},loadLegacy:async()=>{requests++;return{legacyLiteratureQuestions}}}
  const js=ts.transpileModule(`globalThis.result=(async()=>{${source};return question})()`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  runInNewContext(js,scope);const question=await scope.result
  assert.equal(question.id,id)
  assert.equal(requests,id.includes('intro')?1:0)
  if(!requests)assert.equal(question.sections.length,2)
 }
})
