<script setup lang="ts">
import { facts, factCategories } from '~/data/facts'
import type { FactCategoryId } from '~/data/facts'
import { Search, Sparkles } from 'lucide-vue-next'

const { saved, toggleSaved } = useProgress()
const route = useRoute()
const nuxtApp = useNuxtApp()
// A query left in the URL must not replay the destination after a reload.
const ignoreInitialFact = ref(nuxtApp.isHydrating)
onMounted(() => {
  if (!ignoreInitialFact.value || !('fact' in route.query)) return
  const { fact: _fact, ...query } = route.query
  void navigateTo({ path: route.path, query, hash: route.hash }, { replace: true })
})
watch(() => route.query.fact, () => { ignoreInitialFact.value = false }, { flush: 'sync' })
const selectedFactId = ref<string>()
let lastLinkedFactId: string | undefined
function clearFactHighlight() { selectedFactId.value = undefined }
const search = ref('')
const category = ref<FactCategoryId | 'all'>('all')
const pageSize = 24
const limit = ref(pageSize)
const categoryById = Object.fromEntries(factCategories.map(item => [item.id, item]))
const categoryCounts = Object.fromEntries(factCategories.map(item => [item.id, facts.filter(fact => fact.category === item.id).length]))
// Interleave topics so each group contributes one fact per round.
// A stable order keeps SSR, pagination and saved destinations consistent.
const factGroups = factCategories.map(item => facts.filter(fact => fact.category === item.id))
const mixedFacts = Array.from({ length: Math.max(0, ...factGroups.map(group => group.length)) }, (_, index) =>
  factGroups.flatMap(group => group[index] ? [group[index]!] : []),
).flat()
const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase('hy-AM').trim()
const filteredFacts = computed(() => {
  const term = normalize(search.value)
  return mixedFacts.filter(fact =>
    (category.value === 'all' || fact.category === category.value) &&
    (!term || normalize(`${fact.title} ${fact.text} ${categoryById[fact.category].name}`).includes(term)),
  )
})
const matchingCategories = computed(() => normalize(search.value)
  ? new Set(filteredFacts.value.map(fact => fact.category))
  : new Set<FactCategoryId>())
function highlightedParts(value: string) {
  const text = value.normalize('NFC')
  const term = normalize(search.value)
  if (!term) return [{ text, match: false }]
  const lower = text.toLocaleLowerCase('hy-AM')
  const parts: { text: string; match: boolean }[] = []
  let position = 0
  let index = lower.indexOf(term)
  while (index !== -1) {
    if (index > position) parts.push({ text: text.slice(position, index), match: false })
    parts.push({ text: text.slice(index, index + term.length), match: true })
    position = index + term.length
    index = lower.indexOf(term, position)
  }
  if (position < text.length) parts.push({ text: text.slice(position), match: false })
  return parts
}
const visibleFacts = computed(() => filteredFacts.value.slice(0, limit.value))
watch([search, category], () => { limit.value = pageSize }, { flush: 'sync' })
function resetFilters() { search.value = ''; category.value = 'all' }
const linkedFact = () => ignoreInitialFact.value ? undefined : facts.find(item => item.id === route.query.fact)
useHead({ title: 'Հետաքրքիր փաստեր — FACTUM', meta: [{ name: 'description', content: 'Բացահայտիր հետաքրքիր փաստեր՝ գիտության, բնության, պատմության և մշակույթի մասին։ Որոնիր և ընտրիր քեզ հետաքրքրող թեման։' }] })
useSavedScroll(
  () => linkedFact() ? `fact-${linkedFact()!.id}` : undefined,
  () => {
    const id = linkedFact()?.id
    if (id !== lastLinkedFactId) {
      selectedFactId.value = nuxtApp.isHydrating ? undefined : id
      lastLinkedFactId = id
    }
    resetFilters()
    const position = mixedFacts.findIndex(item => item.id === route.query.fact)
    limit.value = Math.max(pageSize, Math.ceil((position + 1) / pageSize) * pageSize)
  },
)
</script>

