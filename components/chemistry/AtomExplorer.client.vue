<script setup lang="ts">
import { nextTick } from 'vue'
import AtomSelect from './AtomSelect.vue'
import { Atom, RotateCcw, Pause, Play, Plus, Minus, Move, LoaderCircle, ChevronLeft, X } from 'lucide-vue-next'
import { periodicElements, elementFamilies } from '~/data/periodicTable'
import { atomIsotopes, atomIsotopeSource, createAtomModel, defaultIsotope } from '~/utils/chemistry/atomModel'
import { atomLessons } from '~/data/chemistry/atomLessons'
import { orbitalOrientations, orbitalLabel, orbitalSource } from '~/utils/chemistry/orbitals'
import type { createOrbitalSampler } from '~/utils/chemistry/orbitalSampler.client'
import type { AtomScene } from '~/utils/chemistry/atomScene.client'

const props = defineProps<{ elementNumber: number }>()
const emit = defineEmits<{ select: [number: number]; back: [] }>()
const element = computed(() => periodicElements.find(item => item.number === props.elementNumber) || periodicElements[0]!)
const configuration = computed(() => element.value.electronConfiguration.replace(/\s*\((?:calculated|predicted)\)/g, ''))
const isotopeOptions = computed(() => atomIsotopes(element.value.number))
const massNumber = ref(defaultIsotope(element.value.number)!)
const guideStep = ref<number | null>(null)
const lessonExpanded = ref(true)
const lessonPanel = ref<HTMLElement | null>(null)
const lessonHeading = ref<HTMLElement | null>(null)
const subshellLabel = ref('1s')
const orientation = ref(0)
const cutaway = ref(false)
const density = ref(.52)
const cloudBusy = ref(false)
const cloudError = ref(false)
let sampler: ReturnType<typeof createOrbitalSampler> | undefined
let cloudGeneration = 0
const playing = ref(false)
const loading = ref(true)
const error = ref(false)
const viewport = ref<HTMLElement | null>(null)
let scene: AtomScene | undefined
let disposed = false
let loadingScene = false
let motionPreference: MediaQueryList | undefined
watch(() => element.value.number, number => { massNumber.value = defaultIsotope(number)! })
const model = computed(() => createAtomModel(element.value.number, massNumber.value))
const subshell = computed(() => model.value.subshells.find(item => item.label === subshellLabel.value) || model.value.subshells.at(-1)!)
const orientations = computed(() => orbitalOrientations(subshell.value.l))
const elementSelectOptions = periodicElements.map(item => ({ value: item.number, label: `${item.number} · ${item.name} · ${item.symbol}` }))
const isotopeSelectOptions = computed(() => isotopeOptions.value.map(item => ({ value: item.massNumber, label: `${element.value.symbol}–${item.massNumber}` })))
const subshellSelectOptions = computed(() => model.value.subshells.map(item => ({ value: item.label, label: `${item.label} · ${item.count} էլեկտրոն` })))
const orientationSelectOptions = computed(() => orientations.value.map(item => ({ value: item.m, label: `${subshell.value.n}${item.label}` })))
const orbital = computed(() => ({ n: subshell.value.n, l: subshell.value.l, m: orientation.value }))
const orbitalName = computed(() => orbitalLabel(orbital.value))
const shapeDescription = computed(() => [
  'Այս s օրբիտալի ամպը գնդային համաչափություն ունի․ միջուկից նույն հեռավորության վրա բոլոր ուղղությունները համարժեք են։',
  'Այս p օրբիտալն ունի երկու հիմնական բլթակ։ Դրանց միջև միջուկով անցնող հանգուցային հարթությունում հայտնաբերման հավանականությունը զրո է։',
  'Սա d օրբիտալ է։ Տարբեր կողմնորոշումներն ունեն տարբեր ձևեր․ ընտրիր տարբերակները և համեմատիր բլթակների դասավորությունը։',
  'Սա f օրբիտալ է՝ ավելի բարդ տարածական կառուցվածքով։ Պտտիր այն՝ տարբեր կողմերից բլթակները տեսնելու համար։',
][subshell.value.l])
const lessonNames = atomLessons.map(lesson => lesson.title)
const activeLesson = computed(() => guideStep.value === null ? null : atomLessons[guideStep.value] || null)
const guideTitle = computed(() => guideStep.value === null ? 'Ինչի՞ց է կազմված ատոմը' : lessonNames[guideStep.value])
const guideDescription = computed(() => {
  switch (guideStep.value) {
    case 0: return `Պրոտոնները միջուկում են և ունեն դրական լիցք։ Պրոտոնների քանակն է որոշում քիմիական տարրը․ ${element.value.name} տարրի ատոմն ունի ${model.value.protons} պրոտոն։ Այդ թիվը փոխելիս արդեն այլ տարր կստանանք։`
    case 1: return `Նեյտրոնները միջուկում են և էլեկտրական լիցք չունեն։ Նեյտրոնները մասնակցում են միջուկի կառուցվածքին, և դրանց քանակն ազդում է միջուկի կայունության վրա։ ${element.value.symbol}–${massNumber.value} իզոտոպն ունի ${model.value.neutrons} նեյտրոն։ ${model.value.neutrons === 0 ? 'Այս իզոտոպում նեյտրոն չկա։' : ''}`
    case 2: return `Էլեկտրոնները բացասական լիցքով մասնիկներ են։ Դրանք միջուկից դուրս են և մասնակցում են քիմիական կապերի առաջացմանը։ Այս չեզոք ատոմում դրանց թիվը ${model.value.electrons} է՝ պրոտոնների թվին հավասար։ Ամպի կետերը էլեկտրոնի հնարավոր հայտնաբերման տեղերն են, ոչ առանձին էլեկտրոններ կամ դրանց շարժման ուղիներ։`
    case 3: return `Նույն տարրի տարբեր իզոտոպներն ունեն նույն թվով պրոտոններ և տարբեր թվով նեյտրոններ։ Ընտրված ${element.value.symbol}–${massNumber.value} իզոտոպի զանգվածային թիվը ${massNumber.value} է՝ ${model.value.protons} պրոտոն + ${model.value.neutrons} նեյտրոն։ Ստորև փոխիր իզոտոպը և հետևիր՝ ինչն է փոխվում, ինչը՝ մնում նույնը։`
    case 4: return 'Օրբիտալը նկարագրում է էլեկտրոնի քվանտային վիճակը։ Ամպը ցույց է տալիս՝ որտեղ է այն հայտնաբերելու հավանականությունն ավելի մեծ։ Յուրաքանչյուր կետ հնարավոր դիտարկման տեղ է․ հազարավոր կետերը հազարավոր էլեկտրոններ չեն։ Սա մեկ ընտրված օրբիտալ է, ոչ ամբողջ ատոմի էլեկտրոնային պատկերը։'
    default: return 'Ատոմի կենտրոնում միջուկն է՝ պրոտոններով և, սովորաբար, նեյտրոններով։ Միջուկից դուրս էլեկտրոններն են։ Ընտրիր թեման և իմացիր՝ որն է յուրաքանչյուր մասնիկը, որտեղ է գտնվում և ինչ դեր ունի։ Մասնիկների չափերն ու հեռավորությունները պայմանական են։'
  }
})
function startGuide(step: number) { if (atomLessons[step]) { guideStep.value = step; lessonExpanded.value = true } }
async function openLesson(step: number) {
  startGuide(step)
  await nextTick()
  lessonPanel.value?.scrollIntoView({ behavior: motionPreference?.matches ? 'instant' : 'smooth', block: 'start' })
  lessonHeading.value?.focus({ preventScroll: true })
}
function closeGuide() { guideStep.value = null; lessonExpanded.value = false }
async function closeReading() {
  const index = guideStep.value ?? 0
  closeGuide()
  await nextTick()
  lessonPanel.value?.querySelector<HTMLButtonElement>(`[data-lesson-index="${index}"]`)?.focus({ preventScroll: true })
}
watch(() => element.value.number, () => { guideStep.value = null })



