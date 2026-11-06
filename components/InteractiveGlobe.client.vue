<script setup lang="ts">
import type {PlaceSearchResult} from '~/utils/geography/placeSearch'
import type {AtlasCountry,MapLocation,WorldRecord} from '~/utils/geography/types'
import {normalizeGeoSearch,populationColor,validCoordinates,density} from '~/utils/geography/core'
import {capitalName} from '~/data/geography/labels'
import {geographicPlaces} from '~/data/geography/places'
import { countryPopulation } from '~/data/countryPopulation'
import { Globe2, RotateCcw, Minus, Plus, Search, MapPin, MousePointer2 } from 'lucide-vue-next'
import { orientCountry, rotateGlobe, type CountryFeature, type CountryDetails, type GlobeApi, type GlobeProjection } from '~/utils/globe'

const props = defineProps<{ focusCountry?: { code: string; requestId: number }; focusLocation?:MapLocation; mapQuiz?:boolean; selectionLocked?:boolean }>()
const emit=defineEmits<{countrySelected:[code:string]}>()
const atlas=useGeographyAtlas()
const search = ref('')
const worldResults=shallowRef<PlaceSearchResult[]>([])
const worldSearchState=ref<'idle'|'loading'|'ready'|'error'>('idle')
const worldSearchMessage=ref('')
let worldSearchController:AbortController|undefined
let worldSearchVersion=0
let worldSearchTimer:ReturnType<typeof setTimeout>|undefined
let lastWorldSearchAt=0
function cancelWorldSearchTimer(){if(worldSearchTimer!==undefined)clearTimeout(worldSearchTimer);worldSearchTimer=undefined}
watch(search,()=>{
 worldSearchVersion++;worldSearchController?.abort();cancelWorldSearchTimer();worldResults.value=[];worldSearchState.value='idle';worldSearchMessage.value=''
 if(search.value.trim().length<2||props.mapQuiz||disposed)return
 worldSearchTimer=setTimeout(()=>{worldSearchTimer=undefined;void searchWorld()},Math.max(500,1100-(Date.now()-lastWorldSearchAt)))
})
async function searchWorld(){
 cancelWorldSearchTimer()
 const query=search.value.trim()
 if(props.mapQuiz||query.length<2||worldSearchState.value==='loading')return
 worldSearchController?.abort()
 const controller=new AbortController(),version=++worldSearchVersion
 lastWorldSearchAt=Date.now();worldSearchController=controller;worldSearchState.value='loading';worldSearchMessage.value=''
 try{
  const response=await $fetch<{items:PlaceSearchResult[]}>('/api/geography/search',{query:{q:query},signal:controller.signal,timeout:10000,retry:0})
  if(disposed||version!==worldSearchVersion)return
  worldResults.value=response.items;worldSearchState.value='ready'
 }catch(error){
  if(disposed||version!==worldSearchVersion)return
  worldSearchState.value='error'
  worldSearchMessage.value=(error as {statusCode?:number}).statusCode===429?'Մի պահ սպասիր և կրկին փորձիր։':'Համաշխարհային որոնումը ժամանակավորապես անհասանելի է։ Փորձիր կրկին։'
 }
}
function chooseWorldPlace(place:PlaceSearchResult){
 if(props.mapQuiz)return
 locate({coordinates:place.coordinates,label:place.label,detail:place.context,source:{name:'OpenStreetMap',url:place.url}})
}
const night=ref(false),showPopulation=ref(false),lightsFailed=ref(false),populationMetric=ref<'total'|'density'>('total')
const layerError=ref(''),selectedCode=ref('ARM'),location=ref<MapLocation|null>(null)
const records=shallowRef<WorldRecord[]>([])
const quizCandidate=ref<string|null>(null)
const nearbyQuizCountries=shallowRef<AtlasCountry[]>([])
const candidateCountry=computed(()=>atlas.countries.value.find(c=>c.cca3===quizCandidate.value))
const needsQuizConfirmation=()=>props.mapQuiz&&window.matchMedia('(max-width: 900px), (pointer: coarse)').matches
watch(()=>props.mapQuiz,()=>{quizCandidate.value=null;nearbyQuizCountries.value=[];worldSearchVersion++;worldSearchController?.abort();worldResults.value=[];worldSearchState.value='idle';cancelWorldSearchTimer()})
function previewQuizCountry(code:string){
 if(props.selectionLocked)return
 const country=atlas.countries.value.find(c=>c.cca3===code);if(!country)return
 quizCandidate.value=code;selectedCode.value=code
 selected.value=countries.value.find(c=>c.properties.ADM0_A3===code)||null
 hovered.value=null;location.value=null
}
function confirmQuizCountry(){
 if(!props.mapQuiz||props.selectionLocked||!quizCandidate.value)return
 const code=quizCandidate.value,country=candidateCountry.value
 quizCandidate.value=null;nearbyQuizCountries.value=[]
 if(country){centerAt([country.latlng[1],country.latlng[0]]);if(!selected.value)location.value={coordinates:[country.latlng[1],country.latlng[0]],label:country.nameHy}}
 emit('countrySelected',code)
}
function nearbyAt(event:PointerEvent,touched?:CountryFeature){
 if(!projection||!stage.value)return
 const bounds=stage.value.getBoundingClientRect(),x=(event.clientX-bounds.left)*viewSize/bounds.width,y=(event.clientY-bounds.top)*viewSize/bounds.height
 const rad=Math.PI/180
 const close=atlas.countries.value.flatMap(c=>{
  const [lat,lon]=c.latlng
  const visible=Math.sin(lat*rad)*Math.sin(-rotation.value[1]*rad)+Math.cos(lat*rad)*Math.cos(-rotation.value[1]*rad)*Math.cos((lon+rotation.value[0])*rad)>0
  if(!visible)return []
  const point=projection!.rotate(rotation.value).scale(270*zoom.value)([lon,lat]);if(!point)return []
  const distance=Math.hypot(point[0]-x,point[1]-y)*bounds.width/viewSize
  return distance<=48?[{country:c,distance}]:[]
 }).sort((a,b)=>a.distance-b.distance).map(v=>v.country)
 const hit=atlas.countries.value.find(c=>c.cca3===touched?.properties.ADM0_A3)
 nearbyQuizCountries.value=[...(hit?[hit]:[]),...close.filter(c=>c.cca3!==hit?.cca3)].slice(0,5)
 if(hit)previewQuizCountry(hit.cca3)
 else if(nearbyQuizCountries.value[0])previewQuizCountry(nearbyQuizCountries.value[0].cca3)
}