<template>
  <main class="shell py-10 facts-page" @click="clearFactHighlight" @input="clearFactHighlight" @keydown="clearFactHighlight">
    <header class="facts-intro">
      <p class="gold facts-eyebrow">FACTUM · ԱՄԵՆ ՕՐ ՄԻ ՆՈՐ ԲԱՑԱՀԱՅՏՈՒՄ</p>
      <h1 class="heading"><Sparkles :size="30" aria-hidden="true" /> Հետաքրքիր փաստեր</h1>
      <p class="muted">{{ facts.length }} փաստ · {{ factCategories.length }} թեմա։ Ընտրիր քեզ հետաքրքրող աշխարհը։</p>
    </header>
    <label class="facts-search">
      <Search :size="20" aria-hidden="true" />
      <span class="sr-only">Որոնել հետաքրքիր փաստերը</span>
      <input v-model="search" type="search" placeholder="Որոնիր՝ տիեզերք, ութոտնուկ, ԴՆԹ…">
    </label>
    <div class="facts-categories" role="group" aria-label="Փաստերի թեմաներ">
      <button type="button" :aria-pressed="category === 'all'" @click="category = 'all'">Բոլորը <span>{{ facts.length }}</span></button>
      <button v-for="item in factCategories" :key="item.id" type="button" :aria-pressed="category === item.id" :class="{ 'search-match': matchingCategories.has(item.id) }" @click="category = item.id">
        <span class="facts-topic-icon" aria-hidden="true"><span class="facts-topic-glyph">{{ item.symbol }}</span></span> {{ item.name }} <span v-if="matchingCategories.has(item.id)" class="match-label">✓ Գտնվել է</span> <span class="facts-category-count">{{ categoryCounts[item.id] }}</span>
      </button>
    </div>
    <p class="muted facts-result-count" role="status">Ցուցադրված է {{ visibleFacts.length }} / {{ filteredFacts.length }} փաստ</p>
    <div id="facts-list" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article v-for="fact in visibleFacts" :id="`fact-${fact.id}`" :key="fact.id" class="panel overflow-hidden saved-destination flex flex-col" :class="{ 'fact-selected': selectedFactId === fact.id }" tabindex="-1">
        <div class="p-6 flex flex-col flex-1">
          <p class="gold text-sm facts-category-label"><span class="facts-topic-icon facts-topic-icon-card" aria-hidden="true"><span class="facts-topic-glyph">{{ categoryById[fact.category].symbol }}</span></span> {{ categoryById[fact.category].name }}</p>
          <h2 class="text-xl font-bold mt-3"><template v-for="(part, index) in highlightedParts(fact.title)" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></h2>
          <p class="muted mt-4 mb-6 facts-text"><template v-for="(part, index) in highlightedParts(fact.text)" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
          <div class="mt-auto">
            <a :href="fact.source.url" target="_blank" rel="noopener noreferrer" class="facts-source">Աղբյուր՝ {{ fact.source.name }} <span aria-hidden="true">↗</span><span class="sr-only"> (բացվում է նոր ներդիրում)</span></a>
            <button type="button" class="btn-secondary mt-4" :aria-pressed="saved.includes(fact.id)" @click="toggleSaved(fact.id, $event)">{{ saved.includes(fact.id) ? '★ Պահպանված' : '☆ Պահպանել' }}</button>
          </div>
        </div>
      </article>
    </div>
    <div v-if="!filteredFacts.length" class="panel p-8 text-center">
      <p class="muted mb-4">Փաստ չի գտնվել։ Փորձիր այլ բառ կամ թեմա։</p>
      <button type="button" class="btn-secondary" @click="resetFilters">Մաքրել որոնումն ու ֆիլտրերը</button>
    </div>
    <div v-if="visibleFacts.length < filteredFacts.length" class="facts-load-more">
      <button type="button" class="btn-secondary" aria-controls="facts-list" @click="limit += pageSize">Բեռնել ավելին · {{ Math.min(pageSize, filteredFacts.length - visibleFacts.length) }} փաստ</button>
    </div>
  </main>
</template>

