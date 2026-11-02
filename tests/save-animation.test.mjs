import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
const ts=require('typescript')
const {parse,compileScript}=require('@vue/compiler-sfc')
const vueUrl=new URL('file://'+require.resolve('vue')).href
const {nextTick}=await import(vueUrl)
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64')
const utilityUrl=moduleUrl(read('utils/saveAnimation.ts'))
const {animateSaveFlight}=await import(utilityUrl)
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}

test('flight arrives only after all particles finish, and cancellation removes them',async t=>{
  const nodes=[]
  const originalDocument=globalThis.document
  t.after(()=>{globalThis.document=originalDocument})
  globalThis.document={body:{appendChild(){}},createElement(){
    const node={style:{},removed:false,setAttribute(){},remove(){this.removed=true},animate(keyframes,options){
      const pending=deferred()
      const animation={finished:pending.promise,cancel(){pending.reject(new Error('cancelled'))}}
      Object.assign(node,{keyframes,options,pending,animation})
      return animation
    }}
    nodes.push(node);return node
  }}
  const flight=animateSaveFlight({x:50,y:600},{x:900,y:35})
  let arrived=false;flight.finished.then(()=>{arrived=true})
  assert.equal(nodes.length,7)
  assert.ok(nodes.at(-1).keyframes.at(-1).transform.includes('850px'))
  assert.ok(nodes.at(-1).keyframes.at(-1).transform.includes('-565px'))
  nodes.slice(0,-1).forEach(node=>node.pending.resolve())
  await Promise.resolve();assert.equal(arrived,false)
  nodes.at(-1).pending.resolve()
  assert.equal(await flight.finished,true)
  assert.ok(nodes.every(node=>node.removed))
  const cancelled=animateSaveFlight({x:0,y:100},{x:100,y:0})
  cancelled.cancel()
  assert.equal(await cancelled.finished,false)
  assert.ok(nodes.every(node=>node.removed))
})

test('header waits for arrival before pulsing and cancels pending flights on teardown',async t=>{
  const originalWindow=globalThis.window,originalDocument=globalThis.document
  t.after(()=>{globalThis.window=originalWindow;globalThis.document=originalDocument})
  const mounted=[],unmounted=[],pending=[]
  let reduced=false,cancelled=0
  globalThis.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:reduced})}
  globalThis.document={querySelector:()=>({animate(){},getBoundingClientRect:()=>({left:800,top:10,width:100,height:40})})}
  globalThis.__saveHeader={mounted,unmounted,flight(){const d=deferred();pending.push(d);return {finished:d.promise,cancel(){cancelled++;d.resolve(false)}}}}
  const stub=moduleUrl("export const SAVE_ANIMATION_EVENT='test:save';export const animateSaveFlight=(...args)=>globalThis.__saveHeader.flight(...args)")
  const {descriptor}=parse(read('components/SiteHeader.vue'))
  let code=compileScript(descriptor,{id:'save-header-test'}).content
    .replaceAll("from 'vue'",`from '${vueUrl}'`)
    .replaceAll("from 'lucide-vue-next'",`from '${new URL('file://'+require.resolve('lucide-vue-next')).href}'`)
    .replaceAll("from '~/utils/saveAnimation'",`from '${stub}'`)
  code=`import {ref,nextTick} from '${vueUrl}';const useProgress=()=>({});const onMounted=fn=>globalThis.__saveHeader.mounted.push(fn);const onUnmounted=fn=>globalThis.__saveHeader.unmounted.push(fn);`+code
  const header=(await import(moduleUrl(code))).default.setup({},{expose(){}})
  const event={detail:{origin:{x:50,y:600}}}
  const save=header.handleSaveAnimation(event)
  assert.equal(header.savePulse.value,false)
  pending[0].resolve(true);await save;await nextTick()
  assert.equal(header.savePulse.value,true)
  header.savePulse.value=false
  reduced=true
  const reducedSave=header.handleSaveAnimation(event)
  assert.equal(pending.length,2)
  pending[1].resolve(true);await reducedSave;await nextTick()
  assert.equal(header.savePulse.value,true)
  reduced=false
  header.savePulse.value=false
  const second=header.handleSaveAnimation(event)
  unmounted.forEach(fn=>fn());await second
  assert.equal(cancelled,1)
  assert.equal(header.savePulse.value,false)
})

test('adding a bookmark requests a flight; removing it does not',async t=>{
  const requested=[]
  globalThis.__saveRequests=requested
  t.after(()=>{delete globalThis.__saveRequests})
  const stub=moduleUrl('export const requestSaveAnimation=event=>globalThis.__saveRequests.push(event)')
  let source=read('composables/useProgress.ts')
    .replace('effectScope, onMounted, ref, watch','effectScope, ref, watch')
    .replace("from 'vue'",`from '${vueUrl}'`)
    .replace("from '../utils/saveAnimation'",`from '${stub}'`)
  source='const onMounted=()=>{};'+source
  const {useProgress}=await import(moduleUrl(source))
  const progress=useProgress(),event={currentTarget:'save button'}
  progress.toggleSaved('article-1',event)
  assert.deepEqual(progress.saved.value,['article-1'])
  assert.deepEqual(requested,[event])
  progress.toggleSaved('article-1',event)
  assert.deepEqual(progress.saved.value,[])
  assert.equal(requested.length,1)
})
