<script setup lang="ts">
import { allEncyclopediaQuestions, people, facts, timeline } from '~/data/content'
import { bibleBooks } from '~/data/bible'
import { disintegrate, type Disintegration } from '~/utils/disintegrate'
import { findMillionBookmark } from '~/utils/millionBookmarks'
import { BookOpen, Trophy, ScrollText, Sparkles, Users, Landmark, Bookmark, ArrowUpRight, Trash2, Check } from 'lucide-vue-next'

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

type SavedCategory = 'encyclopedia' | 'million' | 'bible' | 'facts' | 'people' | 'history' | 'other'
type SavedEntry = { id: string; title: string; to: string; kind: string; category: SavedCategory; answer?: string; explanation?: string }
const activeCategory = ref<SavedCategory | 'all'>('all')
const sectionDefinitions = [
  { id: 'encyclopedia', title: 'Հանրագիտարան', icon: BookOpen, description: 'Հոդվածներ ու հարցերի բացատրություններ', to: '/subjects' },
  { id: 'million', title: 'Միլիոնատեր', icon: Trophy, description: 'Խաղի հարցերը՝ ճիշտ պատասխաններով', to: '/games/million' },
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
  const question = allEncyclopediaQuestions.find(item => item.id === id)
  if (question) return { id, title: question.title, to: `/articles/${id}#saved-article`, kind: 'Հոդված', category: 'encyclopedia' }

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
const sections = computed(() => sectionDefinitions.map(section => ({...section, items: savedEntries.value.filter(item => item.category === section.id)})))
const categoryTabs = computed(() => sections.value.filter(section => ['encyclopedia','million','bible'].includes(section.id) || section.items.length || section.id === activeCategory.value))
const shownSections = computed(() => sections.value.filter(section => activeCategory.value === 'all' ? section.items.length : section.id === activeCategory.value))
</script>

<template>
  <main class="shell py-10 profile-page">
    <header class="profile-heading"><span class="gold profile-eyebrow">ՔՈ ԱՆՁՆԱԿԱՆ ԳԻՏԵԼԻՔՆԵՐԻ ՀԱՎԱՔԱԾՈՒՆ</span><h1 class="heading">Իմ FACTUM-ը</h1><p class="muted">{{savedEntries.length}} պահպանված նյութ։ Ընտրիր բաժինը և շարունակիր բացահայտել։</p></header>
    <nav class="profile-categories" aria-label="Պահպանված նյութերի բաժիններ"><button :aria-pressed="activeCategory === 'all'" :class="{'is-active':activeCategory === 'all'}" @click="activeCategory='all'"><Bookmark :size="17" /> Բոլորը <span>{{savedEntries.length}}</span></button><button v-for="section in categoryTabs" :key="section.id" :aria-pressed="activeCategory === section.id" :class="{'is-active':activeCategory === section.id}" @click="activeCategory=section.id"><component :is="section.icon" :size="17" />{{section.title}}<span>{{section.items.length}}</span></button></nav>
    <section v-for="section in shownSections" :key="section.id" class="profile-section" :aria-labelledby="`saved-section-${section.id}`">
      <header class="profile-section-heading"><div class="profile-section-icon"><component :is="section.icon" :size="23" /></div><div><h2 :id="`saved-section-${section.id}`">{{section.title}} <span>{{section.items.length}}</span></h2><p class="muted">{{section.description}}</p></div></header>
      <div v-if="section.items.length" class="profile-entry-grid"><article v-for="item in section.items" :key="item.id" class="panel profile-entry" :aria-busy="removing.has(item.id)" :class="{'profile-million-entry':item.category === 'million', 'is-removing':removing.has(item.id)}"><div class="profile-entry-top"><span class="gold">{{item.kind}}</span><button class="profile-remove" :disabled="removing.has(item.id)" :aria-label="`${item.title}՝ հեռացնել պահպանվածներից`" @click="removeEntry(item.id, $event)"><Trash2 :size="15" /> Հեռացնել</button></div><NuxtLink :to="item.to" class="profile-entry-title">{{item.title}} <ArrowUpRight :size="16" /></NuxtLink><div v-if="item.answer" class="profile-answer"><span><Check :size="15" /> Ճիշտ պատասխան</span><strong>{{item.answer}}</strong></div><p v-if="item.explanation" class="profile-explanation">{{item.explanation}}</p></article></div>
      <div v-else class="panel profile-empty"><component :is="section.icon" :size="30" /><p>Այս բաժնում դեռ պահպանված նյութեր չկան։</p><NuxtLink :to="section.to" class="btn-secondary">Բացահայտել բաժինը <ArrowUpRight :size="15" /></NuxtLink></div>
    </section>
    <div v-if="activeCategory === 'all' && !savedEntries.length" class="panel profile-empty"><Bookmark :size="32" /><h2>Քո հավաքածուն սկսվում է մեկ պահպանումից</h2><p class="muted">Պահպանիր հոդվածներ, Միլիոնատերի հարցեր կամ Աստվածաշնչի գլուխներ․ դրանք կհայտնվեն իրենց բաժիններում։</p><NuxtLink to="/subjects" class="btn">Բացահայտել հանրագիտարանը</NuxtLink></div>
    <p class="sr-only" role="status">{{ removalMessage }}</p>
    <p class="profile-storage-note muted">Հյուրի ռեժիմ․ տվյալները պահվում են այս բրաուզերում։ Սարքերի համաժամեցում դեռ միացված չէ։</p>
  </main>
</template>

<style scoped>
.profile-entry.is-removing { pointer-events: none; }
.profile-heading { margin-bottom: 28px; }.profile-eyebrow { display: block; font-size: 10px; letter-spacing: 1.2px; margin-bottom: 14px; }.profile-heading .heading { margin-bottom: 12px; }.profile-heading > p { font-size: 13px; line-height: 1.9; }
.profile-categories { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 38px; }.profile-categories button { display: flex; align-items: center; gap: 8px; border: 1px solid #8997c044; border-radius: 13px; padding: 12px 15px; font-size: 12px; }.profile-categories button.is-active { border-color: #dfc38f; color: #dfc38f; background: #dfc38f0f; }.profile-categories button > span { min-width: 23px; padding: 2px 6px; border-radius: 7px; background: #8997c01c; font-size: 10px; text-align: center; }
.profile-section { margin-top: 32px; }.profile-section-heading { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }.profile-section-icon { display: grid; place-items: center; width: 47px; height: 47px; border-radius: 14px; background: #dfc38f0d; border: 1px solid #dfc38f44; color: #dfc38f; flex-shrink: 0; }.profile-section-heading h2 { font-size: 22px; font-weight: 750; }.profile-section-heading h2 span { font-size: 12px; font-weight: 500; margin-left: 8px; color: #dfc38f; }.profile-section-heading p { font-size: 11px; margin-top: 6px; }
.profile-entry-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }.profile-entry { padding: 22px; min-width: 0; }.profile-entry-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; font-size: 10px; }.profile-remove { display: flex; align-items: center; gap: 6px; opacity: .65; }.profile-remove:hover { opacity: 1; color: #fb7185; }.profile-entry-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; font-size: 15px; line-height: 1.9; font-weight: 700; }.profile-entry-title:hover { color: #dfc38f; }.profile-entry-title svg { flex-shrink: 0; margin-top: 5px; color: #dfc38f; }
.profile-answer { margin-top: 18px; padding: 14px; border: 1px solid #86c6a244; background: #86c6a20a; border-radius: 12px; }.profile-answer > span { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #86c6a2; }.profile-answer strong { display: block; margin-top: 8px; font-size: 13px; line-height: 1.8; }.profile-explanation { font-size: 12px; line-height: 1.9; margin-top: 14px; opacity: .8; }
.profile-empty { display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; padding: 35px 25px; }.profile-empty > svg { color: #dfc38f; }.profile-empty h2 { font-size: 21px; font-weight: 700; }.profile-empty p { font-size: 13px; line-height: 1.9; max-width: 65ch; }.profile-empty a { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }.profile-storage-note { margin-top: 35px; font-size: 11px; line-height: 1.9; }
.profile-page :is(button,a):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
@media(max-width:700px) { .profile-entry-grid { grid-template-columns: 1fr; }.profile-categories { gap: 8px; }.profile-categories button { padding: 10px 12px; font-size: 11px; }.profile-entry { padding: 19px; } }
:global(html.factum-light .profile-categories button.is-active) { color: #8b6027; border-color: #8b6027; }
:global(html.factum-light .profile-answer > span) { color: #24713e; }
</style>
