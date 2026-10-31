<script setup lang="ts">
import { subjects, questions } from '~/data/content'
import { cardTheme } from '~/data/cardThemes'

const encyclopediaCollections = [
  { id: 'bible', to: '/subjects/bible', name: 'Աստվածաշունչ', image: '/images/bible.jpg' },
  { id: 'people', to: '/subjects/people', name: 'Նշանավոր մարդիկ', image: '/images/historical_figures.jpg' },
]

const route = useRoute()
const searchQuery = ref(String(route.query.q || ''))

// Որոնումն այստեղ նախատեսված է միայն հանրագիտարանի բաժինների համար։
const filteredSubjects = computed(() => {
  const term = searchQuery.value.trim().toLocaleLowerCase('hy')
  return term ? subjects.filter(subject => subject.name.toLocaleLowerCase('hy').includes(term)) : subjects
})

const filteredCollections = computed(() => {
  const term = searchQuery.value.trim().toLocaleLowerCase('hy')
  return term ? encyclopediaCollections.filter(collection => collection.name.toLocaleLowerCase('hy').includes(term)) : encyclopediaCollections
})

// Each encyclopedia subject uses the original, text-free image supplied by the user.
const subjectImages: Record<string, string> = {
  chemistry: '/images/chemistry-art.jpg',
  physics: '/images/glowing_atomic.jpg',
  space: '/images/solar_system.jpg',
  history: '/images/history.jpg',
  nature: '/images/natural_science.jpg',
  technology: '/images/technology-art.jpg',
  art: '/images/art-art.jpg',
  biology: '/images/butterfly-poster.jpg',
  geography: '/images/geography-art.jpg',
  mathematics: '/images/mathematics-poster.jpg',
  linguistics: '/images/language.jpg',
  cinema: '/images/film.jpg',
  music: '/images/musical.jpg',
}

function imageForSubject(slug: string): string {
  return subjectImages[slug] || '/images/space-art.jpg'
}
</script>

<template>
  <main class="shell encyclopedia-page py-10">
    <header class="encyclopedia-heading">
      <p class="encyclopedia-eyebrow">FACTUM · ԳԻՏԵԼԻՔԻ ԱՇԽԱՐՀ</p>
      <h1 class="heading">Հանրագիտարան</h1>
      <p class="muted">{{ subjects.length + encyclopediaCollections.length }} բաժին · {{ questions.length }} նյութ։ Ընտրիր քեզ հետաքրքրող բնագավառը և բացահայտիր նոր գիտելիքներ։</p>
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
        <CardVideo v-if="subject.slug === 'music'" src="/videos/Instruments_floating_on_opera_stage_3e75357e.mp4" poster="/images/musical.jpg" />
        <CardVideo v-else-if="subject.slug === 'biology'" src="/videos/Glowing_butterfly_on_DNA_strand_929f84ef_t0-6.mp4" poster="/images/butterfly-poster.jpg" />
        <CardVideo v-else-if="subject.slug === 'mathematics'" src="/videos/Owl_blinking_on_stone_pedestal_ee98753c.mp4" poster="/images/mathematics-poster.jpg" />
        <CardVideo v-else-if="subject.slug === 'chemistry'" src="/videos/Molecular_structure_rotating_in_…_654c41f3.mp4" poster="/images/chemistry-art.jpg" />
        <CardVideo v-else-if="subject.slug === 'cinema'" src="/videos/Vintage_film_projector_turning_r…_eb957e93.mp4" poster="/images/film.jpg" />
        <CardVideo v-else-if="subject.slug === 'nature'" src="/videos/Deer_and_fox_in_landscape_d0932100.mp4" poster="/images/natural_science.jpg" />
        <CardVideo v-else-if="subject.slug === 'linguistics'" src="/videos/Magical_tree_sprouting_from_book_cd6c5146.mp4" poster="/images/language.jpg" />
        <CardVideo v-else-if="subject.slug === 'space'" src="/videos/Planets_orbit_the_sun_bd41aa81.mp4" poster="/images/solar_system.jpg" />
        <img
          v-else
          :src="imageForSubject(subject.slug)"
          :alt="subject.name"
          loading="lazy"
        >
        <span class="encyclopedia-tile-shade" aria-hidden="true" />
        <span class="encyclopedia-emblem" aria-hidden="true"><component :is="cardTheme(subject.slug).icon" :size="19" /></span>
        <span class="encyclopedia-tile-name">{{ subject.name }} · {{ questions.filter(item => item.subject === subject.slug).length }} նյութ <span aria-hidden="true">→</span></span>
      </NuxtLink>
      <!-- Հանրագիտարանի լրացուցիչ հավաքածուներ -->
      <NuxtLink
        v-for="collection in filteredCollections"
        :key="collection.to"
        :to="collection.to"
        class="encyclopedia-tile"
        :style="{ '--card-accent': cardTheme(collection.id).color }"
      >
        <img :src="collection.image" :alt="collection.name" loading="lazy">
        <span class="encyclopedia-tile-shade" aria-hidden="true" />
        <span class="encyclopedia-emblem" aria-hidden="true"><component :is="cardTheme(collection.id).icon" :size="19" /></span>
        <span class="encyclopedia-tile-name">{{ collection.name }} · {{ questions.filter(item => item.subject === collection.id).length }} նյութ <span aria-hidden="true">→</span></span>
      </NuxtLink>
    </div>

    <p v-if="searchQuery.trim() && !filteredSubjects.length && !filteredCollections.length" class="muted mt-8">
      Այդ անունով բաժին չի գտնվել։ Փորձիր, օրինակ՝ «Քիմիա» կամ «Ֆիզիկա»։
    </p>
  </main>
</template>
