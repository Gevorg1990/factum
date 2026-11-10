<script setup lang="ts">
import { optimizedImage } from '~/data/optimizedImages'
import { subjects, collectionSubjects, armenianPeople, timeline, facts, questions } from '~/data/content'
import { armenianPortraits } from '~/data/personPortraits'
import { selectHomeFacts } from '~/utils/homeFacts'
import { cardTheme, gameAccents } from '~/data/cardThemes'
import { ArrowRight, Sparkles, BookOpen, CircleHelp, Brain, Users, Globe2, ChevronRight, ChevronLeft } from 'lucide-vue-next'
const search=ref('')
const personIndex=ref(0)
const peopleReady = ref(false)
function timelineYear(value: string) {
  const year = Number(value.match(/\d+/)?.[0] || 0)
  return value.startsWith('մ.թ.ա.') ? -year : year
}
const homeTimeline = [...timeline].sort((a,b) => timelineYear(a.year) - timelineYear(b.year))
const popularIndex=ref(0)
// Use the same visible question catalog as site search.
const suggestedQuestions = subjects.flatMap(subject => {
  const question = questions.filter(item => item.subject === subject.slug)
    .sort((a, b) => a.title.length - b.title.length)[0]
  return question ? [question.title] : []
}).slice(0, 12)
const popularSets = Array.from({ length: Math.ceil(suggestedQuestions.length / 4) },
  (_, index) => suggestedQuestions.slice(index * 4, index * 4 + 4))
// Հետաքրքիր փաստերի ցուցադրություն։ Ընտրությունը կատարվում է միայն client-ում,
// որպեսզի Nuxt SSR hydration-ի ժամանակ HTML-ը չտարբերվի։
const homeFacts = ref(facts.slice(0, 5))
const featuredFactIndex = ref(0)
const featuredFact = computed(() => homeFacts.value[featuredFactIndex.value] ?? facts[0]!)

function refreshHomeFacts() {
  let previousIds = homeFacts.value.map(fact => fact.id)
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('factum-home-facts') || 'null')
    if (Array.isArray(stored)) previousIds = stored.filter((id): id is string => typeof id === 'string')
  } catch { /* Use the current selection when storage is unavailable. */ }
  homeFacts.value = selectHomeFacts(facts, previousIds)
  featuredFactIndex.value = 0
  try {
    sessionStorage.setItem('factum-home-facts', JSON.stringify(homeFacts.value.map(fact => fact.id)))
  } catch { /* The selection also refreshes without browser storage. */ }
}

function nextFact(direction: number) {
  if (!homeFacts.value.length) return
  featuredFactIndex.value = (featuredFactIndex.value + direction + homeFacts.value.length) % homeFacts.value.length
}

