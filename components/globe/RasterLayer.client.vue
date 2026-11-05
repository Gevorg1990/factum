<script setup lang="ts">
import type {GlobeProjection} from '~/utils/globe'
const props=defineProps<{projection:GlobeProjection;rotation:[number,number,number];zoom:number;mode:'night'}>()
const emit=defineEmits<{error:[]}>()
const canvas=ref<HTMLCanvasElement|null>(null)
let source:ImageData|undefined,frame=0,generation=0,disposed=false
const size=280
function draw(){
 frame=0
 const context=canvas.value?.getContext('2d');if(!context||!source||disposed)return
 const projection=props.projection.rotate(props.rotation).scale(270*props.zoom),result=context.createImageData(size,size),src=source.data,w=source.width,h=source.height
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const sx=x/size*680,sy=y/size*680
  if(Math.hypot(sx-340,sy-340)>270*props.zoom)continue
  const point=projection.invert([sx,sy]);if(!point||!point.every(Number.isFinite))continue
  const u=Math.min(w-1,Math.max(0,Math.floor((point[0]+180)/360*w))),v=Math.min(h-1,Math.max(0,Math.floor((90-point[1])/180*h)))
  const from=(v*w+u)*4,to=(y*size+x)*4
  result.data[to]=src[from]!;result.data[to+1]=src[from+1]!;result.data[to+2]=src[from+2]!;// Show only the light signal over the same vector countries; omit the image's land/ocean backdrop.
  const luminance=src[from]!*0.2126+src[from+1]!*0.7152+src[from+2]!*0.0722
  result.data[to+3]=Math.round(255*Math.max(0,Math.min(1,(luminance-35)/110)))
 }
 context.putImageData(result,0,0)
}
function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(draw)}
function load(){const version=++generation;source=undefined;canvas.value?.getContext('2d')?.clearRect(0,0,size,size);const image=new Image();image.onload=()=>{if(disposed||version!==generation)return;const buffer=document.createElement('canvas');buffer.width=image.width;buffer.height=image.height;const ctx=buffer.getContext('2d');if(!ctx){emit('error');return}try{ctx.drawImage(image,0,0);source=ctx.getImageData(0,0,image.width,image.height);schedule()}catch{emit('error')}};image.onerror=()=>{if(!disposed&&version===generation)emit('error')};image.src='/images/geography/earth-night-v1.jpg'}
onMounted(load)
watch(()=>props.mode,load)
watch([()=>props.rotation,()=>props.zoom],schedule)
onBeforeUnmount(()=>{disposed=true;generation++;cancelAnimationFrame(frame);source=undefined})
</script>
<template><canvas ref="canvas" :width="size" :height="size" aria-hidden="true" :style="{clipPath:`circle(${270*zoom/680*100}% at 50% 50%)`}" class="globe-raster"/></template>
<style scoped>.globe-raster{position:absolute;inset:0;z-index:2;mix-blend-mode:screen;display:block;width:100%;height:100%;pointer-events:none;animation:raster-in .3s ease}@keyframes raster-in{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.globe-raster{animation:none}}</style>
