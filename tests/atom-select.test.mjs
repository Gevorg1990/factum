import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import{createRequire}from'node:module'
import{runInNewContext}from'node:vm'
const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript')
const{parse,compileScript,compileTemplate,compileStyle}=require('@vue/compiler-sfc')
const filename='components/chemistry/AtomSelect.vue'
const{descriptor}=parse(readFileSync(new URL('../'+filename,import.meta.url),'utf8'),{filename})
const code=ts.transpileModule(compileScript(descriptor,{id:'select-test'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function setup(){
  const exports={},events=new Map(),resizes=new Map(),cleanup=[],emitted=[],focus=[]
  const props=vue.reactive({id:'elements',modelValue:1,options:[{value:1,label:'Ջրածին'},{value:2,label:'Հելիում'},{value:26,label:'Երկաթ'}]})
  runInNewContext(code,{...vue,exports,onBeforeUnmount:fn=>cleanup.push(fn),window:{innerHeight:800,addEventListener:(n,f)=>resizes.set(n,f),removeEventListener:n=>resizes.delete(n)},document:{addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)},require:n=>n==='vue'?vue:{}})
  const select=exports.default.setup(props,{expose(){},emit:(...args)=>emitted.push(args)})
  select.trigger.value={getBoundingClientRect:()=>({top:600,bottom:644}),focus:()=>focus.push(true)}
  select.root.value={contains:target=>target==='inside'}
  select.list.value={querySelector:()=>({scrollIntoView(){}})}
  return{select,props,events,resizes,emitted,focus,dispose:()=>cleanup.forEach(fn=>fn())}
}
const key=key=>({key,preventDefault(){}})
test('bounded select compiles and keyboard selection preserves numeric values and the selected label',async()=>{
  assert.deepEqual(compileTemplate({source:descriptor.template.content,filename,id:'select-test'}).errors,[])
  assert.deepEqual(compileStyle({source:descriptor.styles[0].content,filename,id:'select-test',scoped:true}).errors,[])
  const app=setup()
  app.select.keyboard(key('ArrowDown'));await vue.nextTick()
  assert.equal(app.select.open.value,true)
  assert.equal(app.select.upward.value,true)
  assert.ok(app.select.maxHeight.value<=264)
  app.select.keyboard(key('End'));app.select.keyboard(key('Enter'));await vue.nextTick()
  assert.deepEqual(app.emitted[0],['update:modelValue',26])
  assert.equal(app.select.open.value,false)
  assert.equal(app.focus.length,1)
  app.dispose()
})
test('Armenian typeahead, Escape, outside clicks and teardown close the dropdown cleanly',async()=>{
  const app=setup()
  app.select.keyboard(key('Ե'));await vue.nextTick()
  assert.equal(app.select.active.value,2)
  assert.equal(app.events.size,1)
  app.select.keyboard(key('Escape'));await vue.nextTick()
  assert.equal(app.select.open.value,false);assert.equal(app.events.size,0)
  app.select.show();await vue.nextTick();app.events.get('pointerdown')({target:'outside'});await vue.nextTick()
  assert.equal(app.select.open.value,false)
  app.select.show();await vue.nextTick();app.dispose()
  assert.equal(app.events.size,0);assert.equal(app.resizes.size,0)
})