function defaultOrbital() { subshellLabel.value = model.value.subshells.at(-1)!.label; orientation.value = 0 }
defaultOrbital()
watch(() => element.value.number, defaultOrbital)
watch(subshellLabel, () => { orientation.value = 0 })
async function updateCloud() {
  const generation = ++cloudGeneration
  sampler?.cancel()
  scene?.clearCloud()
  cloudBusy.value = false
  cloudError.value = false
  if (!scene || !sampler) return
  cloudBusy.value = true
  try {
    const cloud = await sampler.sample(orbital.value)
    if (!disposed && generation === cloudGeneration) scene?.setOrbitalCloud(cloud)
  } catch {
    if (!disposed && generation === cloudGeneration) cloudError.value = true
  } finally {
    if (!disposed && generation === cloudGeneration) cloudBusy.value = false
  }
}
watch(orbital, () => { void updateCloud() })
watch(cutaway, value => scene?.setCutaway(value))
watch(density, value => scene?.setDensity(value))
function updateModel() {
  scene?.setAtom(model.value)
  scene?.setMotion(playing.value)
  scene?.setView('cloud')
  scene?.setCutaway(cutaway.value)
  scene?.setDensity(density.value)
  void updateCloud()
}
watch(model, updateModel)
watch(playing, enabled => scene?.setMotion(enabled))
function stopForReducedMotion(event: MediaQueryListEvent) { if (event.matches) playing.value = false }
async function loadScene() {
  if (loadingScene || disposed || !viewport.value) return
  loadingScene = true
  loading.value = true
  error.value = false
  try {
    const [{ createAtomScene }, { createOrbitalSampler }] = await Promise.all([import('~/utils/chemistry/atomScene.client'), import('~/utils/chemistry/orbitalSampler.client')])
    if (disposed || !viewport.value) return
    scene?.dispose()
    sampler?.dispose()
    sampler = createOrbitalSampler()
    scene = createAtomScene(viewport.value, () => { error.value = true; playing.value = false })
    updateModel()
  } catch {
    error.value = true
    playing.value = false
  } finally {
    loadingScene = false
    if (!disposed) loading.value = false
  }
}
function keyboard(event: KeyboardEvent) {
  if (loading.value || error.value) return
  const step = .12
  const actions: Record<string, () => void> = {
    ArrowLeft: () => scene?.rotate(-step, 0), ArrowRight: () => scene?.rotate(step, 0),
    ArrowUp: () => scene?.rotate(0, -step), ArrowDown: () => scene?.rotate(0, step),
    '+': () => scene?.zoom(.85), '=': () => scene?.zoom(.85), '-': () => scene?.zoom(1.18),
    Home: () => scene?.resetView(), ' ': () => { playing.value = !playing.value },
  }
  const action = actions[event.key]
  if (action) { event.preventDefault(); action() }
}
onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  playing.value = !motionPreference.matches
  motionPreference.addEventListener('change', stopForReducedMotion)
  void loadScene()
})
onBeforeUnmount(() => {
  disposed = true
  cloudGeneration++
  sampler?.dispose()
  motionPreference?.removeEventListener('change', stopForReducedMotion)
  scene?.dispose()
  scene = undefined
})
</script>

