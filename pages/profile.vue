<script setup lang="ts">
import type {Question} from '~/data/content'
import type {GeoFact} from '~/utils/geography/types'
import { allEncyclopediaQuestions, people, facts, timeline, subjects, collectionSubjects } from '~/data/content'
import { resultLevels, shareableGames, type ShareableGame } from '~/utils/gameResult'
import { optimizedImage } from '~/data/optimizedImages'
import { readGameRecords, removeGameRecord, restoreGameRecord, gameRecordsEvent, type GameRecord, type RemovedGameRecord } from '~/utils/gameRecords'
import { bibleBooks } from '~/data/bible'
import { disintegrate, type Disintegration } from '~/utils/disintegrate'
import { findMillionBookmark } from '~/utils/millionBookmarks'
import { findGameBookmark } from '~/utils/gameBookmarks'
// Separate aliases keep setup metadata available when Nuxt tree-shakes ClientOnly template icons.
import { BookOpen as EncyclopediaSectionIcon, Gamepad2 as GameSectionIcon, Bookmark as SavedSectionIcon } from 'lucide-vue-next'
import { BookOpen, Trophy, ScrollText, Sparkles, Users, Landmark, Gamepad2, Bookmark, ArrowUpRight, Trash2, Check } from 'lucide-vue-next'

const { saved, removeSaved, library } = useProgress()
const {records:libraryRecords,loadSaved:loadSavedLibrary}=useLibraryReading()
onMounted(loadSavedLibrary)
const savedLibraryIds=computed(()=>[...new Set([...library.value,...Object.entries(libraryRecords.value).filter(([,state])=>state.bookmarks.length>0).map(([id])=>id)])])
const savedLibraryCount=computed(()=>savedLibraryIds.value.length)
const geographyFacts=shallowRef<GeoFact[]>([])
let geographyPending=false
watch(saved,async ids=>{if(geographyPending||geographyFacts.value.length||!ids.some(id=>id.startsWith('geo-')))return;geographyPending=true;try{geographyFacts.value=await $fetch<GeoFact[]>('/data/geography/facts-v1.json',{timeout:10000,retry:1})}catch{}finally{geographyPending=false}},{immediate:true})
const legacyLiterature=shallowRef<Question[]>([])
let literaturePending=false
watch(saved,async ids=>{
  if(literaturePending||legacyLiterature.value.length||!ids.some(id=>/^literature-intro-[ab]-\d+-[ab]$/.test(id)))return
  literaturePending=true
  try{const {legacyLiteratureQuestions}=await import('~/data/encyclopedia/literatureLegacy');legacyLiterature.value=legacyLiteratureQuestions}catch{ /* Keep the saved article link available if its archive chunk cannot load. */ }finally{literaturePending=false}
},{immediate:true})
const legacyHealth=shallowRef<Question[]>([])
let healthPending=false
watch(saved,async ids=>{
  if(healthPending||legacyHealth.value.length||!ids.some(id=>/^health-(?:heart|lungs|habits(?:-b)?|mind)-\d+-[ab]$/.test(id)))return
  healthPending=true
  try{const {legacyHealthQuestions}=await import('~/data/encyclopedia/healthLegacy');legacyHealth.value=legacyHealthQuestions}catch{ /* The original saved article link remains available. */ }finally{healthPending=false}
},{immediate:true})
const geographyById=computed(()=>new Map(geographyFacts.value.map(f=>[`geo-${f.id}`,f])))
const removing = ref(new Set<string>())
const removalMessage = ref('')
const removalEffects = new Set<Disintegration>()
let disposed = false
async function removeEntry(id: string, event: Event) {
  if (removing.value.has(id)) return
  const card = (event.currentTarget as HTMLElement).closest<HTMLElement>('.profile-entry')
  if (!card) { removeSaved(id); return }
  removing.value = new Set([...removing.value, id])
  const nextButton = (card.nextElementSibling || card.previousElementSibling)?.querySelector<HTMLButtonElement>('.profile-remove')
  const effect = disintegrate(card)
  removalEffects.add(effect)
  await effect.finished
  removalEffects.delete(effect)
  removeSaved(id)
  removing.value = new Set([...removing.value].filter(item => item !== id))
  if (disposed) return
  removalMessage.value = 'Նյութը հեռացվեց Իմ FACTUM-ից։'
  await nextTick()
  const target = nextButton?.isConnected ? nextButton : document.querySelector<HTMLButtonElement>('.profile-categories button')
  target?.focus({ preventScroll: true })
}
onBeforeUnmount(() => {
  disposed = true
  removalEffects.forEach(effect => effect.cancel())
  removalEffects.clear()
})

