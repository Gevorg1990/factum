import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {moduleUrl} from './helpers/catalog.mjs'
const root=new URL('../',import.meta.url),load=p=>import(moduleUrl(new URL(p,root))),read=p=>readFileSync(new URL(p,root),'utf8')
const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript'),sfc=require('@vue/compiler-sfc')
const {financeQuestions}=await load('data/encyclopedia/finance.ts')
const {financeExtraQuestions}=await load('data/encyclopedia/financeExtraQuestions.ts')
const {financeEnrichments}=await load('data/encyclopedia/financeEnrichments.ts')
const content=await load('data/content.ts')
test('70 new questions extend the existing 52 without renumbering, replacing or duplicating them',()=>{
 assert.equal(financeExtraQuestions.length,70);assert.equal(financeQuestions.length,122)
 assert.equal(new Set(financeQuestions.map(q=>q.id)).size,122);assert.equal(new Set(financeQuestions.map(q=>q.title)).size,122)
 const previous=financeQuestions.filter(q=>/^finance-(?:budget|economy|inflation|saving-investing|choices)-\d+-[ab]$/.test(q.id))
 assert.equal(previous.length,52)
 for(const q of financeQuestions){assert.ok(q.answer);assert.ok(new URL(q.source.url).protocol==='https:');assert.ok(content.allEncyclopediaQuestions.some(a=>a.id===q.id))}
 assert.equal(content.questions.filter(q=>q.subject==='finance').length,10)
 assert.equal(read('data/encyclopedia/financeExtraQuestions.ts'),read('data-test/financeQuestions.ts'))
})
test('five expansions match their actual questions, including the corrected monthly-payment association',()=>{
 assert.equal(Object.keys(financeEnrichments).length,5)
 const titles={'finance-banking-3-b':'Ինչո՞վ է դեբետային քարտը տարբերվում վարկայինից','finance-credit-6-b':'Արդյո՞ք փոքր ամսական վճարումը միշտ նշանակում է էժան վարկ','finance-economic-indicators-1-b':'Ինչո՞վ է անվանական ՀՆԱ-ն տարբերվում իրական ՀՆԱ-ից','finance-investing-basics-1-b':'Ինչո՞վ է պարտատոմսը տարբերվում բաժնետոմսից','finance-insurance-safety-4-b':'Ինչո՞ւ չի կարելի հայտնել մեկանգամյա հաստատման կոդը'}
 for(const [id,title] of Object.entries(titles)){
  const q=content.allEncyclopediaQuestions.find(q=>q.id===id)
  assert.equal(q.title,title);assert.equal(q.detail,financeEnrichments[id].detail);assert.equal(q.sections.length,2);assert.ok(q.example);assert.ok(q.takeaway)
 }
 assert.equal(financeEnrichments['finance-credit-5-b'],undefined)
 assert.equal(read('data/encyclopedia/financeEnrichments.ts'),read('data-test/financeEnrichments.ts').replace("'finance-credit-5-b':","'finance-credit-6-b':"))
})
test('the finance list selects ten detailed articles and searches examples with saved/read filters',()=>{
 const d=sfc.parse(read('pages/subjects/[slug].vue')).descriptor
 const js=ts.transpileModule(sfc.compileScript(d,{id:'finance-test'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const saved=vue.ref([]),readIds=vue.ref([]),scope={...vue,exports:{},useRoute:()=>({params:{slug:'finance'}}),useProgress:()=>({read:readIds,saved,markRead:id=>{readIds.value=[...readIds.value,id]},toggleSaved(){}}),require:name=>name==='vue'?vue:content}
 runInNewContext(js,scope);const page=scope.exports.default.setup({}, {expose(){}})
 assert.equal(page.items.length,10);assert.equal(page.displayed.value.length,10)
 page.limit.value=40;assert.equal(page.displayed.value.length,10)
 page.limit.value=140;assert.equal(page.displayed.value.length,10)
 page.searchQuery.value='20 000 դրամ';assert.equal(page.limit.value,20);assert.equal(page.displayed.value.length,1);assert.equal(page.displayed.value[0].id,'finance-banking-3-b')
 page.searchQuery.value='';saved.value=['finance-credit-6-b'];page.filter.value='saved';assert.equal(page.displayed.value.length,1)
 page.toggleQuestion('finance-credit-6-b');assert.equal(page.readCount.value,1)
 assert.equal(content.questions.filter(q=>q.subject==='health').length,10)
 assert.equal(content.questions.filter(q=>q.subject==='literature').length,10)
})
test('the real search endpoint indexes the new finance expansions and preserves existing finance articles',async()=>{
 const modules={'~/data/content':content}
 for(const [key,file] of [['~/utils/searchTerms','utils/searchTerms.ts'],['~/utils/searchSubjects','utils/searchSubjects.ts'],['~/utils/searchRecords','utils/searchRecords.ts'],['~/data/atomArticle','data/atomArticle.ts']])modules[key]=await load(file)
 const scope={exports:{},defineEventHandler:fn=>fn,getQuery:event=>event,useRuntimeConfig:()=>({public:{directusUrl:''}}),require:name=>modules[name]||(()=>{throw Error(name)})()}
 const js=ts.transpileModule(read('server/api/search.get.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 runInNewContext(js,scope)
 const {items}=await scope.exports.default({q:'20 000 դրամ'})
 assert.ok(items.some(q=>q.url==='/articles/finance-banking-3-b'))
 assert.ok(content.allEncyclopediaQuestions.some(q=>q.id==='finance-budget-1-a'))
})
