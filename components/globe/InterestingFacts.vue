<script setup lang="ts">
import type {GeoFact,MapLocation} from '~/utils/geography/types'
const emit=defineEmits<{locate:[location:MapLocation]}>()
const route=useRoute(),{saved,toggleSaved}=useProgress()
const category=ref('all'),index=ref(0),factId=ref(typeof route.query.fact==='string'?route.query.fact:'')
const {items:facts,categories,total,pending,error,hasMore,load}=useGeographyContent('facts',{category,id:factId,limit:6})
watch(()=>route.query.fact,value=>{factId.value=typeof value==='string'?value:'';index.value=0})
watch(category,()=>{factId.value='';index.value=0})
const fact=computed(()=>facts.value[index.value])
async function next(){if(factId.value){factId.value='';index.value=0;return}if(index.value+1>=facts.value.length&&hasMore.value)await load(true);index.value=index.value+1<facts.value.length?index.value+1:0}
</script>
<template><section id="globe-facts" class="geo-section" aria-labelledby="geo-facts-title"><header><p class="geo-kicker">ՓՈՔՐ ԲԱՑԱՀԱՅՏՈՒՄՆԵՐ · ՄԵԾ ԱՇԽԱՐՀ</p><h2 id="geo-facts-title">Գիտեի՞ր, որ…</h2><p>{{total}} աղբյուրավորված փաստ՝ աշխարհագրությունից, օվկիանոսներից ու բնության աշխարհից։</p></header><label>Ընտրիր թեման<select v-model="category"><option value="all">Բոլոր թեմաները</option><option v-for="c in categories" :key="c.id" :value="c.id">{{c.title}}</option></select></label><p v-if="error" role="alert">Փաստերը չբեռնվեցին։ <button class="geo-button" @click="load()">Կրկին փորձել</button></p><article v-if="fact" class="panel geo-card fact-feature" aria-live="polite"><span class="geo-kicker">{{fact.categoryName}}</span><h3>{{fact.title}}</h3><p>{{fact.detail}}</p><a class="geo-source" :href="fact.source.url" target="_blank" rel="noopener noreferrer">{{fact.source.name}} ↗</a><div class="geo-actions"><button class="geo-button" :disabled="pending" @click="next">Հաջորդ փաստը →</button><button v-if="fact.coordinates" class="geo-button" @click="emit('locate',{coordinates:fact.coordinates,label:fact.title})">Ցույց տալ քարտեզի վրա</button><button class="geo-button" :aria-pressed="saved.includes(`geo-${fact.id}`)" @click="toggleSaved(`geo-${fact.id}`,$event)">{{saved.includes(`geo-${fact.id}`)?'Պահպանված է Իմ FACTUM-ում':'Պահպանել Իմ FACTUM-ում'}}</button></div><p class="geo-note">{{index+1}} / {{total}} · փաստերը չեն կրկնվում մինչև հերթականության ավարտը։</p></article></section></template>
<style scoped>.fact-feature{margin-top:20px;background:radial-gradient(ellipse at 95% 0,#37667c33,transparent 65%),#0e1a2e}.fact-feature h3{font-size:22px;margin:18px 0}.fact-feature>p{max-width:85ch;margin-bottom:18px}</style>
