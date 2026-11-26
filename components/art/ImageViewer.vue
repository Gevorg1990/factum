<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref} from 'vue'
import {Minus,Plus, X} from 'lucide-vue-next'

const props=defineProps<{src:string;title:string}>()
const emit=defineEmits<{close:[]}>()
const dialog=ref<HTMLDialogElement>()
const viewport=ref<HTMLElement>()
const closeButton=ref<HTMLButtonElement>()
const size=ref({width:0,height:0})
const intrinsic=ref({width:0,height:0})
const zoom=ref(1)
const offset=ref({x:0,y:0})
const dragging=ref(false)
const failed=ref(false)
const maxZoom=5
const activePointers=new Map<number,{x:number;y:number}>()
let observer:ResizeObserver|undefined
let returnFocus:HTMLElement|undefined

const fitted=computed(()=>{
  const {width,height}=intrinsic.value
  const fit=width&&height?Math.min(size.value.width/width,size.value.height/height):0
  return {width:width*fit,height:height*fit}
})
const imageStyle=computed(()=>({
  width:`${fitted.value.width}px`,height:`${fitted.value.height}px`,
  transform:`translate(-50%, -50%) translate(${offset.value.x}px, ${offset.value.y}px) scale(${zoom.value})`,
}))

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function place(x:number,y:number){
  const maxX=Math.max(0,(fitted.value.width*zoom.value-size.value.width)/2)
  const maxY=Math.max(0,(fitted.value.height*zoom.value-size.value.height)/2)
  offset.value={x:clamp(x,-maxX,maxX),y:clamp(y,-maxY,maxY)}
}
function scale(next:number,origin={x:0,y:0},destination=origin){
  const effective=clamp(next,1,maxZoom)
  const ratio=effective/zoom.value
  zoom.value=effective
  place(destination.x+(offset.value.x-origin.x)*ratio,destination.y+(offset.value.y-origin.y)*ratio)
}
function reset(){zoom.value=1;place(0,0)}
function imageLoaded(event:Event){
  const image=event.currentTarget as HTMLImageElement
  intrinsic.value={width:image.naturalWidth,height:image.naturalHeight}
  reset()
}
function point(event:MouseEvent){
  const bounds=viewport.value!.getBoundingClientRect()
  return {x:event.clientX-bounds.left-bounds.width/2,y:event.clientY-bounds.top-bounds.height/2}
}
function wheel(event:WheelEvent){
  if(!intrinsic.value.width)return
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.value.height:1)
  scale(zoom.value*Math.exp(clamp(-delta*.0025,-1,1)),point(event))
}
function pointerDown(event:PointerEvent){
  if(!intrinsic.value.width||activePointers.size>=2||event.pointerType==='mouse'&&(event.button!==0||zoom.value<=1))return
  activePointers.set(event.pointerId,point(event))
  viewport.value?.setPointerCapture(event.pointerId)
  dragging.value=true
}
function pointerMove(event:PointerEvent){
  const last=activePointers.get(event.pointerId)
  if(!last)return
  const next=point(event)
  activePointers.set(event.pointerId,next)
  if(activePointers.size===1){place(offset.value.x+next.x-last.x,offset.value.y+next.y-last.y);return}
  const other=[...activePointers].find(([id])=>id!==event.pointerId)?.[1]
  if(!other)return
  const distance=Math.hypot(last.x-other.x,last.y-other.y)
  const ratio=distance>0?Math.hypot(next.x-other.x,next.y-other.y)/distance:1
  scale(zoom.value*ratio,{x:(last.x+other.x)/2,y:(last.y+other.y)/2},{x:(next.x+other.x)/2,y:(next.y+other.y)/2})
}
function pointerEnd(event:PointerEvent){
  activePointers.delete(event.pointerId)
  dragging.value=activePointers.size>0
}
function close(){
  if(!dialog.value?.open)return
  dialog.value.close()
  emit('close')
  void nextTick(()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true})})
}
function keydown(event:KeyboardEvent){
  if(event.key==='Escape'){
    event.preventDefault()
    event.stopPropagation()
    close()
    return
  }
  if(!intrinsic.value.width||event.ctrlKey||event.metaKey||event.altKey)return
  switch(event.key){
    case '+':case '=':scale(zoom.value*1.25);break
    case '-':scale(zoom.value/1.25);break
    case '0':case 'Home':reset();break
    case 'ArrowLeft':place(offset.value.x+60,offset.value.y);break
    case 'ArrowRight':place(offset.value.x-60,offset.value.y);break
    case 'ArrowUp':place(offset.value.x,offset.value.y+60);break
    case 'ArrowDown':place(offset.value.x,offset.value.y-60);break
    default:return
  }
  event.preventDefault()
  event.stopPropagation()
}
onMounted(()=>{
  if(document.activeElement instanceof HTMLElement)returnFocus=document.activeElement
  dialog.value?.showModal()
  closeButton.value?.focus({preventScroll:true})
  const stage=viewport.value
  if(!stage)return
  const measure=()=>{
    size.value={width:stage.clientWidth,height:stage.clientHeight}
    place(offset.value.x,offset.value.y)
  }
  measure()
  observer=new ResizeObserver(measure)
  observer.observe(stage)
})
onBeforeUnmount(()=>{observer?.disconnect();activePointers.clear();if(dialog.value?.open)dialog.value.close()})
</script>

