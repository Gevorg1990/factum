<script setup lang="ts">
import { optimizedImage } from '~/data/optimizedImages'
import { subjects, questions } from '~/data/content'
import { cardTheme } from '~/data/cardThemes'

const encyclopediaCollections = [
  { id: 'bible', to: '/subjects/bible', name: 'Աստվածաշունչ', image: '/images/optimized/bible-b846c66c03.webp' },
  { id: 'people', to: '/subjects/people', name: 'Նշանավոր մարդիկ', image: '/images/optimized/historical_figures-c386436d70.webp' },
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
  chemistry: '/images/optimized/chemistry-art-68cb23965b.webp',
  physics: '/images/optimized/glowing_atomic-b2b2506372.webp',
  space: '/images/optimized/solar_system-2a149a2be2.webp',
  history: '/images/optimized/history-bc707c9d4b.webp',
  nature: '/images/optimized/natural_science-c20c5b483b.webp',
  technology: '/images/optimized/technology-art-1c0313cbd8.webp',
  art: '/images/optimized/art-art-46ce31606a.webp',
  biology: '/images/optimized/butterfly-poster-ba96016f61.webp',
  geography: '/images/optimized/geography-globe-4e2efb7e.webp',
  mathematics: '/images/optimized/mathematics-poster-a8b4f5a4be.webp',
  linguistics: '/images/optimized/language-1ebd4747fa.webp',
  cinema: '/images/optimized/film-f5f6a80113.webp',
  music: '/images/optimized/musical-81d16b4b01.webp',
}

function imageForSubject(slug: string): string {
  return subjectImages[slug] || '/images/optimized/space-art-2f2239150d.webp'
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
        <CardVideo v-if="subject.slug === 'music'" src="/videos/previews/Instruments_floating_on_opera_stage_3e75357e.mp4" poster="/images/optimized/video-first-frame-c6e2a98273d1.webp" />
        <CardVideo v-else-if="subject.slug === 'geography'" src="/videos/previews/Illuminated_globe_rotating_on_map_4e2efb7e.mp4" poster="/images/optimized/video-first-frame-4e9546a8ab01.webp" />
        <CardVideo v-else-if="subject.slug === 'art'" src="/videos/previews/Marble_bust_in_museum_hall_bb4b7a2b.mp4" poster="/images/optimized/video-first-frame-7eb352771065.webp" />
        <CardVideo v-else-if="subject.slug === 'physics'" src="/videos/previews/Glowing_atom_floating_in_space_12f9fd11.mp4" poster="/images/optimized/video-first-frame-e4e4972220ff.webp" />
        <CardVideo v-else-if="subject.slug === 'biology'" src="/videos/previews/Glowing_butterfly_on_DNA_strand_929f84ef_t0-6.mp4" poster="/images/optimized/video-first-frame-f09d43ca356a.webp" />
        <CardVideo v-else-if="subject.slug === 'mathematics'" src="/videos/previews/Owl_blinking_on_stone_pedestal_ee98753c.mp4" poster="/images/optimized/video-first-frame-5db14267bb82.webp" />
        <CardVideo v-else-if="subject.slug === 'chemistry'" src="/videos/previews/Molecular_structure_rotating_in_…_654c41f3.mp4" poster="/images/optimized/video-first-frame-93a6e86a6353.webp" />
        <CardVideo v-else-if="subject.slug === 'cinema'" src="/videos/previews/Vintage_film_projector_turning_r…_eb957e93.mp4" poster="/images/optimized/video-first-frame-650fb4c0e44b.webp" />
        <CardVideo v-else-if="subject.slug === 'nature'" src="/videos/previews/Deer_and_fox_in_landscape_d0932100.mp4" poster="/images/optimized/video-first-frame-697a147e83d9.webp" />
        <CardVideo v-else-if="subject.slug === 'history'" src="/videos/previews/Ancient_monuments_under_drifting…_8c16c027.mp4" poster="/images/optimized/video-first-frame-109d93bdc887.webp" />
        <CardVideo v-else-if="subject.slug === 'linguistics'" src="/videos/previews/Magical_tree_sprouting_from_book_4ffec4a6.mp4" poster="/images/optimized/video-first-frame-b36b975b4af1.webp" />
        <CardVideo v-else-if="subject.slug === 'technology'" src="/videos/previews/Cyberpunk_city_lights_at_night_6d880cd4.mp4" poster="/images/optimized/video-first-frame-c52d37ab7a2d.webp" />
        <CardVideo v-else-if="subject.slug === 'space'" src="/videos/previews/Planets_orbit_the_sun_bd41aa81.mp4" poster="/images/optimized/video-first-frame-dfd8d71721c8.webp" />
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
        <CardVideo v-if="collection.id === 'people'" src="/videos/previews/Historical_thinkers_against_cosm…_7be85a42.mp4" poster="/images/optimized/video-first-frame-91d65d13a4d6.webp" />
        <CardVideo v-else-if="collection.id === 'bible'" src="/videos/previews/Manuscript_page_turns_over_a45f134d.mp4" poster="/images/optimized/video-first-frame-5bbf5db1a9ad.webp" />
        <img v-else :src="optimizedImage(collection.image)" :alt="collection.name" loading="lazy">
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
