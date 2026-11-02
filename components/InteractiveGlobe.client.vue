<script setup lang="ts">
import { countryPopulation } from '~/data/countryPopulation'
import { Globe2, RotateCcw, Minus, Plus, Search, MapPin, MousePointer2 } from 'lucide-vue-next'
import { orientCountry, rotateGlobe, type CountryFeature, type CountryDetails, type GlobeApi, type GlobeProjection } from '~/utils/globe'

const props = defineProps<{ focusCountry?: { code: string; requestId: number } }>()


const { estimates: populationEstimates, status: populationStatus } = usePopulationEstimates()
const stage = ref<HTMLElement | null>(null)
const countries = shallowRef<CountryFeature[]>([])
const details = shallowRef<Record<string, CountryDetails>>({})
const selected = shallowRef<CountryFeature | null>(null)
const hovered = shallowRef<CountryFeature | null>(null)
const loading = ref(true)
const error = ref(false)
const search = ref('')
const zoom = ref(1)
const rotation = ref<[number, number, number]>([-45, -25, 0])
const dragging = ref(false)
const pointerFocused = ref(false)
const tip = ref({ x: 0, y: 0 })
const viewSize = 680
let api: GlobeApi | undefined
let projection: GlobeProjection | undefined
let controller: AbortController | undefined
let disposed = false
let drag: { id: number; x: number; y: number; rotation: [number, number, number]; moved: boolean; country?: CountryFeature } | undefined
let suppressClick = false
let frame = 0
let queuedRotation: [number, number, number] | undefined
const countryNames = new Intl.DisplayNames(['hy'], { type: 'region' })
const number = new Intl.NumberFormat('hy-AM')
const continents: Record<string, string> = { Asia: 'Ասիա', Europe: 'Եվրոպա', Africa: 'Աֆրիկա', 'North America': 'Հյուսիսային Ամերիկա', 'South America': 'Հարավային Ամերիկա', Oceania: 'Օվկիանիա', Antarctica: 'Անտարկտիկա', 'Seven seas (open ocean)': 'Օվկիանոսային կղզիներ' }
const continentColors: Record<string, string> = {
  Europe: '#9b8cde',
  Asia: '#d89164',
  Africa: '#cc727c',
  'North America': '#6ca5d9',
  'South America': '#62ae86',
  Oceania: '#cf85ae',
  Antarctica: '#c1d7e0',
  'Seven seas (open ocean)': '#8b9ba8',
}
const selectedContinent = ref<string | null>(null)
const continentCenters: Record<string, [number, number]> = {
  Europe: [15, 52], Asia: [90, 35], Africa: [20, 5],
  'North America': [-100, 40], 'South America': [-60, -20],
  Oceania: [140, -25], Antarctica: [0, -90], 'Seven seas (open ocean)': [70, -20],
}
function toggleContinent(continent: string) {
  if (selectedContinent.value === continent) {
    selectedContinent.value = null
    return
  }
  selectedContinent.value = continent
  hovered.value = null
  selected.value = null
  const center = continentCenters[continent]
  if (center) {
    cancelAnimationFrame(frame)
    frame = 0
    queuedRotation = undefined
    rotation.value = [-center[0], -center[1], 0]
    zoom.value = 1
  }
}
function info(country: CountryFeature) { return details.value[country.properties.ADM0_A3] }
function flagCode(country: CountryFeature) { return info(country)?.cca2 || country.properties.ISO_A2 }
function name(country: CountryFeature) {
  const code = info(country)?.cca2 || country.properties.ISO_A2
  return code && /^[A-Z]{2}$/.test(code) ? countryNames.of(code) || country.properties.NAME : country.properties.NAME
}
const active = computed(() => hovered.value ?? selected.value)
const activePopulation = computed(() => active.value ? countryPopulation(active.value.properties.ADM0_A3, active.value.properties.POP_EST, active.value.properties.POP_YEAR, populationEstimates.value) : undefined)
const activeDetails = computed(() => active.value ? info(active.value) : undefined)
const results = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return []
  return countries.value.filter(country => [name(country), country.properties.NAME, info(country)?.capital?.join(' ') ?? ''].some(value => value.toLocaleLowerCase().includes(query))).slice(0, 8)
})
const paths = computed(() => {
  if (!api || !projection || !countries.value.length) return []
  projection.rotate(rotation.value).scale(270 * zoom.value)
  const path = api.geoPath(projection)
  return countries.value.map(country => ({ country, path: path(country) || '' }))
})
const graticule = computed(() => {
  // Read the same dependencies as the country paths before projecting the grid.
  rotation.value; zoom.value; countries.value
  return api && projection ? api.geoPath(projection.rotate(rotation.value).scale(270 * zoom.value))(api.geoGraticule10()) || '' : ''
})
const radius = computed(() => 270 * zoom.value)

