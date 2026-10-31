<script setup lang="ts">
import { BookOpen, ArrowRight, ArrowUpRight, Search, ScrollText, Sparkles, Leaf, Mountain, Sun, Check, Bookmark, Clock3, ChevronLeft, ChevronRight, ChevronDown, Library, Undo2 } from 'lucide-vue-next'
import { bibleBooks, bibleCommandments, bibleTimeline, bibleReadingPaths, testamentNames, bibleProgressKey, bibleIntroduction, bibleVersionUrl, etchmiadzinUrl, clampBibleChapter, type Testament } from '~/data/bible'

useHead({ title: 'Աստվածաշունչ — Հին և Նոր Կտակարան · FACTUM', meta: [{ name: 'description', content: 'Բացահայտիր Հին և Նոր Կտակարանների գրքերը, ընտրիր ընթերցման ճանապարհ և ուսումնասիրիր աստվածաշնչյան ժամանակագիծը։' }] })
const { read, saved, markRead, removeRead, toggleSaved } = useProgress()
const route = useRoute()
const linkedBook = bibleBooks.find(book => book.id === route.query.book)
const testament = ref<Testament>(linkedBook?.testament ?? 'old')
const search = ref('')
const category = ref('Բոլորը')
const selectedId = ref(linkedBook?.id ?? 'genesis')
const bookList = ref<HTMLElement | null>(null)
const chapter = ref(clampBibleChapter(linkedBook ?? bibleBooks[0]!, Number(route.query.chapter)))
const timelineFilter = ref('all')
const showReadChapters = ref(false)
const selected = computed(() => bibleBooks.find(book => book.id === selectedId.value)!)
const categories = computed(() => ['Բոլորը', ...new Set(bibleBooks.filter(book => book.testament === testament.value).map(book => book.category))])
const visibleBooks = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('hy')
  return bibleBooks.filter(book => book.testament === testament.value && (category.value === 'Բոլորը' || book.category === category.value) && (!term || [book.name, book.code, book.category].some(value => value.toLocaleLowerCase('hy').includes(term))))
})
async function revealActiveBook() {
  await nextTick()
  const list = bookList.value
  const active = list?.querySelector<HTMLElement>('.bible-book.is-active')
  if (!list || !active) return
  const bounds = list.getBoundingClientRect()
  const item = active.getBoundingClientRect()
  if (item.top >= bounds.top && item.bottom <= bounds.top + list.clientHeight) return
  list.scrollTo({
    top: list.scrollTop + item.top - bounds.top - (list.clientHeight - item.height) / 2,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}
onMounted(revealActiveBook)
watch([selectedId, visibleBooks], revealActiveBook, { flush: 'post' })
const progressKey = computed(() => bibleProgressKey(selected.value, chapter.value))
const isRead = computed(() => read.value.includes(progressKey.value))
const isSaved = computed(() => saved.value.includes(progressKey.value))
const savedKeys = computed(() => new Set(saved.value))
const savedBooks = computed(() => new Set(bibleBooks.filter(book =>
  Array.from({length: book.chapters}, (_, i) => bibleProgressKey(book, i + 1)).some(key => savedKeys.value.has(key))
).map(book => book.id)))
const validChapterKeys = new Set(bibleBooks.flatMap(book => Array.from({length: book.chapters}, (_, i) => bibleProgressKey(book, i + 1))))
const readCount = computed(() => new Set(read.value.filter(key => validChapterKeys.has(key))).size)
watch(readCount, (count, previous) => {
  if (previous > 0 && count === 0) showReadChapters.value = false
}, { flush: 'sync' })
const readChapterGroups = computed(() => {
  const keys = new Set(read.value)
  return bibleBooks.map(book => ({
    book,
    chapters: Array.from({length:book.chapters},(_,index)=>index+1).filter(number=>keys.has(bibleProgressKey(book,number))),
  })).filter(group=>group.chapters.length)
})
function openReadChapter(bookId: string, number: number) {
  showReadChapters.value = false
  selectBook(bookId,number,true)
}
const chapterTotal = bibleBooks.reduce((total, book) => total + book.chapters, 0)
const visibleTimeline = computed(() => bibleTimeline.filter(event => timelineFilter.value === 'all' || event.era === timelineFilter.value))
const timelineFilters = [{id:'all',label:'Ամբողջ ճանապարհը'},{id:'old',label:'Հին Կտակարան'},{id:'new',label:'Նոր Կտակարան'},{id:'armenian',label:'Հայերեն ժառանգություն'}]
const pathIcons = {sun:Sun,sparkles:Sparkles,leaf:Leaf,mountain:Mountain}
async function scrollTo(id: string) {
  await nextTick()
  const element = document.getElementById(id)
  element?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'})
  element?.focus({preventScroll:true})
}
function selectTestament(value: Testament, jump = false) {
  testament.value = value
  search.value = ''
  category.value = 'Բոլորը'
  selectedId.value = bibleBooks.find(book => book.testament === value)!.id
  chapter.value = 1
  if (jump) void scrollTo('bible-library')
}
function selectBook(id: string, number = 1, jump = false) {
  const book = bibleBooks.find(item => item.id === id)
  if (!book) return
  selectedId.value = id
  chapter.value = clampBibleChapter(book,number)
  if (testament.value !== book.testament || jump) {
    testament.value = book.testament
    category.value = 'Բոլորը'
    search.value = ''
  }
  if (jump) void scrollTo('bible-reader')
}
function changeReadingChapter(delta: number) {
  chapter.value = clampBibleChapter(selected.value,chapter.value + delta)
  void scrollTo('bible-current-chapter')
}
function toggleRead() { if (isRead.value) removeRead(progressKey.value); else markRead(progressKey.value) }
function readInBook(book: typeof bibleBooks[number]) { return Array.from({length:book.chapters},(_,i)=>bibleProgressKey(book,i+1)).filter(key=>read.value.includes(key)).length }
useSavedScroll(
  () => bibleBooks.some(book => book.id === route.query.book) ? 'bible-reader' : undefined,
  () => {
    search.value = ''
    category.value = 'Բոլորը'
    selectBook(String(route.query.book), Number(route.query.chapter))
  },
)

</script>

<template>
  <main class="shell bible-page">
    <section class="bible-hero" aria-labelledby="bible-title">
      <img class="bible-hero-image" src="/images/bible.jpg" alt="Բացված զարդանկար Աստվածաշունչ՝ եկեղեցական միջավայրում, գեղարվեստական պատկեր" fetchpriority="high" />
      <div class="bible-hero-shade" aria-hidden="true" />
      <div class="bible-hero-copy">
        <span class="bible-eyebrow"><BookOpen :size="16" /> ՀԱՎԱՏՔ · ՊԱՏՄՈՒԹՅՈՒՆ · ԻՄԱՍՏՈՒԹՅՈՒՆ</span>
        <h1 id="bible-title">Աստվածաշունչ</h1>
        <p class="bible-hero-subtitle">Մի գիրք։ Դարերի ճանապարհ։</p>
        <p class="bible-hero-description">Բացահայտիր Հին և Նոր Կտակարանների պատմությունները, գտիր քո ընթերցման սկիզբը և հետևիր իրադարձությունների ընթացքին։</p>
        <div class="bible-hero-actions"><a href="#bible-library" class="btn" @click.prevent="scrollTo('bible-library')"><BookOpen :size="17" /> Բացել գրքերը</a><a href="#bible-commandments" class="bible-hero-timeline" @click.prevent="scrollTo('bible-commandments')"><ScrollText :size="17" /> Տասը պատվիրանները</a><a href="#bible-timeline" class="bible-hero-timeline" @click.prevent="scrollTo('bible-timeline')"><Clock3 :size="17" /> Տեսնել ժամանակագիծը</a></div>
      </div>
      <div class="bible-hero-foot"><span>ԵՐԿՈՒ ԿՏԱԿԱՐԱՆ · ՄԵԿ ՀՈԳԵՎՈՐ ՃԱՆԱՊԱՐՀ</span><span>FACTUM / ՍՈՒՐԲ ԳԻՐՔ</span></div>
    </section>

    <section class="bible-testaments" aria-label="Ընտրիր Կտակարանը">
      <button type="button" class="bible-testament" :class="{'is-selected':testament === 'old'}" @click="selectTestament('old',true)">
        <img src="/images/bible/old-testament.png" alt="Անապատային ճանապարհ ու լեռներ՝ Հին Կտակարանի թեմատիկ պատկեր" loading="lazy" />
        <div class="bible-testament-shade" aria-hidden="true" /><div class="bible-testament-copy"><span>ՍԿԶԲՆԱՎՈՐՈՒՄ · ՈՒԽՏ · ԻՄԱՍՏՈՒԹՅՈՒՆ</span><h2>Հին Կտակարան</h2><p>Նահապետներից և մարգարեներից մինչև կյանքի մեծ հարցերը։</p><strong>Բացահայտել գրքերը <ArrowRight :size="17" /></strong></div>
      </button>
      <button type="button" class="bible-testament" :class="{'is-selected':testament === 'new'}" @click="selectTestament('new',true)">
        <img src="/images/bible/new-testament.png" alt="Գալիլեայի լճի ափն ու ձկնորսական նավակ՝ Նոր Կտակարանի թեմատիկ պատկեր" loading="lazy" />
        <div class="bible-testament-shade" aria-hidden="true" /><div class="bible-testament-copy"><span>ԱՎԵՏԱՐԱՆ · ՍԵՐ · ՀՈՒՅՍ</span><h2>Նոր Կտակարան</h2><p>Հիսուսի կյանքը, ուսուցումը և առաջին քրիստոնեական համայնքները։</p><strong>Բացահայտել գրքերը <ArrowRight :size="17" /></strong></div>
      </button>
    </section>

    <section id="bible-commandments" class="bible-commandments" tabindex="-1" aria-labelledby="bible-commandments-title">
      <div class="bible-section-heading"><div><span class="bible-eyebrow">ՀԱՎԱՏՔ ԵՎ ԿՅԱՆՔԻ ՈՒՂԵՆԻՇՆԵՐ</span><h2 id="bible-commandments-title">Տասը պատվիրանները</h2></div><ScrollText :size="25" aria-hidden="true" /></div>
      <p class="bible-commandments-intro">Աշխարհաբար համառոտ շարադրանք՝ ըստ Ելք 20:1–17-ի։ Ամբողջական աստվածաշնչյան տեքստը կարող ես կարդալ ստորև նշված գլուխներում։</p>
      <figure class="bible-commandments-image">
        <img src="/images/Stone_tablets.jpg" alt="Տասը պատվիրանների քարե տախտակների գեղարվեստական պատկեր" width="1376" height="768" loading="lazy" />
      </figure>
      <ol class="bible-commandments-grid">
        <li v-for="commandment in bibleCommandments" :key="commandment.number" class="panel bible-commandment">
          <span class="bible-commandment-number" aria-hidden="true">{{String(commandment.number).padStart(2,'0')}}</span>
          <div><h3>{{commandment.title}}</h3><p>{{commandment.text}}</p><small>{{commandment.reference}}</small></div>
        </li>
      </ol>
      <div class="bible-commandments-links">
        <button type="button" class="btn-secondary" @click="selectBook('exodus',20,true)"><BookOpen :size="16" /> Կարդալ Ելք 20-ը</button>
        <button type="button" class="btn-secondary" @click="selectBook('deuteronomy',5,true)"><BookOpen :size="16" /> Կարդալ Երկրորդ Օրենք 5-ը</button>
      </div>
    </section>

    <section class="bible-paths" aria-labelledby="bible-paths-title">
      <div class="bible-section-heading"><div><span class="bible-eyebrow">ՍԿՍԻՐ ՔԵԶ ՄՈՏ ԹԵՄԱՅԻՑ</span><h2 id="bible-paths-title">Որտեղի՞ց սկսել ընթերցումը</h2></div><Sparkles :size="24" aria-hidden="true" /></div>
      <div class="bible-path-grid"><button v-for="path in bibleReadingPaths" :key="path.id" class="panel bible-path" @click="selectBook(path.book,path.chapter,true)"><component :is="pathIcons[path.icon as keyof typeof pathIcons]" :size="24" /><h3>{{path.title}}</h3><p>{{path.subtitle}}</p><span>Բացել ուղեցույցը <ArrowRight :size="15" /></span></button></div>
    </section>

    <section id="bible-library" class="bible-library" tabindex="-1" aria-labelledby="bible-library-title">
      <div class="bible-section-heading"><div><span class="bible-eyebrow">ՔՈ ԱՆՁՆԱԿԱՆ ԸՆԹԵՐՑՄԱՆ ՃԱՆԱՊԱՐՀԸ</span><h2 id="bible-library-title">Սուրբ Գրքի գրադարանը</h2></div><button type="button" class="bible-progress" :disabled="readCount === 0" :aria-expanded="showReadChapters" aria-controls="bible-read-chapters" :title="readCount ? 'Տեսնել ընթերցված գլուխները' : 'Դեռ ընթերցված գլուխներ չկան'" @click="readCount > 0 && (showReadChapters = !showReadChapters)"><BookOpen :size="17" /> {{readCount}} / {{chapterTotal}} գլուխ՝ ընթերցված <ChevronDown :size="15" class="bible-progress-chevron" /></button></div>
      <section v-if="showReadChapters" id="bible-read-chapters" class="bible-read-panel" aria-labelledby="bible-read-title">
        <h3 id="bible-read-title">Ընթերցված գլուխներ <span>{{readCount}}</span></h3>
        <p v-if="!readChapterGroups.length" class="bible-read-empty">Դեռ ընթերցված գլուխներ չկան։ Կարդացած գլուխները կարող ես նշել «Նշել ընթերցված» կոճակով։</p>
        <div v-else class="bible-read-list">
          <div v-for="group in readChapterGroups" :key="group.book.id" class="bible-read-book">
            <h4>{{group.book.name}}</h4>
            <div class="bible-read-links">
              <div v-for="number in group.chapters" :key="number" class="bible-read-chapter">
                <button type="button" :aria-label="`${group.book.name}՝ գլուխ ${number}, բացել ընթերցված գլուխը`" @click="openReadChapter(group.book.id,number)"><Check :size="13" aria-hidden="true" /> Գլուխ {{number}} <ArrowRight :size="13" aria-hidden="true" /></button>
                <button type="button" class="bible-mark-unread" :aria-label="`${group.book.name}՝ գլուխ ${number}, նշել չընթերցված`" @click="removeRead(bibleProgressKey(group.book,number))"><Undo2 :size="13" aria-hidden="true" /> Նշել չընթերցված</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div class="bible-library-toolbar"><div class="bible-tabs" role="group" aria-label="Կտակարանի ընտրություն"><button v-for="(label,key) in testamentNames" :key="key" :aria-pressed="testament === key" :class="{'is-active':testament === key}" @click="selectTestament(key)">{{label}}</button></div><label class="bible-book-search"><Search :size="17" aria-hidden="true" /><span class="sr-only">Գտնել գիրք</span><input v-model="search" type="search" placeholder="Գտիր գիրքը…" /></label></div>
      <div class="bible-categories" role="group" aria-label="Գրքերի տեսակներ"><button v-for="item in categories" :key="item" :aria-pressed="category === item" :class="{'is-active':category === item}" @click="category = item">{{item}}</button></div>
      <div class="bible-library-grid">
        <div class="panel bible-book-list"><div class="bible-book-list-heading"><Library :size="17" /><span>{{testamentNames[testament]}}</span><small>{{visibleBooks.length}} գիրք</small></div><div ref="bookList" class="bible-book-scroll"><button v-for="(book,i) in visibleBooks" :key="book.id" class="bible-book" :class="{'is-active':selected.id === book.id,'is-saved':savedBooks.has(book.id)}" :aria-pressed="selected.id === book.id" @click="selectBook(book.id)"><span class="bible-book-index">{{String(i+1).padStart(2,'0')}}</span><span><strong>{{book.name}}</strong><span v-if="savedBooks.has(book.id)" class="bible-book-saved"><Bookmark :size="11" fill="currentColor" aria-hidden="true" /> Պահպանված գլուխ կա</span><small>{{book.chapters}} գլուխ <span v-if="readInBook(book)">· {{readInBook(book)}} ընթերցված</span></small></span><ChevronRight :size="16" /></button><p v-if="!visibleBooks.length" class="bible-empty">Գիրք չի գտնվել։<button class="gold" @click="search='';category='Բոլորը'">Մաքրել որոնումը</button></p></div></div>
        <article id="bible-reader" class="panel bible-reader" tabindex="-1" aria-labelledby="bible-reader-title">
          <div class="bible-reader-cover"><img :src="selected.testament === 'old' ? '/images/bible/old-testament.png' : '/images/bible/new-testament.png'" alt="" loading="lazy" /><div class="bible-reader-cover-shade" /><div><span>{{testamentNames[selected.testament]}} · {{selected.category}}</span><h3 id="bible-reader-title">{{selected.name}}</h3><p>{{selected.chapters}} գլուխ</p></div><BookOpen :size="40" aria-hidden="true" /></div>
          <div class="bible-reader-body"><h4>Գրքի մասին</h4><p class="bible-book-introduction">{{bibleIntroduction(selected)}}</p>
            <div class="bible-chapter-heading"><h4>Ընտրիր գլուխը</h4><span>{{chapter}} / {{selected.chapters}}</span></div>
            <div class="bible-chapters" role="group" :aria-label="`${selected.name}՝ գլուխներ`"><button v-for="n in selected.chapters" :key="n" :aria-label="`Գլուխ ${n}${read.includes(bibleProgressKey(selected,n)) ? '․ ընթերցված' : ''}${savedKeys.has(bibleProgressKey(selected,n)) ? '․ պահպանված' : ''}`" :aria-pressed="chapter === n" :class="{'is-active':chapter === n,'is-read':read.includes(bibleProgressKey(selected,n)),'is-saved':savedKeys.has(bibleProgressKey(selected,n))}" @click="chapter=n">{{n}}<Bookmark v-if="savedKeys.has(bibleProgressKey(selected,n))" class="bible-chapter-bookmark" :size="10" fill="currentColor" aria-hidden="true" /><Check v-if="read.includes(bibleProgressKey(selected,n))" :size="9" /></button></div>
            <div id="bible-current-chapter" class="bible-chapter-current saved-destination" tabindex="-1"><span><ScrollText :size="17" /> {{selected.name}} · Գլուխ {{chapter}}</span><div><button :disabled="chapter === 1" aria-label="Նախորդ գլուխ" @click="chapter--"><ChevronLeft :size="17" /></button><button :disabled="chapter === selected.chapters" aria-label="Հաջորդ գլուխ" @click="chapter++"><ChevronRight :size="17" /></button></div></div>
            <BibleChapterReader :book="selected" :chapter="chapter" @previous="changeReadingChapter(-1)" @completed="markRead(progressKey)" @next="changeReadingChapter(1)" />
            <div class="bible-reader-actions"><button :aria-pressed="isRead" @click="toggleRead"><Check :size="16" /> {{isRead ? 'Ընթերցված է' : 'Նշել ընթերցված'}}</button><button :aria-pressed="isSaved" @click="toggleSaved(progressKey, $event)"><Bookmark :size="16" :fill="isSaved ? 'currentColor' : 'none'" /> {{isSaved ? 'Պահպանված է' : 'Պահպանել Իմ FACTUM-ում'}}</button></div>
          </div>
        </article>
      </div>
      <p class="bible-edition-note">Ընթերցման տեքստը՝ ժամանակակից արևելահայերենով՝ <a :href="bibleVersionUrl" target="_blank" rel="noopener noreferrer">«Նոր վերանայված Արարատ» հրատարակությամբ</a> (Հայաստանի Աստվածաշնչային ընկերություն, 2018)։ Նախընտրո՞ւմ ես այլ տարբերակ․ <a :href="etchmiadzinUrl" target="_blank" rel="noopener noreferrer">բացիր «Նոր Էջմիածին»-ը՝ նաև երկրորդական կանոնական գրքերով ↗</a>։</p>
    </section>

    <section id="bible-timeline" class="bible-timeline-section" tabindex="-1" aria-labelledby="bible-timeline-title">
      <div class="bible-section-heading"><div><span class="bible-eyebrow">ՊԱՏՄՈՒԹՅՈՒՆՆԵՐԻՑ ԴԵՊԻ ՊԱՏՄՈՒԹՅՈՒՆ</span><h2 id="bible-timeline-title">Դարերի ճանապարհը</h2></div><Clock3 :size="25" aria-hidden="true" /></div>
      <p class="bible-timeline-intro">Հետևիր հիմնական հանգրվաններին և յուրաքանչյուրից բացիր համապատասխան գրքի ուղեցույցը։ Պատումային շրջանները օրացուցային ճշգրիտ թվագրումներ չեն։</p>
      <div class="bible-categories" role="group" aria-label="Ժամանակագծի բաժիններ"><button v-for="filter in timelineFilters" :key="filter.id" :aria-pressed="timelineFilter === filter.id" :class="{'is-active':timelineFilter === filter.id}" @click="timelineFilter=filter.id">{{filter.label}}</button></div>
      <div class="bible-timeline-layout"><aside class="bible-timeline-art"><img src="/images/bible.jpg" alt="Զարդանկար մատյանի գեղարվեստական պատկեր" width="1376" height="768" loading="lazy" /><div><ScrollText :size="30" /><h3>Յուրաքանչյուր էջ՝<br />մի պատմություն</h3><p>Մարդկանց, ընտրությունների, հավատքի և հույսի մասին։</p></div></aside><ol class="bible-timeline"><li v-for="(event,i) in visibleTimeline" :key="event.id"><span class="bible-timeline-dot" aria-hidden="true">{{String(i+1).padStart(2,'0')}}</span><article class="panel bible-event"><span class="bible-event-period">{{event.period}}</span><h3>{{event.title}}</h3><p>{{event.description}}</p><button v-if="event.book" @click="selectBook(event.book,event.chapter,true)">{{event.reference}} <ArrowRight :size="14" /></button><a v-else href="https://armenianchurch.us/still-mightier-than-the-sword/" target="_blank" rel="noopener noreferrer">{{event.reference}} <ArrowUpRight :size="14" /></a></article></li></ol></div>
    </section>
    <footer class="bible-page-notes"><p>Պատկերները գեղարվեստական մեկնաբանություններ են։ Ընթերցման նշումներն ու պահպանված գլուխները պահվում են այս բրաուզերում։</p><p>Աղբյուրներ՝ <a href="https://biblesociety.am/eng/1/Main" target="_blank" rel="noopener noreferrer">Հայաստանի Աստվածաշնչային Ընկերություն</a> · <a href="https://www.americanbible.org/engage/bible-resources/articles/chronological-reading-plan/" target="_blank" rel="noopener noreferrer">Ժամանակագրական ուղեցույց</a> · <a href="https://armenianchurch.us/still-mightier-than-the-sword/" target="_blank" rel="noopener noreferrer">Հայ թարգմանիչները</a></p></footer>
  </main>
</template>

<style scoped>
.bible-commandments { margin-top: 46px; scroll-margin-top: 100px; }
.bible-commandments-intro { max-width: 760px; margin: 14px 0 22px; font-size: 12px; line-height: 1.9; opacity: .75; }
.bible-commandments-image { margin: 0 0 22px; overflow: hidden; border: 1px solid #dfc38f44; border-radius: 18px; }
.bible-commandments-image img { display: block; width: 100%; height: clamp(220px,30vw,380px); object-fit: cover; object-position: center; }
.bible-commandments-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; list-style: none; padding: 0; margin: 0; }
.bible-commandment { display: flex; align-items: flex-start; gap: 14px; padding: 18px; }
.bible-commandment-number { flex-shrink: 0; color: var(--bible-gold,#dfc38f); font-size: 23px; line-height: 1.4; font-weight: 750; opacity: .8; }
.bible-commandment h3 { font-size: 14px; line-height: 1.7; font-weight: 700; }
.bible-commandment p { margin-top: 6px; font-size: 12px; line-height: 1.9; }
.bible-commandment small { display: block; margin-top: 8px; color: var(--bible-gold,#dfc38f); font-size: 10px; }
.bible-commandments-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.bible-commandments-links button { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
@media(max-width:700px) { .bible-commandments-grid { grid-template-columns: 1fr; } }
.bible-page { --bible-gold: #dfc38f; max-width: 1320px; }
.bible-hero { position: relative; min-height: 470px; border: 1px solid #dfc38f44; border-radius: 24px; overflow: hidden; background: #081020; color: #f9f1e4; }
.bible-hero-image,.bible-hero-shade { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bible-hero-image { object-position: center 56%; }
.bible-hero-shade { background: linear-gradient(90deg,#06101bf2, #06101bc9 38%,#06101b25 76%),linear-gradient(0deg,#06101bf0,transparent 30%); }
.bible-hero-copy { position: relative; max-width: 660px; padding: 55px 46px 95px; }
.bible-eyebrow { display: flex; align-items: center; gap: 9px; color: var(--bible-gold); font-size: 10px; font-weight: 650; letter-spacing: 1.4px; line-height: 1.8; }
.bible-hero h1 { margin: 27px 0 10px; font-size: clamp(32px,4.8vw,60px); font-weight: 850; letter-spacing: -1.5px; }
.bible-hero-subtitle { font-size: clamp(16px,2vw,23px); color: #e9d4b3; }
.bible-hero-description { font-size: 14px; line-height: 2; margin-top: 18px; max-width: 48ch; color: #c7cbd1; }
.bible-hero-actions { display: flex; flex-wrap: wrap; gap: 22px; align-items: center; margin-top: 28px; }
.bible-hero-actions .btn,.bible-hero-timeline { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
.bible-hero-timeline { color: #ead8b7; }
.bible-hero-foot { position: absolute; bottom: 0; inset-inline: 0; display: flex; justify-content: space-between; gap: 14px; padding: 20px 46px; border-top: 1px solid #dfc38f26; font-size: 9px; letter-spacing: 1.5px; color: #c6bda9; }
.bible-testaments { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 24px; }
.bible-testament { position: relative; min-height: 290px; border: 1px solid #8997c044; border-radius: 20px; overflow: hidden; text-align: left; color: #f9f1e4; background: #081020; }
.bible-testament img,.bible-testament-shade { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bible-testament-shade { background: linear-gradient(0deg,#040d1af5, #040d1a99 45%,#040d1a08); }
.bible-testament.is-selected,.bible-testament:hover { border-color: var(--bible-gold); }
.bible-testament-copy { position: relative; padding: 90px 28px 28px; }
.bible-testament-copy > span { font-size: 9px; color: #f0d7ae; letter-spacing: 1px; }
.bible-testament h2 { font-size: 30px; font-weight: 850; margin: 12px 0; }
.bible-testament p { max-width: 45ch; font-size: 12px; line-height: 1.9; color: #d3d6dd; }
.bible-testament strong { display: flex; gap: 9px; align-items: center; font-size: 12px; color: #f0d7ae; margin-top: 18px; }
.bible-paths,.bible-library,.bible-timeline-section { margin-top: 55px; scroll-margin-top: 25px; }
.bible-section-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 23px; }
.bible-section-heading h2 { margin-top: 9px; font-size: clamp(22px,2.7vw,31px); font-weight: 800; }
.bible-section-heading > svg { color: var(--bible-gold); flex-shrink: 0; }
.bible-path-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }
.bible-path { padding: 24px 20px; text-align: left; }
.bible-path > svg { color: var(--bible-gold); margin-bottom: 22px; }
.bible-path h3 { font-size: 15px; font-weight: 750; line-height: 1.7; }
.bible-path p { font-size: 11px; line-height: 1.9; margin: 9px 0 18px; }
.bible-path span { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--bible-gold); }
.bible-path:hover { border-color: var(--bible-gold); }
.bible-progress { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #dfc38f55; border-radius: 24px; background: #dfc38f0a; cursor: pointer; font-size: 11px; color: var(--bible-gold); }
.bible-progress:hover:not(:disabled),.bible-progress[aria-expanded="true"] { border-color: var(--bible-gold); background: #dfc38f14; }
.bible-progress:disabled { cursor: default; opacity: .65; }
.bible-progress:disabled .bible-progress-chevron { display: none; }
.bible-progress-chevron { transition: transform .2s ease; }
.bible-progress[aria-expanded="true"] .bible-progress-chevron { transform: rotate(180deg); }
.bible-read-panel { margin: 18px 0 24px; padding: 20px; border: 1px solid #dfc38f44; border-radius: 16px; background: #dfc38f08; }
.bible-read-panel h3 { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 15px; font-weight: 700; }
.bible-read-panel h3 span { color: var(--bible-gold); font-size: 12px; }
.bible-read-list { max-height: 320px; overflow-y: auto; scrollbar-width: thin; padding-right: 8px; }
.bible-read-book + .bible-read-book { margin-top: 18px; }
.bible-read-book h4 { margin-bottom: 9px; font-size: 13px; font-weight: 650; }
.bible-read-links { display: flex; flex-wrap: wrap; gap: 8px; }
.bible-read-links button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px; border: 1px solid #8997c044; border-radius: 9px; color: var(--bible-gold); font-size: 11px; }
.bible-read-links button:hover { border-color: var(--bible-gold); background: #dfc38f12; }
.bible-read-chapter { display: inline-flex; flex-wrap: wrap; border: 1px solid #8997c044; border-radius: 9px; overflow: hidden; }
.bible-read-chapter button { border: 0; border-radius: 0; }
.bible-read-chapter .bible-mark-unread { border-left: 1px solid #8997c044; font-size: 10px; }
.bible-read-empty { font-size: 12px; line-height: 1.9; opacity: .75; }
.bible-library-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.bible-tabs { display: flex; padding: 5px; background: #8997c014; border: 1px solid #8997c033; border-radius: 14px; gap: 4px; }
.bible-tabs button { padding: 11px 16px; font-size: 12px; border: 1px solid transparent; border-radius: 10px; }
.bible-tabs button.is-active { border-color: #dfc38f66; color: var(--bible-gold); background: #dfc38f10; }
.bible-book-search { display: flex; align-items: center; gap: 10px; border: 1px solid #8997c044; border-radius: 12px; padding: 12px 15px; max-width: 320px; width: 100%; }
.bible-book-search input { background: transparent; min-width: 0; width: 100%; font-size: 12px; color: inherit; outline: none; }
.bible-book-search:focus-within { border-color: #f4c46c; }
.bible-book-search > svg { color: var(--bible-gold); flex-shrink: 0; }
.bible-categories { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
.bible-categories button { font-size: 11px; padding: 8px 12px; border: 1px solid #8997c033; border-radius: 22px; }
.bible-categories button.is-active { color: var(--bible-gold); border-color: #dfc38f88; background: #dfc38f0d; }
.bible-library-grid { display: grid; grid-template-columns: minmax(260px,.8fr) minmax(0,1.7fr); gap: 22px; align-items: start; }
.bible-book-list { overflow: hidden; }
.bible-book-list-heading { display: flex; align-items: center; gap: 9px; padding: 20px; border-bottom: 1px solid #8997c026; color: var(--bible-gold); font-size: 12px; }
.bible-book-list-heading small { margin-left: auto; font-size: 10px; }
.bible-book-scroll { max-height: 650px; overflow-y: auto; scrollbar-width: thin; padding: 7px; }
.bible-book { display: flex; align-items: center; gap: 12px; text-align: left; padding: 14px 12px; width: 100%; border: 1px solid transparent; border-radius: 12px; }
.bible-book.is-active { border-color: #dfc38f66; background: #dfc38f0d; }
.bible-book.is-saved { background: #dfc38f0c; box-shadow: inset 3px 0 0 var(--bible-gold); }
.bible-book.is-saved.is-active { border-color: var(--bible-gold); background: #dfc38f20; }
.bible-book-saved { display: flex; align-items: center; gap: 5px; color: var(--bible-gold); font-size: 9px; margin-top: 6px; }
.bible-book:hover { background: #8997c012; }
.bible-book-index { font-size: 10px; color: var(--bible-gold); font-variant-numeric: tabular-nums; }
.bible-book strong { display: block; font-size: 12px; font-weight: 700; }
.bible-book small { display: block; font-size: 10px; margin-top: 5px; opacity: .65; }
.bible-book > svg { margin-left: auto; color: var(--bible-gold); flex-shrink: 0; }
.bible-empty { padding: 24px 15px; font-size: 12px; line-height: 1.9; }.bible-empty button { display: block; margin-top: 12px; }
.bible-reader { overflow: hidden; scroll-margin-top: 25px; }
.bible-reader-cover { position: relative; min-height: 190px; display: flex; align-items: flex-end; justify-content: space-between; padding: 26px; color: #f9f1e4; }
.bible-reader-cover > img,.bible-reader-cover-shade { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }.bible-reader-cover-shade { background: linear-gradient(0deg,#071222f5,#07122245); }
.bible-reader-cover > div:not(.bible-reader-cover-shade),.bible-reader-cover > svg { position: relative; }.bible-reader-cover > svg { color: #e9cfa0; }
.bible-reader-cover span,.bible-reader-cover p { font-size: 10px; color: #e9d5b5; }.bible-reader-cover h3 { font-size: 31px; font-weight: 800; margin: 10px 0; }
.bible-reader-body { padding: 28px; }.bible-reader-body h4 { font-size: 13px; font-weight: 750; }.bible-book-introduction { margin: 13px 0 26px; font-size: 13px; line-height: 2; }
.bible-chapter-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }.bible-chapter-heading span { font-size: 11px; color: var(--bible-gold); }
.bible-chapters { display: grid; grid-template-columns: repeat(auto-fill,minmax(38px,1fr)); gap: 7px; max-height: 235px; overflow-y: auto; scrollbar-width: thin; padding: 2px; }
.bible-chapters button { position: relative; min-height: 38px; border: 1px solid #8997c033; border-radius: 8px; font-size: 11px; }.bible-chapters button.is-active { border-color: var(--bible-gold); background: #dfc38f1a; color: var(--bible-gold); }.bible-chapters button.is-read { border-bottom-color: #86c6a2; }.bible-chapters svg { position: absolute; right: 3px; bottom: 3px; color: #86c6a2; }
.bible-chapters button.is-saved { border-color: #dfc38f99; background: #dfc38f0d; }
.bible-chapters button.is-saved.is-active { background: #dfc38f30; border-color: var(--bible-gold); }
.bible-chapters .bible-chapter-bookmark { top: 3px; bottom: auto; color: var(--bible-gold); }
.bible-chapter-current { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin: 24px 0 16px; padding-top: 20px; border-top: 1px solid #8997c026; }.bible-chapter-current > span { display: flex; align-items: center; gap: 8px; font-size: 12px; }.bible-chapter-current > div { display: flex; gap: 6px; }.bible-chapter-current button { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid #8997c033; border-radius: 8px; }.bible-chapter-current button:disabled { opacity: .3; }
.bible-reader-actions { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 20px; }.bible-reader-actions button { display: flex; align-items: center; gap: 7px; font-size: 10px; }.bible-reader-actions button[aria-pressed=true] { color: var(--bible-gold); }
.bible-edition-note { font-size: 10px; line-height: 2; opacity: .75; margin-top: 18px; }.bible-edition-note a { color: var(--bible-gold); text-decoration: underline; text-underline-offset: 3px; }
.bible-timeline-intro { font-size: 13px; line-height: 2; max-width: 80ch; }
.bible-timeline-layout { display: grid; grid-template-columns: .8fr 1.7fr; gap: 40px; align-items: start; margin-top: 30px; }
.bible-timeline-art {
  position: sticky; top: 100px; display: flex; flex-direction: column;
  min-height: 0; max-height: calc(100vh - 120px); max-height: calc(100dvh - 120px);
  border-radius: 20px; overflow: hidden; background: #071222; color: #f9f1e4;
}
.bible-timeline-art > img {
  display: block; width: 100%; height: auto; min-height: 0; flex: 0 1 auto;
  object-fit: contain; object-position: center;
}
.bible-timeline-art > div {
  position: relative; min-height: 0; flex: 0 1 auto; overflow-y: auto;
  display: flex; flex-direction: column; justify-content: flex-start;
  padding: clamp(18px,2vw,28px); background: linear-gradient(0deg,#071222,#0c1b2d);
}
.bible-timeline-art svg { color: #dfc38f; }.bible-timeline-art h3 { font-size: 27px; font-weight: 750; margin: 20px 0 12px; line-height: 1.5; }.bible-timeline-art p { font-size: 12px; line-height: 1.9; }
.bible-timeline { list-style: none; margin: 0 0 0 20px; padding: 0 0 0 30px; border-left: 1px solid #dfc38f55; }.bible-timeline li { position: relative; margin-bottom: 18px; }.bible-timeline li:last-child { margin-bottom: 0; }.bible-timeline-dot { position: absolute; left: -48px; top: 23px; display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #dfc38f88; border-radius: 50%; background: #102039; color: #dfc38f; font-size: 9px; }
.bible-event { padding: 24px; }.bible-event-period { color: var(--bible-gold); font-size: 10px; }.bible-event h3 { margin-top: 9px; font-size: 20px; font-weight: 750; }.bible-event p { margin-top: 12px; font-size: 12px; line-height: 1.9; }.bible-event button,.bible-event a { display: inline-flex; align-items: center; gap: 8px; color: var(--bible-gold); margin-top: 16px; font-size: 11px; }
.bible-page-notes { padding: 30px 0 0; margin-top: 25px; border-top: 1px solid #8997c026; font-size: 10px; line-height: 2; opacity: .7; }.bible-page-notes p + p { margin-top: 8px; }.bible-page-notes a { color: var(--bible-gold); text-decoration: underline; text-underline-offset: 3px; }
.bible-page :is(button,a):focus-visible { outline: 2px solid var(--bible-gold); outline-offset: 3px; }.bible-page :is(section,article)[tabindex='-1']:focus { outline: none; }
@media(max-width:1000px) { .bible-path-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }.bible-timeline-layout { grid-template-columns: 1fr; }.bible-timeline-art { display: none; } }
@media(max-width:700px) { .bible-hero { min-height: 460px; }.bible-hero-copy { padding: 35px 25px 95px; }.bible-hero-shade { background: linear-gradient(90deg,#06101bf0,#06101ba3),linear-gradient(0deg,#06101be6,transparent); }.bible-hero-foot { padding: 18px 25px; }.bible-hero-foot span:last-child { display: none; }.bible-testaments { grid-template-columns: 1fr; gap: 16px; }.bible-testament { min-height: 260px; }.bible-testament-copy { padding-top: 65px; }.bible-section-heading { flex-wrap: wrap; gap: 14px; }.bible-library-grid { grid-template-columns: 1fr; }.bible-book-scroll { max-height: 260px; }.bible-library-toolbar { align-items: stretch; flex-direction: column; gap: 14px; }.bible-book-search { max-width: none; }.bible-tabs { width: 100%; }.bible-tabs button { flex: 1; padding-inline: 8px; }.bible-reader-body { padding: 22px; }.bible-paths,.bible-library,.bible-timeline-section { margin-top: 38px; }.bible-timeline { padding-left: 23px; }.bible-timeline-dot { left: -41px; }.bible-event { padding: 20px; } }
@media(max-width:420px) { .bible-path-grid { grid-template-columns: 1fr; }.bible-path { display: grid; grid-template-columns: 26px 1fr; column-gap: 15px; padding: 20px; }.bible-path > svg { grid-row: span 3; margin: 3px 0 0; }.bible-path h3,.bible-path p,.bible-path span { grid-column: 2; }.bible-hero-actions { gap: 18px; }.bible-hero h1 { letter-spacing: -1px; }.bible-testament h2 { font-size: 27px; } }
:global(html.factum-light .bible-page) { --bible-gold: #8b6027; }
:global(html.factum-light .bible-hero .bible-eyebrow) { color: #dfc38f; }
</style>