type SavedCategory = 'library' | 'encyclopedia' | 'games' | 'bible' | 'facts' | 'people' | 'history' | 'other'
type SavedEntry = { id: string; title: string; to: string; kind: string; category: SavedCategory; sourceSection?: string; answer?: string; explanation?: string }
const activeCategory = ref<SavedCategory | 'all'>('all')
const gameRecords = ref<GameRecord[]>([])
const profileGameRecords = computed(() => gameRecords.value.map(record => ({
  ...record, ...shareableGames[record.mode], category: 'games',
})))
function refreshGameRecords() { gameRecords.value = readGameRecords() }
const removedGameRecord = ref<RemovedGameRecord | null>(null)
function removeRecord(mode: ShareableGame) {
  try {
    removedGameRecord.value = removeGameRecord(mode)
    refreshGameRecords()
    removalMessage.value = `${shareableGames[mode].title}․ լավագույն արդյունքը ջնջվեց։ Անցած մակարդակները պահպանված են։`
  } catch { removalMessage.value = 'Չհաջողվեց ջնջել արդյունքը։ Փորձիր կրկին։' }
}
function undoGameRemoval() {
  if (!removedGameRecord.value) return
  try {
    restoreGameRecord(removedGameRecord.value)
    removedGameRecord.value = null
    refreshGameRecords()
    removalMessage.value = 'Լավագույն արդյունքը վերականգնվեց։'
  } catch { removalMessage.value = 'Չհաջողվեց վերականգնել արդյունքը։' }
}
onMounted(() => {
  refreshGameRecords()
  window.addEventListener('storage', refreshGameRecords)
  window.addEventListener(gameRecordsEvent, refreshGameRecords)
  window.addEventListener('focus', refreshGameRecords)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', refreshGameRecords)
  window.removeEventListener(gameRecordsEvent, refreshGameRecords)
  window.removeEventListener('focus', refreshGameRecords)
})
const sectionDefinitions = [
  { id: 'encyclopedia', title: 'Հանրագիտարան', icon: EncyclopediaSectionIcon, description: 'Հոդվածներ ու հարցերի բացատրություններ', to: '/subjects' },
  { id: 'games', title: 'Խաղեր', icon: GameSectionIcon, description: 'Միլիոնատեր, Genius և Logic․ լավագույն արդյունքներ ու պահպանված հարցեր', to: '/games/genius' },
  { id: 'library', title: 'Գրադարան', icon: EncyclopediaSectionIcon, description: 'Պահպանված գրքեր, էջանշված տողեր և անձնական նշումներ', to: '/library' },
  { id: 'bible', title: 'Աստվածաշունչ', icon: ScrollText, description: 'Պահպանված գրքեր և գլուխներ', to: '/bible' },
  { id: 'facts', title: 'Հետաքրքիր փաստեր', icon: Sparkles, description: 'Քեզ հետաքրքրած փաստերն ու բացահայտումները', to: '/facts' },
  { id: 'people', title: 'Նշանավոր մարդիկ', icon: Users, description: 'Կենսագրություններ և ստեղծագործություններ', to: '/people' },
  { id: 'history', title: 'Հայոց պատմություն', icon: Landmark, description: 'Պատմական իրադարձություններ', to: '/history' },
  { id: 'other', title: 'Այլ նյութեր', icon: SavedSectionIcon, description: 'Մյուս պահպանված նյութերը', to: '/subjects' },
] as const

