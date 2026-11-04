<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { Atom, ArrowLeft, Search, X, Mic } from 'lucide-vue-next'
import { elementFamilies, periodicElements, periodicSource, type ElementFamily, type PeriodicElement } from '~/data/periodicTable'

useHead({ title: 'Մենդելեևի պարբերական աղյուսակ — FACTUM', meta: [{ name: 'description', content: 'Բացահայտիր բոլոր 118 քիմիական տարրերը․ հայերեն անուններ, ատոմային զանգված, էլեկտրոնային կառուցվածք և ինտերակտիվ քարտեր։' }] })
const query = ref('')
const family = ref<ElementFamily | ''>('')
const selected = ref(periodicElements[0]!)
const hovered = ref<PeriodicElement | null>(null)
const tooltipStyle = ref<CSSProperties>({})
const preview = computed(() => hovered.value ?? selected.value)
const detailPanel = ref<HTMLElement | null>(null)
const quizNavigation = ref(false)
const labTab = ref<'table' | 'atoms'>('table')
const atomPanel = ref<HTMLElement | null>(null)
function selectAtomElement(number: number) {
  const element = periodicElements.find(item => item.number === number)
  if (element) selected.value = element
  hideTooltip()
}
async function openAtom(element: PeriodicElement = selected.value) {
  selected.value = element
  hideTooltip()
  labTab.value = 'atoms'
  await nextTick()
  atomPanel.value?.focus({ preventScroll: true })
}
function switchLabTab(tab: 'table' | 'atoms') {
  hideTooltip()
  labTab.value = tab
}
async function labTabKeyboard(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const tab = event.key === 'Home' ? 'table' : event.key === 'End' ? 'atoms' : labTab.value === 'table' ? 'atoms' : 'table'
  switchLabTab(tab)
  await nextTick()
  document.getElementById(`chemistry-tab-${tab}`)?.focus()
}

async function showInTable(number: number) {
  const element = periodicElements.find(item => item.number === number)
  if (!element) return
  clearFilters()
  labTab.value = 'table'
  selected.value = element
  hideTooltip()
  quizNavigation.value = true
  await nextTick()
  const cell = document.getElementById(`periodic-element-${number}`)
  cell?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center', inline: 'center' })
  cell?.focus({ preventScroll: true })
  hideTooltip()
}
let hideTimer: ReturnType<typeof setTimeout> | undefined