watch([() => props.focusCountry, countries], async ([request]) => {
  if (!request) return
  const country = countries.value.find(item => item.properties.ADM0_A3 === request.code)
  if (!country) return
  cancelAnimationFrame(frame)
  frame = 0
  queuedRotation = undefined
  zoom.value = 1
  choose(country, true)
  await nextTick()
  const target = window.matchMedia('(max-width: 900px)').matches
    ? document.getElementById('globe-country-info')
    : stage.value?.querySelector('svg')
  target?.focus({ preventScroll: true })
})

async function loadApi(signal: AbortSignal): Promise<GlobeApi> {
  const existing = (window as unknown as { d3?: GlobeApi }).d3
  if (existing?.geoOrthographic) return existing
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js'
    script.async = true
    const cleanup = () => { script.onload = null; script.onerror = null; signal.removeEventListener('abort', abort) }
    const abort = () => { cleanup(); script.remove(); reject(new Error('Cancelled')) }
    script.onload = () => { cleanup(); resolve() }
    script.onerror = () => { cleanup(); script.remove(); reject(new Error('Globe library unavailable')) }
    signal.addEventListener('abort', abort, { once: true })
    document.head.appendChild(script)
  })
  const loaded = (window as unknown as { d3?: GlobeApi }).d3
  if (!loaded?.geoOrthographic) throw new Error('Globe library unavailable')
  return loaded
}
async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  const timeout = setTimeout(() => controller?.abort(), 25000)
  loading.value = true
  error.value = false
  try {
    const [loadedApi, worldResponse, detailResponse] = await Promise.all([
      loadApi(signal),
      fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson', { signal }),
      fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json', { signal }),
    ])
    if (!worldResponse.ok || !detailResponse.ok) throw new Error('Country data unavailable')
    const [world, countryInfo] = await Promise.all([worldResponse.json(), detailResponse.json()]) as [{ features: CountryFeature[] }, CountryDetails[]]
    if (disposed || signal.aborted) return
    api = loadedApi
    projection = api.geoOrthographic().translate([viewSize / 2, viewSize / 2]).clipAngle(90).precision(.4)
    details.value = Object.fromEntries(countryInfo.map(country => [country.cca3, country]))
    countries.value = world.features.map(feature => orientCountry(feature, loadedApi.geoArea))
    selected.value = countries.value.find(country => country.properties.ADM0_A3 === 'ARM') ?? null
  } catch {
    if (!disposed) error.value = true
  } finally {
    clearTimeout(timeout)
    if (!disposed) loading.value = false
  }
}
function choose(country: CountryFeature, center = false) {
  if (selectedContinent.value !== country.properties.CONTINENT) selectedContinent.value = null
  selected.value = country
  hovered.value = null
  if (center) {
    const coordinates = info(country)?.latlng
    if (coordinates) rotation.value = [-coordinates[1], -coordinates[0], 0]
    hovered.value = null
    search.value = ''
  }
}
function moveTip(event: PointerEvent) {
  if (dragging.value || !stage.value) return
  const bounds = stage.value.getBoundingClientRect()
  tip.value = { x: Math.max(8, Math.min(event.clientX - bounds.left + 14, bounds.width - 210)), y: Math.max(8, Math.min(event.clientY - bounds.top + 14, bounds.height - 80)) }
}
function pointerDown(event: PointerEvent) {
  if (event.button !== 0 || !projection) return
  const countryCode = (event.target as Element).getAttribute('data-country')
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation: [...rotation.value], moved: false, country: countries.value.find(country => country.properties.ADM0_A3 === countryCode) }
  suppressClick = false
  ;(event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId)
}
function pointerMove(event: PointerEvent) {
  moveTip(event)
  if (!drag || drag.id !== event.pointerId || !stage.value) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (!drag.moved && Math.hypot(dx, dy) < 4) return
  drag.moved = true
  dragging.value = true
  hovered.value = null
  const scale = radius.value * Math.min(stage.value.clientWidth, stage.value.clientHeight) / viewSize
  queuedRotation = rotateGlobe(drag.rotation, dx, dy, scale)
  if (!frame) frame = requestAnimationFrame(() => {
    if (queuedRotation) rotation.value = queuedRotation
    frame = 0
  })
}
function pointerUp(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return
  suppressClick = drag.moved
  if (!drag.moved && drag.country && event.type === 'pointerup') choose(drag.country)
  drag = undefined
  dragging.value = false
  const svg = event.currentTarget as SVGSVGElement
  if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId)
}
function changeZoom(amount: number) { zoom.value = Math.max(.75, Math.min(1.8, zoom.value + amount)) }
function keyRotate(event: KeyboardEvent) {
  const changes: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }
  const delta = changes[event.key]
  if (!delta) return
  event.preventDefault()
  rotation.value = rotateGlobe(rotation.value, delta[0], delta[1], 100)
  hovered.value = null
}
function reset() { selectedContinent.value = null; rotation.value = [-45, -25, 0]; zoom.value = 1; hovered.value = null }
onMounted(load)
onBeforeUnmount(() => { disposed = true; controller?.abort(); cancelAnimationFrame(frame) })
</script>

