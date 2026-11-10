<script setup lang="ts">
import { timeline as legacyTimeline } from '~/data/content'
import { historyDetails as legacyHistoryDetails } from '~/data/historyDetails'

const timeline = await usePublishedContent('EVENT', legacyTimeline)
const historyDetails = computed(() => Object.fromEntries(timeline.map(event => [event.year, (event as typeof event & {details?:unknown}).details || legacyHistoryDetails[event.year]])) as typeof legacyHistoryDetails)
const route = useRoute()
const nuxtApp = useNuxtApp()
const era = ref('Բոլորը')
const eras = ['Բոլորը', ...new Set(timeline.map(item => item.era))]
function yearOrder(value: string) {
  const number = Number(value.match(/\d+/)?.[0] || 0)
  return value.startsWith('մ.թ.ա.') ? -number : number
}
const sortedTimeline = computed(() => [...timeline].sort((a, b) => yearOrder(a.year) - yearOrder(b.year)))
const shown = computed(() => sortedTimeline.value.filter(item => era.value === 'Բոլորը' || item.era === era.value))
const expanded = ref<string[]>([])

function eventId(year: string) {
  return `event-${year.replace(/[^\p{L}\p{N}]+/gu, '-')}`
}
function toggle(year: string) {
  expanded.value = expanded.value.includes(year)
    ? expanded.value.filter(item => item !== year)
    : [...expanded.value, year]
}
let scrollFrame = 0
let scrollVersion = 0
async function jumpToEvent() {
  const version = ++scrollVersion
  cancelAnimationFrame(scrollFrame)
  const year = typeof route.query.event === 'string' ? route.query.event : ''
  if (!year || !timeline.some(item => item.year === year)) return
  era.value = 'Բոլորը'
  if (!expanded.value.includes(year)) expanded.value.push(year)
  await nextTick()
  if (version !== scrollVersion) return
  // Wait for page rendering and the router's initial scroll reset to finish.
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = requestAnimationFrame(() => {
      if (version !== scrollVersion) return
      document.getElementById(eventId(year))?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  })
}
onMounted(jumpToEvent)
const removePageFinishHook = nuxtApp.hook('page:finish', jumpToEvent)
watch(() => route.query.event, jumpToEvent, { flush: 'post' })
onBeforeUnmount(() => {
  scrollVersion++
  cancelAnimationFrame(scrollFrame)
  removePageFinishHook()
})
</script>

<template>
  <main class="shell py-10">
    <h1 class="heading">🇦🇲 Հայոց պատմություն · Ժամանակագիծ</h1>
    <p class="muted mb-6">Ուսումնասիրիր {{ timeline.length }} պատմական իրադարձություն՝ հնագույն շրջանից մինչև նորագույն ժամանակներ։ Ընտրիր դարաշրջանը և բացիր իրադարձության պատմությունն ու հետաքրքիր փաստերը։</p>
    <div class="flex flex-wrap gap-2 mb-7">
      <button v-for="item in eras" :key="item" :aria-pressed="era === item" class="btn-secondary history-era text-sm" @click="era = item">{{ item }}</button>
    </div>
    <div class="border-l-2 border-amber-400/50 ml-4">
      <article v-for="event in shown" :id="eventId(event.year)" :key="event.year" class="history-detail-entry relative ml-7 mb-4 panel p-5" :class="{ 'history-detail-entry-open': expanded.includes(event.year) }">
        <span class="absolute -left-[39px] top-6 bg-amber-400 w-4 h-4 rounded-full"></span>
        <button class="history-detail-toggle" type="button" :aria-expanded="expanded.includes(event.year)" @click="toggle(event.year)">
          <span class="gold font-bold">{{ event.year }}</span>
          <span class="history-detail-heading">{{ event.title }}</span>
          <span class="muted text-sm">{{ event.era }}</span>
          <span class="gold text-sm mt-2">{{ expanded.includes(event.year) ? 'Փակել մանրամասները ↑' : 'Կարդալ ավելին ↓' }}</span>
        </button>
        <div v-if="expanded.includes(event.year)" class="history-detail-content">
          <template v-if="historyDetails[event.year]">
            <p class="history-detail-intro">{{ historyDetails[event.year].intro }}</p>
            <section v-for="section in historyDetails[event.year].sections" :key="section.heading" class="history-detail-section">
              <h3>{{ section.heading }}</h3>
              <p>{{ section.body }}</p>
            </section>
            <div class="history-detail-facts">
              <h3>Հետաքրքիր փաստեր</h3>
              <ul><li v-for="fact in historyDetails[event.year].facts" :key="fact">{{ fact }}</li></ul>
            </div>
          </template>
          <p v-else class="muted">{{ event.title }}՝ {{ event.era.toLowerCase() }} պատմության կարևոր իրադարձություններից։ Մանրամասն հոդվածը պատրաստման փուլում է։</p>
        </div>
      </article>
    </div>
    <p class="muted text-xs mt-6">Պատմական թվագրությունները որոշ դեպքերում ավանդական կամ մոտավոր են։</p>
  <CatalogMore :items="timeline" kind="EVENT" />
  </main>
</template>

<style scoped>
.history-era { font-weight: 400; background-color: transparent; }
.history-era[aria-pressed="true"] { color: #071327; background-color: #f4c46c; border-color: #f4c46c; }
.history-era:not([aria-pressed="true"]):hover { background-color: #f4c46c26; border-color: #ffe2a2; box-shadow: 0 3px 12px #f4c46c26; }
.history-era:focus-visible { outline: 2px solid #f4c46c; outline-offset: 3px; }
</style>
