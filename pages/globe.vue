<script setup lang="ts">
import { Globe2, Mic } from 'lucide-vue-next'
const mapFocus = ref<{ code: string; requestId: number }>()
const mapReturnTarget = ref('capital-quiz-title')
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
function showOnMap(code: string, returnTarget = 'capital-quiz-title') {
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
      <a @click.prevent="scrollToSection('world-facts-title')" href="#world-facts-title" class="btn-secondary globe-game-link"><Globe2 :size="17" /> Աշխարհը՝ հարց ու պատասխանով</a>
      <a @click.prevent="scrollToSection('capital-quiz-title')" href="#capital-quiz-title" class="btn-secondary globe-game-link"><Mic :size="17" /> Փորձիր ձայնային խաղը</a>
      </div>
    </header>
    <ClientOnly>
      <div id="interactive-globe" class="globe-map-anchor"><InteractiveGlobe :focus-country="mapFocus" /></div>
      <a v-if="mapFocus" @click.prevent="scrollToSection(mapReturnTarget)" :href="`#${mapReturnTarget}`" class="btn-secondary globe-game-link">Վերադառնալ հարցին ↓</a>
      <template #fallback><div class="panel globe-placeholder" role="status">Բեռնում ենք երկրագունդը…</div></template>
    </ClientOnly>
    <WorldFacts @show-on-map="showOnMap($event, 'world-facts-title')" />
    <ClientOnly><CapitalVoiceQuiz @show-on-map="showOnMap" /></ClientOnly>
    <p class="globe-sources">Աղբյուրներ՝ <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · <a href="https://github.com/mledoze/countries" target="_blank" rel="noopener noreferrer">Countries</a></p>
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
.globe-heading-actions .globe-game-link { margin-top: 0; }
.globe-page :deep(#world-facts-title), .globe-page :deep(#capital-quiz-title) { scroll-margin-top: 24px; }
.globe-map-anchor { scroll-margin-top: 20px; }
.globe-placeholder { min-height: 420px; display: grid; place-items: center; color: #dfc38f; }
.globe-sources { margin-top: 20px; font-size: 11px; color: #91a5bf; }
.globe-sources a { color: #dfc38f; text-decoration: underline; text-underline-offset: 3px; }
</style>