const popularQuestions=computed(()=>popularSets[popularIndex.value])
function rotateHighlights(){
  refreshHomeFacts()
  popularIndex.value=(popularIndex.value+1)%popularSets.length
  personIndex.value=(personIndex.value+1)%featuredPeople.value.length
}
let rotationTimer: ReturnType<typeof setInterval> | undefined
onMounted(()=>{
  shuffleSubjects()
  refreshHomeFacts()
  // Client-only random start avoids SSR hydration mismatch.
  popularIndex.value=Math.floor(Math.random()*popularSets.length)
  refreshHomePeople()
  peopleReady.value = true
  rotationTimer=setInterval(rotateHighlights,60000)
})
onUnmounted(()=>{if(rotationTimer)clearInterval(rotationTimer)})
const allFeaturedPeople=armenianPeople.map(p => ({
  ...p,
  img: armenianPortraits[p.id]
}))
const featuredPeople = ref(allFeaturedPeople.slice(0, 5))
function refreshHomePeople() {
  const shuffled = [...allFeaturedPeople]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  featuredPeople.value = shuffled.slice(0, 5)
  personIndex.value = 0
}
const chosenPerson=computed(()=>featuredPeople.value[personIndex.value])
// Հանրագիտարանի բոլոր հասանելի բաժինները ցուցադրել պատահական հերթականությամբ։
// Խառնումը կատարվում է client-ում՝ hydration mismatch-ից խուսափելու համար։
const subjectImages: Record<string, string> = {
  bible: '/images/optimized/bible-b846c66c03.webp',
  people: '/images/optimized/historical_figures-c386436d70.webp',
  nature: '/images/optimized/natural_science-c20c5b483b.webp',
  history: '/images/optimized/history-bc707c9d4b.webp',
  space: '/images/optimized/solar_system-2a149a2be2.webp',
  physics: '/images/optimized/glowing_atomic-b2b2506372.webp',
  biology: '/images/optimized/butterfly-poster-ba96016f61.webp',
  mathematics: '/images/optimized/mathematics-poster-a8b4f5a4be.webp',
  linguistics: '/images/optimized/language-1ebd4747fa.webp',
  cinema: '/images/optimized/film-f5f6a80113.webp',
  music: '/images/optimized/musical-81d16b4b01.webp',
  literature: '/images/optimized/literature-library-9cd74fda.webp',
  health: '/images/optimized/health-anatomy-a5d93967.webp',
  finance: '/images/optimized/finance-coins-2a9c80b1.webp',
}
const homeSubjects = [...subjects, ...collectionSubjects.map(subject => ({ ...subject, img: subject.slug }))]
const homeSubjectLimit = 16
const subjectOrder = ref(homeSubjects.slice(0, homeSubjectLimit).map(subject => subject.slug))
function shuffleSubjects() {
  const shuffled = homeSubjects.map(subject => subject.slug)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  const selection = shuffled.slice(0, homeSubjectLimit)
  // Avoid repeating the same visible set of cards on consecutive refreshes.
  try {
    const selectionKey = (slugs: string[]) => [...slugs].sort().join(',')
    const previous = sessionStorage.getItem('factum-home-subjects')
    if (selection.length > 1 && selectionKey(selection) === previous) {
      const swapIndex = shuffled.length > homeSubjectLimit ? homeSubjectLimit : 1
      ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[0]!]
    }
    sessionStorage.setItem('factum-home-subjects', selectionKey(shuffled.slice(0, homeSubjectLimit)))
  } catch { /* Random selection also works when browser storage is unavailable. */ }
  subjectOrder.value = shuffled.slice(0, homeSubjectLimit)
}
const tiles = computed(() => subjectOrder.value.map(slug => homeSubjects.find(subject => subject.slug === slug)!).map(subject => ({
  ...subject,
  img: optimizedImage(subjectImages[subject.slug] ?? `/images/${subject.img}-art.jpg`),
  icon: cardTheme(subject.slug).icon,
  label: ('shortName' in subject && typeof subject.shortName==='string' ? subject.shortName : undefined) || subject.name,
  accent: cardTheme(subject.slug).color,
})))
const games=[{id:'million',name:'FACTUM Million',desc:'15 հարց՝ 5 հեշտ ու հումորային, 5 միջին և 5 շատ բարդ։',button:'Խաղալ',tone:'gold'},{id:'genius',name:'FACTUM Genius',desc:'Հեշտ, միջին և դժվար մակարդակներ․ հաջորդը բացվում է հաջող ավարտից հետո։',button:'Խաղալ',tone:'blue'},{id:'logic',name:'FACTUM Logic',desc:'Երեք բարդության մակարդակ՝ նոր գլուխկոտրուկներով ու հաջորդական բացմամբ։',button:'Խաղալ',tone:'purple'}]
function goSearch(){if(search.value.trim())navigateTo('/search?q='+encodeURIComponent(search.value.trim()))}
function nextPerson(dir:number){personIndex.value=(personIndex.value+dir+featuredPeople.value.length)%featuredPeople.value.length}
</script>
<template><main class="factum-home">
<div class="home-cosmic-backdrop" aria-hidden="true"></div>
<section class="cosmic-hero"><div class="shell hero-content"><div class="hero-copy"><h1><span>Աշխարհն ավելի հետաքրքիր է,</span><br/>քան պատկերացնում ես</h1><p>Հարցրու, բացահայտիր, սովորիր և փորձիր քո գիտելիքները։</p><HomeSearch v-model="search" @submit="goSearch" /><div class="quick-queries"><span>Հանրաճանաչ հարցեր՝</span><button v-for="q in popularQuestions" :key="q" @click="search=q;goSearch()">{{q}}</button></div></div><blockquote class="hero-quote">«Գիտելիքը ճանապարհ է,<br/> որը երբեք չի ավարտվում»</blockquote></div></section>
<div class="shell home-content"><section class="subject-section" aria-labelledby="home-encyclopedia-title"><div class="section-title"><h2 id="home-encyclopedia-title"><NuxtLink prefetch-on="interaction" to="/subjects" class="encyclopedia-heading-link"><BookOpen :size="23" /> Հանրագիտարան <ArrowRight :size="19" /></NuxtLink></h2></div><div class="home-subject-grid"><NuxtLink prefetch-on="interaction" v-for="s in tiles" :key="s.slug" :to="'/subjects/'+s.slug" class="subject-tile" :style="{ '--card-accent': s.accent }"><CardVideo v-if="s.slug === 'music'" src="/videos/previews/Instruments_floating_on_opera_stage_3e75357e.mp4" poster="/images/optimized/video-first-frame-c6e2a98273d1.webp" /><CardVideo v-else-if="s.slug === 'geography'" src="/videos/previews/Illuminated_globe_rotating_on_map_4e2efb7e.mp4" poster="/images/optimized/video-first-frame-4e9546a8ab01.webp" /><CardVideo v-else-if="s.slug === 'physics'" src="/videos/previews/Glowing_atom_floating_in_space_12f9fd11.mp4" poster="/images/optimized/video-first-frame-e4e4972220ff.webp" /><CardVideo v-else-if="s.slug === 'biology'" src="/videos/previews/Glowing_butterfly_on_DNA_strand_929f84ef_t0-6.mp4" poster="/images/optimized/video-first-frame-f09d43ca356a.webp" /><CardVideo v-else-if="s.slug === 'mathematics'" src="/videos/previews/Owl_blinking_on_stone_pedestal_ee98753c.mp4" poster="/images/optimized/video-first-frame-5db14267bb82.webp" /><CardVideo v-else-if="s.slug === 'chemistry'" src="/videos/previews/Molecular_structure_rotating_in_…_654c41f3.mp4" poster="/images/optimized/video-first-frame-93a6e86a6353.webp" /><CardVideo v-else-if="s.slug === 'cinema'" src="/videos/previews/Vintage_film_projector_turning_r…_eb957e93.mp4" poster="/images/optimized/video-first-frame-650fb4c0e44b.webp" /><CardVideo v-else-if="s.slug === 'nature'" src="/videos/previews/Deer_and_fox_in_landscape_d0932100.mp4" poster="/images/optimized/video-first-frame-697a147e83d9.webp" /><CardVideo v-else-if="s.slug === 'bible'" src="/videos/previews/Manuscript_page_turns_over_a45f134d.mp4" poster="/images/optimized/video-first-frame-5bbf5db1a9ad.webp" /><CardVideo v-else-if="s.slug === 'people'" src="/videos/previews/Historical_thinkers_against_cosm…_7be85a42.mp4" poster="/images/optimized/video-first-frame-91d65d13a4d6.webp" /><CardVideo v-else-if="s.slug === 'history'" src="/videos/previews/Ancient_monuments_under_drifting…_8c16c027.mp4" poster="/images/optimized/video-first-frame-109d93bdc887.webp" /><CardVideo v-else-if="s.slug === 'linguistics'" src="/videos/previews/Magical_tree_sprouting_from_book_4ffec4a6.mp4" poster="/images/optimized/video-first-frame-b36b975b4af1.webp" /><CardVideo v-else-if="s.slug === 'technology'" src="/videos/previews/Cyberpunk_city_lights_at_night_6d880cd4.mp4" poster="/images/optimized/video-first-frame-c52d37ab7a2d.webp" /><CardVideo v-else-if="s.slug === 'space'" src="/videos/previews/Solar_system_planets_orbiting_sun_d14eb8ab.mp4" poster="/images/optimized/space-video-first-frame.webp" /><CardVideo v-else-if="s.slug === 'finance'" src="/videos/previews/Brass_scales_book_coins_abacus_db917ecf.mp4" poster="/images/optimized/finance-video-first-frame.webp" /><CardVideo v-else-if="s.slug === 'health'" src="/videos/previews/Holographic_human_body_and_DNA_270d202e.mp4" poster="/images/optimized/health-video-first-frame.webp" /><CardVideo v-else-if="s.slug === 'literature'" src="/videos/previews/Magical_figures_emerge_from_book_f81aa87e.mp4" poster="/images/optimized/literature-video-first-frame.webp" /><img v-else :src="s.img" :alt="s.name" loading="lazy"/><span class="subject-emblem" aria-hidden="true"><component :is="s.icon" :size="17" :stroke-width="1.9" /></span><strong :title="s.name">{{s.label}}</strong></NuxtLink></div></section>
<section class="games-section"><div class="section-title"><h2><Sparkles :size="24"/> Փորձիր քո գիտելիքները</h2></div><div class="games-grid"><NuxtLink prefetch-on="interaction" v-for="g in games" :key="g.id" :to="'/games/'+g.id" class="game-card" :class="'game-'+g.tone" :style="{ '--card-accent': gameAccents[g.id] }"><img :src="optimizedImage('/images/'+g.id+'-art.jpg')" :alt="g.name"/><div class="game-copy"><h3>{{g.name}}</h3><p>{{g.desc}}</p><span class="game-play">{{g.button}} <ArrowRight :size="17"/></span></div></NuxtLink></div></section>
<section class="discovery-grid"><div class="discovery-column">
  <div class="section-title">
    <h2><NuxtLink prefetch-on="interaction" to="/facts" class="encyclopedia-heading-link"><Sparkles :size="22" /> Հետաքրքիր փաստեր <ArrowRight :size="18" /></NuxtLink></h2>
  </div>
  <article class="discovery-card fact-highlight">
    <img src="/images/Earth_floating_with_digital_netw…_f11676c3.jpg" alt="Երկիր մոլորակը՝ թվային ցանցի կապերով" width="1376" height="768" decoding="async" />
    <div class="discovery-copy">
      <span class="fact-eyebrow">FACTUM · Գիտե՞ս, որ...</span>
      <h3>{{ featuredFact.title }}</h3>
      <p :title="featuredFact.text">{{ featuredFact.text }}</p>
    </div>
    <NuxtLink prefetch-on="interaction" :to="{ path: '/facts', query: { fact: featuredFact.id } }" class="fact-read-more" :aria-label="`Կարդալ ավելին․ ${featuredFact.title}`">Կարդալ ավելին <ArrowRight :size="15" aria-hidden="true" /></NuxtLink>
    <div class="person-controls fact-controls" role="group" aria-label="Փաստերի հերթափոխում">
      <button type="button" aria-label="Նախորդ փաստը" :disabled="homeFacts.length < 2" @click="nextFact(-1)"><ChevronLeft :size="18" /></button>
      <span class="muted text-xs" aria-live="polite">{{ featuredFactIndex + 1 }} / {{ homeFacts.length }}</span>
      <button type="button" aria-label="Հաջորդ փաստը" :disabled="homeFacts.length < 2" @click="nextFact(1)"><ChevronRight :size="18" /></button>
    </div>
  </article>
