<script setup lang="ts">
import { Search, MapPin, ArrowUpRight, Globe2, ChevronDown, ChevronUp } from 'lucide-vue-next'
const emit = defineEmits<{ showOnMap: [code: string] }>()
const { estimates: populationEstimates } = usePopulationEstimates()
const search=ref(''),category=ref('all')
const {items,categories,total,pending,error,hasMore,load}=useGeographyContent('world-facts',{query:search,category,limit:6})
const worldFactCategories=computed(()=>Object.fromEntries(categories.value.map(item=>[item.id,item.title])))
const visible=computed(()=>items.value.map(fact=>{const population=populationEstimates.value.IND;if(!fact.livePopulation||fact.id!=='most-populous-country'||!population)return fact;return {...fact,answer:`Հնդկաստանը՝ մոտ ${Math.round(population.value/1_000_000).toLocaleString('hy-AM')} միլիոն մարդ՝ ${population.year} թ. գնահատմամբ։`,detail:`${population.source.name} աղբյուրի ${population.year} թվականի տվյալներում Հնդկաստանի բնակչությունը գնահատվում է ${population.value.toLocaleString('hy-AM')} մարդ։ Սա տվյալ տարվա գնահատական է․ բնակչության թիվը փոխվում է, իսկ նոր գնահատումները կարող են վերանայվել։`,source:population.source,dataYear:population.year}}))
</script>

<template>
  <section class="world-facts" aria-labelledby="world-facts-title">
    <header class="facts-heading">
      <p class="gold">ԱՇԽԱՐՀԸ՝ ՀԱՐՑ ՈՒ ՊԱՏԱՍԽԱՆՈՎ</p>
      <h2 id="world-facts-title"><Globe2 :size="25" /> Բացահայտիր աշխարհը</h2>
      <p class="muted">Երկրներ, բնակչություն և մոլորակի ռեկորդներ։ Գտիր պատասխանը և իմացիր ավելին։</p>
    </header>
    <label class="facts-search"><Search :size="18" aria-hidden="true" /><span class="sr-only">Որոնել աշխարհի մասին հարցերը</span><input v-model="search" type="search" placeholder="Օրինակ՝ բնակչություն, ամենամեծ, օվկիանոս…" /></label>
    <div class="facts-filters" role="group" aria-label="Հարցերի թեմաներ">
      <button type="button" :aria-pressed="category === 'all'" @click="category = 'all'">Բոլորը</button>
      <button v-for="(label,key) in worldFactCategories" :key="key" type="button" :aria-pressed="category === key" @click="category = String(key)">{{label}}</button>
    </div>
    <p class="facts-count muted" role="status">{{visible.length}} / {{total}} հարց</p>
    <div id="world-facts-list" class="facts-grid">
      <article v-for="fact in visible" :key="fact.id" class="panel fact-card">
        <div class="fact-meta"><span>{{worldFactCategories[fact.category]}}</span><span v-if="fact.dataYear">{{fact.dataYear}} թ.</span></div>
        <h3>{{fact.question}}</h3>
        <p class="fact-answer">{{fact.answer}}</p>
        <details><summary>Մանրամասն</summary><p>{{fact.detail}}</p></details>
        <footer>
          <button v-if="fact.countryCode" type="button" @click="emit('showOnMap',fact.countryCode)"><MapPin :size="14" /> Ցույց տալ քարտեզի վրա</button>
          <a :href="fact.source.url" target="_blank" rel="noopener noreferrer">{{fact.source.name}} <ArrowUpRight :size="13" /></a>
        </footer>
      </article>
    </div>
    <p v-if="pending" role="status">Բեռնվում են հարցերը…</p><p v-if="error" role="alert">{{error}} <button type="button" @click="load()">Կրկին փորձել</button></p>
    <div v-if="hasMore" class="facts-toggle"><button type="button" class="btn-secondary" :disabled="pending" @click="load(true)">Հաջորդ 6 հարցերը <ChevronDown :size="17"/></button></div>
    <p v-if="!pending&&!error&&!visible.length" class="panel facts-empty">Հարց չի գտնվել։ <button type="button" @click="search='';category='all'">Մաքրել որոնումը</button></p>
  </section>
</template>

<style scoped>
.world-facts { margin: 44px 0; scroll-margin-top: 24px; }
.facts-heading > .gold { font-size: 10px; letter-spacing: 1.5px; }
.facts-heading h2 { display: flex; align-items: center; gap: 10px; margin: 12px 0; font-size: clamp(22px,3vw,30px); font-weight: 750; }
.facts-heading h2 svg { color: #dfc38f; }
.facts-heading > .muted { font-size: 13px; line-height: 1.9; }
.facts-search { display: flex; align-items: center; gap: 10px; margin: 22px 0 14px; padding: 13px 16px; border: 1px solid #8997c044; border-radius: 12px; color: #dfc38f; }
.facts-search input { width: 100%; min-width: 0; background: transparent; color: inherit; outline: none; font-size: 13px; }
.facts-search:focus-within { outline: 2px solid #dfc38f; outline-offset: 2px; }
.facts-filters { display: flex; flex-wrap: wrap; gap: 8px; }
.facts-filters button { border: 1px solid #8997c033; border-radius: 20px; padding: 8px 14px; font-size: 12px; }
.facts-filters button[aria-pressed="true"] { border-color: #dfc38f; background: #dfc38f18; color: #dfc38f; }
.facts-count { margin: 14px 0; font-size: 11px; }
.facts-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
.facts-toggle { display: flex; justify-content: center; margin-top: 20px; }
.facts-toggle button { display: inline-flex; align-items: center; gap: 10px; }
.fact-card { display: flex; flex-direction: column; padding: 22px; min-width: 0; }
.fact-meta { display: flex; justify-content: space-between; gap: 12px; color: #91a5bf; font-size: 10px; }
.fact-card h3 { margin: 14px 0 10px; font-size: 16px; font-weight: 700; line-height: 1.7; }
.fact-answer { color: #dfc38f; font-size: 17px; line-height: 1.9; }
.fact-card details { margin: 16px 0; font-size: 12px; line-height: 1.9; }
.fact-card summary { cursor: pointer; color: #aabbd2; }
.fact-card details p { margin-top: 10px; }
.fact-card footer { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: auto; padding-top: 14px; border-top: 1px solid #8997c022; }
.fact-card footer :is(button,a) { display: inline-flex; align-items: center; gap: 5px; color: #dfc38f; font-size: 10px; }
.fact-card footer a { margin-left: auto; text-decoration: underline; text-underline-offset: 3px; }
.facts-empty { padding: 24px; font-size: 13px; }
.facts-empty button { color: #dfc38f; text-decoration: underline; }
.world-facts :is(button,a,summary):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
@media(max-width:640px) { .facts-grid { grid-template-columns: 1fr; } .fact-card { padding: 18px; } }
</style>
