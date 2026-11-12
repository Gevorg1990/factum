<script setup lang="ts">
type District={name:string;path:string;label:number[]}
type DistrictMap={viewBox:string;source:string;credit:string;license:string;licenseUrl:string;boundaryYear:number;items:District[]}
const data=shallowRef<DistrictMap>(),selected=ref('Կենտրոն'),hovered=ref(''),error=ref(false)
const controller=new AbortController()
async function load(){error.value=false;try{data.value=await $fetch<DistrictMap>('/data/armenia/districts/yerevan-map.json',{signal:controller.signal})}catch{if(!controller.signal.aborted)error.value=true}}
onMounted(load)
onBeforeUnmount(()=>controller.abort())
</script>
<template>
 <div class="yerevan-districts">
  <header><div><small>ՄԱՅՐԱՔԱՂԱՔԻ ՔԱՐՏԵԶԸ</small><h3>Երևան</h3></div><span><strong>12</strong> վարչական շրջան</span></header>
  <template v-if="data">
   <svg :viewBox="data.viewBox" role="group" aria-label="Երևանի վարչական շրջանների ինտերակտիվ քարտեզ">
    <g v-for="(district,i) in data.items" :key="district.name" class="district" role="button" tabindex="0" :aria-label="district.name" :aria-pressed="selected===district.name" @click="selected=district.name" @keydown.enter.prevent="selected=district.name" @keydown.space.prevent="selected=district.name" @mouseenter="hovered=district.name" @mouseleave="hovered=''" @focus="hovered=district.name" @blur="hovered=''">
     <title>{{district.name}}</title><path :d="district.path" :fill="selected===district.name?'#c2a574':hovered===district.name?'#52717b':i%2?'#304c5b':'#3a5865'"/>
     <text :x="district.label[0]" :y="district.label[1]" :class="{'is-selected':selected===district.name}" text-anchor="middle" dominant-baseline="middle">{{i+1}}</text>
    </g>
   </svg>
   <div class="district-selection" aria-live="polite"><i/><strong>{{hovered||selected}}</strong><span>վարչական շրջան</span></div>
   <footer>Քարտեզ՝ <a :href="data.source" target="_blank" rel="noopener noreferrer">{{data.credit}}</a> · <a :href="data.licenseUrl" target="_blank" rel="noopener noreferrer">{{data.license}}</a> · {{data.boundaryYear}}<br>Գույներն ու նշումները հարմարեցված են FACTUM-ին։</footer>
  </template>
  <p v-else-if="error" role="alert">Քարտեզը չհաջողվեց բեռնել։ <button type="button" @click="load">Կրկին փորձել</button></p>
  <div v-else class="district-loading" role="status">Բեռնվում է Երևանի քարտեզը…</div>
 </div>
</template>
<style scoped>
.yerevan-districts{padding-top:25px;color:#b9c7d0}.yerevan-districts header{display:flex;align-items:center;justify-content:space-between;gap:15px}.yerevan-districts header small{font-size:8px;letter-spacing:1.5px;color:#8fa5b3}.yerevan-districts h3{font-size:28px;font-weight:450;color:#e1ccaa;margin:5px 0}.yerevan-districts header>span{font-size:9px;color:#93aab9}.yerevan-districts header strong{color:#d5bb8a;font-size:20px;font-weight:400;margin-right:5px}.yerevan-districts svg{display:block;width:100%;max-width:440px;max-height:390px;margin:12px auto;overflow:visible}.district{cursor:pointer;outline:none}.district path{stroke:#112737;stroke-width:2.5;stroke-linejoin:round;transition:fill .18s}.district:focus-visible path{stroke:#fff1cf;stroke-width:5}.district text{font-family:inherit;font-size:22px;fill:#e0e8e9;pointer-events:none;paint-order:stroke;stroke:#203744;stroke-width:3}.district text.is-selected{fill:#102536;stroke:#c2a574}.district-selection{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0 19px;min-height:32px}.district-selection i{width:5px;height:5px;border-radius:50%;background:#d5bb8a}.district-selection strong{font-size:15px;font-weight:450;color:#e0c99e}.district-selection>span{font-size:9px;color:#879eae}.yerevan-districts footer{font-size:8px;line-height:1.9;color:#718c9f;margin-top:17px}.yerevan-districts a{text-decoration:underline;text-underline-offset:3px}.district-loading{min-height:390px;display:grid;place-items:center;font-size:12px;color:#bda575}.yerevan-districts button:focus-visible,.yerevan-districts a:focus-visible{outline:2px solid #dac08a;outline-offset:2px}@media(max-width:480px){.district-selection{flex-wrap:wrap}.yerevan-districts svg{max-height:330px}.yerevan-districts header>span{font-size:8px}}
</style>
