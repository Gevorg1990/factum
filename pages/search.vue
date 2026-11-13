<script setup lang="ts">
import { highlightedParts } from '~/utils/searchHighlight'
import { getSearchSubject } from '~/utils/searchSubjects'
import type { SearchResult } from '~/utils/searchRecords'

const route = useRoute()
const term = ref(String(route.query.q || ''))
const query = computed(() => String(route.query.q || ''))
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1'), 10) || 1))

const { data, pending, error } = await useFetch<{ items: SearchResult[]; total: number }>(
  '/api/search',
  { key: 'factum-search-results-v3', query: { q: query, offset: computed(() => (page.value - 1) * 20), limit: 20 }, watch: [query, page] },
)

const results = computed(() => (data.value?.items ?? []).map(item => ({
  ...item, subject: item.subject ?? getSearchSubject(item.url),
})))

function submit() {
  navigateTo({ path: '/search', query: { q: term.value.trim() } })
}

watch(() => route.query.q, value => {
  term.value = String(value || '')
})
</script>

<template>
  <main class="shell py-10 max-w-5xl">
    <h1 class="heading">Որոնում COGNITIO-ում</h1>

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
          <template v-for="(part, partIndex) in highlightedParts(item.title, query)" :key="partIndex">
            <mark v-if="part.matched" class="search-match">{{ part.text }}</mark>
            <template v-else>{{ part.text }}</template>
          </template>
          →
        </NuxtLink>

        <p class="muted text-sm mt-2">
          <template v-for="(part, partIndex) in highlightedParts(item.description, query)" :key="partIndex">
            <mark v-if="part.matched" class="search-match">{{ part.text }}</mark>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
      </div>

      <nav v-if="data?.total && data.total > 20" class="search-pagination" aria-label="Որոնման էջեր">
        <NuxtLink v-if="page > 1" :to="{path:'/search',query:{q:query,page:page-1}}">← Նախորդը</NuxtLink>
        <span>Էջ {{ page }} / {{ Math.ceil(data.total / 20) }} · {{ data.total }} արդյունք</span>
        <NuxtLink v-if="page * 20 < data.total" :to="{path:'/search',query:{q:query,page:page+1}}">Հաջորդը →</NuxtLink>
      </nav>

      <div v-if="query.trim() && !data?.items?.length" class="panel p-6">
        <p>COGNITIO-ի նյութերում այս հարցմամբ պատասխան չգտնվեց։ Փորձիր այլ բառերով որոնել։</p>
      </div>
    </template>
  </main>
</template>

<style scoped>
.search-pagination { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; margin:24px 0; font-size:13px; color:#a9bbd4; }
.search-pagination a { color:#f4c46c; border:1px solid #f4c46c88; border-radius:10px; padding:9px 13px; }
.search-pagination a:hover,.search-pagination a:focus-visible { border-color:#f4c46c; outline:none; }
</style>
