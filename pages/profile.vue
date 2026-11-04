<script setup lang="ts">
import { allEncyclopediaQuestions, people, facts, timeline, subjects, collectionSubjects } from '~/data/content'
import { resultLevels, type ResultLevel } from '~/utils/gameResult'
import { geniusRecordKey, parseGeniusRecord, clearGeniusBest } from '~/utils/geniusRecord'
import { bibleBooks } from '~/data/bible'
import { disintegrate, type Disintegration } from '~/utils/disintegrate'
import { findMillionBookmark } from '~/utils/millionBookmarks'
import { findGameBookmark } from '~/utils/gameBookmarks'
import { BookOpen, Trophy, ScrollText, Sparkles, Users, Landmark, Gamepad2, Bookmark, ArrowUpRight, Trash2, Check } from 'lucide-vue-next'

const { saved, removeSaved } = useProgress()
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

type SavedCategory = 'encyclopedia' | 'million' | 'games' | 'bible' | 'facts' | 'people' | 'history' | 'other'
type SavedEntry = { id: string; title: string; to: string; kind: string; category: SavedCategory; sourceSection?: string; answer?: string; explanation?: string }
const activeCategory = ref<SavedCategory | 'all'>('all')
const geniusBestLevel = ref<ResultLevel | null>(null)
const geniusBestScore = ref<number | null>(null)
function refreshGeniusRecord() {
  try {
    const record = parseGeniusRecord(localStorage.getItem(geniusRecordKey))
    geniusBestLevel.value = record.bestLevel
    geniusBestScore.value = record.best
  } catch { geniusBestScore.value = null; geniusBestLevel.value = null }
}
const removedGeniusRecord = ref<string | null>(null)
function removeGeniusRecord() {
  try {
    removedGeniusRecord.value = clearGeniusBest(localStorage)
    refreshGeniusRecord()
    removalMessage.value = 'Genius-ի լավագույն արդյունքը ջնջվեց։ Անցած մակարդակները պահպանված են։'
  } catch {
    removalMessage.value = 'Չհաջողվեց ջնջել արդյունքը։ Փորձիր կրկին։'
  }
}
function undoGeniusRemoval() {
  if (removedGeniusRecord.value === null) return
  try {
    localStorage.setItem(geniusRecordKey, removedGeniusRecord.value)
    removedGeniusRecord.value = null
    refreshGeniusRecord()
    removalMessage.value = 'Genius-ի լավագույն արդյունքը վերականգնվեց։'
  } catch { removalMessage.value = 'Չհաջողվեց վերականգնել արդյունքը։' }
}
onMounted(() => {
  refreshGeniusRecord()
  window.addEventListener('storage', refreshGeniusRecord)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', refreshGeniusRecord)
})
const sectionDefinitions = [
  { id: 'encyclopedia', title: 'Հանրագիտարան', icon: BookOpen, description: 'Հոդվածներ ու հարցերի բացատրություններ', to: '/subjects' },
  { id: 'million', title: 'Միլիոնատեր', icon: Trophy, description: 'Խաղի հարցերը՝ ճիշտ պատասխաններով', to: '/games/million' },
  { id: 'games', title: 'Խաղեր', icon: Gamepad2, description: 'Լավագույն արդյունքներ և պահպանված խաղի հարցեր', to: '/games/genius' },
  { id: 'bible', title: 'Աստվածաշունչ', icon: ScrollText, description: 'Պահպանված գրքեր և գլուխներ', to: '/bible' },
  { id: 'facts', title: 'Հետաքրքիր փաստեր', icon: Sparkles, description: 'Քեզ հետաքրքրած փաստերն ու բացահայտումները', to: '/facts' },
  { id: 'people', title: 'Նշանավոր մարդիկ', icon: Users, description: 'Կենսագրություններ և ստեղծագործություններ', to: '/people' },
  { id: 'history', title: 'Հայոց պատմություն', icon: Landmark, description: 'Պատմական իրադարձություններ', to: '/history' },
  { id: 'other', title: 'Այլ նյութեր', icon: Bookmark, description: 'Մյուս պահպանված նյութերը', to: '/subjects' },
] as const

