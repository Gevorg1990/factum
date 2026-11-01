<script setup lang="ts">
import { getSearchTerms } from '~/utils/searchTerms'
import { getSearchSubject } from '~/utils/searchSubjects'
import type { SearchResult } from '~/utils/searchRecords'

interface HighlightPart {
  text: string
  matched: boolean
}

const route = useRoute()
const term = ref(String(route.query.q || ''))
const query = ref(String(route.query.q || ''))

const { data, pending, error } = await useFetch<{ items: SearchResult[] }>(
  '/api/search',
  { key: 'factum-search-results-v2', query: { q: query }, watch: [query] },
)

const results = computed(() => (data.value?.items ?? []).map(item => ({
  ...item, subject: item.subject ?? getSearchSubject(item.url),
})))

/**
 * Splits text into safe Vue text nodes and highlighted matches.
 * We intentionally avoid v-html so search results are never treated as HTML.
 */
function highlightedParts(text: string): HighlightPart[] {
  const value = String(text || '')
  const terms = getSearchTerms(query.value)
  if (!terms.length) return [{ text: value, matched: false }]

  // Escape regex metacharacters supplied by the user.
  const escaped = terms
    .sort((a, b) => b.length - a.length)
    .map(word => [...word].map(char => '\\^$.*+?()[]{}|'.includes(char) ? `\\${char}` : char).join(''))
  const matcher = new RegExp(`(${escaped.join('|')})`, 'giu')
  const parts: HighlightPart[] = []
  let cursor = 0

  for (const match of value.matchAll(matcher)) {
    const index = match.index ?? 0
    if (index > cursor) {
      parts.push({ text: value.slice(cursor, index), matched: false })
    }
    parts.push({ text: match[0], matched: true })
    cursor = index + match[0].length
  }

  if (cursor < value.length) {
    parts.push({ text: value.slice(cursor), matched: false })
  }
  return parts.length ? parts : [{ text: value, matched: false }]
}

function submit() {
  query.value = term.value.trim()
  navigateTo({ path: '/search', query: { q: query.value } })
}

watch(() => route.query.q, value => {
  query.value = String(value || '')
  term.value = query.value
})
</script>

<template>
  <main class="shell py-10 max-w-5xl">
    <h1 class="heading">Որոնում FACTUM-ում</h1>

    <form class="flex gap-3 mb-7" @submit.prevent="submit">
      <input
        v-model="term"
        class="input"
        placeholder="Ի՞նչ ես ուզում իմանալ"
        aria-label="Որոնման տեքստ"
      >
      <button class="btn" type="submit">Որոնել</button>
    </form>

    <p class="muted text-sm mb-5">
      Սկզբում որոնում ենք կայքի հարցերում, մարդկանց, պատմության, փաստերի և գրքերի մեջ։
    </p>

    <p v-if="pending" class="muted">Որոնում...</p>
    <p v-else-if="error" class="muted">Որոնման ժամանակ սխալ է առաջացել։</p>

    <template v-else>
      <h2 class="text-xl font-bold mb-4">
        {{ data?.items?.length ? 'Գտնված նյութեր' : 'Նյութեր չեն գտնվել' }}
      </h2>

      <div
        v-for="(item, index) in results"
        :key="`${item.url}-${index}`"
        class="panel p-5 mb-3"
      >
        <div class="gold text-xs flex flex-wrap items-center gap-2">
          <span>{{ item.kind }}</span>
          <template v-if="item.subject">
            <span aria-hidden="true">·</span>
            <NuxtLink :to="item.subject.url" class="hover:underline">{{ item.subject.name }}</NuxtLink>
          </template>
        </div>

        <NuxtLink
          :to="item.url"
          class="block text-lg font-bold hover:text-amber-300 mt-1"
        >
          <template v-for="(part, partIndex) in highlightedParts(item.title)" :key="partIndex">
            <mark v-if="part.matched" class="search-match">{{ part.text }}</mark>
            <template v-else>{{ part.text }}</template>
          </template>
          →
        </NuxtLink>

        <p class="muted text-sm mt-2">
          <template v-for="(part, partIndex) in highlightedParts(item.description)" :key="partIndex">
            <mark v-if="part.matched" class="search-match">{{ part.text }}</mark>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
      </div>

      <div v-if="query.trim() && !data?.items?.length" class="panel p-6">
        <p>FACTUM-ի նյութերում այս հարցմամբ պատասխան չգտնվեց։ Փորձիր այլ բառերով որոնել։</p>
      </div>
    </template>
  </main>
</template>