<template>
  <div class="atom-lab" :style="{ '--atom-accent': elementFamilies[element.family].color }">
    <header class="atom-lab-heading">
      <div><p class="atom-eyebrow"><Atom :size="15" aria-hidden="true" /> FACTUM · ԱՏՈՄՆԵՐԻ ԱՇԽԱՐՀ</p><h2>{{ element.name }} <span>{{ element.symbol }}</span></h2><p class="muted">Բացահայտիր չեզոք ատոմի կառուցվածքը՝ մասնիկ առ մասնիկ։</p></div>
      <button type="button" class="btn-secondary atom-back" @click="emit('back')"><ChevronLeft :size="16" aria-hidden="true" /> Պարբերական աղյուսակ</button>
    </header>
    <p class="atom-quantum-intro">Քվանտային օրբիտալներ · Հավանականության ամպ</p>
    <section ref="lessonPanel" class="atom-guide panel" aria-label="Սովորիր ատոմի կառուցվածքը">
      <div class="atom-lesson-tabs" role="group" aria-label="Ընտրիր՝ ինչ ես ուզում ուսումնասիրել"><button v-for="(name, index) in lessonNames" :key="name" type="button" :aria-pressed="guideStep === index" :data-lesson-index="index" @click="startGuide(index)">{{ index + 1 }}. {{ name }}</button></div>
      <div v-if="lessonExpanded" class="atom-lesson-heading"><h3 ref="lessonHeading" tabindex="-1">{{ guideTitle }}</h3><button type="button" class="atom-lesson-close" @click="closeReading"><X :size="15" aria-hidden="true"/>Փակել բացատրությունը</button></div>
      <p v-if="lessonExpanded" class="atom-lesson-example" aria-live="polite">{{ guideDescription }}</p>
      <article v-if="activeLesson && lessonExpanded" class="atom-lesson-article" :aria-label="`${activeLesson.title}․ ուսուցողական բացատրություն`">
        <div class="atom-lesson-sections"><section v-for="section in activeLesson.sections" :key="section.title"><h4>{{ section.title }}</h4><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p></section></div>
        <nav class="atom-lesson-sources" aria-label="Այս թեմայի գիտական աղբյուրները"><span>Կարդա սկզբնաղբյուրներում</span><a v-for="source in activeLesson.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} ↗</a></nav>
      </article>
    </section>
    <div class="atom-workspace">
      <section class="panel atom-stage" aria-label="Ատոմի ինտերակտիվ 3D մոդել">
        <div class="atom-stage-top"><span class="atom-stage-badge">{{ element.symbol }}–{{ massNumber }}</span><span class="atom-model-label">{{ orbitalName }} · ջրածնանման օրբիտալ</span></div>
        <div ref="viewport" class="atom-viewport" role="group" tabindex="0" :aria-label="`${element.name}–${massNumber} ատոմի մոդել։ ${model.protons} պրոտոն, ${model.neutrons} նեյտրոն, ${model.electrons} էլեկտրոն։`" aria-describedby="atom-keyboard-help" :aria-busy="loading || cloudBusy" @keydown="keyboard" />
        <div v-if="loading" class="atom-stage-message" role="status"><LoaderCircle class="atom-loading" :size="26" aria-hidden="true" /><span>Պատրաստում ենք 3D աշխարհը…</span></div>
        <div v-else-if="error" class="atom-stage-message atom-stage-error" role="status"><Atom :size="30" aria-hidden="true" /><p>Այս սարքում 3D դիտարկիչը չի գործարկվել։ Իզոտոպի տվյալները հասանելի են աջ կողմի քարտում։</p><button type="button" class="btn-secondary" @click="loadScene">Կրկին փորձել</button></div>
        <div v-if="!loading && !error && cloudBusy" class="atom-cloud-status" role="status">Հաշվարկում ենք հավանականության ամպը…</div>
        <div v-if="!loading && !error && cloudError" class="atom-stage-message atom-stage-error" role="status"><p>Օրբիտալի ամպը չհաջողվեց հաշվարկել։</p><button type="button" class="btn-secondary" @click="updateCloud">Կրկին փորձել</button></div>
        <div class="atom-cloud-legend"><span>Կապույտ և ոսկեգույն՝ ալիքային ֆունկցիայի տարբեր նշաններ</span><small>Երկու գույնի հատվածներում էլ կարելի է հայտնաբերել էլեկտրոնը։ Գույները էլեկտրական լիցքեր չեն։</small><details><summary>Ինչո՞ւ երկու գույն</summary><p>Էլեկտրոնի վիճակը նկարագրող ալիքային ֆունկցիան՝ ψ-ն, կարող է դրական կամ բացասական նշան ունենալ։ Հայտնաբերման հավանականությունը որոշվում է |ψ|²-ով։ Նշանների տարբերությունն օգնում է ուսումնասիրել օրբիտալների փոխազդեցությունը։</p></details></div>
        <div class="atom-stage-controls" aria-label="3D մոդելի կառավարում">
          <button type="button" :disabled="loading || error" :aria-pressed="playing" @click="playing = !playing"><Pause v-if="playing" :size="17" aria-hidden="true" /><Play v-else :size="17" aria-hidden="true" />{{ playing ? 'Դադարեցնել' : 'Շարունակել' }} պտույտը</button>
          <button type="button" :disabled="loading || error" aria-label="Մեծացնել մոդելը" @click="scene?.zoom(.85)"><Plus :size="18" aria-hidden="true" /></button>
          <button type="button" :disabled="loading || error" aria-label="Փոքրացնել մոդելը" @click="scene?.zoom(1.18)"><Minus :size="18" aria-hidden="true" /></button>
          <button type="button" :disabled="loading || error" aria-label="Վերականգնել մոդելի սկզբնական դիրքը" @click="scene?.resetView()"><RotateCcw :size="17" aria-hidden="true" /></button>
        </div>
        <p class="atom-quantum-intro">Որտե՞ղ կարող ենք գտնել էլեկտրոնը։ Ամպի խիտ հատվածներում հայտնաբերման հավանականությունն ավելի մեծ է։ Կետերը հնարավոր դիտարկումներ են, ոչ թե առանձին էլեկտրոններ։</p>
        <p id="atom-keyboard-help" class="atom-interaction-help"><Move :size="14" aria-hidden="true" />Քաշիր՝ պտտելու համար։ Մեծացրու անիվով կամ երկու մատով։ Ստեղնաշար՝ սլաքներ, +/−, Home, բացատ։</p>
      </section>
      <aside class="panel atom-inspector" aria-label="Ատոմի տվյալները և իզոտոպի ընտրությունը">
        <div class="atom-selectors">
          <div class="atom-field"><label for="atom-element">Քիմիական տարր</label><AtomSelect id="atom-element" :model-value="element.number" :options="elementSelectOptions" @update:model-value="emit('select', Number($event))"/></div>
          <div class="atom-field"><label for="atom-isotope">Իզոտոպ</label><AtomSelect id="atom-isotope" :model-value="massNumber" :options="isotopeSelectOptions" @update:model-value="massNumber = Number($event)"/></div>
        </div>
        <ChemistryElementAppearance :element="element" />
        <dl class="atom-particle-counts" aria-live="polite">
          <div><dt>Զանգվածային թիվ · A</dt><dd>{{ massNumber }}</dd></div>
          <div class="atom-count-proton"><dt><i aria-hidden="true" />Պրոտոն · p⁺</dt><dd>{{ model.protons }}</dd><button type="button" @click="openLesson(0)">Ի՞նչ է պրոտոնը</button></div>
          <div class="atom-count-neutron"><dt><i aria-hidden="true" />Նեյտրոն · n⁰</dt><dd>{{ model.neutrons }}</dd><button type="button" @click="openLesson(1)">Ի՞նչ է նեյտրոնը</button></div>
          <div class="atom-count-electron"><dt><i aria-hidden="true" />Էլեկտրոն · e⁻</dt><dd>{{ model.electrons }}</dd><button type="button" @click="openLesson(2)">Ի՞նչ է էլեկտրոնը</button></div>
        </dl>
        <p class="atom-equation">Նեյտրոններ՝ <strong>{{ massNumber }} − {{ model.protons }} = {{ model.neutrons }}</strong></p>
        <p class="atom-note">A-ն ընտրված իզոտոպի պրոտոնների և նեյտրոնների գումարն է։ Այն տարրի հարաբերական ատոմային զանգվածի կլորացումը չէ։</p>
        <section class="atom-quantum-controls" aria-label="Օրբիտալի ընտրություն">
          <div class="atom-field"><label for="atom-subshell">Զբաղեցված ենթաշերտ</label><AtomSelect id="atom-subshell" :model-value="subshellLabel" :options="subshellSelectOptions" @update:model-value="subshellLabel = String($event)"/></div>
          <div class="atom-field"><label for="atom-orientation">Օրբիտալի ձև և կողմնորոշում</label><AtomSelect id="atom-orientation" :model-value="orientation" :options="orientationSelectOptions" @update:model-value="orientation = Number($event)"/></div>
          <p class="atom-shape-description" aria-live="polite">{{ shapeDescription }}</p>
          <details class="atom-term-help"><summary>Ի՞նչ են նշանակում թվերն ու հանգույցները</summary><p>n-ը գլխավոր քվանտային թիվն է, ℓ-ը՝ օրբիտալի տեսակը բնութագրող թիվը։ Հանգույցը մակերևույթ է, որտեղ ընտրված օրբիտալի համար էլեկտրոնը հայտնաբերելու հավանականությունը զրո է։</p><dl class="atom-node-counts"><div><dt>Գլխավոր թիվ · n</dt><dd>{{ subshell.n }}</dd></div><div><dt>Օրբիտալային թիվ · ℓ</dt><dd>{{ subshell.l }}</dd></div><div><dt>Շառավղային հանգույցներ</dt><dd>{{ subshell.n - subshell.l - 1 }}</dd></div><div><dt>Անկյունային հանգույցներ</dt><dd>{{ subshell.l }}</dd></div></dl></details>
          <label class="atom-check"><input v-model="cutaway" type="checkbox">Հեռացնել ամպի կեսը՝ ներքին շերտերը տեսնելու համար</label>
          <label for="atom-density">Ամպի տեսանելիություն<input id="atom-density" v-model.number="density" type="range" min="0.1" max="0.9" step="0.05"></label>
          <p class="atom-note">Ներկայացված է մեկ օրբիտալ։ Ենթաշերտի բոլոր էլեկտրոնները այս օրբիտալում չեն գտնվում․ մեկ օրբիտալը կարող է ունենալ առավելագույնը 2 էլեկտրոն։ Տեսանելիության կարգավորումը չի փոխում հավանականության բաշխումը։</p>
          <p class="atom-approximation">{{ element.number === 1 ? 'Ջրածնի ոչ ռելյատիվիստական օրբիտալի մոդել՝ առանց նուրբ ուղղումների։' : 'Ջրածնանման օրբիտալի ձևի մոտավոր ներկայացում։ Սա այս բազմաէլեկտրոն ատոմի իրական ամբողջական էլեկտրոնային խտությունը չէ։' }} Ամպերը հարմարեցված են էկրանին․ դրանց չափերով ատոմների իրական չափերը մի համեմատիր։</p>
        </section>
        <p v-if="model.configurationPredicted" class="atom-prediction">Այս տարրի էլեկտրոնային կառուցվածքը հաշվարկային կամ կանխատեսված է։</p>
        <p class="atom-configuration"><span>Էլեկտրոնային կառուցվածք</span><code>{{ configuration }}</code></p>
      </aside>
    </div>
    <div class="atom-footnotes">
      <details class="panel atom-explanation"><summary>Ինչպե՞ս հասկանալ այս մոդելը</summary><p>Օրբիտալային տեսքում կետերը ընտրված են |ψ|² հավանականության խտությամբ՝ ջրածնանման Շրյոդինգերի հավասարման լուծումներից։ Հանգույցներն այն մակերևույթներն են, որտեղ այդ օրբիտալի հավանականության խտությունը զրո է։ Պտույտը միայն դիտման շարժում է, ոչ էլեկտրոնի ուղի։ Միջուկը մեծացված պայմանական նշիչ է։ Բազմաէլեկտրոն ատոմների համար հաշվի չեն առնվում էլեկտրոնների փոխազդեցությունը, էկրանավորումը և ռելյատիվիստական ուղղումները։</p><p>Մասնիկների չափերը, միջուկից հեռավորությունները, գույներն ու շարժման արագությունները պատկերավոր են և իրական մասշտաբները չեն ներկայացնում։ Միջուկի մասնիկների դիրքերը նույնպես ուսուցողական դասավորություն են։</p></details>
      <div class="atom-sources"><p>Ատոմի կառուցվածք՝ <a href="https://www.nrc.gov/education-regulatory-research/the-student-corner/science-101/what-is-an-atom" target="_blank" rel="noopener noreferrer">NRC ↗</a> · Օրբիտալների տեսություն՝ <a :href="orbitalSource" target="_blank" rel="noopener noreferrer">MIT OpenCourseWare ↗</a> · Իզոտոպներ՝ <a :href="atomIsotopeSource.url" target="_blank" rel="noopener noreferrer">NIST ↗</a> · ատոմային համար և էլեկտրոնային կառուցվածք՝ <a :href="`https://pubchem.ncbi.nlm.nih.gov/element/${element.number}`" target="_blank" rel="noopener noreferrer">PubChem ↗</a></p><p>Ներկայացված են NIST-ի այս աղյուսակում նշված իզոտոպները, ոչ բոլոր հայտնի իզոտոպները։</p></div>
    </div>
  </div>
