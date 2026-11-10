import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {moduleUrl} from './helpers/catalog.mjs'
const root=new URL('../',import.meta.url),load=p=>import(moduleUrl(new URL(p,root)))
const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript'),sfc=require('@vue/compiler-sfc')
const {healthQuestions}=await load('data/encyclopedia/health.ts')
const {healthEnrichments}=await load('data/encyclopedia/healthEnrichments.ts')
const {legacyHealthQuestions}=await load('data/encyclopedia/healthLegacy.ts')
const content=await load('data/content.ts')
test('all 84 supplied health questions and 10 expansions are connected to the active catalog',()=>{
 assert.equal(healthQuestions.length,84)
 assert.equal(new Set(healthQuestions.map(q=>q.id)).size,84)
 assert.equal(new Set(healthQuestions.map(q=>q.title)).size,84)
 assert.equal(Object.keys(healthEnrichments).length,10)
 for(const q of healthQuestions){assert.ok(q.answer);assert.ok(new URL(q.source.url).protocol==='https:');assert.ok(content.allEncyclopediaQuestions.some(a=>a.id===q.id))}
 for(const [id,expansion] of Object.entries(healthEnrichments)){
  const article=content.allEncyclopediaQuestions.find(q=>q.id===id)
  assert.ok(article,id);assert.equal(article.detail,expansion.detail);assert.equal(article.sections.length,2);assert.ok(article.example);assert.ok(article.takeaway)
 }
 assert.match(content.allEncyclopediaQuestions.find(q=>q.id==='health-heart-advanced-1-a').title,/սրտամկանը/)
 assert.match(content.allEncyclopediaQuestions.find(q=>q.id==='health-sleep-4-a').answer,/8–10/)
 assert.match(content.allEncyclopediaQuestions.find(q=>q.id==='health-immunity-3-a').title,/պատվաստման/)
})
test('the health page shows ten richly expanded articles and retains search and saved/read filters',async()=>{
 const d=sfc.parse(readFileSync(new URL('pages/subjects/[slug].vue',root),'utf8')).descriptor
 const code=ts.transpileModule(sfc.compileScript(d,{id:'health-test'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const read=vue.ref([]),saved=vue.ref([]),scope={...vue,usePublishedContent:async(_kind,fallback,options)=>options?.key?fallback.filter(x=>x.slug===options.key):fallback,exports:{},useRoute:()=>({params:{slug:'health'}}),useProgress:()=>({read,saved,markRead:id=>{read.value=[...read.value,id]},toggleSaved(){}}),require:name=>name==='vue'?{...vue,withAsyncContext:fn=>[fn(),()=>{}]}:content}
 runInNewContext(code,scope);const page=await scope.exports.default.setup({}, {expose(){}})
 assert.equal(page.items.length,10);assert.equal(page.displayed.value.length,10)
 page.limit.value=40;assert.equal(page.displayed.value.length,10)
 page.limit.value=100;assert.equal(page.displayed.value.length,10)
 page.searchQuery.value='էպիկարդ';assert.equal(page.limit.value,20);assert.equal(page.displayed.value.length,1);assert.equal(page.displayed.value[0].id,'health-heart-advanced-1-a')
 page.searchQuery.value='';saved.value=['health-sleep-4-a'];page.filter.value='saved';assert.equal(page.displayed.value.length,1)
 page.toggleQuestion('health-sleep-4-a');assert.equal(page.readCount.value,1)
 assert.equal(content.questions.filter(q=>q.subject==='literature').length,10)
})
test('44 legacy health URLs retain their articles without joining the shared active catalog',async()=>{
 assert.equal(legacyHealthQuestions.length,44)
 const {legacyLiteratureQuestions}=await load('data/encyclopedia/literatureLegacy.ts')
 let source=sfc.parse(readFileSync(new URL('pages/articles/[id].vue',root),'utf8')).descriptor.scriptSetup.content.replace(/^import .*$/gm,'')
 source=source.replace("import('~/data/encyclopedia/literatureLegacy')",'loadLiteratureLegacy()').replace("import('~/data/encyclopedia/healthLegacy')",'loadHealthLegacy()')
 for(const id of ['health-heart-advanced-1-a',...legacyHealthQuestions.map(q=>q.id)]){
  let requests=0
  const scope={...vue,...content,usePublishedContent:async(_kind,fallback)=>fallback,useRoute:()=>({params:{id},hash:'#saved-article'}),useProgress:()=>({saved:vue.ref([]),markRead(){},toggleSaved(){}}),onMounted(){},useHead(){},useSavedScroll(){},loadLiteratureLegacy:async()=>({legacyLiteratureQuestions}),loadHealthLegacy:async()=>{requests++;return{legacyHealthQuestions}}}
  const js=ts.transpileModule(`globalThis.result=(async()=>{${source};return question})()`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  runInNewContext(js,scope);assert.equal((await scope.result).id,id)
  assert.equal(requests,id.includes('advanced')?0:1)
 }
 assert.ok(!readFileSync(new URL('data/content.ts',root),'utf8').includes('healthLegacy'))
})
test('the original inputs remain unchanged and all ten expanded health articles are selected',()=>{
 for(const [target,original] of [['health.ts','healthQuestions.ts'],['healthEnrichments.ts','healthEnrichments.ts']])assert.equal(readFileSync(new URL('data/encyclopedia/'+target,root),'utf8'),readFileSync(new URL('data-test/'+original,root),'utf8'))
 const active=content.questions.filter(q=>q.subject==='health')
 assert.equal(active.length,10);assert.equal(active.filter(q=>q.sections?.length).length,10)
 assert.ok(!active.some(q=>legacyHealthQuestions.some(old=>old.id===q.id)))
})