function describeEntry(id: string): SavedEntry {
  if(id.startsWith('geo-')){const fact=geographyById.value.get(id);return {id,title:fact?.title||'Աշխարհագրական փաստ',to:`/globe?fact=${encodeURIComponent(id.slice(4))}#globe-atlas`,kind:'Աշխարհագրություն',category:'facts',explanation:fact?.detail}}
  if (id.startsWith('million-')) {
    const question = findMillionBookmark(id)
    return question
      ? { id, title: question.question, to: `/games/questions/${id}#saved-million-question`, kind: 'Միլիոնատերի հարց', category: 'games', answer: question.answers[question.correct], explanation: question.explanation }
      : { id, title: 'Պահպանված հարցն այլևս հասանելի չէ', to: '/games/million', kind: 'Միլիոնատերի հարց', category: 'games' }
  }
  if (id.startsWith('game-')) {
    const question = findGameBookmark(id)
    return question
      ? { id, title: question.question, to: `/games/questions/${id}#saved-game-question`, kind: question.gameTitle, category: 'games', answer: question.answers[question.correct], explanation: question.explanation }
      : { id, title: 'Պահպանված խաղի հարցը հասանելի չէ', to: '/games', kind: 'Խաղի հարց', category: 'games' }
  }
  const question = allEncyclopediaQuestions.find(item => item.id === id) || legacyLiterature.value.find(item => item.id === id) || legacyHealth.value.find(item => item.id === id)
  if (question) {
    const section = [...subjects, ...collectionSubjects].find(section => section.slug === question.subject)
    const sourceSection = section
      ? (('shortName' in section && typeof section.shortName==='string' ? section.shortName : undefined) || section.name)
      : 'Հանրագիտարան'
    return { id, title: question.title, to: `/articles/${id}#saved-article`, kind: 'Հոդված', category: 'encyclopedia', sourceSection }
  }

  if(/^literature-intro-[ab]-\d+-[ab]$/.test(id))return {id,title:'Գրականություն · պահպանված հոդված',to:`/articles/${id}#saved-article`,kind:'Հոդված',category:'encyclopedia',sourceSection:'Գրականություն'}

  if(/^health-(?:heart|lungs|habits(?:-b)?|mind)-\d+-[ab]$/.test(id))return {id,title:'Առողջություն · պահպանված հոդված',to:`/articles/${id}#saved-article`,kind:'Հոդված',category:'encyclopedia',sourceSection:'Առողջություն'}

  const fact = facts.find(item => item.id === id)
  if (fact) return { id, title: fact.title, to: `/facts?fact=${encodeURIComponent(id)}`, kind: 'Հետաքրքիր փաստ', category: 'facts' }

  if (id.startsWith('person-')) {
    const personId = id.slice('person-'.length)
    const person = people.find(item => item.id === personId)
    return {
      id,
      title: person?.name ?? (personId === 'einstein' ? 'Ալբերտ Էյնշտեյն' : 'Նշանավոր մարդ'),
      to: person ? `/people/${personId}#saved-person` : '/people',
      kind: 'Նշանավոր մարդ', category: 'people',
    }
  }

  if (id.startsWith('history-')) {
    const year = id.slice('history-'.length)
    const event = timeline.find(item => String(item.year) === year)
    return { id, title: event?.title ?? `Պատմություն · ${year}`, to: `/history?event=${encodeURIComponent(year)}`, kind: 'Հայոց պատմություն', category: 'history' }
  }

  if (id.startsWith('bible-')) {
    const match = id.match(/^bible-(.+)-(\d+)$/)
    const book = bibleBooks.find(item => item.id === match?.[1])
    const chapter = Number(match?.[2])
    if (book && chapter >= 1 && chapter <= book.chapters) {
      return { id, title: `${book.name} · Գլուխ ${chapter}`, to: `/bible?book=${book.id}&chapter=${chapter}`, kind: 'Աստվածաշունչ', category: 'bible' }
    }
    return { id, title: 'Աստվածաշունչ · ' + id.slice('bible-'.length), to: '/bible', kind: 'Աստվածաշունչ', category: 'bible' }
  }

  return { id, title: id, to: '/subjects', kind: 'Այլ նյութ', category: 'other' }
}