const selectedAtlas=computed(()=>atlas.countries.value.find(c=>c.cca3===selectedCode.value))
const selectedPopulation=computed(()=>{
 const c=selectedAtlas.value;if(!c)return undefined
 const f=countries.value.find(f=>f.properties.ADM0_A3===c.cca3),snapshot=atlas.statistics.value
 const baseline=snapshot?.countries[c.cca3]?.population
 const latest=countryPopulation(c.cca3,f?.properties.POP_EST??NaN,f?.properties.POP_YEAR??0,populationEstimates.value)
 if(baseline!=null&&Number.isFinite(baseline)&&baseline>=0&&snapshot!.year>latest.year)return {value:baseline,year:snapshot!.year,source:snapshot!.source}
 if(baseline!=null&&Number.isFinite(baseline)&&baseline>=0&&snapshot!.year===latest.year&&!populationEstimates.value[c.cca3])return {value:baseline,year:snapshot!.year,source:snapshot!.source}
 return Number.isFinite(latest.value)&&latest.year>0?latest:undefined
})
watch([night,showPopulation],()=>{layerError.value='';selectedContinent.value=null;hovered.value=null})
watch(night,()=>{lightsFailed.value=false})
function rasterError(){lightsFailed.value=true;layerError.value='Լուսավորության պատկերը հասանելի չէ։ Նույն քարտեզի գիշերային գունավորումը շարունակում է աշխատել։'}
const marker=computed(()=>{rotation.value;zoom.value;const target=props.mapQuiz&&candidateCountry.value?{coordinates:[candidateCountry.value.latlng[1],candidateCountry.value.latlng[0]] as [number,number]}:location.value;if(!target||!projection)return null;const [lon,lat]=target.coordinates;const rad=Math.PI/180;const visible=Math.sin(lat*rad)*Math.sin(-rotation.value[1]*rad)+Math.cos(lat*rad)*Math.cos(-rotation.value[1]*rad)*Math.cos((lon+rotation.value[0])*rad)>0;if(!visible)return null;return projection.rotate(rotation.value).scale(270*zoom.value)([lon,lat])})
// Marker positions are interior land points derived from the actual outlines.
const islandPoints=computed(()=>{
 if(!projection)return []
 const rad=Math.PI/180,rot=rotation.value,scale=270*zoom.value
 return countries.value.flatMap(feature=>{
  const coordinates=feature.properties.POINT
  if(!coordinates)return []
  const [lon,lat]=coordinates
  const visible=Math.sin(lat*rad)*Math.sin(-rot[1]*rad)+Math.cos(lat*rad)*Math.cos(-rot[1]*rad)*Math.cos((lon+rot[0])*rad)>0
  if(!visible)return []
  const point=projection!.rotate(rot).scale(scale)(coordinates)
  return point?[{feature,code:feature.properties.ADM0_A3,x:point[0],y:point[1]}]:[]
 })
})
const landmarkPoints=computed(()=>{
 rotation.value;zoom.value;countries.value
 if(!projection)return []
 const rad=Math.PI/180
 return geographicPlaces.filter(place=>['bishop-rock','tromelin'].includes(place.id)&&place.coordinates).flatMap(place=>{
  const [lon,lat]=place.coordinates!
  const visible=Math.sin(lat*rad)*Math.sin(-rotation.value[1]*rad)+Math.cos(lat*rad)*Math.cos(-rotation.value[1]*rad)*Math.cos((lon+rotation.value[0])*rad)>0
  if(!visible)return []
  const point=projection!.rotate(rotation.value).scale(270*zoom.value)([lon,lat])
  return point?[{place,x:point[0],y:point[1]}]:[]
 })
})
function centerAt(coordinates:[number,number]){
 cancelAnimationFrame(frame);frame=0;queuedRotation=undefined
 const target:[number,number,number]=[-coordinates[0],-coordinates[1],0]
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){rotation.value=target;return}
 const start:[number,number,number]=[...rotation.value],delta=((target[0]-start[0]+540)%360)-180
 let began=0,previous=0
 const animate=(time:number)=>{frame=0;if(disposed)return;if(!began)began=time;const t=Math.min(1,(time-began)/650);if(time-previous>30||t===1){const ease=1-(1-t)**3;rotation.value=[start[0]+delta*ease,start[1]+(target[1]-start[1])*ease,0];previous=time}if(t<1)frame=requestAnimationFrame(animate)}
 frame=requestAnimationFrame(animate)
}
function locate(target:MapLocation){if(!validCoordinates(target.coordinates))return;location.value=target;zoom.value=1;search.value='';centerAt(target.coordinates)}
watch(()=>props.focusLocation,value=>{if(value&&api)locate(value)})
function chooseCode(code:string){if(props.selectionLocked)return;if(needsQuizConfirmation()){previewQuizCountry(code);return}const feature=countries.value.find(c=>c.properties.ADM0_A3===code);if(feature){choose(feature,true);return}const country=atlas.countries.value.find(c=>c.cca3===code);if(country){selected.value=null;selectedCode.value=code;locate({coordinates:[country.latlng[1],country.latlng[0]],label:country.nameHy});emit('countrySelected',code)}}
function countryFill(feature:CountryFeature){
 const c=details.value[feature.properties.ADM0_A3],stats=atlas.statistics.value?.countries[feature.properties.ADM0_A3]
 let color=continentColors[feature.properties.CONTINENT]||'#427c79'
 if(showPopulation.value)color=populationMetric.value==='density'?populationColor(density(stats,c?.area||0)==null?undefined:density(stats,c?.area||0)!*1e5):populationColor(stats?.population)
 if(!night.value)return color
 return '#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.42).toString(16).padStart(2,'0')).join('')
}



