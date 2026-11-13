<script setup lang="ts">
import { Search, ArrowRight, LoaderCircle, X } from 'lucide-vue-next'
import type { SearchResult } from '~/utils/searchRecords'
import { highlightedParts } from '~/utils/searchHighlight'
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value:string]; submit: [] }>()
const value = computed({ get:()=>props.modelValue, set:(text:string)=>emit('update:modelValue',text) })
const container = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const items = shallowRef<SearchResult[]>([])
const pending = ref(false)
const failed = ref(false)
const open = ref(false)
const active = ref(-1)
let focused = false
let disposed = false
let version = 0
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let completedQuery = ''
function cancelPending() {
  version++
  clearTimeout(timer)
  controller?.abort()
  pending.value = false
}
function close() {
  cancelPending()
  open.value = false
  active.value = -1
}
async function load(query: string, requestVersion: number) {
  const request = new AbortController()
  controller = request
  try {
    const response = await $fetch<{items:SearchResult[]}>('/api/search', { query:{q:query,limit:5},signal:request.signal,retry:0,timeout:8000 })
    if (disposed || requestVersion !== version) return
    items.value = response.items.slice(0,5)
    completedQuery = query
  } catch {
    if (!disposed && requestVersion === version && !request.signal.aborted) failed.value = true
  } finally {
    if (!disposed && requestVersion === version) pending.value = false
  }
}
function schedule() {
  cancelPending()
  const query = props.modelValue.trim().slice(0,160)
  active.value = -1
  failed.value = false
  if (!focused || query.length < 2) {
    open.value = false
    items.value = []
    completedQuery = ''
    return
  }
  open.value = true
  if (query === completedQuery) return
  items.value = []
  completedQuery = ''
  pending.value = true
  const requestVersion = version
  timer = setTimeout(()=>{ void load(query,requestVersion) },250)
}
function focus() { focused = true; schedule() }
function focusOut(event: FocusEvent) {
  if (container.value?.contains(event.relatedTarget as Node | null)) return
  focused = false
  close()
}
async function move(direction: number) {
  if (!items.value.length) return
  open.value = true
  active.value = active.value < 0
    ? (direction > 0 ? 0 : items.value.length - 1)
    : (active.value + direction + items.value.length) % items.value.length
  await nextTick()
  container.value?.querySelector(`#home-search-result-${active.value}`)?.scrollIntoView({block:'nearest'})
}
function submit() {
  const selected = open.value && active.value >= 0 ? items.value[active.value] : undefined
  close()
  if (selected) void navigateTo(selected.url)
  else emit('submit')
}
function clearSearch() {
  value.value = ''
  input.value?.focus()
}
function outside(event: PointerEvent) {
  if (container.value?.contains(event.target as Node)) return
  focused = false
  close()
}
watch(()=>props.modelValue,schedule)
onMounted(()=>document.addEventListener('pointerdown',outside,{passive:true}))
onBeforeUnmount(()=>{
  disposed = true
  cancelPending()
  document.removeEventListener('pointerdown',outside)
})
</script>

<template>
  <div ref="container" class="home-search" @focusout="focusOut" @keydown.esc.prevent="close">
    <form class="hero-search" role="search" @submit.prevent="submit">
      <Search :size="24" aria-hidden="true" />
      <input ref="input" v-model="value" type="search" maxlength="160" autocomplete="off" placeholder="Որոնիր հոդված, մարդ, փաստ, գիրք կամ բաժին…" aria-label="Որոնել COGNITIO-ում" role="combobox" aria-autocomplete="list" aria-controls="home-search-results" :aria-expanded="open" :aria-activedescendant="active >= 0 ? `home-search-result-${active}` : undefined" @focus="focus" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" />
      <button v-if="modelValue" class="home-search-clear" type="button" aria-label="Մաքրել որոնումը" @click="clearSearch"><X :size="17" aria-hidden="true" /></button>
      <LoaderCircle v-if="pending" :size="19" class="animate-spin home-search-spinner" aria-label="Որոնում ենք" />
    </form>
    <div v-if="open" class="home-search-dropdown">
      <p v-if="pending" class="home-search-message" role="status">Որոնում ենք…</p>
      <p v-else-if="failed" class="home-search-message" role="status">Չհաջողվեց բեռնել արդյունքները։ Փորձիր կրկին կամ սեղմիր Enter։</p>
      <p v-else-if="!items.length" class="home-search-message" role="status">Նյութ չի գտնվել։ Փորձիր այլ բառ։</p>
      <div id="home-search-results" role="listbox" aria-label="Որոնման արագ արդյունքներ" :aria-busy="pending">
        <NuxtLink v-for="(item,index) in items" :id="`home-search-result-${index}`" :key="`${item.url}-${index}`" :to="item.url" class="home-search-result" :class="{'is-active':active === index}" role="option" :aria-selected="active === index" @click="close">
          <small>{{item.kind}}<template v-if="item.subject"> · {{item.subject.name}}</template></small>
          <strong><span><template v-for="(part,partIndex) in highlightedParts(item.title,modelValue)" :key="partIndex"><mark v-if="part.matched" class="home-search-match">{{part.text}}</mark><template v-else>{{part.text}}</template></template></span> <ArrowRight :size="14" aria-hidden="true" /></strong>
          <span><template v-for="(part,partIndex) in highlightedParts(item.description,modelValue)" :key="partIndex"><mark v-if="part.matched" class="home-search-match">{{part.text}}</mark><template v-else>{{part.text}}</template></template></span>
        </NuxtLink>
      </div>
      <NuxtLink :to="{path:'/search',query:{q:modelValue.trim()}}" class="home-search-all" @click="close">Տեսնել բոլոր արդյունքները <ArrowRight :size="15" /></NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.home-search { position: relative; }
.home-search .hero-search { padding-right: 16px; }
.home-search .hero-search input::-webkit-search-cancel-button { display: none; }
.home-search .hero-search .home-search-clear { display:grid; place-items:center; flex:0 0 30px; width:30px; height:30px; padding:0; border:1px solid transparent; border-radius:50%; background:transparent; color:#aebfd4; cursor:pointer; }
.home-search .hero-search .home-search-clear:is(:hover,:focus-visible) { border-color:#dfc38f; color:#dfc38f; outline:none; }
.home-search-spinner { flex-shrink: 0; color: #dfc38f; }
.home-search-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 20; max-height: min(60dvh,470px); overflow-y: auto; overscroll-behavior: contain; border: 1px solid #dfc38f66; border-radius: 16px; background: #0a1428; box-shadow: 0 16px 40px #0008; }
.home-search-result { display: block; padding: 12px 16px; border-bottom: 1px solid #8997c022; }
.home-search-result:is(:hover,:focus-visible),.home-search-result.is-active { background: #dfc38f12; outline: none; }
.home-search-result small { display: block; color: #dfc38f; font-size: 10px; margin-bottom: 5px; }
.home-search-result strong { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 1.6; color: #eef4ff; }
.home-search-result > span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px; font-size: 11px; line-height: 1.8; color: #aebfd4; }
.home-search-match { color: #f6c85f; background: transparent; font-weight: 800; }
.home-search-message { padding: 16px; font-size: 12px; line-height: 1.8; color: #aebfd4; }
.home-search-all { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; color: #dfc38f; font-size: 12px; }
.home-search-all:is(:hover,:focus-visible) { background: transparent; border: 1px solid #dfc38f; outline: none; padding: 11px 15px; border-radius: 0 0 15px 15px; }
</style>