const managedSaved=ref<SavedEntry[]>([])
watch(saved,async ids=>{try{const output:SavedEntry[]=[];for(let i=0;i<ids.length;i+=100){const response=await $fetch<{items:SavedEntry[]}>('/api/content/saved',{method:'POST',body:{keys:ids.slice(i,i+100)}});output.push(...response.items)}managedSaved.value=output}catch{}},{immediate:true})
const savedEntries = computed(() => [...new Set(saved.value)].map(id=>managedSaved.value.find(item=>item.id===id)||describeEntry(id)))
const savedCount = computed(() => savedEntries.value.length + gameRecords.value.length + savedLibraryCount.value)
const sections = computed(() => sectionDefinitions.map(section => {
  const items = savedEntries.value.filter(item => item.category === section.id)
  const records = profileGameRecords.value.filter(record => record.category === section.id)
  return { ...section, items, records, count: items.length + records.length + (section.id==='library'?savedLibraryCount.value:0) }
}))
const categoryTabs = computed(() => sections.value.filter(section => ['encyclopedia','games','bible','library'].includes(section.id) || section.items.length || section.id === activeCategory.value))
const shownSections = computed(() => sections.value.filter(section => activeCategory.value === 'all' ? section.count : section.id === activeCategory.value))
</script>

<template>
  <main class="shell py-10 profile-page">
    <ClientOnly>
    <AccountPanel />
    <header class="profile-heading"><span class="gold profile-eyebrow">ՔՈ ԱՆՁՆԱԿԱՆ ԳԻՏԵԼԻՔՆԵՐԻ ՀԱՎԱՔԱԾՈՒՆ</span><h2 class="heading">Իմ հավաքածուն</h2><p class="muted">{{savedCount}} պահպանված նյութ։ Ընտրիր բաժինը և շարունակիր բացահայտել։</p></header>
    <div class="profile-summary" aria-label="Քո հավաքածուի ամփոփումը">
      <div><span class="profile-summary-icon"><Bookmark :size="19" /></span><p><strong>{{savedEntries.length+savedLibraryCount}}</strong><span>պահպանված նյութ</span></p></div>
      <div><span class="profile-summary-icon"><Trophy :size="19" /></span><p><strong>{{gameRecords.length}}</strong><span>խաղային ռեկորդ</span></p></div>
      <div><span class="profile-summary-icon"><BookOpen :size="19" /></span><p><strong>{{sections.filter(section=>section.count>0).length}}</strong><span>բացահայտված բաժին</span></p></div>
    </div>
    <nav class="profile-categories" aria-label="Պահպանված նյութերի բաժիններ"><button :aria-pressed="activeCategory === 'all'" :class="{'is-active':activeCategory === 'all'}" @click="activeCategory='all'"><Bookmark :size="17" /> Բոլորը <span>{{savedCount}}</span></button><button v-for="section in categoryTabs" :key="section.id" :aria-pressed="activeCategory === section.id" :class="{'is-active':activeCategory === section.id}" @click="activeCategory=section.id"><component :is="section.icon" :size="17" />{{section.title}}<span>{{section.count}}</span></button></nav>
    <section v-for="section in shownSections" :key="section.id" class="profile-section" :aria-labelledby="`saved-section-${section.id}`">
      <header class="profile-section-heading"><div class="profile-section-icon"><component :is="section.icon" :size="23" /></div><div><h2 :id="`saved-section-${section.id}`">{{section.title}} <span>{{section.count}}</span></h2><p class="muted">{{section.description}}</p></div></header>
      <LazyLibraryProfileCollection v-if="section.id==='library'&&savedLibraryCount" :ids="savedLibraryIds"/>
      <article v-for="record in section.records" :key="record.mode" class="panel profile-game-record">
        <div class="genius-record-art">
          <img :src="optimizedImage(record.image)" :alt="record.title" width="640" height="358" loading="lazy" decoding="async" />
          <span class="genius-record-label"><Gamepad2 :size="15" aria-hidden="true" /> {{ record.title }}</span>
        </div>
        <div class="genius-record-content">
          <div class="genius-record-top">
            <span class="genius-record-eyebrow"><Trophy :size="15" aria-hidden="true" /> ՔՈ ԱՆՁՆԱԿԱՆ ՌԵԿՈՐԴԸ</span>
            <button type="button" class="profile-remove" :aria-label="`Ջնջել ${record.title}-ի լավագույն արդյունքը`" @click="removeRecord(record.mode)"><Trash2 :size="15" aria-hidden="true" /> Ջնջել</button>
          </div>
          <h3>{{ record.title }}</h3>
          <p class="muted genius-record-caption">Քո լավագույն արդյունքը</p>
          <p v-if="record.level" class="genius-record-level">{{ resultLevels[record.level] }} մակարդակ</p>
          <p v-else-if="['genius', 'logic', 'million'].includes(record.mode)" class="genius-record-level">Մակարդակը չի պահպանվել</p>
          <p class="genius-record-score"><strong>{{ record.score }}</strong><span>/ {{ record.total }}</span></p>
          <p class="muted genius-record-description">{{ record.score === record.total ? 'Կատարյալ արդյունք․ բոլոր պատասխանները ճիշտ են։' : 'Նոր փորձ, նոր բացահայտումներ․ բարելավիր քո ռեկորդը։' }}</p>
          <div class="genius-record-actions">
            <GameResultShare :mode="record.mode" :score="record.score" :level="record.level" />
            <NuxtLink :to="record.playPath" class="btn-secondary">Խաղալ կրկին <ArrowUpRight :size="16" aria-hidden="true" /></NuxtLink>
          </div>
        </div>
      </article>
      <div v-if="section.items.length" class="profile-entry-grid"><article v-for="item in section.items" :key="item.id" class="panel profile-entry" :aria-busy="removing.has(item.id)" :class="{'is-removing':removing.has(item.id)}"><div class="profile-entry-top"><div class="profile-entry-labels"><span class="gold">{{item.kind}}</span><span v-if="item.sourceSection" class="profile-entry-source">{{item.sourceSection}}</span></div><button class="profile-remove" :disabled="removing.has(item.id)" :aria-label="`${item.title}՝ հեռացնել պահպանվածներից`" @click="removeEntry(item.id, $event)"><Trash2 :size="15" /> Հեռացնել</button></div><NuxtLink :to="item.to" class="profile-entry-title text-action">{{item.title}} <ArrowUpRight :size="16" /></NuxtLink><div v-if="item.answer" class="profile-answer"><span><Check :size="15" /> Ճիշտ պատասխան</span><strong>{{item.answer}}</strong></div><p v-if="item.explanation" class="profile-explanation">{{item.explanation}}</p></article></div>
      <div v-else-if="!section.records.length&&!(section.id==='library'&&savedLibraryCount)" class="panel profile-empty"><component :is="section.icon" :size="30" /><p>Այս բաժնում դեռ պահպանված նյութեր չկան։</p><NuxtLink :to="section.to" class="btn-secondary">Բացահայտել բաժինը <ArrowUpRight :size="15" /></NuxtLink></div>
    </section>
    <div v-if="activeCategory === 'all' && !savedCount" class="panel profile-empty"><Bookmark :size="32" /><h2>Քո հավաքածուն սկսվում է մեկ պահպանումից</h2><p class="muted">Պահպանիր հոդվածներ, Միլիոնատերի հարցեր կամ Աստվածաշնչի գլուխներ․ դրանք կհայտնվեն իրենց բաժիններում։</p><NuxtLink to="/subjects" class="btn">Բացահայտել հանրագիտարանը</NuxtLink></div>
    <div v-if="removalMessage" class="profile-removal-status" role="status">
      <p>{{ removalMessage }}</p>
      <button v-if="removedGameRecord !== null" type="button" class="btn-secondary" @click="undoGameRemoval">Վերականգնել արդյունքը</button>
    </div>
    <p class="profile-storage-note muted">Մուտք գործիր նույն հաշվով այլ սարքից՝ քո պահպանված նյութերն ու առաջընթացը շարունակելու համար։</p>
    <template #fallback><section class="panel p-6" aria-busy="true"><p class="muted">Քո պահպանված նյութերը բեռնվում են…</p></section></template>
    </ClientOnly>
  </main>
