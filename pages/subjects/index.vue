<script setup lang="ts">
import { categoryMedia,type EncyclopediaCategory } from '~/utils/categoryMedia'
import { subjects as legacySubjects, collectionSubjects } from '~/data/content'
import { cardTheme } from '~/data/cardThemes'

const subjects = await usePublishedContent<EncyclopediaCategory>('CATEGORY',[...legacySubjects,...collectionSubjects.map(item=>({...item,img:item.slug}))])
const {data:articleCounts}=await useFetch<Record<string,number>>('/api/category-counts',{key:'category-counts'})
const articleTotal=computed(()=>Object.values(articleCounts.value||{}).reduce((sum,count)=>sum+count,0))
const route = useRoute()
const searchQuery = ref(String(route.query.q || ''))

// Որոնումն այստեղ նախատեսված է միայն հանրագիտարանի բաժինների համար։
const filteredSubjects = computed(() => {
  const term = searchQuery.value.trim().toLocaleLowerCase('hy')
  return term ? subjects.filter(subject => subject.name.toLocaleLowerCase('hy').includes(term)) : subjects
})

// Each encyclopedia subject uses the original, text-free image supplied by the user.
const subjectImages: Record<string, string> = {
  bible:'/images/optimized/bible-b846c66c03.webp',
  people:'/images/optimized/historical_figures-c386436d70.webp',
  chemistry: '/images/optimized/chemistry-art-68cb23965b.webp',
  physics: '/images/optimized/glowing_atomic-b2b2506372.webp',
  space: '/images/optimized/solar_system-2a149a2be2.webp',
  history: '/images/optimized/history-bc707c9d4b.webp',
  nature: '/images/optimized/natural_science-c20c5b483b.webp',
  technology: '/images/optimized/technology-art-1c0313cbd8.webp',
  biology: '/images/optimized/butterfly-poster-ba96016f61.webp',
  geography: '/images/optimized/geography-globe-4e2efb7e.webp',
  mathematics: '/images/optimized/mathematics-poster-a8b4f5a4be.webp',
  linguistics: '/images/optimized/language-1ebd4747fa.webp',
  cinema: '/images/optimized/film-f5f6a80113.webp',
  music: '/images/optimized/musical-81d16b4b01.webp',
  literature: '/images/optimized/literature-library-9cd74fda.webp',
  health: '/images/optimized/health-anatomy-a5d93967.webp',
  finance: '/images/optimized/finance-coins-2a9c80b1.webp',
}

const subjectBySlug=computed(()=>new Map(subjects.map(subject=>[subject.slug,subject])))
function customImage(slug:string){return subjectBySlug.value.get(slug)?.image}
function imageForSubject(slug: string): string {
  return customImage(slug) || subjectImages[slug] || '/images/optimized/space-art-2f2239150d.webp'
}
</script>

<template>
  <main class="shell encyclopedia-page py-10">
    <header class="encyclopedia-heading">
      <p class="encyclopedia-eyebrow">COGNITIO · ԳԻՏԵԼԻՔԻ ԱՇԽԱՐՀ</p>
      <h1 class="heading">Հանրագիտարան</h1>
      <p class="muted">{{ subjects.length }} բաժին · {{ articleTotal }} նյութ։ Ընտրիր քեզ հետաքրքրող բնագավառը և բացահայտիր նոր գիտելիքներ։</p>
    </header>

    <label class="sr-only" for="encyclopedia-search">Որոնիր բաժինները</label>
    <input
      id="encyclopedia-search"
      v-model="searchQuery"
      class="input mb-7 encyclopedia-search"
      placeholder="Որոնիր բաժինները..."
      type="search"
    >

    <div class="encyclopedia-grid">
      <NuxtLink
        v-for="subject in filteredSubjects"
        :key="subject.slug"
        :to="`/subjects/${subject.slug}`"
        class="encyclopedia-tile"
        :style="{ '--card-accent': cardTheme(subject.slug).color }"
      >
        <CardVideo v-if="categoryMedia(subject,imageForSubject(subject.slug)).video" :src="categoryMedia(subject,imageForSubject(subject.slug)).video" :poster="categoryMedia(subject,imageForSubject(subject.slug)).poster" />
        <img v-else :src="imageForSubject(subject.slug)" :alt="subject.name" loading="lazy" decoding="async" width="640" height="360">
        <span class="encyclopedia-tile-shade" aria-hidden="true" />
        <span class="encyclopedia-emblem" aria-hidden="true"><component :is="cardTheme(subject.slug).icon" :size="19" /></span>
        <span class="encyclopedia-tile-name"><span>{{ subject.shortName || subject.name }} · {{ articleCounts?.[subject.slug]||0 }} նյութ</span><span aria-hidden="true">→</span></span>
      </NuxtLink>

    </div>

    <p v-if="searchQuery.trim() && !filteredSubjects.length" class="muted mt-8">
      Այդ անունով բաժին չի գտնվել։ Փորձիր, օրինակ՝ «Քիմիա» կամ «Ֆիզիկա»։
    </p>
  </main>
</template>