function describeEntry(id: string): SavedEntry {
  if (id.startsWith('million-')) {
    const question = findMillionBookmark(id)
    return question
      ? { id, title: question.question, to: `/games/questions/${id}#saved-million-question`, kind: 'Միլիոնատերի հարց', category: 'million', answer: question.answers[question.correct], explanation: question.explanation }
      : { id, title: 'Պահպանված հարցն այլևս հասանելի չէ', to: '/games/million', kind: 'Միլիոնատերի հարց', category: 'million' }
  }
  if (id.startsWith('game-')) {
    const question = findGameBookmark(id)
    return question
      ? { id, title: question.question, to: `/games/questions/${id}#saved-game-question`, kind: question.gameTitle, category: 'games', answer: question.answers[question.correct], explanation: question.explanation }
      : { id, title: 'Պահպանված խաղի հարցը հասանելի չէ', to: '/games', kind: 'Խաղի հարց', category: 'games' }
  }
  const question = allEncyclopediaQuestions.find(item => item.id === id)
  if (question) {
    const section = [...subjects, ...collectionSubjects].find(section => section.slug === question.subject)
    const sourceSection = section
      ? (('shortName' in section ? section.shortName : undefined) || section.name)
      : 'Հանրագիտարան'
    return { id, title: question.title, to: `/articles/${id}#saved-article`, kind: 'Հոդված', category: 'encyclopedia', sourceSection }
  }

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

const savedEntries = computed(() => [...new Set(saved.value)].map(describeEntry))
const savedCount = computed(() => savedEntries.value.length + (geniusBestScore.value !== null ? 1 : 0))
const sections = computed(() => sectionDefinitions.map(section => {
  const items = savedEntries.value.filter(item => item.category === section.id)
  return { ...section, items, count: items.length + (section.id === 'games' && geniusBestScore.value !== null ? 1 : 0) }
}))
const categoryTabs = computed(() => sections.value.filter(section => ['encyclopedia','million','games','bible'].includes(section.id) || section.items.length || section.id === activeCategory.value))
const shownSections = computed(() => sections.value.filter(section => activeCategory.value === 'all' ? section.items.length || (section.id === 'games' && geniusBestScore.value !== null) : section.id === activeCategory.value))
</script>

<template>
  <main class="shell py-10 profile-page">
    <header class="profile-heading"><span class="gold profile-eyebrow">ՔՈ ԱՆՁՆԱԿԱՆ ԳԻՏԵԼԻՔՆԵՐԻ ՀԱՎԱՔԱԾՈՒՆ</span><h1 class="heading">Իմ FACTUM-ը</h1><p class="muted">{{savedCount}} պահպանված նյութ։ Ընտրիր բաժինը և շարունակիր բացահայտել։</p></header>
    <nav class="profile-categories" aria-label="Պահպանված նյութերի բաժիններ"><button :aria-pressed="activeCategory === 'all'" :class="{'is-active':activeCategory === 'all'}" @click="activeCategory='all'"><Bookmark :size="17" /> Բոլորը <span>{{savedCount}}</span></button><button v-for="section in categoryTabs" :key="section.id" :aria-pressed="activeCategory === section.id" :class="{'is-active':activeCategory === section.id}" @click="activeCategory=section.id"><component :is="section.icon" :size="17" />{{section.title}}<span>{{section.count}}</span></button></nav>
    <section v-for="section in shownSections" :key="section.id" class="profile-section" :aria-labelledby="`saved-section-${section.id}`">
      <header class="profile-section-heading"><div class="profile-section-icon"><component :is="section.icon" :size="23" /></div><div><h2 :id="`saved-section-${section.id}`">{{section.title}} <span>{{section.count}}</span></h2><p class="muted">{{section.description}}</p></div></header>
      <article v-if="section.id === 'games'" class="panel profile-game-record">
        <div class="genius-record-art">
          <img src="/images/optimized/genius-art-c410cd085a.webp" alt="Genius խաղի լուսավոր ուղեղի պատկերազարդումը" width="640" height="358" loading="lazy" decoding="async" />
          <span class="genius-record-label"><Gamepad2 :size="15" aria-hidden="true" /> ՃԻՇՏ ԿԱՄ ՍԽԱԼ</span>
        </div>
        <div class="genius-record-content">
          <div class="genius-record-top">
            <span class="genius-record-eyebrow"><Trophy :size="15" aria-hidden="true" /> ՔՈ ԱՆՁՆԱԿԱՆ ՌԵԿՈՐԴԸ</span>
            <button v-if="geniusBestScore !== null" type="button" class="profile-remove" aria-label="Ջնջել Genius-ի լավագույն արդյունքը" @click="removeGeniusRecord"><Trash2 :size="15" aria-hidden="true" /> Ջնջել</button>
          </div>
          <h3>FACTUM <span>Genius</span></h3>
          <template v-if="geniusBestScore !== null">
            <p class="muted genius-record-caption">Քո լավագույն արդյունքը</p>
            <p class="genius-record-level">{{ geniusBestLevel ? `${resultLevels[geniusBestLevel]} մակարդակ` : 'Մակարդակը չի պահպանվել' }}</p>
            <p v-if="!geniusBestLevel" class="muted genius-record-description">Սա նախկինում գրանցված արդյունք է։ Մակարդակը կպահպանվի նոր խաղում նույն կամ ավելի բարձր միավոր ստանալիս։</p>
            <p class="genius-record-score"><strong>{{ geniusBestScore }}</strong><span>/ 10</span></p>
            <p class="muted genius-record-description">{{ geniusBestScore === 10 ? 'Կատարյալ արդյունք․ բոլոր պատասխանները ճիշտ են։' : 'Նոր փորձ, նոր բացահայտումներ․ բարելավիր քո ռեկորդը։' }}</p>
            <div class="genius-record-actions">
              <GameResultShare mode="genius" :score="geniusBestScore" :level="geniusBestLevel" />
              <NuxtLink to="/games/genius" class="btn-secondary">Խաղալ կրկին <ArrowUpRight :size="16" aria-hidden="true" /></NuxtLink>
            </div>
          </template>
          <template v-else>
            <p class="muted genius-record-description">Փորձիր գիտելիքներդ․ ավարտիր առաջին խաղը և պահպանիր քո լավագույն արդյունքն այստեղ։</p>
            <NuxtLink to="/games/genius" class="btn genius-record-start">Խաղալ Genius <ArrowUpRight :size="16" aria-hidden="true" /></NuxtLink>
          </template>
        </div>
      </article>
      <div v-if="section.items.length" class="profile-entry-grid"><article v-for="item in section.items" :key="item.id" class="panel profile-entry" :aria-busy="removing.has(item.id)" :class="{'profile-million-entry':item.category === 'million', 'is-removing':removing.has(item.id)}"><div class="profile-entry-top"><div class="profile-entry-labels"><span class="gold">{{item.kind}}</span><span v-if="item.sourceSection" class="profile-entry-source">{{item.sourceSection}}</span></div><button class="profile-remove" :disabled="removing.has(item.id)" :aria-label="`${item.title}՝ հեռացնել պահպանվածներից`" @click="removeEntry(item.id, $event)"><Trash2 :size="15" /> Հեռացնել</button></div><NuxtLink :to="item.to" class="profile-entry-title">{{item.title}} <ArrowUpRight :size="16" /></NuxtLink><div v-if="item.answer" class="profile-answer"><span><Check :size="15" /> Ճիշտ պատասխան</span><strong>{{item.answer}}</strong></div><p v-if="item.explanation" class="profile-explanation">{{item.explanation}}</p></article></div>
      <div v-else-if="section.id !== 'games'" class="panel profile-empty"><component :is="section.icon" :size="30" /><p>Այս բաժնում դեռ պահպանված նյութեր չկան։</p><NuxtLink :to="section.to" class="btn-secondary">Բացահայտել բաժինը <ArrowUpRight :size="15" /></NuxtLink></div>
    </section>
    <div v-if="activeCategory === 'all' && !savedCount" class="panel profile-empty"><Bookmark :size="32" /><h2>Քո հավաքածուն սկսվում է մեկ պահպանումից</h2><p class="muted">Պահպանիր հոդվածներ, Միլիոնատերի հարցեր կամ Աստվածաշնչի գլուխներ․ դրանք կհայտնվեն իրենց բաժիններում։</p><NuxtLink to="/subjects" class="btn">Բացահայտել հանրագիտարանը</NuxtLink></div>
    <div v-if="removalMessage" class="profile-removal-status" role="status">
      <p>{{ removalMessage }}</p>
      <button v-if="removedGeniusRecord !== null" type="button" class="btn-secondary" @click="undoGeniusRemoval">Վերականգնել արդյունքը</button>
    </div>
    <p class="profile-storage-note muted">Հյուրի ռեժիմ․ տվյալները պահվում են այս բրաուզերում։ Սարքերի համաժամեցում դեռ միացված չէ։</p>
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
</style>
