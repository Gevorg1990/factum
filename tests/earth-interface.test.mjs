import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import{createRequire}from'node:module'
import{runInNewContext}from'node:vm'
import{moduleUrl}from'./helpers/catalog.mjs'
const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript')
const {parse,compileScript,compileTemplate,compileStyle}=require('@vue/compiler-sfc')
const data=await import(moduleUrl(new URL('../data/earth/interior.ts',import.meta.url)))
const model=await import(moduleUrl(new URL('../utils/earth/interior.ts',import.meta.url)))
function descriptor(file){return parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{filename:file}).descriptor}
const file='components/earth/InteriorExplorer.client.vue',d=descriptor(file)
const code=ts.transpileModule(compileScript(d,{id:'earth-test'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const tick=()=>new Promise(resolve=>setImmediate(resolve))
function setup({fail=false,delayed=false}={}) {
  const mounted=[],cleanup=[],calls=[],events=new Map(),frames=new Map(),changes=new Set(),emitted=[]
  let next=0,release
  const scene=Object.fromEntries(['setSurface','dispose','setOpening','setDepth','setLayer','setReducedMotion','rotate','zoom','reset'].map(name=>[name,(...args)=>calls.push([name,...args])]))
  const sceneModule={createEarthScene(){calls.push(['create']);if(fail)throw Error('No WebGL');return scene}}
  const pending=delayed?new Promise(resolve=>{release=()=>resolve(sceneModule)}):sceneModule
  const document={hidden:false,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)}
  const exports={}
  runInNewContext(code,{...vue,exports,document,Intl,onMounted:fn=>mounted.push(fn),onBeforeUnmount:fn=>cleanup.push(fn),window:{matchMedia:()=>({matches:true,addEventListener:(_,fn)=>changes.add(fn),removeEventListener:(_,fn)=>changes.delete(fn)})},requestAnimationFrame:fn=>{const id=++next;frames.set(id,time=>{frames.delete(id);fn(time)});return id},cancelAnimationFrame:id=>frames.delete(id),require:name=>name==='vue'?vue:name==='lucide-vue-next'?{}:name.includes('data/earth')?data:name.includes('utils/earth/interior')?model:name.includes('scene.client')?pending:(()=>{throw Error(name)})()})
  const viewer=exports.default.setup({}, {expose(){},emit:(...args)=>emitted.push(args)})
  viewer.host.value={};mounted.forEach(fn=>fn())
  return{viewer,calls,frames,document,events,release,emitted,dispose:()=>cleanup.forEach(fn=>fn())}
}
test('earth components and existing globe page compile for SSR-compatible templates and responsive CSS',()=>{
  for(const filename of [file,'components/earth/InteriorCharts.vue','pages/globe.vue']){
    const component=descriptor(filename)
    assert.deepEqual(compileTemplate({source:component.template.content,filename,id:'earth-test'}).errors,[])
    for(const style of component.styles)assert.deepEqual(compileStyle({source:style.content,filename,id:'earth-test',scoped:true}).errors,[])
  }
})
test('depth slider, layer selection, pause/resume, hidden tab and teardown update real scientific data',async()=>{
  const app=setup();await tick()
  assert.equal(app.viewer.error.value,false)
  app.viewer.chooseLayer('outer-core');await vue.nextTick()
  assert.equal(app.viewer.layer.value.id,'outer-core')
  assert.ok(app.calls.some(call=>call[0]==='setLayer'&&call[1]==='outer-core'))
  app.viewer.toggleJourney();await vue.nextTick();assert.equal(app.frames.size,1)
  app.frames.values().next().value(100);app.frames.values().next().value(200);await vue.nextTick()
  const paused=app.viewer.depth.value
  app.viewer.toggleJourney();await vue.nextTick();assert.equal(app.viewer.depth.value,paused);assert.equal(app.viewer.travelling.value,false)
  app.viewer.toggleJourney();await vue.nextTick();assert.equal(app.viewer.travelling.value,true)
  app.document.hidden=true;app.events.get('visibilitychange')();await vue.nextTick();assert.equal(app.viewer.travelling.value,false)
  app.viewer.chooseDepth(6371);await vue.nextTick();assert.ok(app.viewer.pressure.value>363)
  app.viewer.leave();assert.equal(app.emitted[0][0],'back')
  app.dispose();assert.equal(app.events.size,0);assert.equal(app.frames.size,0)
  assert.equal(app.calls.filter(call=>call[0]==='dispose').length,1)
})
test('WebGL failure leaves usable depth and graphs; late dynamic import cannot create a detached scene',async()=>{
  const failed=setup({fail:true});await tick();assert.equal(failed.viewer.error.value,true)
  failed.viewer.chooseDepth(5000);await vue.nextTick();assert.equal(failed.viewer.layer.value.id,'outer-core');failed.dispose()
  const late=setup({delayed:true});late.dispose();late.release();await tick();assert.equal(late.calls.filter(call=>call[0]==='create').length,0)
})
test('globe mode keeps the original selection and country links while returning from the depth mode',async()=>{
  const pageDescriptor=descriptor('pages/globe.vue'),exports={},focused=[]
  const pageCode=ts.transpileModule(compileScript(pageDescriptor,{id:'globe-mode'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  runInNewContext(pageCode,{...vue,exports,useHead(){},document:{getElementById:id=>({focus:()=>focused.push(id),scrollIntoView(){},setAttribute(){}})},window:{matchMedia:()=>({matches:false})},require:name=>name==='vue'?vue:{}})
  const page=exports.default.setup({}, {expose(){}})
  assert.equal(page.mode.value,'globe')
  await page.showOnMap('ARM')
  const original=page.mapFocus.value
  await page.setMode('interior')
  assert.equal(page.mode.value,'interior');assert.equal(focused.at(-1),'earth-interior')
  await page.setMode('globe')
  assert.equal(page.mapFocus.value,original);assert.equal(focused.at(-1),'interactive-globe')
  await page.setMode('interior');await page.showOnMap('FRA','world-facts-title')
  assert.equal(page.mode.value,'globe');assert.equal(page.mapFocus.value.code,'FRA');assert.equal(page.mapReturnTarget.value,'world-facts-title')
})
