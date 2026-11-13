import { contentUrl } from './helpers/catalog.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript'),{parse,compileScript,compileTemplate}=require('@vue/compiler-sfc')
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const url=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')
const vueUrl=new URL('file://'+require.resolve('vue')).href
const {reactive,nextTick}=await import(vueUrl)

const termsUrl=url(read('utils/searchTerms.ts'))
const highlightUrl=url(read('utils/searchHighlight.ts').replace("from './searchTerms'",`from '${termsUrl}'`))
const subjectUrl=url(read('utils/searchSubjects.ts').replace("from '../data/content'",`from '${contentUrl}'`))
const settle=async()=>{await nextTick();await nextTick()}

test('quick search debounces requests, ignores stale responses, and supports keyboard navigation',async t=>{
 const originalDocument=globalThis.document
 globalThis.document={removeEventListener(){}}
 const timers=new Map(),requests=[],emitted=[],navigated=[],unmounted=[]
 let timerId=0
 globalThis.__homeSearchTest={timers,unmounted,navigated,
  setTimer:fn=>{const id=++timerId;timers.set(id,fn);return id},clearTimer:id=>timers.delete(id),
  fetch:(path,options)=>new Promise((resolve,reject)=>requests.push({path,options,resolve,reject})),
 }
 t.after(()=>{unmounted.forEach(fn=>fn());globalThis.document=originalDocument;delete globalThis.__homeSearchTest})
 const {descriptor}=parse(read('components/HomeSearch.vue'))
 assert.deepEqual(compileTemplate({source:descriptor.template.content,filename:'HomeSearch.vue',id:'home-search-test'}).errors,[])
 assert.match(descriptor.template.content.match(/<form[\s\S]*?<\/form>/)[0],/<button[^>]*type="button"/)
 let code=compileScript(descriptor,{id:'home-search-test'}).content
  .replaceAll("from 'vue'",`from '${vueUrl}'`)
  .replaceAll("from 'lucide-vue-next'",`from '${new URL('file://'+require.resolve('lucide-vue-next')).href}'`)
    .replace("from '~/utils/searchHighlight'",`from '${highlightUrl}'`)
 code=`import {ref,shallowRef,computed,watch,nextTick} from '${vueUrl}';const onMounted=()=>{};const onBeforeUnmount=fn=>globalThis.__homeSearchTest.unmounted.push(fn);const setTimeout=fn=>globalThis.__homeSearchTest.setTimer(fn);const clearTimeout=id=>globalThis.__homeSearchTest.clearTimer(id);const $fetch=(...args)=>globalThis.__homeSearchTest.fetch(...args);const navigateTo=url=>globalThis.__homeSearchTest.navigated.push(url);`+code
 const props=reactive({modelValue:''})
 const search=(await import(url(code))).default.setup(props,{expose(){},emit:(...args)=>emitted.push(args)})
 const runTimers=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn())}
 search.focus()
 props.modelValue='ջերմ';await settle()
 props.modelValue='ջերմաստիճան';await settle()
 assert.equal(timers.size,1);assert.equal(requests.length,0)
 runTimers();assert.equal(requests[0].options.query.q,'ջերմաստիճան')
 props.modelValue='ատոմ';await settle();assert.equal(requests[0].options.signal.aborted,true)
 runTimers();assert.equal(requests.length,2)
 requests[0].resolve({items:[{title:'Old result',url:'/old'}]});await settle()
 assert.equal(search.items.value.length,0);assert.equal(search.pending.value,true)
 const items=Array.from({length:6},(_,index)=>({title:'Ատոմ '+index,description:'Կարճ բացատրություն',url:index===0?'/articles/c1':'/articles/p'+index,kind:'Հոդված',score:1,...(index===0?{subject:{name:'Քիմիա',url:'/subjects/chemistry'}}:{})}))
 requests[1].resolve({items});await settle()
 assert.equal(search.items.value.length,5);assert.equal(search.items.value[0].subject.name,'Քիմիա')
 await search.move(-1);assert.equal(search.active.value,4)
 await search.move(1);assert.equal(search.active.value,0)
 search.submit();assert.deepEqual(navigated,['/articles/c1']);assert.equal(search.open.value,false)
 search.focus();search.submit();assert.deepEqual(emitted,[['submit']])
 props.modelValue='լուծույթ';await settle();assert.equal(timers.size,1)
 search.close();assert.equal(timers.size,0);assert.equal(search.open.value,false)
 props.modelValue='ատոմ';await settle();assert.equal(timers.size,1)
 runTimers();requests.at(-1).resolve({items});await settle();assert.equal(search.items.value.length,5)
 props.modelValue='այլ հարց';await settle();runTimers();requests.at(-1).reject(new Error('offline'));await settle()
 assert.equal(search.failed.value,true);assert.equal(search.pending.value,false)
})
