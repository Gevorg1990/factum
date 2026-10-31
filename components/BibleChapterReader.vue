<script setup lang="ts">
import { BookOpen, Minus, Plus, RefreshCw, ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-vue-next'
import type { BibleBook } from '~/data/bible'
import { bibleChapterUrl } from '~/data/bible'
import type { BibleChapterData } from '~/shared/types/bibleReader'
const props = defineProps<{ book: BibleBook; chapter: number }>()
const emit = defineEmits<{ previous: []; next: []; completed: [] }>()
const data = shallowRef<BibleChapterData | null>(null)
const loading = ref(true)
const failed = ref(false)
const failureMessage = ref('')
const sourceUrl = computed(() => bibleChapterUrl(props.book, props.chapter))
const fontSize = ref(18)
const isFullscreen = ref(false)
const fullscreenDialog = ref<HTMLDialogElement | null>(null)
const fullscreenButton = ref<HTMLButtonElement | null>(null)
let previousBodyOverflow = ''
async function openFullscreen() {
  if (isFullscreen.value || !fullscreenDialog.value) return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isFullscreen.value = true
  await nextTick()
  if (disposed) return
  fullscreenDialog.value?.showModal()
  fullscreenButton.value?.focus()
}
function closeFullscreen() {
  if (!isFullscreen.value) return
  fullscreenDialog.value?.close()
  isFullscreen.value = false
  document.body.style.overflow = previousBodyOverflow
  if (!disposed) void nextTick(() => fullscreenButton.value?.focus())
}
let controller: AbortController | undefined
let requestVersion = 0
let disposed = false
function nextChapter() {
  if (loading.value || !data.value || data.value.bookId !== props.book.id || data.value.chapter !== props.chapter || props.chapter >= props.book.chapters) return
  emit('completed')
  emit('next')
}
async function load() {
  const version = ++requestVersion
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  failed.value = false
  data.value = null
  try {
    const result = await $fetch<BibleChapterData>('/api/bible/chapter', { query:{book:props.book.id,chapter:props.chapter}, signal:controller.signal, retry:0, timeout:30000 })
    if (disposed || version !== requestVersion) return
    if (result.bookId !== props.book.id || result.chapter !== props.chapter || !result.verses.length) throw new Error('Unexpected Bible chapter')
    data.value = result
  } catch (error) {
    if (!disposed && version === requestVersion) {
      failed.value = true
      const code = (error as { data?: { data?: { code?: string } } })?.data?.data?.code
      failureMessage.value = code === 'BIBLE_SOURCE_UNAVAILABLE'
        ? 'Սերվերը չի կարողանում կապվել տեքստի աղբյուրին՝ Bible.com-ին։ Փորձիր կրկին կամ բացիր գլուխը սկզբնաղբյուրում։'
        : code === 'BIBLE_SOURCE_FORMAT'
          ? 'Չհաջողվեց մշակել սկզբնաղբյուրի տեքստը։ Գլուխը կարող ես բացել Bible.com-ում։'
          : 'Չհաջողվեց բեռնել գլուխը։ Փորձիր կրկին կամ բացիր գլուխը սկզբնաղբյուրում։'
    }
  } finally {
    if (!disposed && version === requestVersion) loading.value = false
  }
}
onMounted(load)
watch(() => [props.book.id, props.chapter], load)
onBeforeUnmount(() => { disposed = true; closeFullscreen(); requestVersion++; controller?.abort() })
</script>

<template>
  <dialog ref="fullscreenDialog" class="bible-fullscreen-dialog" :aria-label="`${book.name}՝ գլուխ ${chapter}, լիաէկրան ընթերցում`" @cancel.prevent="closeFullscreen" @close="closeFullscreen" />
  <Teleport :to="fullscreenDialog ?? 'body'" :disabled="!isFullscreen">
  <section class="bible-inline-reader" :class="{'is-fullscreen':isFullscreen}" :aria-label="`${book.name}՝ գլուխ ${chapter}`" :aria-busy="loading">
    <div class="bible-reading-toolbar"><span><BookOpen :size="17" /> {{isFullscreen ? `${book.name} · Գլուխ ${chapter}` : 'Կարդա հենց այստեղ'}}</span><div role="group" aria-label="Տառաչափ"><button type="button" :disabled="fontSize <= 16" aria-label="Փոքրացնել տառաչափը" @click="fontSize=Math.max(16,fontSize-1)"><Minus :size="15" /></button><span>{{fontSize}}</span><button type="button" :disabled="fontSize >= 26" aria-label="Մեծացնել տառաչափը" @click="fontSize=Math.min(26,fontSize+1)"><Plus :size="15" /></button><button ref="fullscreenButton" type="button" :aria-label="isFullscreen ? 'Փակել լիաէկրան ընթերցումը' : 'Կարդալ լիաէկրան'" :title="isFullscreen ? 'Փակել (Esc)' : 'Կարդալ լիաէկրան'" :aria-pressed="isFullscreen" @click="isFullscreen ? closeFullscreen() : openFullscreen()"><Minimize2 v-if="isFullscreen" :size="17" /><Maximize2 v-else :size="17" /></button></div></div>
    <p class="bible-reading-edition">Արևելահայերեն · Նոր վերանայված Արարատ</p>
    <div v-if="loading" class="bible-reading-message" role="status"><BookOpen :size="26" /><p>Բեռնում ենք {{book.name}} գրքի {{chapter}}-րդ գլուխը…</p></div>
    <div v-else-if="failed" class="bible-reading-message" role="alert"><p>{{failureMessage}}</p><button class="btn-secondary" type="button" @click="load"><RefreshCw :size="15" /> Փորձել կրկին</button><a class="btn-secondary" :href="sourceUrl" target="_blank" rel="noopener noreferrer">Բացել գլուխը Bible.com-ում <ArrowUpRight :size="15" /></a></div>
    <div v-else-if="data" :key="`${data.bookId}-${data.chapter}`" class="bible-verse-text" :style="{fontSize:`${fontSize}px`}" lang="hy" tabindex="0" role="region" :aria-label="`${book.name}՝ գլուխ ${chapter}, ընթերցման տեքստ`"><p v-for="verse in data.verses" :key="verse.number"><span class="bible-verse-number" :aria-label="`Համար ${verse.number}`">{{verse.number}}</span>{{verse.text}}</p></div>
    <div v-if="data && !loading" class="bible-reading-bottom"><button type="button" :disabled="chapter === 1" @click="emit('previous')"><ChevronLeft :size="16" /> Նախորդ գլուխը</button><button type="button" :disabled="chapter === book.chapters" @click="nextChapter">Հաջորդ գլուխը <ChevronRight :size="16" /></button></div>
    <p class="bible-reading-edition">© Հայաստանի Աստվածաշնչային ընկերություն, 2018</p>
    <footer class="bible-reading-source"><a :href="data?.sourceUrl ?? sourceUrl" target="_blank" rel="noopener noreferrer">Տեքստի աղբյուր՝ Bible.com <ArrowUpRight :size="12" /></a></footer>
  </section>
  </Teleport>
</template>
<style scoped>
.bible-inline-reader { margin-top: 20px; padding: 22px; border: 1px solid #dfc38f44; border-radius: 16px; background: #dfc38f05; }
.bible-reading-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; }.bible-reading-toolbar > span { display: flex; align-items: center; gap: 8px; color: var(--bible-gold,#dfc38f); font-size: 13px; font-weight: 700; }.bible-reading-toolbar > div { display: flex; align-items: center; gap: 10px; font-size: 11px; }.bible-reading-toolbar button { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #8997c044; border-radius: 8px; }.bible-reading-toolbar button:disabled,.bible-reading-bottom button:disabled { opacity: .3; cursor: default; }
.bible-reading-edition { margin: 12px 0 24px; font-size: 10px; opacity: .65; line-height: 1.9; }.bible-reading-message { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; gap: 18px; font-size: 12px; line-height: 1.9; text-align: center; }.bible-reading-message > svg { color: var(--bible-gold,#dfc38f); }.bible-reading-message button { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.bible-verse-text { max-height: min(60vh, 640px); overflow-y: auto; scrollbar-gutter: stable; padding-right: 12px; line-height: 2.1; overflow-wrap: anywhere; }.bible-verse-text p + p { margin-top: 14px; }.bible-verse-number { display: inline-block; margin-right: 10px; font-size: 10px; color: var(--bible-gold,#dfc38f); vertical-align: super; font-weight: 750; line-height: 1; }
.bible-reading-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #8997c033; }.bible-reading-bottom button { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; color: var(--bible-gold,#dfc38f); }.bible-reading-source { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px; border-top: 1px solid #8997c026; margin-top: 24px; padding-top: 18px; }.bible-reading-source a { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; line-height: 1.9; color: var(--bible-gold,#dfc38f); text-decoration: underline; text-underline-offset: 3px; }
.bible-inline-reader :is(button,a,.bible-verse-text):focus-visible { outline: 2px solid var(--bible-gold,#dfc38f); outline-offset: 3px; }
.bible-fullscreen-dialog { position: fixed; inset: 0; width: 100vw; height: 100vh; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left)); border: 0; background: #081020; color: #edf0f7; }
.bible-fullscreen-dialog::backdrop { background: #081020; }
.bible-inline-reader.is-fullscreen { display: flex; flex-direction: column; width: 100%; max-width: 900px; height: 100%; min-height: 0; margin: 0 auto; padding: 0; border: 0; border-radius: 0; background: transparent; --bible-gold: #dfc38f; }
.is-fullscreen .bible-reading-toolbar,.is-fullscreen .bible-reading-bottom,.is-fullscreen .bible-reading-edition,.is-fullscreen .bible-reading-source { flex-shrink: 0; }
.is-fullscreen .bible-verse-text { flex: 1; min-height: 0; max-height: none; }
.is-fullscreen .bible-reading-message { flex: 1; min-height: 0; overflow-y: auto; }
.is-fullscreen .bible-reading-bottom { margin-top: 14px; padding-top: 14px; }
.is-fullscreen .bible-reading-edition { margin: 10px 0; }
.is-fullscreen .bible-reading-source { margin-top: 0; padding-top: 8px; }
@media(max-width:600px) { .bible-inline-reader { padding: 17px; } }
</style>