</div><div class="history-column"><div class="section-title"><h2><NuxtLink prefetch-on="interaction" to="/history" class="encyclopedia-heading-link">✦ Հայոց պատմություն <ArrowRight :size="18" /></NuxtLink></h2></div><article class="history-card"><div class="history-scroll" tabindex="0" role="region" aria-label="Հայոց պատմության ժամանակագրություն"><div class="history-track"><NuxtLink prefetch-on="interaction" v-for="e in homeTimeline" :key="e.year" :to="{ path: '/history', query: { event: e.year } }" class="history-entry"><span class="history-year">{{e.year}}</span><div class="history-event"><strong>{{e.title}}</strong><small>{{e.era}}</small></div></NuxtLink></div></div></article></div><div class="people-column"><div class="section-title"><h2><NuxtLink prefetch-on="interaction" to="/people" class="encyclopedia-heading-link">✦ Հայ հայտնիներ <ArrowRight :size="18" /></NuxtLink></h2></div><article class="people-card" :aria-busy="!peopleReady"><div v-if="peopleReady" class="person-feature"><div class="person-photo"><PersonPortrait :key="chosenPerson.id" :person="{ ...chosenPerson, portrait: chosenPerson.img }" size="large"/></div><div class="person-description"><h3>{{chosenPerson.name}}</h3><small>{{chosenPerson.years}} · {{chosenPerson.role}}</small><p>{{chosenPerson.bio}}</p><NuxtLink prefetch-on="interaction" :to="`/people/${chosenPerson.id}`">Կարդալ ավելին <ArrowRight :size="15"/></NuxtLink></div></div><div v-else class="person-feature person-placeholder" aria-hidden="true"><div class="person-photo"></div><div class="person-description"><span class="placeholder-line placeholder-name"></span><span class="placeholder-line"></span><span class="placeholder-line"></span><span class="placeholder-line"></span></div></div><div class="person-controls" :style="{ visibility: peopleReady ? undefined : 'hidden' }"><button aria-label="Նախորդ մարդը" @click="nextPerson(-1)"><ChevronLeft :size="18"/></button><span class="muted text-xs" aria-live="polite">{{ personIndex + 1 }} / {{ featuredPeople.length }}</span><button aria-label="Հաջորդ մարդը" @click="nextPerson(1)"><ChevronRight :size="18"/></button></div></article></div></section>
<div class="stats-bar"><div><BookOpen/><strong>10,000+</strong><small>նախատեսվող հոդվածներ</small></div><div><CircleHelp/><strong>500,000+</strong><small>հարցերի երկարաժամկետ նպատակ</small></div><div><Brain/><strong>3</strong><small>ինտելեկտուալ խաղ</small></div><div><Users/><strong>100%</strong><small>անվճար հասանելիություն</small></div><div><Globe2/><strong>3 լեզու</strong><small>նախատեսված՝ Հայերեն / English / Русский</small></div></div><p class="demo-disclaimer">Ցուցադրական տարբերակ․ հոդվածների և հարցերի նշված քանակները զարգացման նպատակներ են, ոչ հրապարակված բովանդակության փաստացի հաշվարկ։</p>
</div></main></template>

