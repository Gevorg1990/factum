import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript'),{parse,compileScript}=require('@vue/compiler-sfc')
const vueUrl=new URL('file://'+require.resolve('vue')).href
const {nextTick}=await import(vueUrl)
const {descriptor}=parse(readFileSync(new URL('../components/CardVideo.vue',import.meta.url),'utf8'))
const source=compileScript(descriptor,{id:'card-video-test'}).content.replaceAll("from 'vue'",`from '${vueUrl}'`)
const code=`import {ref,nextTick} from '${vueUrl}';const onMounted=fn=>globalThis.__cardVideo.mounted.push(fn);const onBeforeUnmount=fn=>globalThis.__cardVideo.unmounted.push(fn);`+source
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const component=(await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))).default

function setup(t,deferred=false,options={}){
 const old={window:globalThis.window,document:globalThis.document,IntersectionObserver:globalThis.IntersectionObserver}
 const mounted=[],unmounted=[],plays=[]
 let observe
 globalThis.__cardVideo={mounted,unmounted}
 globalThis.window={IntersectionObserver:true,matchMedia:()=>({matches:!!options.reducedMotion,addEventListener(){},removeEventListener(){}})}
 globalThis.document={hidden:false,addEventListener(){},removeEventListener(){}}
 globalThis.IntersectionObserver=class{constructor(fn){observe=fn}observe(){}disconnect(){}}
 const card={matches:()=>!!options.initialHover,addEventListener(){},removeEventListener(){},contains(){return false}}
 const video={src:'',currentTime:0,closest:()=>card,getAttribute(){return this.src},removeAttribute(){this.src=''},load(){this.currentTime=0},paused:true,pause(){this.paused=true},play(){this.paused=false;
  let resolve,reject
  const promise=deferred?new Promise((yes,no)=>{resolve=yes;reject=no}):Promise.resolve()
  plays.push({resolve,reject});return promise
 }}
 const reader=component.setup({src:'/videos/test.mp4',poster:'/images/test.jpg'},{expose(){}})
 reader.video.value=video
 mounted.forEach(fn=>fn())
 if (!options.deferObserver) observe([{isIntersecting:true,intersectionRatio:1}])
 t.after(()=>{unmounted.forEach(fn=>fn());Object.assign(globalThis,old);delete globalThis.__cardVideo})
 return {reader,video,plays}
}

test('repeat hover resumes interrupted clips and retains completed frames until replay',async t=>{
 const {reader,video,plays}=setup(t)
 assert.equal(plays.length,0)
 reader.pointerEnter({pointerType:'mouse'});await nextTick()
 video.currentTime=1.8
 reader.pointerLeave()
 reader.pointerEnter({pointerType:'mouse'});await nextTick()
 assert.equal(video.currentTime,1.8)
 assert.equal(plays.length,2)
 video.currentTime=4
 reader.finishPlayback()
 assert.equal(video.currentTime,4)
 reader.pointerLeave()
 assert.equal(video.currentTime,4)
 assert.equal(video.src,'/videos/test.mp4')
 assert.equal(video.paused,true)
 reader.pointerEnter({pointerType:'mouse'});await nextTick()
 assert.equal(video.currentTime,0)
 assert.equal(reader.completed.value,false)
 assert.equal(video.src,'/videos/test.mp4')
 assert.equal(plays.length,3)
 video.currentTime=6
 reader.finishPlayback();reader.pointerLeave()
 assert.equal(video.currentTime,6)
 reader.pointerEnter({pointerType:'mouse'});await nextTick()
 assert.equal(video.src,'/videos/test.mp4')
 assert.equal(plays.length,4)
 assert.doesNotMatch(descriptor.template.content,/<video[^>]*\bloop\b/)
})

test('replay holds the final frame until the restarted video presents a frame',async t=>{
 const {reader,video}=setup(t)
 let drawn=0, reveal
 video.videoWidth=640;video.videoHeight=360
 reader.replayFrame.value={width:0,height:0,offsetWidth:640,getContext:()=>({drawImage(){drawn++}})}
 video.requestVideoFrameCallback=fn=>{reveal=fn;return 1}
 video.cancelVideoFrameCallback=()=>{}
 reader.pointerEnter({pointerType:'mouse'});await nextTick()
 video.currentTime=6;reader.finishPlayback();reader.pointerLeave()
 assert.equal(video.currentTime,6)
 reader.pointerEnter({pointerType:'mouse'})
 assert.equal(reader.holdingLastFrame.value,true)
 assert.equal(video.currentTime,6)
 await nextTick();await nextTick();await nextTick()
 assert.equal(drawn,1)
 assert.equal(video.currentTime,0)
 assert.equal(video.src,'/videos/test.mp4')
 assert.equal(reader.holdingLastFrame.value,true)
 reveal()
 assert.equal(reader.holdingLastFrame.value,false)
})

test('an old interrupted play promise cannot hide the new hover preview',async t=>{
 const {reader,video,plays}=setup(t,true)
 reader.pointerEnter({pointerType:'mouse'})
 reader.pointerLeave()
 reader.pointerEnter({pointerType:'mouse'})
 plays[1].resolve();await nextTick();await nextTick()
 assert.equal(!video.paused,true)
 plays[0].reject(new Error('interrupted by pause'));await nextTick();await nextTick()
 assert.equal(!video.paused,true)
})

test('intentional hover starts muted playback even before visibility observation and with reduced motion', async t => {
 const {reader,video,plays}=setup(t,false,{deferObserver:true,reducedMotion:true})
 assert.equal(plays.length,0)
 assert.equal(video.src,'')
 reader.pointerEnter({pointerType:'mouse'});await nextTick()
 assert.equal(plays.length,1)
 assert.equal(video.muted,true)
 assert.equal(video.defaultMuted,true)
 assert.equal(video.playsInline,true)
 assert.equal(!video.paused,true)
 reader.pointerLeave();await nextTick()
 assert.equal(!video.paused,false)
})
test('a card already hovered during hydration starts its preview', async t => {
 const {reader,video,plays}=setup(t,false,{initialHover:true,deferObserver:true})
 await nextTick()
 assert.equal(plays.length,1)
 assert.equal(!video.paused,true)
})

test('native poster and video share one surface without a separate image or touch hint', () => {
 assert.match(descriptor.template.content, /<video[^>]*:poster="poster"/)
 assert.doesNotMatch(descriptor.template.content, /<img|card-video-hint/)
 assert.match(descriptor.template.content, /preload="none"/)
 assert.doesNotMatch(descriptor.template.content, /<video[^>]*\s:?(?:src)=/)
})