<style scoped>
.facts-intro { margin-bottom: 24px; }
.facts-intro h1 { display: flex; align-items: center; gap: 12px; }
.facts-intro h1 svg { color: #dfc38f; flex-shrink: 0; }
.facts-eyebrow { font-size: 10px; letter-spacing: 1.4px; margin-bottom: 12px; }
.facts-search { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid #8997c044; border-radius: 14px; color: #dfc38f; margin-bottom: 20px; }
.facts-search input { flex: 1; width: 100%; min-width: 0; background: transparent; color: inherit; outline: none; }
.facts-search:focus-within { outline: 2px solid #dfc38f; outline-offset: 3px; }
.facts-categories { display: flex; flex-wrap: wrap; gap: 8px; }
.facts-categories button { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #8997c044; border-radius: 20px; padding: 9px 13px; font-size: 12px; }
.facts-categories button[aria-pressed="true"] { color: #dfc38f; border-color: #dfc38f; background: #dfc38f18; }
.facts-categories button > .facts-category-count { opacity: .65; font-size: 11px; }
.facts-result-count { margin: 22px 0 16px; font-size: 13px; }
.facts-category-label { display: flex; align-items: center; gap: 12px; }
.facts-topic-icon { display: inline-grid; place-items: center; box-sizing: border-box; padding: 0; flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px; background: #dfc38f12; border: 1px solid #dfc38f26; font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; font-size: 24px; line-height: 1; }
.facts-topic-glyph { display: block; width: 1em; height: 1em; line-height: 1; text-align: center; font-weight: 400; font-style: normal; letter-spacing: 0; text-indent: 0; transform: translateY(.04em); }
.facts-topic-icon-card { width: 46px; height: 46px; border-radius: 13px; font-size: 30px; }
.facts-categories button[aria-pressed="true"] .facts-topic-icon { background: #dfc38f26; border-color: #dfc38f66; }
:global(html.factum-light) .facts-topic-icon { background: #a87e3a10; border-color: #a87e3a33; }
.facts-text { line-height: 1.9; }
.facts-source { display: block; font-size: 11px; line-height: 1.7; color: #a8b8d4; text-decoration: underline; text-underline-offset: 3px; }
.facts-load-more { display: flex; justify-content: center; margin-top: 28px; }
.facts-page :is(button,a):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
:global(html.factum-light) .facts-source { color: #4e6481; }
:global(html.factum-light) .facts-categories button[aria-pressed="true"] { color: #78501b; border-color: #a87e3a; }
@media(max-width:640px) { .facts-categories { gap: 6px; } .facts-categories button { padding: 8px 11px; } }
.facts-categories button.search-match { border-color: #65b7ce; background: #409fb51c; box-shadow: inset 0 0 0 1px #65b7ce55; }
.match-label { color: #85d7e8; font-size: 10px; }
.facts-page mark { color: #172033; background: #f0d18d; border-radius: 3px; padding: 0 2px; }
:global(html.factum-light) .match-label { color: #176074; }
:global(html.factum-light) .facts-categories button.search-match { border-color: #28798c; }
.facts-page .fact-selected { border-color: #dfc38f; box-shadow: 0 0 0 2px #dfc38f, 0 8px 30px #dfc38f22; scroll-margin-top: 110px; }
</style>

<style scoped>
.facts-categories button { transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease; }
.facts-topic-icon { transition: background-color .18s ease, border-color .18s ease; }
@media (hover: hover) {
  .facts-categories button:hover { border-color: #dfc38f99; background-color: #dfc38f18; box-shadow: 0 3px 12px #00000018; }
  .facts-categories button:hover .facts-topic-icon { background-color: #dfc38f2b; border-color: #dfc38f77; }
  :global(html.factum-light) .facts-categories button:hover { border-color: #a87e3a; background-color: #a87e3a16; }
  .facts-categories button.search-match:hover { border-color: #65b7ce; background-color: #409fb530; }
}
@media (prefers-reduced-motion: reduce) {
  .facts-categories button, .facts-topic-icon { transition: none; }
}
</style>