<template>
  <div class="globe-layout">
      <section class="panel globe-search-panel">
        <label for="globe-country-search"><Search :size="17" /> Գտիր երկիրը</label>
        <input id="globe-country-search" v-model="search" class="input" type="search" placeholder="Օրինակ՝ Հայաստան" autocomplete="off" :disabled="loading || error" />
        <ul v-if="results.length" class="globe-results"><li v-for="country in results" :key="country.properties.ADM0_A3"><button type="button" @click="choose(country, true)"><CountryFlag :code="flagCode(country)" /><span class="globe-result-name">{{ name(country) }}</span> <MapPin :size="14" /></button></li></ul>
        <p v-else-if="search.trim()" class="muted globe-no-results" role="status">Երկիր չի գտնվել։ Փորձիր այլ անուն։</p>
      </section>
    <section class="panel globe-view" aria-label="Ինտերակտիվ երկրագունդ">
      <div class="globe-toolbar">
        <span><Globe2 :size="16" /> Բացահայտիր աշխարհը</span>
        <div class="globe-controls">
          <button type="button" aria-label="Հեռացնել երկրագունդը" :disabled="zoom <= .75 || loading" @click="changeZoom(-.15)"><Minus :size="18" /></button>
          <button type="button" aria-label="Մոտեցնել երկրագունդը" :disabled="zoom >= 1.8 || loading" @click="changeZoom(.15)"><Plus :size="18" /></button>
          <button type="button" aria-label="Վերականգնել սկզբնական դիրքը" @click="reset"><RotateCcw :size="17" /></button>
        </div>
      </div>
      <div ref="stage" class="globe-stage" :class="{ 'is-dragging': dragging }">
        <div v-if="loading" class="globe-message" role="status"><Globe2 :size="40" /><p>Բեռնում ենք երկրագունդը…</p></div>
        <div v-else-if="error" class="globe-message" role="alert"><Globe2 :size="40" /><p>Չհաջողվեց բեռնել քարտեզը։ Ստուգիր ինտերնետ կապը։</p><button class="btn-secondary" @click="load">Փորձել կրկին</button></div>
        <svg v-else :viewBox="`0 0 ${viewSize} ${viewSize}`" :class="{ 'has-pointer-focus': pointerFocused }" tabindex="0" role="group" aria-label="Պտտվող երկրագունդ․ պտտիր մկնիկով, հպումով կամ ստեղնաշարի սլաքներով։ Երկրները կարող ես ընտրել նաև որոնմամբ։" @keydown="pointerFocused = false; keyRotate($event)" @pointerdown="pointerFocused = true; pointerDown($event)" @blur="pointerFocused = false" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @lostpointercapture="pointerUp" @pointerleave="hovered = null">
          <defs>
            <radialGradient id="factum-ocean" cx="32%" cy="28%" r="80%"><stop stop-color="#22678a" /><stop offset=".6" stop-color="#103e62" /><stop offset="1" stop-color="#04142a" /></radialGradient>
            <radialGradient id="factum-globe-shade" cx="32%" cy="28%" r="75%"><stop offset=".3" stop-color="#fff" stop-opacity=".06" /><stop offset=".75" stop-color="#020918" stop-opacity=".08" /><stop offset="1" stop-color="#010612" stop-opacity=".8" /></radialGradient>
            <clipPath id="factum-globe-clip"><circle cx="340" cy="340" :r="radius" /></clipPath>
          </defs>
          <circle cx="340" cy="340" :r="radius + 7" fill="none" stroke="#71b9ed" stroke-opacity=".12" stroke-width="12" />
          <circle class="globe-ocean" cx="340" cy="340" :r="radius" fill="url(#factum-ocean)" stroke="#80c6e8" stroke-opacity=".6" />
          <g clip-path="url(#factum-globe-clip)">
            <path :d="graticule" fill="none" stroke="#80b3c7" stroke-opacity=".13" stroke-width=".7" pointer-events="none" />
            <path v-for="item in paths" :key="item.country.properties.ADM0_A3 + item.country.properties.NAME" :d="item.path" :data-country="item.country.properties.ADM0_A3" class="globe-country" :style="{ '--continent-color': continentColors[item.country.properties.CONTINENT] || '#427c79' }" :class="{ 'is-active': active === item.country, 'is-continent-selected': selectedContinent === item.country.properties.CONTINENT, 'is-continent-muted': selectedContinent && selectedContinent !== item.country.properties.CONTINENT }" @pointerenter="!dragging && $event.pointerType !== 'touch' && (hovered = item.country)" @pointerleave="hovered = null" @click="!suppressClick && choose(item.country)"><title>{{ name(item.country) }}</title></path>
          </g>
          <circle cx="340" cy="340" :r="radius" fill="url(#factum-globe-shade)" pointer-events="none" />
        </svg>
        <div v-if="active && !dragging" class="globe-tooltip" :class="{ 'is-selected': !hovered }" :style="hovered ? { left: `${tip.x}px`, top: `${tip.y}px` } : undefined" aria-hidden="true"><strong><CountryFlag :code="flagCode(active)" /> {{ name(active) }}</strong><small>{{ continents[active.properties.CONTINENT] || active.properties.CONTINENT }}</small></div>
      </div>
      <ul class="globe-continent-legend" aria-label="Աշխարհամասերի գույները">
        <li v-for="(color, continent) in continentColors" :key="continent">
          <button type="button" :aria-pressed="selectedContinent === continent" :disabled="loading || error" @click="toggleContinent(String(continent))">
            <span class="globe-continent-swatch" :style="{ backgroundColor: color }" aria-hidden="true" />
            {{ continents[continent] }}
          </button>
        </li>
      </ul>
      <p class="globe-continent-help" role="status">{{ selectedContinent ? `${continents[selectedContinent]}․ կրկին սեղմիր՝ ընդգծումը հանելու համար։` : 'Սեղմիր գույնի վրա՝ աշխարհամասը տեսնելու համար։' }}</p>
      <p class="globe-hint"><MousePointer2 :size="15" /> Քաշիր՝ պտտելու, պահիր երկրի վրա՝ տեսնելու, սեղմիր՝ ընտրելու համար։</p>
    </section>

    <aside class="globe-sidebar">

      <section id="globe-country-info" tabindex="-1" class="panel globe-info" aria-live="polite" aria-atomic="true">
        <template v-if="active">
          <span class="globe-eyebrow">{{ hovered ? 'ԲԱՑԱՀԱՅՏՈՒՄ ԵՍ' : 'ԸՆՏՐՎԱԾ ԵՐԿԻՐ' }}</span>
          <div class="globe-country-title"><CountryFlag class="globe-flag" :code="flagCode(active)" /><div><h2>{{ name(active) }}</h2><p>{{ active.properties.NAME }}</p></div></div>
          <dl>
            <div><dt>Մայրաքաղաք</dt><dd>{{ activeDetails?.capital?.join(', ') || 'Տվյալ չկա' }}</dd></div>
            <div><dt>Աշխարհամաս</dt><dd>{{ continents[active.properties.CONTINENT] || active.properties.CONTINENT }}</dd></div>
            <div v-if="activePopulation"><dt>Բնակչություն <small>({{ activePopulation.year }} թ․ գնահատական)</small></dt><dd>{{ activePopulation.value >= 0 ? number.format(Math.round(activePopulation.value)) : 'Տվյալ չկա' }}</dd></div>
            <div><dt>Տարածք</dt><dd>{{ activeDetails?.area ? `${number.format(activeDetails.area)} կմ²` : 'Տվյալ չկա' }}</dd></div>
            <div v-if="activeDetails?.languages"><dt>Լեզուներ</dt><dd>{{ Object.values(activeDetails.languages).join(', ') }}</dd></div>
          </dl>
        </template>
        <div v-else class="globe-empty"><Globe2 :size="32" /><h2>Աշխարհը՝ քո ձեռքերում</h2><p>Ընտրիր երկիրը գլոբուսի վրա կամ գտիր որոնմամբ։</p></div>
      </section>
      <p v-if="populationStatus === 'loading'" class="globe-data-note" role="status">Թարմացնում ենք բնակչության տվյալները…</p>
      <p v-else-if="populationStatus === 'error'" class="globe-data-note" role="status">Բնակչության թարմացումն այս պահին անհասանելի է․ ցուցադրված են պահպանված տվյալները՝ իրենց տարեթվերով։</p>
      <p class="globe-data-note">Բնակչությունը՝ յուրաքանչյուր երկրի համար հասանելի վերջին տարեթվով։ Քարտեզը՝ պարզեցված սահմաններով։ Փոքր երկրներն ու կղզիները կարող են չերևալ։ Մայրաքաղաքների և լեզուների անունները ներկայացված են աղբյուրի լեզվով։</p>
    </aside>
  </div>