<style scoped>
.factum-home .discovery-grid .fact-highlight { overflow: hidden; }
.factum-home .discovery-grid .fact-highlight > img { display: block; width: 100%; object-fit: cover; object-position: center; border-top-left-radius: inherit; border-top-right-radius: inherit; background: #081321; filter: none; }
.home-subject-grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 13px; padding: 8px 0 12px; }
.home-subject-grid > .subject-tile { width: 100%; min-width: 0; max-width: none; height: 148px; }
@media (max-width: 1100px) { .home-subject-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 540px) { .home-subject-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.fact-read-more { display: inline-flex; align-items: center; align-self: flex-end; gap: 7px; flex-shrink: 0; margin: 8px 17px 0; color: #dfc38f; font-size: 12px; }
.fact-read-more:hover { text-decoration: underline; }
.fact-read-more:focus-visible { outline: 2px solid #dfc38f; outline-offset: 4px; border-radius: 4px; }
.fact-controls { padding: 12px 16px 14px; flex-shrink: 0; }
.fact-controls button:disabled { opacity: .4; cursor: default; }

.factum-home .discovery-grid { --discovery-card-height: 420px; }
.factum-home .discovery-grid :is(.fact-highlight, .history-card, .people-card) {
  flex: 0 0 var(--discovery-card-height);
  height: var(--discovery-card-height);
  min-height: var(--discovery-card-height);
  max-height: var(--discovery-card-height);
}
.factum-home .discovery-grid .person-feature { min-height: 0; grid-template-rows: minmax(0, 1fr); }
.factum-home .discovery-grid .person-feature .person-photo { position: relative; height: 100%; min-height: 0; }
.factum-home .discovery-grid .person-photo > :deep(img),
.factum-home .discovery-grid .person-photo > :deep(.portrait) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center; }
.factum-home .discovery-grid .person-description { display: flex; flex-direction: column; align-self: stretch; min-height: 0; overflow: hidden; }
.factum-home .discovery-grid .person-description h3,
.factum-home .discovery-grid .person-description small { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; flex-shrink: 0; }
.factum-home .discovery-grid .person-description h3 { -webkit-line-clamp: 2; }
.factum-home .discovery-grid .person-description small { -webkit-line-clamp: 3; }
.factum-home .discovery-grid .person-description p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 6; min-height: 0; overflow: hidden; margin-block: 10px; }
.factum-home .discovery-grid .person-description a { flex-shrink: 0; margin-top: auto; }

@media (max-width: 800px) {
  .factum-home .cosmic-hero { height: auto; }
  .factum-home .hero-content { height: auto; padding-top: 54px; padding-bottom: 20px; }
  .factum-home .discovery-grid .people-card { flex: 0 0 auto; height: auto; min-height: 0; max-height: none; }
  .factum-home .discovery-grid .person-feature { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto; gap: 16px; }
  .factum-home .discovery-grid .person-feature .person-photo { height: 280px; min-height: 0; }
  .factum-home .discovery-grid .person-description { padding: 0 6px 8px; }
  .factum-home .discovery-grid .person-description h3 { font-size: 18px; }
  .factum-home .discovery-grid .person-description small { font-size: 12px; }
  .factum-home .discovery-grid .person-description p { font-size: 13px; }
}
.person-placeholder .person-photo { background: var(--border, #ffffff12); }
.placeholder-line { display: block; height: 14px; margin: 0 0 16px; border-radius: 6px; background: var(--border, #ffffff12); }
.placeholder-name { width: 70%; height: 24px; }
</style>