const { estimates: populationEstimates, status: populationStatus } = usePopulationEstimates()
const stage = ref<HTMLElement | null>(null)
const countries = shallowRef<CountryFeature[]>([])
const details = shallowRef<Record<string, CountryDetails>>({})
const selected = shallowRef<CountryFeature | null>(null)
const hovered = shallowRef<CountryFeature | null>(null)
const loading = ref(true)
const error = ref(false)
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
  selectedCode.value=''
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
const tooltipPopulation=computed(()=>active.value?atlas.statistics.value?.countries[active.value.properties.ADM0_A3]?.population:undefined)
const activeDetails = computed(() => active.value ? info(active.value) : undefined)
const results = computed(() => {
  const query=normalizeGeoSearch(search.value)
  if(!query)return []
  const find=(term:string)=>atlas.countries.value.filter(country=>[country.nameHy,country.nameEn].some(value=>normalizeGeoSearch(value).includes(term))).slice(0,7)
  const exact=find(query)
  // Accept the Armenian definite article without changing official display names.
  return exact.length||query.length<4?exact:find(query.replace(/[ըն]$/u,''))
})
const placeResults=computed(()=>{
 const q=normalizeGeoSearch(search.value);if(!q)return []
 const find=(term:string)=>geographicPlaces.filter(p=>p.category==='Կղզիներ և ժայռեր').filter(p=>normalizeGeoSearch([p.title,'measure' in p?p.measure:'',p.category].join(' ')).includes(term)).slice(0,6)
 const exact=find(q)
 return exact.length||q.length<4?exact:find(q.replace(/[ըն]$/u,''))
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
    script.src = '/vendor/d3-7.9.0.min.js'
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
    const [loadedApi, worldResponse] = await Promise.all([
      loadApi(signal),
      fetch('/data/geography/world-v1.json', { signal }),
      atlas.load(),
    ])
    if (!worldResponse.ok) throw new Error('Country data unavailable')
    const world = await worldResponse.json() as { features: CountryFeature[] }
    const countryInfo = atlas.countries.value
    if (disposed || signal.aborted) return
    api = loadedApi
    projection = api.geoOrthographic().translate([viewSize / 2, viewSize / 2]).clipAngle(90).precision(.4)
    details.value = Object.fromEntries(countryInfo.map(country => [country.cca3, country]))
    countries.value = world.features.map(feature => orientCountry(feature, loadedApi.geoArea))
    selected.value = countries.value.find(country => country.properties.ADM0_A3 === 'ARM') ?? null
    if(props.focusLocation)locate(props.focusLocation)
    if(props.focusCountry)chooseCode(props.focusCountry.code)
  } catch {
    if (!disposed) error.value = true
  } finally {
    clearTimeout(timeout)
    if (!disposed) loading.value = false
  }
}
function choose(country: CountryFeature, center = true) {
  if(props.selectionLocked)return
  if(needsQuizConfirmation()){previewQuizCountry(country.properties.ADM0_A3);return}
  if (selectedContinent.value !== country.properties.CONTINENT) selectedContinent.value = null
  selected.value = country
  selectedCode.value=country.properties.ADM0_A3
  location.value=null
  emit('countrySelected',country.properties.ADM0_A3)
  hovered.value = null
  if (center) {
    const coordinates = info(country)?.latlng
    if (coordinates) centerAt([coordinates[1],coordinates[0]])
    hovered.value = null
    search.value = ''
  }
}
function moveTip(event: PointerEvent) {
  if (dragging.value || !stage.value) return
  const bounds = stage.value.getBoundingClientRect()
  tip.value = { x: Math.max(8, Math.min(event.clientX - bounds.left + 14, bounds.width - 210)), y: Math.max(8, Math.min(event.clientY - bounds.top + 14, bounds.height - 120)) }
}
function pointerDown(event: PointerEvent) {
  if (event.button !== 0 || !projection) return
  cancelAnimationFrame(frame);frame=0;queuedRotation=undefined
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
  if (!drag.moved && event.type === 'pointerup') {
    if(needsQuizConfirmation()&&!props.selectionLocked){nearbyAt(event,drag.country);suppressClick=true}
    else if(drag.country){choose(drag.country);suppressClick=true}
  }
  drag = undefined
  dragging.value = false
  const svg = event.currentTarget as SVGSVGElement
  if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId)
}
function changeZoom(amount: number) { zoom.value = Math.max(.75, Math.min(2.2, zoom.value + amount)) }
function keyRotate(event: KeyboardEvent) {
  cancelAnimationFrame(frame);frame=0
  if(event.key==='+'||event.key==='='){event.preventDefault();changeZoom(.15);return}
  if(event.key==='-'){event.preventDefault();changeZoom(-.15);return}
  if(event.key==='Home'){event.preventDefault();reset();return}
  const changes: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }
  const delta = changes[event.key]
  if (!delta) return
  event.preventDefault()
  rotation.value = rotateGlobe(rotation.value, delta[0], delta[1], 100)
  hovered.value = null
}
function reset() { cancelAnimationFrame(frame);frame=0;location.value=null; selectedContinent.value = null; rotation.value = [-45, -25, 0]; zoom.value = 1; hovered.value = null }
onMounted(()=>{void load();void $fetch<WorldRecord[]>('/data/geography/records-v1.json',{timeout:10000}).then(value=>{if(!disposed)records.value=value}).catch(()=>{})})
onBeforeUnmount(() => { disposed = true; controller?.abort(); worldSearchController?.abort(); cancelWorldSearchTimer(); cancelAnimationFrame(frame) })
defineExpose({ getSurfaceFeatures: () => countries.value })
</script>