function matches(element: PeriodicElement) {
  const term = query.value.trim().toLocaleLowerCase('hy')
  return (!family.value || element.family === family.value) && (!term || [element.name, element.nameEn, element.symbol, String(element.number)].some(value => value.toLocaleLowerCase('hy').includes(term)))
}
const matchCount = computed(() => periodicElements.filter(matches).length)
const filtered = computed(() => !!query.value.trim() || !!family.value)
function clearFilters() { query.value = ''; family.value = '' }
function cancelHide() { clearTimeout(hideTimer) }
function hideTooltip() {
  clearTimeout(hideTimer)
  hovered.value = null
}
function scheduleHide() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(hideTooltip, 140)
}
function showTooltip(element: PeriodicElement, event: Event) {
  if (event instanceof PointerEvent && event.pointerType !== 'mouse') return
  clearTimeout(hideTimer)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const width = Math.min(350, window.innerWidth - 24)
  const height = Math.min(390, window.innerHeight - 32)
  const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12))
  const top = rect.bottom + 12 + height <= window.innerHeight ? rect.bottom + 12 : Math.max(12, rect.top - height - 12)
  tooltipStyle.value = { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${height}px` }
  hovered.value = element
}
async function selectElement(element: PeriodicElement) {
  selected.value = element
  hideTooltip()
  // On touch screens show the full card above the horizontally scrollable table.
  if (window.matchMedia('(hover: none)').matches) {
    await nextTick()
    detailPanel.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
}
function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') hideTooltip() }
onMounted(() => {
  window.addEventListener('scroll', hideTooltip, { passive: true })
  window.addEventListener('resize', hideTooltip)
  window.addEventListener('keydown', closeOnEscape)
})
onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  window.removeEventListener('scroll', hideTooltip)
  window.removeEventListener('resize', hideTooltip)
  window.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <main class="shell page-with-back periodic-page">
    <NuxtLink to="/subjects" class="gold periodic-back"><ArrowLeft :size="16" /> Հանրագիտարան</NuxtLink>
    <header class="periodic-heading">
      <p class="encyclopedia-eyebrow">FACTUM · ՔԻՄԻԱ</p>
      <h1><Atom :size="32" aria-hidden="true" /> Մենդելեևի աղյուսակ</h1>
      <p class="muted">118 տարր, մի ամբողջ աշխարհ։ Պահիր ցուցիչը տարրի վրա կամ սեղմիր՝ դրա հատկությունները բացահայտելու համար։</p>
      <a v-if="labTab === 'table'" href="#element-quiz-title" class="btn-secondary periodic-game-link"><Mic :size="17" /> Փորձիր ձայնային խաղը</a>
    </header>

    <nav class="chemistry-lab-tabs" role="tablist" aria-label="Քիմիական լաբորատորիա" @keydown="labTabKeyboard">
      <button id="chemistry-tab-table" type="button" role="tab" :aria-selected="labTab === 'table'" aria-controls="chemistry-panel-table" :tabindex="labTab === 'table' ? 0 : -1" @click="switchLabTab('table')"><Search :size="17" aria-hidden="true" /><span>Պարբերական աղյուսակ</span><small>118 տարր</small></button>
      <button id="chemistry-tab-atoms" type="button" role="tab" :aria-selected="labTab === 'atoms'" aria-controls="chemistry-panel-atoms" :tabindex="labTab === 'atoms' ? 0 : -1" @click="switchLabTab('atoms')"><Atom :size="18" aria-hidden="true" /><span>Ատոմների 3D աշխարհ</span><small>Բացահայտիր կառուցվածքը</small></button>
    </nav>

    <section id="chemistry-panel-table" v-show="labTab === 'table'" role="tabpanel" aria-labelledby="chemistry-tab-table">
    <div class="periodic-intro-grid">
      <section ref="detailPanel" class="panel periodic-inspector" aria-label="Ընտրված տարրի հատկությունները">
        <PeriodicElementInfo :element="preview" />
        <button type="button" class="btn-secondary periodic-open-atom" @click="openAtom(preview)"><Atom :size="18" aria-hidden="true" /> Դիտել 3D ատոմը <span>{{ preview.symbol }}</span></button>
        <a :href="`https://pubchem.ncbi.nlm.nih.gov/element/${preview.number}`" target="_blank" rel="noopener noreferrer" class="gold periodic-source">Տարրի տվյալները՝ PubChem-ում ↗</a>
      </section>
      <aside class="panel periodic-guide">
        <p class="encyclopedia-eyebrow">ԻՆՉՊԵ՞Ս ԿԱՐԴԱԼ ԱՂՅՈՒՍԱԿԸ</p>
        <h2>Յուրաքանչյուր վանդակ՝ մեկ տարր</h2>
        <p>Վերևի թիվը ատոմային համարն է՝ միջուկի պրոտոնների քանակը։ Կենտրոնում տարրի քիմիական նշանն է, ներքևում՝ անունն ու ատոմային զանգվածը։</p>
        <p>Տողերը պարբերություններն են, սյունակները՝ խմբերը։ Գույները ցույց են տալիս տարրերի ընտանիքները։</p>
        <p>Սեղմիր տարրի վրա՝ նրա ամբողջական քարտը պահելու համար։ Ստեղնաշարով անցիր տարրերին Tab-ով։ Esc-ը փակում է հուշաքարտը։</p>
        <span class="periodic-guide-note">Լանթանոիդներն ու ակտինոիդները տեղադրված են ներքևում՝ աղյուսակն ավելի կոմպակտ պահելու համար։</span>
      </aside>
    </div>

    <section class="panel periodic-workspace" aria-label="Քիմիական տարրերի պարբերական աղյուսակ">
      <div class="periodic-controls">
        <a v-if="quizNavigation" href="#element-quiz-title" class="gold periodic-quiz-return">Վերադառնալ հարցին ↓</a>
        <label class="periodic-search"><Search :size="18" aria-hidden="true" /><span class="sr-only">Որոնել տարր</span><input v-model="query" type="search" placeholder="Անուն, նշան կամ համար․ օրինակ՝ երկաթ, Fe, 26"></label>
        <label class="periodic-family"><span class="sr-only">Տարրերի ընտանիք</span><select v-model="family"><option value="">Բոլոր ընտանիքները</option><option v-for="(item, key) in elementFamilies" :key="key" :value="key">{{ item.name }}</option></select></label>
        <button v-if="filtered" class="periodic-clear" type="button" @click="clearFilters"><X :size="16" /> Մաքրել</button>
      </div>
      <p class="periodic-results muted" role="status">{{ filtered ? `Համապատասխանում է ${matchCount} տարր։` : 'Բոլոր 118 տարրերը' }} <span v-if="filtered && !matchCount">Փորձիր այլ անուն կամ մաքրիր զտիչները։</span></p>
      <p id="periodic-scroll-help" class="muted periodic-scroll-help">Փոքր էկրանին աղյուսակը սահեցրու աջ ու ձախ։</p>
      <div class="periodic-scroll" tabindex="0" aria-label="Սահեցվող պարբերական աղյուսակ" aria-describedby="periodic-scroll-help" @scroll="hideTooltip">
        <div class="periodic-grid">
          <span v-for="group in 18" :key="`group-${group}`" class="periodic-group" :style="{ gridColumn: group + 1, gridRow: 1 }" aria-hidden="true">{{ group }}</span>
          <span v-for="period in 7" :key="`period-${period}`" class="periodic-period" :style="{ gridColumn: 1, gridRow: period + 1 }" aria-hidden="true">{{ period }}</span>
          <div class="periodic-table-caption" aria-hidden="true"><strong>Պարբերական համակարգ</strong><span>Տարրերը դասավորված են ըստ ատոմային համարի աճման</span></div>
          <div class="periodic-series-placeholder" :style="{ gridColumn: 4, gridRow: 7 }" aria-label="57-ից 71 տարրերը՝ ներքևի շարքում"><strong>57–71</strong><span>↓</span></div>
          <div class="periodic-series-placeholder" :style="{ gridColumn: 4, gridRow: 8 }" aria-label="89-ից 103 տարրերը՝ ներքևի շարքում"><strong>89–103</strong><span>↓</span></div>
          <span class="periodic-series-label" :style="{ gridColumn: '1 / 5', gridRow: 10 }">6 · Լանթանոիդներ</span>
          <span class="periodic-series-label" :style="{ gridColumn: '1 / 5', gridRow: 11 }">7 · Ակտինոիդներ</span>
          <button v-for="element in periodicElements" :key="element.number" :id="`periodic-element-${element.number}`" type="button" class="periodic-cell" :class="{ 'is-muted': !matches(element), 'is-selected': selected.number === element.number, 'is-previewed': hovered?.number === element.number }" :style="{ gridColumn: element.column + 1, gridRow: element.row + 1, '--element-accent': elementFamilies[element.family].color }" :aria-label="`${element.number}․ ${element.name}, ${element.symbol}։ ${elementFamilies[element.family].name}`" :aria-pressed="selected.number === element.number" :aria-describedby="hovered?.number === element.number ? 'element-hover-card' : undefined" @pointerenter="showTooltip(element, $event)" @pointerleave="scheduleHide" @focus="showTooltip(element, $event)" @blur="scheduleHide" @click="selectElement(element)">
            <span class="periodic-cell-number">{{ element.number }}</span><strong>{{ element.symbol }}</strong><span class="periodic-cell-name">{{ element.name }}</span><span class="periodic-cell-mass">{{ element.atomicMass }}</span>
          </button>
        </div>
      </div>
      <div class="periodic-legend" aria-label="Տարրերի ընտանիքների գույները">
        <button v-for="(item, key) in elementFamilies" :key="key" type="button" :aria-pressed="family === key" :class="{ 'is-active': family === key }" @click="family = family === key ? '' : key"><i :style="{ background: item.color }" aria-hidden="true" />{{ item.name }}</button>
      </div>
    </section>

    <ClientOnly v-if="labTab === 'table'"><CapitalVoiceQuiz topic="chemistry" @show-in-table="showInTable" /></ClientOnly>

    <footer class="periodic-notes muted">
      <p>Տվյալների աղբյուր՝ <a :href="periodicSource" target="_blank" rel="noopener noreferrer" class="gold">PubChem ↗</a> · տվյալների պատճեն՝ 28.10.2026։ Դասակարգումը հետևում է այս աղբյուրին։</p>
      <p>u-ն ատոմային զանգվածի միավորն է։ Ռադիոակտիվ տարրերից մի քանիսի համար աղբյուրը ներկայացնում է առանձին իզոտոպի զանգվածը։ Կանխատեսված հատկությունները նշված են, բացակայող արժեքները՝ «Տվյալ չկա»։</p>
    </footer>
    </section>
    <section v-if="labTab === 'atoms'" id="chemistry-panel-atoms" ref="atomPanel" role="tabpanel" aria-labelledby="chemistry-tab-atoms" tabindex="-1" class="chemistry-atom-panel">
      <ClientOnly>
        <Suspense>
          <LazyChemistryAtomExplorer :element-number="selected.number" @select="selectAtomElement" @back="switchLabTab('table')" />
          <template #fallback><div class="panel atom-panel-loading" role="status">Բացում ենք ատոմների աշխարհը…</div></template>
        </Suspense>
      </ClientOnly>
    </section>
    <Teleport to="body">
      <div v-if="hovered" id="element-hover-card" class="periodic-tooltip" :style="tooltipStyle" role="tooltip" @pointerenter="cancelHide" @pointerleave="scheduleHide">
        <PeriodicElementInfo :element="hovered" compact />
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.periodic-page { max-width: 1480px; }
.chemistry-lab-tabs { display: flex; flex-wrap: wrap; gap: 12px; margin: 4px 0 26px; padding-bottom: 20px; border-bottom: 1px solid #8997c033; }
.chemistry-lab-tabs button { display: grid; grid-template-columns: auto 1fr; gap: 5px 10px; align-items: center; padding: 14px 20px; border: 1px solid #8997c044; border-radius: 13px; background: #11213a; color: #bfcee4; text-align: left; }
.chemistry-lab-tabs button > svg { grid-row: span 2; color: #a6caff; }
.chemistry-lab-tabs button span { font-size: 13px; font-weight: 700; }
.chemistry-lab-tabs button small { font-size: 10px; color: #8fa7c8; }
.chemistry-lab-tabs button[aria-selected="true"] { border-color: #dfc38faa; background: #dfc38f12; color: #f1dbb1; }
.chemistry-lab-tabs button[aria-selected="true"] > svg { color: #dfc38f; }
.chemistry-lab-tabs button:focus-visible, .periodic-open-atom:focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
.periodic-open-atom { display: flex; align-items: center; justify-content: center; gap: 9px; margin-top: 22px; font-size: 13px; }
.periodic-open-atom > span { font-weight: 800; padding-left: 10px; border-left: 1px solid #dfc38f44; }
.chemistry-atom-panel:focus { outline: none; }
.atom-panel-loading { padding: 70px 24px; text-align: center; color: #b7d5fa; }
@media (max-width: 540px) { .chemistry-lab-tabs { gap: 8px; }.chemistry-lab-tabs button { flex: 1 1 180px; padding: 12px; }.periodic-open-atom { width: 100%; } }
.periodic-game-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 18px; font-size: 12px; }
.periodic-quiz-return { flex-basis: 100%; font-size: 12px; padding-bottom: 8px; }
.periodic-back { display: inline-flex; gap: 7px; align-items: center; }
.periodic-heading { margin: 26px 0; }
.periodic-heading h1 { display: flex; align-items: center; gap: 12px; font-size: clamp(24px, 3vw, 38px); font-weight: 850; margin-bottom: 12px; }
.periodic-heading h1 svg { flex-shrink: 0; color: #dfc38f; }
.periodic-heading > p:last-child { max-width: 76ch; line-height: 1.9; }
.periodic-intro-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 22px; margin-bottom: 24px; }
.periodic-inspector, .periodic-guide { padding: 26px; }
.periodic-inspector { scroll-margin-top: 105px; }
.periodic-source { display: inline-block; font-size: 12px; margin-top: 18px; text-underline-offset: 4px; }
.periodic-source:hover { text-decoration: underline; }
.periodic-guide h2 { font-size: 19px; font-weight: 750; margin-bottom: 14px; }
.periodic-guide > p:not(.encyclopedia-eyebrow) { color: #b9c4d9; font-size: 13px; line-height: 1.9; margin-bottom: 14px; }
.periodic-guide-note { display: block; padding-top: 16px; border-top: 1px solid #8997c047; color: #dfc38f; font-size: 12px; line-height: 1.9; }
.periodic-workspace { padding: 22px 14px; }
.periodic-controls { display: flex; flex-wrap: wrap; gap: 12px; padding: 0 8px; }
.periodic-search { display: flex; align-items: center; gap: 10px; flex: 1 1 350px; background: #0c1529; border: 1px solid #8997c047; border-radius: 12px; padding: 12px; color: #b0b9d1; }
.periodic-search input { width: 100%; min-width: 0; background: transparent; color: #eef4ff; outline: none; font-size: 13px; }
.periodic-search:focus-within { border-color: #f4c46c; }
.periodic-family { flex: 0 1 260px; }
.periodic-family select { width: 100%; height: 100%; min-height: 46px; border: 1px solid #8997c047; border-radius: 12px; padding: 10px; color: #eef4ff; background: #0c1529; font-size: 13px; }
.periodic-clear { display: flex; gap: 5px; align-items: center; color: #dfc38f; font-size: 12px; padding: 10px; }
.periodic-results, .periodic-scroll-help { font-size: 12px; margin: 14px 8px; }
.periodic-scroll-help { display: none; }
.periodic-scroll { overflow-x: auto; padding: 8px 6px 18px; scrollbar-width: thin; overscroll-behavior-x: contain; }
.periodic-grid { display: grid; grid-template-columns: 20px repeat(18, minmax(0, 1fr)); grid-template-rows: 22px repeat(7, 88px) 16px repeat(2, 88px); gap: 5px; min-width: 1100px; }
.periodic-group, .periodic-period { display: flex; justify-content: center; align-items: center; color: #aebbd4; font-size: 11px; }
.periodic-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0; padding: 5px 2px; border-radius: 7px; border: 1px solid color-mix(in srgb, var(--element-accent) 45%, #162039); background: color-mix(in srgb, var(--element-accent) 12%, #0c1529); color: #eef4ff; transition: background .15s, opacity .15s, border-color .15s; }
.periodic-cell:hover, .periodic-cell.is-previewed { border-color: var(--element-accent); background: color-mix(in srgb, var(--element-accent) 24%, #0c1529); }
.periodic-cell.is-selected { outline: 2px solid var(--element-accent); outline-offset: 1px; }
.periodic-cell.is-muted { opacity: .22; }
.periodic-cell.is-muted:hover, .periodic-cell.is-muted:focus-visible { opacity: 1; }
.periodic-cell:focus-visible, .periodic-scroll:focus-visible, .periodic-legend button:focus-visible, .periodic-clear:focus-visible { outline: 2px solid #eed8b0; outline-offset: 3px; }
.periodic-cell-number { align-self: flex-start; font-size: 10px; line-height: 1; padding-left: 3px; color: #c3cce0; }
.periodic-cell strong { font-size: 23px; line-height: 1.3; color: var(--element-accent); }
.periodic-cell-name { width: 100%; font-size: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.periodic-cell-mass { font-size: 9px; margin-top: 3px; color: #aebbd4; }
.periodic-table-caption { grid-column: 4 / 14; grid-row: 2 / 4; align-self: center; justify-self: center; text-align: center; }
.periodic-table-caption strong { display: block; font-size: 19px; font-weight: 700; color: #dfc38f; }
.periodic-table-caption span { display: block; font-size: 11px; margin-top: 8px; color: #aebbd4; }
.periodic-series-placeholder { display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; border: 1px dashed #8997c047; border-radius: 7px; font-size: 10px; color: #b0b9d1; }
.periodic-series-label { align-self: center; padding-left: 25px; color: #b0b9d1; font-size: 11px; }
.periodic-legend { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 8px 0; border-top: 1px solid #8997c030; }
.periodic-legend button { display: flex; align-items: center; gap: 7px; border: 1px solid transparent; border-radius: 20px; padding: 7px 10px; font-size: 11px; color: #c3cce0; }
.periodic-legend button.is-active { border-color: #dfc38f; background: #ffffff08; }
.periodic-legend button:hover { background: #ffffff08; }
.periodic-legend i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.periodic-notes { margin-top: 22px; font-size: 12px; line-height: 1.9; }
.periodic-notes p + p { margin-top: 10px; }
.periodic-tooltip { position: fixed; z-index: 100; padding: 18px; border: 1px solid #667497; border-radius: 16px; background: #101a30; box-shadow: 0 18px 55px #0009; overflow-y: auto; }
@media (max-width: 1150px) { .periodic-scroll-help { display: block; } }
@media (max-width: 800px) { .periodic-intro-grid { grid-template-columns: minmax(0, 1fr); } .periodic-guide { display: none; } .periodic-inspector { padding: 20px; } .periodic-workspace { padding: 16px 8px; } }
@media (max-width: 540px) { .periodic-family { flex-basis: 100%; } .periodic-heading h1 { font-size: 24px; } .periodic-heading > p:last-child { font-size: 13px; } }
@media (prefers-reduced-motion: reduce) { .periodic-cell { transition: none; } }
:global(html.factum-light) .periodic-search,
:global(html.factum-light) .periodic-family select,
:global(html.factum-light) .periodic-tooltip { background: #f4f7fc; color: #1b2f4b; }
:global(html.factum-light) .periodic-search input { color: #1b2f4b; }
:global(html.factum-light) .periodic-guide > p:not(.encyclopedia-eyebrow),
:global(html.factum-light) .periodic-guide-note { color: #4e6481; }
</style>
