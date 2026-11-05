<script setup lang="ts">
import type {GeoFact,MapLocation} from '~/utils/geography/types'
import {shuffled} from '~/utils/geography/core'
const emit=defineEmits<{locate:[location:MapLocation]}>()
const route=useRoute()
const {saved,toggleSaved}=useProgress()
const {data:facts,error,refresh}=await useFetch<GeoFact[]>('/data/geography/facts-v1.json',{server:false,default:()=>[]})
const category=ref('all'),index=ref(0),order=ref<GeoFact[]>([])
const visibleFacts=computed(()=>facts.value.filter(f=>!['Երկրներ','Մայրաքաղաքներ'].includes(f.category)))
const categories=computed(()=>[...new Set(visibleFacts.value.map(f=>f.category))])
watch([facts,category,()=>route.query.fact],()=>{const filtered=visibleFacts.value.filter(f=>category.value==='all'||f.category===category.value);order.value=shuffled(filtered);index.value=0;const id=typeof route.query.fact==='string'?route.query.fact:'';const match=order.value.findIndex(f=>f.id===id);if(match>=0)index.value=match},{immediate:true})
const fact=computed(()=>order.value[index.value])
function next(){if(!order.value.length)return;if(index.value+1<order.value.length)index.value++;else{const previous=fact.value?.id;order.value=shuffled(order.value);if(order.value.length>1&&order.value[0]?.id===previous)[order.value[0],order.value[1]]=[order.value[1]!,order.value[0]!];index.value=0}}
</script>
<template><section id="globe-facts" class="geo-section" aria-labelledby="geo-facts-title"><header><p class="geo-kicker">ՓՈՔՐ ԲԱՑԱՀԱՅՏՈՒՄՆԵՐ · ՄԵԾ ԱՇԽԱՐՀ</p><h2 id="geo-facts-title">Գիտեի՞ր, որ…</h2><p>{{visibleFacts.length}} աղբյուրավորված փաստ՝ աշխարհագրությունից, օվկիանոսներից ու բնության աշխարհից։</p></header><label>Ընտրիր թեման<select v-model="category"><option value="all">Բոլոր թեմաները</option><option v-for="c in categories" :key="c" :value="c">{{c}}</option></select></label><p v-if="error" role="alert">Փաստերը չբեռնվեցին։ <button class="geo-button" @click="refresh()">Կրկին փորձել</button></p><article v-if="fact" class="panel geo-card fact-feature" aria-live="polite"><span class="geo-kicker">{{fact.category}}</span><h3>{{fact.title}}</h3><p>{{fact.detail}}</p><a class="geo-source" :href="fact.source.url" target="_blank" rel="noopener noreferrer">{{fact.source.name}} ↗</a><div class="geo-actions"><button class="geo-button" @click="next">Հաջորդ փաստը →</button><button v-if="fact.coordinates" class="geo-button" @click="emit('locate',{coordinates:fact.coordinates,label:fact.title})">Ցույց տալ քարտեզի վրա</button><button class="geo-button" :aria-pressed="saved.includes(`geo-${fact.id}`)" @click="toggleSaved(`geo-${fact.id}`,$event)">{{saved.includes(`geo-${fact.id}`)?'Պահպանված է Իմ FACTUM-ում':'Պահպանել Իմ FACTUM-ում'}}</button></div><p class="geo-note">{{index+1}} / {{order.length}} · փաստերը չեն կրկնվում մինչև հերթականության ավարտը։</p></article></section></template>
<style scoped>.fact-feature{margin-top:20px;background:radial-gradient(ellipse at 95% 0,#37667c33,transparent 65%),#0e1a2e}.fact-feature h3{font-size:22px;margin:18px 0}.fact-feature>p{max-width:85ch;margin-bottom:18px}</style>