<template>
  <div class="globe-layout">
      <section class="panel globe-search-panel">
        <label for="globe-country-search"><Search :size="17" /> Որոնիր աշխարհում</label>
        <div class="globe-world-search">
          <input id="globe-country-search" v-model="search" class="input" type="search" maxlength="160" placeholder="Երկիր, տարածք, կղզի…" autocomplete="off" :disabled="loading || error || mapQuiz" />
        </div>
        <ul v-if="results.length" class="globe-results"><li v-for="country in results" :key="country.cca3"><button type="button" @click="chooseCode(country.cca3)"><CountryFlag :code="country.cca2"/><span class="globe-result-name">{{country.nameHy}}<small>{{capitalName(country.cca3,country.capital)}}</small></span><MapPin :size="14"/></button></li></ul>
        <ul v-if="placeResults.length" class="globe-results"><li v-for="place in placeResults" :key="place.id"><button type="button" @click="place.coordinates && locate({coordinates:place.coordinates,label:place.title,detail:place.detail,source:place.source})"><span class="globe-result-name">{{place.title}}<small>{{place.category}}</small></span><MapPin :size="14"/></button></li></ul>
        <ul v-if="worldResults.length" class="globe-results"><li v-for="place in worldResults" :key="place.id"><button type="button" @click="chooseWorldPlace(place)"><MapPin :size="17"/><span class="globe-result-name">{{place.label}}<small>{{place.context}}</small></span></button></li></ul>
        <p v-if="worldSearchState==='loading'" class="globe-data-note" role="status">Որոնում ենք աշխարհի տեղանուններում…</p>
        <p v-else-if="worldSearchState==='error'" class="globe-data-note" role="status">{{worldSearchMessage}}</p>
        <p v-else-if="worldSearchState==='ready'&&!worldResults.length" class="globe-data-note" role="status">Այդ անվամբ վայր չի գտնվել։ Փորձիր նաև երկրի կամ կղզու միջազգային անվանումը։</p>
        <p v-else-if="search.trim().length>=2&&!results.length&&!placeResults.length&&!worldResults.length" class="globe-data-note">Փնտրում ենք երկրներ, տարածքներ և կղզիներ…</p>
        <p v-if="worldSearchState!=='idle'" class="globe-search-credit">Համաշխարհային որոնում՝ Photon · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></p>
        <p v-if="mapQuiz" class="globe-data-note">Քարտեզի խաղի ընթացքում որոնումը ժամանակավորապես փակ է։</p>
      </section>
    <section class="panel globe-view" :class="{'is-night':night}" aria-label="Ինտերակտիվ երկրագունդ">
      <div class="globe-toolbar">
        <span><Globe2 :size="16" /> Բացահայտիր աշխարհը</span>
        <div class="globe-controls">
          <button type="button" aria-label="Հեռացնել երկրագունդը" :disabled="zoom <= .75 || loading" @click="changeZoom(-.15)"><Minus :size="18" /></button>
          <button type="button" aria-label="Մոտեցնել երկրագունդը" :disabled="zoom >= 2.2 || loading" @click="changeZoom(.15)"><Plus :size="18" /></button>
          <button type="button" aria-label="Վերականգնել սկզբնական դիրքը" @click="reset"><RotateCcw :size="17" /></button>
        </div>
      </div>
      <div class="globe-display-options" role="group" aria-label="Նույն քարտեզի շերտերը"><label :class="{'is-enabled':showPopulation}"><input v-model="showPopulation" type="checkbox">Ցույց տալ բնակչությունը</label><label :class="{'is-enabled':night}"><input v-model="night" type="checkbox">Գիշերային տեսք</label></div>
      <p v-if="layerError" role="status" class="globe-layer-note">{{layerError}}</p>
      <div v-if="showPopulation" class="globe-population-key" :class="{'is-night':night}">
        <label>Ցուցանիշ<select v-model="populationMetric"><option value="total">Բնակչության թիվ</option><option value="density">Բնակչության խտություն</option></select></label>
        <p class="globe-scale-unit">{{populationMetric==='total'?'Մարդկանց թիվը':'Մարդ / կմ²'}}</p>
        <ul class="globe-color-scale" aria-label="Գույների և արժեքների համապատասխանությունը"><li v-for="(color,index) in ['#83c8b4','#4d9d98','#b6ac69','#d58b51','#b84d57']" :key="color"><span>{{(populationMetric==='total'?['< 1 մլն','1–10 մլն','10–50 մլն','50–200 մլն','≥ 200 մլն']:['< 10','10–100','100–500','500–2000','≥ 2000'])[index]}}</span><i :style="{background:color}" aria-hidden="true"/></li></ul>
        <p class="globe-missing-key"><i aria-hidden="true"/>Մոխրագույն՝ այս ցուցանիշի տվյալը բացակայում է։</p><p class="globe-scale-source">Գունավորումը՝ Համաշխարհային բանկի {{atlas.statistics.value?.year}} թ․ տվյալներով։</p>
      </div>
      <div ref="stage" class="globe-stage" :class="{ 'is-dragging': dragging }">
        <div v-if="loading" class="globe-message" role="status"><Globe2 :size="40" /><p>Բեռնում ենք երկրագունդը…</p></div>
        <div v-else-if="error" class="globe-message" role="alert"><Globe2 :size="40" /><p>Չհաջողվեց բեռնել քարտեզը։ Ստուգիր ինտերնետ կապը։</p><button class="btn-secondary" @click="load">Փորձել կրկին</button></div>
        <LazyGlobeRasterLayer v-if="!loading&&!error&&projection&&night&&!lightsFailed" :projection="projection" :rotation="rotation" :zoom="zoom" mode="night" @error="rasterError"/>
        <svg v-if="!loading&&!error" :viewBox="`0 0 ${viewSize} ${viewSize}`" :class="{ 'has-pointer-focus': pointerFocused }" tabindex="0" role="group" aria-label="Պտտվող երկրագունդ․ պտտիր մկնիկով, հպումով կամ ստեղնաշարի սլաքներով։ Երկրները կարող ես ընտրել նաև որոնմամբ։" @keydown="pointerFocused = false; keyRotate($event)" @pointerdown="pointerFocused = true; pointerDown($event)" @blur="pointerFocused = false" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @lostpointercapture="pointerUp" @pointerleave="hovered = null">
          <defs>
            <radialGradient id="factum-ocean" cx="32%" cy="28%" r="80%"><stop stop-color="#22678a" /><stop offset=".6" stop-color="#103e62" /><stop offset="1" stop-color="#04142a" /></radialGradient>
            <radialGradient id="factum-globe-shade" cx="32%" cy="28%" r="75%"><stop offset=".3" stop-color="#fff" stop-opacity=".06" /><stop offset=".75" stop-color="#020918" stop-opacity=".08" /><stop offset="1" stop-color="#010612" stop-opacity=".8" /></radialGradient>
            <radialGradient id="factum-night-shade" cx="32%" cy="28%" r="75%"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#020918" stop-opacity=".08"/><stop offset="1" stop-color="#010612" stop-opacity=".8"/></radialGradient>
            <radialGradient id="factum-night-ocean" cx="32%" cy="28%" r="80%"><stop stop-color="#10283d"/><stop offset=".6" stop-color="#081a2b"/><stop offset="1" stop-color="#030b17"/></radialGradient>
            <clipPath id="factum-globe-clip"><circle cx="340" cy="340" :r="radius" /></clipPath>
          </defs>
          <circle v-if="!night" cx="340" cy="340" :r="radius + 7" fill="none" stroke="#71b9ed" stroke-opacity=".12" stroke-width="12" />
          <circle class="globe-ocean" cx="340" cy="340" :r="radius" :fill="night?'url(#factum-night-ocean)':'url(#factum-ocean)'" stroke="#80c6e8" :stroke-opacity="night ? .2 : .6" />
          <g clip-path="url(#factum-globe-clip)">
            <path v-if="!night" :d="graticule" fill="none" stroke="#80b3c7" stroke-opacity=".22" stroke-width=".8" pointer-events="none" />
            <path v-for="item in paths" :key="item.country.properties.ADM0_A3 + item.country.properties.NAME" :d="item.path" :data-country="item.country.properties.ADM0_A3" class="globe-country" :style="{ '--continent-color': countryFill(item.country) }" :class="{ 'is-active': mapQuiz ? quizCandidate===item.country.properties.ADM0_A3 : active === item.country, 'is-night':night, 'is-continent-selected': selectedContinent === item.country.properties.CONTINENT, 'is-continent-muted': selectedContinent && selectedContinent !== item.country.properties.CONTINENT }" @pointerenter="!mapQuiz && !selectionLocked && !dragging && $event.pointerType !== 'touch' && (hovered = item.country)" @pointerleave="hovered = null" @click="!suppressClick && choose(item.country)"><title v-if="!mapQuiz">{{ name(item.country) }}</title></path>
          </g>
          <circle cx="340" cy="340" :r="radius" :fill="night?'url(#factum-night-shade)':'url(#factum-globe-shade)'" pointer-events="none" />
          <g v-for="point in islandPoints" :key="point.code" class="globe-island" :class="{'is-selected':(mapQuiz ? quizCandidate : selectedCode)===point.code}" @pointerenter="!mapQuiz && !selectionLocked && !dragging && (hovered = point.feature)" @pointerleave="hovered = null" @focus="!mapQuiz && (hovered = point.feature)" @blur="hovered = null" :transform="`translate(${point.x},${point.y})`" role="button" tabindex="0" :aria-label="mapQuiz ? 'Ընտրել կղզին կամ փոքր երկիրը' : name(point.feature)" @pointerdown.stop @click.stop="chooseCode(point.code)" @keydown.enter.stop.prevent="chooseCode(point.code)" @keydown.space.stop.prevent="chooseCode(point.code)">
            <circle r="9" fill="transparent"/>
            <circle class="island-selection-halo" r="13" fill="#f4d79c20" stroke="#ffe0a3" stroke-opacity=".35" stroke-width="1" pointer-events="none"/>
            <circle class="island-ring" r="6" fill="#dfc38f18" stroke="#dfc38faa" stroke-width="1" pointer-events="none"/>
            <circle r="2.5" :fill="(mapQuiz ? quizCandidate : selectedCode)===point.code ? '#fff1cd' : '#dfc38f'" stroke="#fff1cd" stroke-opacity=".5" stroke-width=".5" pointer-events="none"/>
            <title v-if="!mapQuiz">{{name(point.feature)}}</title>
          </g>
          <g v-if="!mapQuiz">
            <g v-for="point in landmarkPoints" :key="point.place.id" class="globe-island" :transform="`translate(${point.x},${point.y})`" role="button" tabindex="0" :aria-label="point.place.title" @pointerdown.stop @click.stop="locate({coordinates:point.place.coordinates!,label:point.place.title,detail:point.place.detail,source:point.place.source})" @keydown.enter.stop.prevent="locate({coordinates:point.place.coordinates!,label:point.place.title,detail:point.place.detail,source:point.place.source})" @keydown.space.stop.prevent="locate({coordinates:point.place.coordinates!,label:point.place.title,detail:point.place.detail,source:point.place.source})">
              <circle r="9" fill="transparent"/><circle class="island-ring" r="6" fill="#dfc38f18" stroke="#dfc38faa"/><circle r="2.5" fill="#dfc38f"/>
              <title>{{point.place.title}}</title>
            </g>
          </g>
        </svg>
        <svg v-if="marker && (!mapQuiz || candidateCountry)" class="globe-markers" :viewBox="`0 0 ${viewSize} ${viewSize}`" aria-hidden="true"><g class="geo-marker" :transform="`translate(${marker[0]},${marker[1]})`" pointer-events="none"><circle r="13" fill="#dfc38f22" stroke="#dfc38f88"/><circle r="5" fill="#ffe0a3" stroke="#fff1cd" stroke-width="1"/></g></svg>
        <div v-if="active && !dragging && !mapQuiz && !location" class="globe-tooltip" :class="{ 'is-selected': !hovered }" :style="hovered ? { left: `${tip.x}px`, top: `${tip.y}px` } : undefined" aria-hidden="true"><strong><CountryFlag :code="flagCode(active)" /> {{ name(active) }}</strong><small>{{ continents[active.properties.CONTINENT] || active.properties.CONTINENT }}</small><small v-if="showPopulation" class="globe-tooltip-population">Բնակչություն՝ {{tooltipPopulation!=null?number.format(Math.round(tooltipPopulation)):'Տվյալը հասանելի չէ'}}<template v-if="tooltipPopulation!=null"> · {{atlas.statistics.value?.year}} թ․</template></small></div>
      </div>
      <div v-if="mapQuiz && candidateCountry" class="quiz-map-confirm" aria-live="polite">
        <p>Ընտրված երկիրը՝ <strong>{{candidateCountry.nameHy}}</strong></p>
        <div v-if="nearbyQuizCountries.length>1" class="quiz-nearby" role="group" aria-label="Հպման կետին մոտ երկրներ"><span>Մոտակայքում՝</span><button v-for="country in nearbyQuizCountries" :key="country.cca3" type="button" :aria-pressed="quizCandidate===country.cca3" @click="previewQuizCountry(country.cca3)">{{country.nameHy}}</button></div>
        <button class="btn" type="button" :disabled="selectionLocked" @click="confirmQuizCountry">Հաստատել ընտրությունը</button>
        <small>Կարող ես ընտրել այլ երկիր կամ մոտեցնել քարտեզը, ապա հաստատել։</small>
      </div>
      <p v-if="location&&!mapQuiz" class="globe-location-label" role="status"><MapPin :size="16"/>{{location.label}}<button type="button" aria-label="Հեռացնել նշիչը" @click="location=null">×</button></p>
      <ul class="globe-continent-legend" aria-label="Ընտրիր աշխարհամասը">
        <li v-for="(color, continent) in continentColors" :key="continent">
          <button type="button" :aria-pressed="selectedContinent === continent" :disabled="loading || error" @click="toggleContinent(String(continent))">

            {{ continents[continent] }}
          </button>
        </li>
      </ul>
      <p class="globe-continent-help" role="status">{{ selectedContinent ? `${continents[selectedContinent]}․ կրկին սեղմիր՝ ընդգծումը հանելու համար։` : 'Ընտրիր աշխարհամասը՝ այն տեսնելու համար։' }}</p>
      <p class="globe-hint"><MousePointer2 :size="15" /> Քաշիր՝ պտտելու, պահիր երկրի վրա՝ տեսնելու, սեղմիր՝ ընտրելու համար։</p>
    </section>

    <aside class="globe-sidebar">

      <section id="globe-country-info" tabindex="-1" class="panel globe-info" aria-live="polite" aria-atomic="true">
        <p v-if="mapQuiz" class="globe-data-note">Քարտեզի խաղը ակտիվ է։ Ընտրիր երկիրը երկրագնդի վրա։ Մոբայլում ընտրությունը հաստատիր քարտեզի ներքևի կոճակով։</p>
        <article v-else-if="location" class="globe-place-info"><p class="gold">ԸՆՏՐՎԱԾ ՎԱՅՐ</p><h2>{{location.label}}</h2><p v-if="location.detail">{{location.detail}}</p><p>{{Math.abs(location.coordinates[1]).toFixed(5)}}° {{location.coordinates[1]>=0?'N':'S'}} · {{Math.abs(location.coordinates[0]).toFixed(5)}}° {{location.coordinates[0]>=0?'E':'W'}}</p><a v-if="location.source" :href="location.source.url" target="_blank" rel="noopener noreferrer">{{location.source.name}} ↗</a></article>
        <GlobeCountryPanel v-else-if="selectedAtlas" :country="selectedAtlas" :countries="atlas.countries.value" :statistics="atlas.statistics.value" :population="selectedPopulation" @select="chooseCode"/>
        <div v-else class="globe-empty"><Globe2 :size="32" /><h2>Աշխարհը՝ քո ձեռքերում</h2><p>Ընտրիր երկիրը գլոբուսի վրա կամ գտիր որոնմամբ։</p></div>
      </section>
      <p v-if="populationStatus === 'loading'" class="globe-data-note" role="status">Թարմացնում ենք բնակչության տվյալները…</p>
      <p v-else-if="populationStatus === 'error'" class="globe-data-note" role="status">Բնակչության թարմացումն այս պահին անհասանելի է․ ցուցադրված են պահպանված տվյալները՝ իրենց տարեթվերով։</p>
      <p class="globe-data-note">Բնակչությունը՝ յուրաքանչյուր երկրի համար հասանելի վերջին տարեթվով։ Քարտեզը՝ պարզեցված սահմաններով։ Փոքր երկրներն ու կղզիները կարող են չերևալ։ Թվերը ներկայացվում են աղբյուրով և տարեթվով։ Քարտեզի սահմանները իրավական դիրքորոշում չեն։</p>
    </aside>
  </div>