</template>

<style scoped>
.genius-record-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.genius-record-top .profile-remove { font-size: 12px; }
.genius-record-level { display: inline-flex; margin-top: 12px; padding: 6px 12px; border: 1px solid #a6caff44; border-radius: 999px; background: #a6caff12; color: #bcd7ff; font-size: 12px; }
.profile-removal-status { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 24px; font-size: 13px; }
.profile-game-record { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); overflow: hidden; margin-bottom: 22px; border: 1px solid #808fbc44; background: linear-gradient(125deg, #101c35, #11172b 70%); }
.genius-record-art { position: relative; min-height: 340px; background: #0a0e20; }
.genius-record-art img { width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; }
.genius-record-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, #080e24b3, transparent 45%); pointer-events: none; }
.genius-record-label { position: absolute; bottom: 24px; left: 24px; z-index: 1; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #ffffff38; border-radius: 999px; padding: 9px 13px; color: #fff; background: #0b112bd9; font-size: 10px; letter-spacing: .8px; }
.genius-record-content { min-width: 0; padding: 32px; color: #eef4ff; }
.genius-record-eyebrow { display: flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 1px; color: #dfc38f; }
.genius-record-content h3 { margin-top: 13px; font-size: clamp(25px, 3vw, 36px); font-weight: 800; letter-spacing: -.8px; }
.genius-record-content h3 span { color: #a6caff; }
.genius-record-caption { margin-top: 20px; font-size: 12px; }
.genius-record-score { display: flex; align-items: baseline; gap: 12px; margin-top: 4px; line-height: 1.15; }
.genius-record-score strong { font-size: clamp(56px, 6vw, 76px); font-weight: 800; color: #f2d599; letter-spacing: -3px; }
.genius-record-score > span { color: #aebbd0; font-size: 23px; }
.genius-record-description { margin-top: 12px; font-size: 12px; line-height: 1.9; }
.genius-record-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.genius-record-actions :deep(.game-result-share) { margin-top: 0; }
.genius-record-actions :deep(.facebook-share) { font-size: 12px; padding: 12px 15px; }
.genius-record-actions > a, .genius-record-start { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; }
.genius-record-start { margin-top: 24px; }
@media (max-width: 700px) {
  .profile-game-record { grid-template-columns: minmax(0, 1fr); }
  .genius-record-art { min-height: 0; aspect-ratio: 640 / 358; }
  .genius-record-content { padding: 24px; }
}
@media (max-width: 400px) {
  .genius-record-actions { align-items: stretch; flex-direction: column; }
  .genius-record-actions :deep(.facebook-share) { width: 100%; }
}
.profile-entry.is-removing { pointer-events: none; }
.profile-heading { margin-bottom: 28px; }.profile-eyebrow { display: block; font-size: 10px; letter-spacing: 1.2px; margin-bottom: 14px; }.profile-heading .heading { margin-bottom: 12px; }.profile-heading > p { font-size: 13px; line-height: 1.9; }
.profile-categories { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 38px; }.profile-categories button { display: flex; align-items: center; gap: 8px; border: 1px solid #8997c044; border-radius: 13px; padding: 12px 15px; font-size: 12px; }.profile-categories button.is-active { border-color: #dfc38f; color: #dfc38f; background: #dfc38f0f; }.profile-categories button > span { min-width: 23px; padding: 2px 6px; border-radius: 7px; background: #8997c01c; font-size: 10px; text-align: center; }
.profile-section { margin-top: 32px; }.profile-section-heading { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }.profile-section-icon { display: grid; place-items: center; width: 47px; height: 47px; border-radius: 14px; background: #dfc38f0d; border: 1px solid #dfc38f44; color: #dfc38f; flex-shrink: 0; }.profile-section-heading h2 { font-size: 22px; font-weight: 750; }.profile-section-heading h2 span { font-size: 12px; font-weight: 500; margin-left: 8px; color: #dfc38f; }.profile-section-heading p { font-size: 11px; margin-top: 6px; }
.profile-entry-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }.profile-entry { padding: 22px; min-width: 0; }.profile-entry-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; font-size: 10px; }.profile-entry-labels { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }.profile-entry-source { display: inline-flex; align-items: center; border: 1px solid #dfc38f44; border-radius: 999px; padding: 4px 8px; color: #f2dfb8; background: #dfc38f0d; font-size: 9px; line-height: 1.3; }.profile-remove { display: flex; align-items: center; gap: 6px; opacity: .65; }.profile-remove:hover { opacity: 1; color: #fb7185; }.profile-entry-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; font-size: 15px; line-height: 1.9; font-weight: 700; }.profile-entry-title:hover { color: #dfc38f; }.profile-entry-title svg { flex-shrink: 0; margin-top: 5px; color: #dfc38f; }
.profile-answer { margin-top: 18px; padding: 14px; border: 1px solid #86c6a244; background: #86c6a20a; border-radius: 12px; }.profile-answer > span { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #86c6a2; }.profile-answer strong { display: block; margin-top: 8px; font-size: 13px; line-height: 1.8; }.profile-explanation { font-size: 12px; line-height: 1.9; margin-top: 14px; opacity: .8; }
.profile-empty { display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; padding: 35px 25px; }.profile-empty > svg { color: #dfc38f; }.profile-empty h2 { font-size: 21px; font-weight: 700; }.profile-empty p { font-size: 13px; line-height: 1.9; max-width: 65ch; }.profile-empty a { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }.profile-storage-note { margin-top: 35px; font-size: 11px; line-height: 1.9; }
.profile-page :is(button,a):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
@media(max-width:700px) { .profile-entry-grid { grid-template-columns: 1fr; }.profile-categories { gap: 8px; }.profile-categories button { padding: 10px 12px; font-size: 11px; }.profile-entry { padding: 19px; } }
:global(html.factum-light .profile-categories button.is-active) { color: #8b6027; border-color: #8b6027; }
:global(html.factum-light .profile-answer > span) { color: #24713e; }

.profile-page { padding-top: 36px; padding-bottom: 70px; }
.profile-heading { margin-bottom: 24px; }
.profile-heading .heading { font-size: clamp(25px, 3vw, 34px); letter-spacing: -.7px; }
.profile-heading .profile-eyebrow { font-size: 9px; letter-spacing: 1.4px; }
.profile-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; margin-bottom: 28px; }
.profile-summary > div { display: flex; align-items: center; gap: 15px; padding: 20px 22px; border: 1px solid #9aaec222; border-radius: 15px; background: #ffffff02; }
.profile-summary-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; color: #d8bc85; background: #d8bc850a; flex-shrink: 0; }
.profile-summary p { display: flex; flex-direction: column; gap: 5px; }
.profile-summary strong { font-size: 25px; line-height: 1.2; font-weight: 650; font-variant-numeric: tabular-nums; }
.profile-summary p > span { font-size: 10px; color: #95a3b7; line-height: 1.6; }
.profile-categories { padding-bottom: 22px; border-bottom: 1px solid #9aaec21c; gap: 8px; margin-bottom: 28px; }
.profile-categories button { border-radius: 10px; border-color: transparent; color: #a5b0c2; transition: background .15s, color .15s; }
.profile-categories button:not(.is-active):hover { background: #ffffff05; color: #e1c593; }
.profile-categories button.is-active { background: #dfc38f0b; border-color: #dfc38f3d; }
.profile-entry { border: 1px solid #9aaec228; border-radius: 16px; background: linear-gradient(140deg,#ffffff03,#ffffff01); transition: border-color .15s; }
.profile-entry:hover { border-color: #d8bc8544; }
.profile-entry-title { min-height: 57px; font-size: 14px; }
.profile-section-heading h2 { font-size: 19px; }
.profile-section-heading p { line-height: 1.8; }
.profile-empty { border: 1px dashed #d8bc8538; border-radius: 20px; padding: 50px 25px; background: radial-gradient(ellipse at top,#d8bc8507,transparent 70%); }
.profile-empty > svg { box-sizing: content-box; padding: 17px; border: 1px solid #d8bc8528; border-radius: 19px; background: #d8bc8506; }
.profile-storage-note { text-align: center; border-top: 1px solid #9aaec21c; padding-top: 25px; }
@media(max-width:700px) { .profile-page { padding-top: 22px; }.profile-summary { gap: 8px; }.profile-summary > div { flex-direction: column; align-items: flex-start; gap: 12px; padding: 15px 12px; }.profile-summary-icon { width: 32px; height: 32px; border-radius: 9px; }.profile-summary strong { font-size: 23px; }.profile-summary p > span { font-size: 9px; }.profile-categories { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 15px; scrollbar-width: thin; }.profile-categories button { flex-shrink: 0; }.profile-section-heading h2 { font-size: 17px; } }
</style>
