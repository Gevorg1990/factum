<script setup lang="ts">
import { Globe2, Mic, Layers } from 'lucide-vue-next'
import '~/assets/css/geography.css'
import type {MapLocation} from '~/utils/geography/types'
import type { CountryFeature } from '~/utils/globe'
const mapFocus = ref<{ code: string; requestId: number }>()
const focusLocation=ref<MapLocation>()
const mapTask=ref<{label:string}|null>(null)
const mapAnswer=ref<{code:string;requestId:number}>()
const mapAnswerPending=ref(false)
let mapReturnTimer:ReturnType<typeof setTimeout>|undefined
function cancelMapReturn(){if(mapReturnTimer!==undefined)clearTimeout(mapReturnTimer);mapReturnTimer=undefined;mapAnswerPending.value=false}
function answerCountry(code:string){
  if(!mapTask.value||mapAnswerPending.value)return
  mapAnswerPending.value=true
  mapAnswer.value={code,requestId:(mapAnswer.value?.requestId||0)+1}
  const returnDelay=window.matchMedia('(max-width: 900px), (pointer: coarse)').matches?1000:2000
  mapReturnTimer=setTimeout(()=>{mapReturnTimer=undefined;mapAnswerPending.value=false;scrollToSection('globe-games')},returnDelay)
}
onBeforeUnmount(cancelMapReturn)
watch(mapTask,task=>{if(task)cancelMapReturn()})
async function locate(location:MapLocation){if(mode.value!=='globe'){mode.value='globe';await nextTick()}focusLocation.value={...location,requestId:(focusLocation.value?.requestId||0)+1};scrollToSection('interactive-globe')}
const mapReturnTarget = ref('capital-quiz-title')
const mode = ref<'globe' | 'interior'>('globe')
const globeView = ref<{ getSurfaceFeatures: () => CountryFeature[] } | null>(null)
const surfaceFeatures = computed(() => globeView.value?.getSurfaceFeatures() || [])
async function setMode(value: 'globe' | 'interior') {
  mode.value = value
  if(value==='interior'){cancelMapReturn();mapTask.value=null}
  await nextTick()
  const target = document.getElementById(value === 'interior' ? 'earth-interior' : 'interactive-globe')
  target?.focus({ preventScroll: true })
}
function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  })
  target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}
async function showOnMap(code: string, returnTarget = 'capital-quiz-title') {
  if (mode.value !== 'globe') { mode.value = 'globe'; await nextTick() }
  mapReturnTarget.value = returnTarget
  mapFocus.value = { code, requestId: (mapFocus.value?.requestId ?? 0) + 1 }
  scrollToSection(returnTarget === 'globe-games' || !window.matchMedia('(max-width: 900px)').matches ? 'interactive-globe' : 'globe-country-info')
}
useHead({ title: 'Երկրագունդ — FACTUM', meta: [{ name: 'description', content: 'Պտտիր ինտերակտիվ երկրագունդը, բացահայտիր երկրները, մայրաքաղաքները և աշխարհամասերը։' }] })
</script>