</template>

<style scoped>
.atom-lab { padding-top: 8px; }
.atom-lesson-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.atom-guide button { min-height: 44px; padding: 10px 14px; border: 1px solid #86b2d844; background: #15263e; color: #cce4fa; border-radius: 10px; font-size: 12px; }
.atom-lesson-tabs button[aria-pressed="true"] { background: #224b68; border-color: #7dd3fc; color: #fff; }
.atom-particle-counts button { min-height: 44px; text-align: left; font-size: 10px; color: #cbe8ff; text-decoration: underline; text-underline-offset: 3px; }
.atom-term-help { color: #aec6df; font-size: 11px; line-height: 1.9; }.atom-term-help summary { cursor: pointer; min-height: 44px; align-content: center; color: #dfc38f; }.atom-term-help p { margin-bottom: 12px; }
.atom-guide { scroll-margin-top: 100px; padding: 20px; margin-bottom: 20px; border-color: #7dd3fc55; background: linear-gradient(120deg,#12304b,#101c30); }.atom-guide-heading span { color: #8dd9ff; font-size: 12px; }.atom-guide h3 { font-size: 18px; margin: 14px 0 8px; color: #e5f4ff; }.atom-guide p { color: #bfd3e8; font-size: 13px; line-height: 1.9; max-width: 95ch; }
.atom-lesson-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.atom-guide .atom-lesson-close { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; font-size: 11px; color: #adc1d8; background: transparent; border-color: #8ca4cc33; }
.atom-lesson-example { padding-left: 14px; border-left: 2px solid #dfc38f88; }
.atom-lesson-sections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 30px; margin-top: 26px; }
.atom-lesson-sections h4 { color: #e6d3ad; font-size: 14px; font-weight: 700; line-height: 1.7; margin-bottom: 9px; }
.atom-guide .atom-lesson-sections p { font-size: 13px; line-height: 2; color: #b9cde2; }
.atom-lesson-sources { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 24px; padding-top: 18px; border-top: 1px solid #89a8c333; font-size: 11px; line-height: 1.8; }
.atom-lesson-sources span { flex-basis: 100%; color: #95afc9; }.atom-lesson-sources a { color: #dfc38f; text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 700px) { .atom-lesson-sections { grid-template-columns: minmax(0, 1fr); gap: 22px; }.atom-guide .atom-lesson-sections p { font-size: 13px; } }
.atom-shape-description { padding: 13px; color: #c8e4f5; background: #7dd3fc0b; border-radius: 10px; font-size: 12px; line-height: 1.9; }
.atom-cloud-legend details { width: 100%; color: #b9cce4; line-height: 1.9; }.atom-cloud-legend summary { cursor: pointer; min-height: 44px; display: list-item; align-content: center; color: #dfc38f; }.atom-cloud-legend details p { max-width: 65ch; margin: 0 auto; }
.atom-quantum-intro { color: #bdcde1; font-size: 13px; line-height: 1.9; max-width: 95ch; margin: 0; padding: 0 20px 16px; }
.atom-quantum-controls { display: grid; gap: 15px; }
.atom-node-counts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px; border-radius: 12px; background: #142a4488; }
.atom-node-counts dt { font-size: 10px; color: #a8bdd8; }.atom-node-counts dd { color: #d9f2ff; font-size: 22px; margin-top: 5px; }
.atom-inspector .atom-check { display: flex; align-items: center; line-height: 1.8; min-height: 44px; }.atom-check input { accent-color: #7dd3fc; width: 18px; height: 18px; flex-shrink: 0; }
.atom-quantum-controls input[type="range"] { width: 100%; min-height: 44px; accent-color: #7dd3fc; }
.atom-approximation { color: #e7c68e; font-size: 11px; line-height: 1.9; padding: 13px; background: #d5a8530b; border: 1px solid #d5a85333; border-radius: 10px; }
.atom-cloud-legend { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px 18px; padding: 0 18px 16px; font-size: 11px; color: #77d2ff; }.atom-cloud-legend span:nth-child(2) { color: #f5bb72; }.atom-cloud-legend small { width: 100%; text-align: center; color: #a6b8d3; font-size: 10px; line-height: 1.8; }
.atom-cloud-status { position: absolute; top: 80px; left: 20px; right: 20px; color: #c0e7ff; text-align: center; font-size: 12px; pointer-events: none; }
.atom-lab-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-bottom: 24px; }
.atom-eyebrow { display: flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 1px; color: #dfc38f; }
.atom-lab-heading h2 { font-size: clamp(27px, 4vw, 42px); font-weight: 800; margin: 12px 0 8px; }
.atom-lab-heading h2 span { color: var(--atom-accent); margin-left: 8px; }
.atom-lab-heading .muted { font-size: 13px; line-height: 1.8; }
.atom-back { display: inline-flex; gap: 8px; align-items: center; font-size: 12px; }
.atom-workspace { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(310px, 1fr); gap: 22px; align-items: start; }
.atom-stage { position: relative; overflow: hidden; background: radial-gradient(ellipse at 50% 40%, #17355977, transparent 65%), #0a1327; border-color: #84baff35; }
.atom-stage-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 22px 0; }
.atom-stage-badge { border: 1px solid var(--atom-accent); border-radius: 999px; padding: 6px 14px; color: var(--atom-accent); font-size: 14px; font-weight: 700; }
.atom-model-label { font-size: 10px; color: #a6b8d3; }
.atom-viewport { height: clamp(340px, 40vw, 510px); position: relative; width: 100%; cursor: grab; touch-action: none; }
.atom-viewport:active { cursor: grabbing; }
.atom-viewport :deep(canvas) { display: block; }
.atom-viewport:focus-visible { outline: 2px solid #a6caff; outline-offset: -4px; }
.atom-stage-message { position: absolute; inset: 75px 20px 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px; text-align: center; color: #b8d1ef; font-size: 13px; pointer-events: none; }
.atom-stage-error { background: #0a1327eb; padding: 24px; pointer-events: auto; }
.atom-stage-error p { max-width: 42ch; line-height: 1.9; }
.atom-loading { animation: atom-load 1s linear infinite; }
@keyframes atom-load { to { transform: rotate(360deg); } }
.atom-stage-controls { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; padding: 0 16px 16px; }
.atom-stage-controls button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-width: 44px; min-height: 44px; border-radius: 11px; padding: 10px 12px; color: #e4efff; border: 1px solid #94b5e33d; background: #172943; font-size: 12px; }
.atom-stage-controls button[aria-pressed="true"] { border-color: #90caf9; background: #28527a55; }
.atom-stage-controls button:disabled { opacity: .4; cursor: not-allowed; }
.atom-interaction-help { display: flex; gap: 8px; align-items: flex-start; color: #9aafc9; border-top: 1px solid #94a3b822; padding: 15px 20px; font-size: 10px; line-height: 1.9; }
.atom-interaction-help svg { flex-shrink: 0; margin-top: 3px; }
.atom-inspector { padding: 24px; }
.atom-selectors { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 12px; }
.atom-field { display: grid; gap: 8px; min-width: 0; }
.atom-inspector label { display: grid; gap: 8px; font-size: 11px; color: #b6c7df; }
.atom-particle-counts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 22px 0 16px; }
.atom-particle-counts > div { border: 1px solid #8ca4cc26; border-radius: 12px; padding: 14px; background: #1d31542b; }
.atom-particle-counts dt { display: flex; align-items: center; gap: 6px; color: #b5c3d7; font-size: 10px; }
.atom-particle-counts dd { font-size: 29px; font-weight: 800; margin-top: 7px; }
.atom-particle-counts i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.atom-count-proton dd, .atom-count-proton i { color: #fb91a0; }
.atom-count-neutron dd, .atom-count-neutron i { color: #f5d48f; }
.atom-count-electron dd, .atom-count-electron i { color: #82ddff; }
.atom-equation { color: #dce7f7; font-size: 12px; }
.atom-note { color: #9cacc5; font-size: 10px; line-height: 1.9; margin: 8px 0 18px; }
.atom-prediction { color: #f4cc8a; font-size: 11px; line-height: 1.8; margin-bottom: 12px; }
.atom-configuration { display: grid; gap: 8px; border-top: 1px solid #94a3b833; padding-top: 16px; font-size: 10px; color: #aebfd5; }
.atom-configuration code { color: #dfebfc; font-size: 12px; direction: ltr; }
.atom-footnotes { margin-top: 22px; }
.atom-explanation { padding: 18px 22px; }
.atom-explanation summary { cursor: pointer; color: #dfc38f; font-size: 13px; font-weight: 600; }
.atom-explanation p { color: #b8c5da; font-size: 12px; line-height: 1.9; margin-top: 12px; max-width: 110ch; }
.atom-sources { color: #93a6c1; font-size: 10px; line-height: 1.9; margin-top: 16px; }
.atom-sources a { color: #dfc38f; text-decoration: underline; text-underline-offset: 3px; }
.atom-lab :is(button, select, summary, a):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
.atom-viewport :deep(.atom-scene-label) { display: block; border-radius: 6px; padding: 5px 8px; font-family: inherit; font-size: 10px; white-space: nowrap; color: #e8f1ff; background: #0b152de8; border: 1px solid #8098bd66; }
.atom-viewport :deep(.atom-scene-label-proton) { color: #ffa4b0; }
.atom-viewport :deep(.atom-scene-label-neutron) { color: #f5d48f; }
.atom-viewport :deep(.atom-scene-label-electron) { color: #82ddff; }
@media (max-width: 950px) { .atom-workspace { grid-template-columns: minmax(0, 1fr); }.atom-viewport { height: 400px; } }
@media (max-width: 480px) { .atom-inspector { padding: 18px; }.atom-viewport { height: 330px; }.atom-stage-top { padding: 16px 16px 0; }.atom-selectors { grid-template-columns: minmax(0, 1fr); }.atom-model-label { font-size: 9px; } }
@media (prefers-reduced-motion: reduce) { .atom-loading { animation: none; } }
</style>
