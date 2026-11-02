import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
const require=createRequire(import.meta.url),ts=require('typescript')
const code=ts.transpileModule(readFileSync(new URL('../utils/disintegrate.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function setup({reduced=false,unsupported=false}={}) {
 const frames=new Map(),timers=new Map(),overlays=[]
 let id=0,draws=0
 const context={scale(){},beginPath(){},roundRect(){},fill(){},stroke(){},clearRect(){},save(){},restore(){},translate(){},rotate(){},drawImage(){draws++}}
 const document={documentElement:{classList:{contains:()=>false}},createElement(){return {style:{},setAttribute(){},getContext:()=>unsupported?null:context,remove(){this.removed=true}}},createTreeWalker:()=>({nextNode:()=>null}),createRange:()=>({}),body:{appendChild:el=>overlays.push(el)}}
 const scope={exports:{},document,NodeFilter:{SHOW_TEXT:4},window:{matchMedia:()=>({matches:reduced}),devicePixelRatio:2},getComputedStyle:()=>({borderRadius:'18',borderColor:'#fff'}),requestAnimationFrame(fn){const key=++id;frames.set(key,fn);return key},cancelAnimationFrame:key=>frames.delete(key),setTimeout(fn){const key=++id;timers.set(key,fn);return key},clearTimeout:key=>timers.delete(key)}
 runInNewContext(code,scope)
 const card={style:{opacity:'.9'},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:20,top:40,width:360,height:240})}
 return {effect:scope.exports.disintegrate(card),card,frames,timers,overlays,get draws(){return draws},frame(time){const [key,fn]=frames.entries().next().value;frames.delete(key);fn(time)}}
}
test('card particles animate, stay bounded and clean up on completion',async()=>{
 const app=setup()
 assert.equal(app.card.style.opacity,'0')
 app.frame(0)
 assert.ok(app.draws>0 && app.draws<800)
 app.frame(1200)
 await app.effect.finished
 assert.equal(app.card.style.opacity,'.9')
 assert.equal(app.overlays[0].removed,true)
 assert.equal(app.frames.size,0)
 assert.equal(app.timers.size,0)
})
test('cancellation and stalled frames both finish removal and remove the overlay',async()=>{
 for(const timed of [false,true]){
  const app=setup()
  if(timed) [...app.timers.values()][0]()
  else {app.effect.cancel();app.effect.cancel()}
  await app.effect.finished
  assert.equal(app.overlays[0].removed,true)
  assert.equal(app.frames.size,0)
  assert.equal(app.card.style.opacity,'.9')
 }
})
test('reduced motion and unavailable canvas never block removal',async()=>{
 for(const options of [{reduced:true},{unsupported:true}]){
  const app=setup(options)
  await app.effect.finished
  assert.equal(app.overlays.length,0)
  assert.equal(app.card.style.opacity,'.9')
  assert.equal(app.timers.size,0)
 }
})

test('profile removes a bookmark once after the effect, including navigation cancellation',async()=>{
 const {parse}=require('@vue/compiler-sfc'),{ref,computed}=require('vue')
 const source=parse(readFileSync(new URL('../pages/profile.vue',import.meta.url),'utf8')).descriptor.scriptSetup.content.replace(/^import .*$/gm,'')
 const js=ts.transpileModule(source+';globalThis.profile={removeEntry};',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 for(const navigating of [false,true]){
  const cleanup=[],effects=[],removed=[]
  const saved=ref(['q1'])
  const scope={exports:{},ref,computed,nextTick:()=>Promise.resolve(),onBeforeUnmount:fn=>cleanup.push(fn),useProgress:()=>({saved,removeSaved:id=>{removed.push(id);saved.value=[]}}),disintegrate(){let resolve;const finished=new Promise(done=>{resolve=done});const effect={finished,cancel:()=>resolve()};effects.push(effect);return effect},document:{querySelector:()=>null},allEncyclopediaQuestions:[],people:[],facts:[],timeline:[],bibleBooks:[],findMillionBookmark(){}}
  for(const icon of ['BookOpen','Trophy','ScrollText','Sparkles','Users','Landmark','Bookmark'])scope[icon]={}
  runInNewContext(js,scope)
  const card={nextElementSibling:null,previousElementSibling:null}
  const event={currentTarget:{closest:()=>card}}
  const pending=scope.profile.removeEntry('q1',event)
  await scope.profile.removeEntry('q1',event)
  assert.equal(effects.length,1)
  assert.equal(removed.length,0)
  if(navigating)cleanup.forEach(fn=>fn())
  else effects[0].cancel()
  await pending
  assert.deepEqual(removed,['q1'])
 }
})