</template>

<style scoped>

.globe-layout { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr); gap: 24px; align-items: start; }
.globe-view { grid-column: 1; grid-row: 1 / span 2; overflow: hidden; background: radial-gradient(ellipse at 45% 45%, #122e4c, #061226 72%); }
.globe-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 0; }
.globe-toolbar > span { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #dfc38f; }
.globe-controls { display: flex; gap: 7px; }
.globe-controls button { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #8291b140; border-radius: 10px; color: #e9d5ae; background: #15233c; }
.globe-controls button:hover:not(:disabled) { border-color: #dfc38f; background: #243452; }
.globe-controls button:disabled { opacity: .35; cursor: default; }
.globe-stage { position: relative; width: 100%; aspect-ratio: 1; max-height: 680px; }
.globe-stage svg { display: block; width: 100%; height: 100%; touch-action: none; user-select: none; }
.globe-stage svg, .globe-ocean, .globe-country { cursor: url('/images/globe-pointer.svg') 5 5, crosshair; }
.globe-stage.is-dragging :is(svg, .globe-ocean, .globe-country) { cursor: grabbing; }
.globe-stage svg:focus { outline: none; }
.globe-stage svg:not(.has-pointer-focus):focus-visible, .globe-controls button:focus-visible, .globe-results button:focus-visible { outline: 2px solid #f4c46c; outline-offset: -3px; }
.globe-country { fill: var(--continent-color, #427c79); stroke: #94c0b2; stroke-width: .65; stroke-linejoin: round; }
.globe-country.is-continent-muted { opacity: .25; }
.globe-country.is-continent-selected { stroke: #f1f5ff; stroke-width: 1; }
.globe-country.is-active { opacity: 1; fill: #dfbb76; stroke: #ffe8b4; stroke-width: 1.3; }
.globe-tooltip { position: absolute; width: 200px; padding: 11px 14px; border: 1px solid #dfc38f88; border-radius: 12px; background: #081326ed; color: #ffe4b2; box-shadow: 0 8px 24px #0005; pointer-events: none; }
.globe-tooltip strong, .globe-tooltip small { display: block; }
.globe-tooltip strong { display: flex; align-items: center; gap: 7px; font-size: 13px; }
.globe-tooltip small { font-size: 11px; color: #b8c7db; margin-top: 4px; }
.globe-continent-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 16px; list-style: none; margin: 0; padding: 0 18px 18px; color: #c7d5e6; font-size: 11px; }
.globe-continent-legend button { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; }
.globe-continent-legend button:hover:not(:disabled), .globe-continent-legend button[aria-pressed="true"] { border-color: #dfc38f; background: #ffffff12; }
.globe-continent-legend button:focus-visible { outline: 2px solid #f4c46c; outline-offset: 2px; }
.globe-continent-legend button:disabled { opacity: .4; cursor: default; }
.globe-continent-help { padding: 0 18px 16px; text-align: center; font-size: 11px; line-height: 1.8; color: #c7d5e6; }
.globe-continent-swatch { width: 11px; height: 11px; border-radius: 3px; border: 1px solid #ffffff55; flex-shrink: 0; }
.globe-hint { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 0 18px 20px; color: #a9bbd4; font-size: 11px; line-height: 1.8; }
.globe-hint svg { flex-shrink: 0; }
.globe-sidebar { display: grid; gap: 18px; grid-column: 2; grid-row: 2; }
.globe-search-panel { grid-column: 2; grid-row: 1; }
.globe-info { scroll-margin-top: 110px; }
.globe-tooltip.is-selected { display: none; left: 50%; top: 12px; transform: translateX(-50%); }
.globe-search-panel, .globe-info { padding: 22px; }
.globe-search-panel label { display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 14px; font-size: 14px; }
.globe-results { list-style: none; margin: 10px 0 0; padding: 0; }
.globe-results button { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 10px 6px; text-align: left; border-bottom: 1px solid #8291b126; font-size: 13px; }
.globe-results button:hover { color: #dfc38f; }
.globe-no-results { margin-top: 12px; font-size: 12px; }
.globe-eyebrow { font-size: 10px; color: #dfc38f; letter-spacing: 1.5px; }
.globe-country-title { display: flex; align-items: center; gap: 14px; margin: 20px 0; }
.globe-flag { width: 48px; height: 34px; }
.globe-result-name { flex: 1; min-width: 0; }
.globe-country-title h2 { font-size: 23px; font-weight: 800; }
.globe-country-title p { font-size: 12px; color: #9caec6; margin-top: 4px; }
.globe-info dl > div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding: 15px 0; border-top: 1px solid #8291b126; }
.globe-info dt { font-size: 12px; color: #a9bbd4; }
.globe-info dt small { display: block; font-size: 10px; margin-top: 4px; }
.globe-info dd { max-width: 100%; font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }
.globe-data-note { padding: 0 4px; font-size: 11px; color: #91a5bf; line-height: 1.9; }
.globe-message { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 28px; color: #dfc38f; text-align: center; font-size: 14px; }
.globe-empty { display: grid; gap: 15px; padding: 20px 0; color: #a9bbd4; line-height: 1.8; }
.globe-empty h2 { font-size: 19px; color: #dfc38f; }
@media (max-width: 900px) {
  .globe-layout { grid-template-columns: 1fr; }
  .globe-search-panel { grid-column: 1; grid-row: 1; }
  .globe-view { grid-column: 1; grid-row: 2; }
  .globe-sidebar { grid-column: 1; grid-row: 3; }
  .globe-tooltip.is-selected { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: max-content; max-width: calc(100% - 24px); padding: 7px 10px; }
  .globe-tooltip.is-selected strong { min-width: 0; overflow-wrap: anywhere; }
  .globe-tooltip.is-selected small { flex-shrink: 0; margin-top: 0; }
}
@media (max-width: 600px) { .globe-sidebar { grid-template-columns: 1fr; }.globe-toolbar { padding: 14px 12px 0; }.globe-toolbar > span { font-size: 10px; }.globe-layout { gap: 18px; }.globe-search-panel, .globe-info { padding: 18px; } }
</style>
