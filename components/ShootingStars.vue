<script setup lang="ts">
import {onMounted,onUnmounted,ref} from 'vue'
const streaks=ref<{id:number;left:number;top:number;angle:number;duration:number}[]>([])
let timer:ReturnType<typeof setInterval>|undefined
let seq=0
function shoot(){
 if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
 const id=++seq
 streaks.value.push({id,left:10+Math.random()*75,top:4+Math.random()*55,angle:25+Math.random()*35,duration:1.1+Math.random()*.8})
 setTimeout(()=>{streaks.value=streaks.value.filter(s=>s.id!==id)},2300)
}
onMounted(()=>{timer=setInterval(shoot,12000+Math.random()*9000);setTimeout(shoot,1600)})
onUnmounted(()=>{if(timer)clearInterval(timer)})
</script>
<template><div class="shooting-sky" aria-hidden="true"><span v-for="s in streaks" :key="s.id" class="meteor" :style="{left:s.left+'%',top:s.top+'%',transform:'rotate('+s.angle+'deg)',animationDuration:s.duration+'s'}"/></div></template>