<template>
  <main class="shell globe-page">
    <header class="globe-heading">
      <p class="gold">FACTUM · ԲԱՑԱՀԱՅՏԻՐ ԱՇԽԱՐՀԸ</p>
      <h1 class="heading"><Globe2 :size="32" /> Երկրագունդ</h1>
      <p class="muted">Պտտիր աշխարհը և բացահայտիր երկրները՝ մեկ հպումով։</p>
      <div class="globe-heading-actions">
      <button v-if="mode === 'globe'" type="button" class="btn-secondary globe-game-link globe-interior-button" @click="setMode('interior')"><Layers :size="17" /> Երկրի խորքերը · 3D</button>
      <a v-show="mode === 'globe'" href="#globe-atlas" class="btn-secondary globe-game-link" @click.prevent="scrollToSection('globe-atlas')">Աշխարհագրական հանրագիտարան ↓</a>
      <a v-show="mode === 'globe'" @click.prevent="scrollToSection('world-facts-title')" href="#world-facts-title" class="btn-secondary globe-game-link"><Globe2 :size="17" /> Աշխարհը՝ հարց ու պատասխանով</a>
      <a v-show="mode === 'globe'" @click.prevent="scrollToSection('globe-knowledge')" href="#globe-knowledge" class="btn-secondary globe-game-link"><Mic :size="17" /> Փորձիր քո գիտելիքները</a>
      </div>
    </header>
    <div v-show="mode === 'globe'">
    <ClientOnly>
      <p v-if="mapTask" class="panel map-game-prompt" role="status">{{mapTask.label}} <button type="button" @click="scrollToSection('globe-games')">Վերադառնալ խաղին ↓</button></p>
      <div id="interactive-globe" tabindex="-1" class="globe-map-anchor"><InteractiveGlobe ref="globeView" :focus-country="mapFocus" :focus-location="focusLocation" :map-quiz="!!mapTask" :selection-locked="mapAnswerPending" @country-selected="answerCountry" /></div>
      <a v-if="mapFocus" @click.prevent="scrollToSection(mapReturnTarget)" :href="`#${mapReturnTarget}`" class="btn-secondary globe-game-link">Վերադառնալ հարցին ↓</a>
      <template #fallback><div class="panel globe-placeholder" role="status">Բեռնում ենք երկրագունդը…</div></template>
    </ClientOnly>
    <ClientOnly><LazyGlobeAtlas @locate="locate"/></ClientOnly>
    <WorldFacts @show-on-map="showOnMap($event, 'world-facts-title')" />
    <ClientOnly><LazyGlobeGames :paused="mode !== 'globe'" :map-answer="mapAnswer" @map-task="mapTask=$event" @map-visit="scrollToSection('interactive-globe')" @map-reveal="showOnMap($event, 'globe-games')" @show-on-map="showOnMap" /></ClientOnly>
    <p class="globe-sources">Աղբյուրներ՝ <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · <a href="https://github.com/mledoze/countries" target="_blank" rel="noopener noreferrer">Countries</a></p>
    </div>
    <div v-if="mode === 'interior'" id="earth-interior" tabindex="-1">
      <ClientOnly><Suspense><LazyEarthInteriorExplorer :surface-features="surfaceFeatures" @back="setMode('globe')"/><template #fallback><div class="panel globe-placeholder" role="status">Բեռնում ենք Երկրի խորքերը…</div></template></Suspense></ClientOnly>
    </div>
  </main>
</template>

<style scoped>
.globe-heading { margin-bottom: 28px; }
.globe-heading > .gold { font-size: 10px; letter-spacing: 2px; margin-bottom: 14px; }
.globe-heading h1 { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.globe-heading h1 svg { color: #dfc38f; }
.globe-heading > .muted { font-size: 14px; line-height: 1.8; }
.globe-game-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 18px; font-size: 12px; }
.globe-heading-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
.globe-heading-actions .globe-game-link { margin-top: 0; min-height: 44px; }
.globe-interior-button { border-color: #dfc38f88; color: #f1d9ae; background: #dfc38f0c; }
.globe-interior-button:focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
.globe-page :deep(#world-facts-title), .globe-page :deep(#capital-quiz-title) { scroll-margin-top: 24px; }
.globe-map-anchor { scroll-margin-top: 20px; }
.globe-placeholder { min-height: 420px; display: grid; place-items: center; color: #dfc38f; }
.globe-sources { margin-top: 20px; font-size: 11px; color: #91a5bf; }
.globe-sources a { color: #dfc38f; text-decoration: underline; text-underline-offset: 3px; }
.map-game-prompt{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:18px;margin-bottom:18px;color:#dfc38f;font-size:14px;position:sticky;top:12px;z-index:5}.map-game-prompt button{font-size:11px;min-height:44px;text-decoration:underline}
</style>