<template>
  <dialog ref="dialog" class="image-viewer" :aria-label="`Մանրամասն դիտել՝ ${props.title}`" @keydown="keydown" @cancel.prevent="close">
    <header class="viewer-header">
      <h2>{{props.title}}</h2>
      <div class="viewer-controls" role="group" aria-label="Նկարի չափը">
        <button type="button" aria-label="Փոքրացնել նկարը" :disabled="!intrinsic.width||zoom<=1" @click="scale(zoom/1.25)"><Minus :size="19" aria-hidden="true"/></button>
        <button type="button" class="zoom-level" aria-label="Ցույց տալ ամբողջ նկարը" :disabled="!intrinsic.width" @click="reset">{{Math.round(zoom*100)}}%</button>
        <button type="button" aria-label="Մոտեցնել նկարը" :disabled="!intrinsic.width||zoom>=maxZoom" @click="scale(zoom*1.25)"><Plus :size="19" aria-hidden="true"/></button>
      </div>
      <button ref="closeButton" class="viewer-close" type="button" aria-label="Փակել մանրամասն դիտիչը" @click="close"><X :size="22" aria-hidden="true"/></button>
    </header>
    <div ref="viewport" class="viewer-stage" :class="{zoomed:zoom>1,dragging}" @wheel.prevent="wheel" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerEnd" @pointercancel="pointerEnd" @lostpointercapture="pointerEnd">
      <img v-if="!failed" :src="props.src" :alt="props.title" :style="imageStyle" draggable="false" decoding="async" @load="imageLoaded" @error="failed=true">
      <p v-if="failed" role="alert">Չհաջողվեց բեռնել նկարը։</p>
      <p v-else-if="!intrinsic.width" role="status">Նկարը բեռնվում է…</p>
    </div>
  </dialog>
</template>

<style scoped>
.image-viewer{box-sizing:border-box;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#10161f;color:#f3eee5}
.image-viewer[open]{display:grid;grid-template-rows:auto minmax(0,1fr)}
.image-viewer::backdrop{background:#10161f}
.viewer-header{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid #344153;background:#17212e}
.viewer-header h2{margin:0;font-size:clamp(15px,2.3vw,20px);line-height:1.25;overflow-wrap:anywhere}
.viewer-controls{display:flex;align-items:center;gap:4px}
.viewer-header button{display:grid;place-items:center;min-width:40px;min-height:40px;padding:4px;border:1px solid #56677c;border-radius:8px;background:#27384d;color:#f3eee5;font:inherit;cursor:pointer}
.viewer-header button:hover:not(:disabled){background:#394e67}
.viewer-header button:disabled{opacity:.5;cursor:default}
.viewer-header button:focus-visible{outline:2px solid #efd18b;outline-offset:2px}
.viewer-header .zoom-level{min-width:68px;font-variant-numeric:tabular-nums}
.viewer-stage{position:relative;display:grid;place-items:center;overflow:hidden;min-width:0;min-height:0;touch-action:none;overscroll-behavior:contain}
.viewer-stage.zoomed{cursor:grab}.viewer-stage.dragging.zoomed{cursor:grabbing}
.viewer-stage img{position:absolute;top:50%;left:50%;display:block;max-width:none;max-height:none;pointer-events:none;user-select:none}
.viewer-stage p{padding:16px;font-size:14px;text-align:center}
@media(max-width:430px){.viewer-header{grid-template-columns:minmax(0,1fr) auto;gap:7px;padding:8px}.viewer-controls{grid-column:1;grid-row:2}.viewer-close{grid-column:2;grid-row:1/3;align-self:start}}
</style>
