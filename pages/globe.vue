<script setup lang="ts">
import { Globe2, Mic, Layers } from 'lucide-vue-next'
import type { CountryFeature } from '~/utils/globe'
const mapFocus = ref<{ code: string; requestId: number }>()
const mapReturnTarget = ref('capital-quiz-title')
const mode = ref<'globe' | 'interior'>('globe')
const globeView = ref<{ getSurfaceFeatures: () => CountryFeature[] } | null>(null)
const surfaceFeatures = computed(() => globeView.value?.getSurfaceFeatures() || [])
async function setMode(value: 'globe' | 'interior') {
  mode.value = value
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
  scrollToSection(window.matchMedia('(max-width: 900px)').matches ? 'globe-country-info' : 'interactive-globe')
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
      <a v-show="mode === 'globe'" @click.prevent="scrollToSection('world-facts-title')" href="#world-facts-title" class="btn-secondary globe-game-link"><Globe2 :size="17" /> Աշխարհը՝ հարց ու պատասխանով</a>
      <a v-show="mode === 'globe'" @click.prevent="scrollToSection('capital-quiz-title')" href="#capital-quiz-title" class="btn-secondary globe-game-link"><Mic :size="17" /> Փորձիր ձայնային խաղը</a>
      </div>
    </header>
    <div v-show="mode === 'globe'">
    <ClientOnly>
      <div id="interactive-globe" tabindex="-1" class="globe-map-anchor"><InteractiveGlobe ref="globeView" :focus-country="mapFocus" /></div>
      <a v-if="mapFocus" @click.prevent="scrollToSection(mapReturnTarget)" :href="`#${mapReturnTarget}`" class="btn-secondary globe-game-link">Վերադառնալ հարցին ↓</a>
      <template #fallback><div class="panel globe-placeholder" role="status">Բեռնում ենք երկրագունդը…</div></template>
    </ClientOnly>
    <WorldFacts @show-on-map="showOnMap($event, 'world-facts-title')" />
    <ClientOnly><CapitalVoiceQuiz :paused="mode !== 'globe'" @show-on-map="showOnMap" /></ClientOnly>
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
</style>