</template>

<style scoped>
.globe-world-search{margin:0}.globe-search-credit{font-size:10px;line-height:1.7;color:#a9bbd4;margin-top:12px}.globe-search-credit a,.globe-place-info a{color:#dfc38f;text-decoration:underline}.globe-place-info{min-width:0;overflow-wrap:anywhere}.globe-place-info h2{font-size:23px;line-height:1.5;margin:8px 0 14px}.globe-place-info p{font-size:12px;line-height:1.9;margin:10px 0}.globe-place-info a{font-size:12px}

.globe-island{cursor:pointer}.globe-island:focus{outline:none}.island-selection-halo{display:none}.globe-island.is-selected .island-selection-halo{display:block}.globe-island.is-selected .island-ring{r:9}.globe-island.is-selected circle:last-of-type{r:4;fill:#fff1cd;stroke:#ffe0a3;stroke-width:1}.globe-island.is-selected .island-ring,.globe-island:focus-visible .island-ring{fill:#dfc38f30;stroke:#ffe0a3;stroke-width:1.5}.globe-island:focus-visible .island-ring{r:8}.globe-island:focus-visible circle:last-of-type,.globe-island:hover circle:last-of-type{fill:#fff1cd;stroke:#ffe0a3;stroke-width:1.5}
.quiz-map-confirm{margin:12px 20px;padding:16px;border:1px solid #dfc38f66;border-radius:12px;background:#101e32;display:grid;gap:14px}.quiz-map-confirm p{font-size:13px;line-height:1.8}.quiz-map-confirm strong{color:#dfc38f}.quiz-map-confirm small{font-size:11px;line-height:1.8;color:#a9bbd4}.quiz-map-confirm>.btn{min-height:48px}.quiz-nearby{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:11px}.quiz-nearby button{min-height:44px;padding:8px 12px;border:1px solid #8997c044;border-radius:10px}.quiz-nearby button[aria-pressed=true]{color:#dfc38f;border-color:#dfc38f;background:#dfc38f10}


.globe-layout { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr); gap: 24px; align-items: start; }
.globe-view { grid-column: 1; grid-row: 1 / span 2; overflow: hidden; background: radial-gradient(ellipse at 45% 45%, #122e4c, #061226 72%); }
.globe-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 0; }
.globe-toolbar > span { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #dfc38f; }
.globe-controls { display: flex; gap: 7px; }
.globe-controls button { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #8291b140; border-radius: 10px; color: #e9d5ae; background: #15233c; }
.globe-controls button:hover:not(:disabled) { border-color: #dfc38f; background: #243452; }
.globe-controls button:disabled { opacity: .35; cursor: default; }
.globe-stage { position: relative; width: min(100%, 680px); aspect-ratio: 1; margin-inline: auto; }
.globe-stage svg { display: block; width: 100%; height: 100%; touch-action: none; user-select: none; }
.globe-stage svg, .globe-ocean, .globe-country { cursor: url('/images/globe-pointer.svg') 5 5, crosshair; }
.globe-stage.is-dragging :is(svg, .globe-ocean, .globe-country) { cursor: grabbing; }
.globe-stage svg:focus { outline: none; }
.globe-stage svg:not(.has-pointer-focus):focus-visible, .globe-controls button:focus-visible, .globe-results button:focus-visible { outline: 2px solid #f4c46c; outline-offset: -3px; }
.globe-country { fill: var(--continent-color, #427c79); stroke: #b2d6ca; stroke-width: .9; stroke-linejoin: round; }
.globe-country.is-continent-muted { opacity: .25; }
.globe-country.is-continent-selected { stroke: #f1f5ff; stroke-width: 1; }
.globe-country.is-active { opacity: 1; fill: #dfbb76; stroke: #ffe8b4; stroke-width: 1.3; }
.globe-tooltip { position: absolute; z-index: 5; max-width: calc(100% - 16px); width: 200px; padding: 11px 14px; border: 1px solid #dfc38f88; border-radius: 12px; background: #081326ed; color: #ffe4b2; box-shadow: 0 8px 24px #0005; pointer-events: none; }
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
.globe-sidebar { min-width: 0; grid-template-columns: minmax(0, 1fr); display: grid; gap: 18px; grid-column: 2; grid-row: 2; }
.globe-search-panel { grid-column: 2; grid-row: 1; }
.globe-info { min-width: 0; scroll-margin-top: 110px; }
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

.globe-display-options{display:flex;flex-wrap:wrap;gap:8px;padding:16px 20px;border-bottom:1px solid #8ba2c022}.globe-display-options label{display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:10px 13px;border:1px solid #8997c033;border-radius:10px;color:#b6c7dc;font-size:11px;cursor:pointer}.globe-display-options label.is-enabled{border-color:#dfc38f88;color:#dfc38f;background:#dfc38f10}.globe-display-options input{accent-color:#dfc38f;width:16px;height:16px}.globe-display-options label:focus-within{outline:2px solid #dfc38f;outline-offset:3px}.globe-tooltip .globe-tooltip-population{color:#dfc38f;font-size:10px;flex-basis:100%;line-height:1.7}.globe-tooltip.is-selected{flex-wrap:wrap}.globe-stage{isolation:isolate}
.globe-stage>svg{position:relative;z-index:1}.globe-country.is-night{stroke:#91b4ce99;stroke-width:.9}.globe-country.is-night.is-active{fill:#dfbb76;stroke:#ffe8b4;stroke-width:1.3}.globe-stage>svg.globe-markers{position:absolute;inset:0;z-index:3;pointer-events:none}.globe-layer-note{padding:12px 20px;color:#dfc38f;font-size:11px;line-height:1.8}.globe-population-key{padding:14px 20px;color:#adc1d9;font-size:10px;line-height:1.8}.globe-population-key label{display:flex;align-items:center;gap:12px}.globe-population-key select{background:#0d1e33;border:1px solid #8997c044;border-radius:8px;min-height:40px;padding:8px;color:#dfc38f}.globe-population-key.is-night i{filter:brightness(.42)}.globe-population-key .globe-scale-unit{margin-top:14px;color:#b9c9dc}.globe-color-scale{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;list-style:none;padding:0;margin:8px 0 12px;max-width:560px}.globe-color-scale li{display:flex;flex-direction:column;gap:7px;min-width:0;text-align:center}.globe-color-scale span{font-size:10px;line-height:1.6;color:#d2ddeb;white-space:nowrap}.globe-color-scale i{display:block;height:10px;width:100%;border-radius:3px}.globe-missing-key{display:flex;align-items:center;gap:7px}.globe-missing-key i{width:11px;height:11px;border-radius:3px;background:#36445a;flex-shrink:0}@media(max-width:400px){.globe-color-scale{gap:3px}.globe-color-scale span{font-size:8px}}.globe-location-label{display:flex;justify-content:center;align-items:center;gap:10px;font-size:12px;color:#dfc38f;margin:12px 20px;line-height:1.8}.globe-location-label button{min-width:44px;min-height:44px;font-size:22px}.globe-results small{display:block;font-size:10px;color:#91a5bf;margin-top:5px}.globe-controls button{width:44px;height:44px}.globe-country{transition:fill .25s,opacity .25s}@media(prefers-reduced-motion:reduce){.globe-country{transition:none}}
</style>
