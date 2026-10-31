<script setup lang="ts">
import { subjects, questions, collectionSubjects } from '~/data/content'

const route = useRoute()
const slug = String(route.params.slug)
const subject = [...subjects, ...collectionSubjects].find((item) => item.slug === slug)
const items = questions.filter((question) => question.subject === slug)
const { read, saved, markRead, toggleSaved } = useProgress()

const subjectImages: Record<string, string> = {
  bible: '/images/bible.jpg',
  people: '/images/historical_figures.jpg',
  chemistry: '/images/chemistry-art.jpg',
  physics: '/images/glowing_atomic.jpg',
  space: '/images/solar_system.jpg',
  history: '/images/history.jpg',
  nature: '/images/natural_science.jpg',
  technology: '/images/technology-art.jpg',
  art: '/images/art-art.jpg',
  biology: '/images/dna_strand.jpg',
  geography: '/images/geography-art.jpg',
  mathematics: '/images/logic-art.jpg',
  linguistics: '/images/language.jpg',
  cinema: '/images/film.jpg',
  music: '/images/musical.jpg',
}

const filter = ref('all')
const opened = ref<string[]>([])
const searchQuery = ref('')
const pageSize = 20
const limit = ref(pageSize)

const readCount = computed(() =>
  items.filter((question) => read.value.includes(question.id)).length
)

const progressPercent = computed(() =>
  items.length ? Math.round((readCount.value / items.length) * 100) : 0
)

const visible = computed(() =>
  items.filter((question) => {
    const term = searchQuery.value.trim().toLocaleLowerCase('hy')
    if (term && ![question.title, question.answer, question.detail, question.example || '', question.takeaway || '', ...(question.sections || []).flatMap(section => [section.title, section.text])].some(text => text.toLocaleLowerCase('hy').includes(term))) return false
    if (filter.value === 'read') return read.value.includes(question.id)
    if (filter.value === 'unread') return !read.value.includes(question.id)
    if (filter.value === 'saved') return saved.value.includes(question.id)
    return true
  })
)

const displayed = computed(() => visible.value.slice(0, limit.value))
watch([searchQuery, filter], () => { limit.value = pageSize }, { flush: 'sync' })

const filters = [
  { id: 'all', title: 'Բոլորը' },
  { id: 'unread', title: 'Չընթերցված' },
  { id: 'read', title: 'Ընթերցված' },
  { id: 'saved', title: 'Պահպանված' },
]

function toggleQuestion(id: string) {
  opened.value = opened.value.includes(id)
    ? opened.value.filter((item) => item !== id)
    : [...opened.value, id]
  markRead(id)
}
</script>

<template>
  <main class="shell page-with-back encyclopedia-page py-10">
    <NuxtLink to="/subjects" class="gold">← Բոլոր առարկաները</NuxtLink>

    <div class="encyclopedia-subject-hero mt-5">
      <img
        :src="subjectImages[slug] || '/images/space-art.jpg'"
        :alt="subject?.name || 'Առարկա'"
      >
      <div class="encyclopedia-subject-hero-content">
        <p class="encyclopedia-eyebrow">FACTUM · ՀԱՆՐԱԳԻՏԱՐԱՆ</p>
        <h1 class="heading">{{ subject?.name || 'Առարկա' }}</h1>
        <p>Ընթերցված՝ {{ readCount }} / {{ items.length }}</p>
      </div>
    </div>

    <p class="muted mb-4 mt-5">{{ items.length }} նյութ՝ բացատրություններով և օրինակներով։ Ընտրիր հարցը՝ կարճ պատասխանը տեսնելու համար։ Մանրամասն բացատրությունը՝ հարցի էջում։</p>

    <div class="h-2 rounded bg-slate-700 mb-6 overflow-hidden">
      <div class="h-full bg-amber-400" :style="{ width: `${progressPercent}%` }" />
    </div>

    <label class="sr-only" for="subject-search">Որոնել բաժնի նյութերում</label>
    <input id="subject-search" v-model="searchQuery" class="input mb-5" type="search" placeholder="Որոնել այս բաժնում...">

    <div class="flex gap-2 flex-wrap mb-5">
      <button
        v-for="option in filters"
        :key="option.id"
        :class="filter === option.id ? 'btn' : 'btn-secondary'"
        class="text-sm"
        @click="filter = option.id"
      >
        {{ option.title }}
      </button>
    </div>

    <p class="muted text-sm mb-4" role="status">Ցուցադրված է {{ displayed.length }} / {{ visible.length }} հարց</p>

    <div id="subject-questions">
    <div v-for="question in displayed" :key="question.id" class="panel p-5 mb-3">
      <div class="flex gap-3 justify-between">
        <button class="text-left flex-1 font-bold" :aria-expanded="opened.includes(question.id)" :aria-controls="`question-${question.id}`" @click="toggleQuestion(question.id)">
          <span :class="read.includes(question.id) ? 'text-green-400' : 'gold'">
            {{ read.includes(question.id) ? '✓' : '○' }}
          </span>
          {{ question.title }}
          <span class="muted text-xs">{{ opened.includes(question.id) ? '▲' : '▼' }}</span>
        </button>
        <button
          :aria-label="`Պահպանել ${question.title}`"
          class="gold"
          @click="toggleSaved(question.id, $event)"
        >
          {{ saved.includes(question.id) ? '★' : '☆' }}
        </button>
      </div>

      <div v-if="opened.includes(question.id)" :id="`question-${question.id}`" class="mt-4 border-t border-slate-700 pt-4">
        <p>{{ question.answer }}</p>
        <a v-if="question.source" :href="question.source.url" target="_blank" rel="noopener noreferrer" class="subject-source">Աղբյուր՝ {{ question.source.name }} ↗<span class="sr-only"> (բացվում է նոր ներդիրում)</span></a>
        <NuxtLink :to="`/articles/${question.id}`" class="gold inline-block mt-4 font-bold">
          Մանրամասն բացատրություն →
        </NuxtLink>
      </div>
    </div>

    </div>
    <div v-if="displayed.length < visible.length" class="flex justify-center mt-6">
      <button type="button" class="btn-secondary" aria-controls="subject-questions" @click="limit += pageSize">Բեռնել ավելին · {{ Math.min(pageSize, visible.length - displayed.length) }} հարց</button>
    </div>

    <p v-if="!visible.length" class="muted">
      Այս որոնմամբ կամ զտիչով նյութեր չեն գտնվել։ Փորձիր փոխել որոնումը կամ ընտրել «Բոլորը»։
    </p>
  </main>
</template>

<style scoped>
.subject-source { display: block; margin-top: 18px; font-size: 12px; color: #a8b8d4; text-decoration: underline; text-underline-offset: 3px; }
:global(html.factum-light) .subject-source { color: #4e6481; }
</style>
