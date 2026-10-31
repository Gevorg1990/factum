<script setup lang="ts">
import { Mic, MicOff, Volume2, Trophy, ArrowRight, RotateCcw, Check, X, MapPin, Lightbulb, Square, LoaderCircle } from 'lucide-vue-next'
import { capitalPairs } from '~/data/capitalQuiz'
import { periodicElements } from '~/data/periodicTable'
import { getElementLife } from '~/data/elementLife'
import { createCapitalRounds, type CapitalQuizMode } from '~/utils/capitalQuiz'

import { createElementRounds, symbolSpeechAliases } from '~/utils/elementQuiz'
import { formatVoiceTranscript, isVoiceAnswerCorrect, type VoiceQuestion } from '~/utils/voiceQuiz'
const props = withDefaults(defineProps<{ topic?: 'geography' | 'chemistry' }>(), { topic: 'geography' })
const feedbackAudio = useMillionAudio()
feedbackAudio.enabled.value = true
const chemistry = computed(() => props.topic === 'chemistry')
const titleId = computed(() => chemistry.value ? 'element-quiz-title' : 'capital-quiz-title')
const allElements = ref(false)
const emit = defineEmits<{ showOnMap: [countryCode: string]; showInTable: [elementNumber: number] }>()
function showOnMap() {
  if (!question.value) return
  if (chemistry.value) emit('showInTable', Number(question.value.reference))
  else emit('showOnMap', question.value.reference)
}

type RecognitionResult = { isFinal: boolean; length: number; [index: number]: { transcript: string } }
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  onaudiostart: (() => void) | null
  onresult: ((event: { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type RecognitionConstructor = new () => Recognition
const mode = ref<CapitalQuizMode>(props.topic === 'chemistry' ? 'capital' : 'mixed')
const status = ref<'idle' | 'playing' | 'finished'>('idle')
const rounds = shallowRef<VoiceQuestion[]>([])
const index = ref(0)
const answer = ref('')
const checked = ref(false)
const correct = ref(false)
const score = ref(0)
const correctCount = ref(0)
const listening = ref(false)
const speechSupported = ref(false)
const speechError = ref('')
const cloudAvailable = ref<boolean | null>(null)
const voiceAvailable = computed(() => cloudAvailable.value !== false)
const readerVoice = ref<'male' | 'female'>('male')
const reading = ref(false)
const readLoading = ref(false)
let questionAudio: HTMLAudioElement | undefined
let audioUrl = ''
let audioRequest: AbortController | undefined
let readGeneration = 0
const autoRead = ref(true)
const autoListen = ref(true)
let recognitionConstructor: RecognitionConstructor | undefined
let recognition: Recognition | undefined
let listenTimeout: ReturnType<typeof setTimeout> | undefined
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
function clearFeedbackTimer() { clearTimeout(feedbackTimer); feedbackTimer = undefined }
let active = true
const question = computed(() => rounds.value[index.value])
const elementLife = computed(() => chemistry.value && question.value ? getElementLife(Number(question.value.reference)) : undefined)
const expected = computed(() => question.value?.expected ?? '')
const prompt = computed(() => question.value?.prompt ?? '')
const voiceAnswers = computed(() => {
  const forward = question.value?.direction === 'forward'
  if (chemistry.value) return periodicElements.map(element => ({
    expected: forward ? element.name : element.symbol,
    aliases: forward ? [element.nameEn] : symbolSpeechAliases(element.symbol),
  }))
  return capitalPairs.map(pair => ({
    expected: forward ? pair.capital : pair.country,
    aliases: forward ? pair.capitalAliases : pair.countryAliases,
  }))
})
const modes = computed<{ id: CapitalQuizMode; label: string }[]>(() => chemistry.value ? [{ id: 'capital', label: 'Նշան → անուն' }] : [{ id: 'capital', label: 'Երկիր → մայրաքաղաք' }, { id: 'country', label: 'Մայրաքաղաք → երկիր' }, { id: 'mixed', label: 'Խառը' }])

function stopListening() {
  const previous = recognition
  recognition = undefined
  clearTimeout(listenTimeout)
  if (previous) { previous.onaudiostart = null; previous.onresult = null; previous.onerror = null; previous.onend = null; previous.abort() }
  listening.value = false
}
function stopAudio() {
  feedbackAudio.stop()
  stopListening()
  stopReading()
}
function stopReading() {
  readGeneration++
  audioRequest?.abort()
  audioRequest = undefined
  if (questionAudio) {
    questionAudio.onended = null
    questionAudio.onerror = null
    questionAudio.pause()
    questionAudio.removeAttribute('src')
    questionAudio.load()
  }
  if (audioUrl) URL.revokeObjectURL(audioUrl)
  audioUrl = ''
  reading.value = false
  readLoading.value = false
}
async function readQuestion() {
  if (!question.value || !voiceAvailable.value) return
  stopAudio()
  speechError.value = ''
  const current = question.value
  const token = readGeneration
  readLoading.value = true
  audioRequest = new AbortController()
  try {
    const response = await fetch('/api/game-speech', {
      method: 'POST', signal: audioRequest.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: props.topic, reference: current.reference, direction: current.direction, voice: readerVoice.value }),
    })
    if (!response.ok) {
      if (response.status === 503) cloudAvailable.value = false
      throw new Error('Speech unavailable')
    }
    const audio = await response.blob()
    if (!active || token !== readGeneration || !questionAudio) return
    audioUrl = URL.createObjectURL(audio)
    questionAudio.src = audioUrl
    questionAudio.preservesPitch = true
    questionAudio.onended = () => {
      if (!active || token !== readGeneration) return
      stopReading()
      startAutoListening()
    }
    questionAudio.onerror = () => {
      if (token !== readGeneration) return
      stopAudio()
      speechError.value = 'Չհաջողվեց լսել հարցը։ Փորձիր կրկին։'
    }
    await questionAudio.play()
    if (active && token === readGeneration) {
      readLoading.value = false
      reading.value = true
    }
  } catch {
    if (!active || token !== readGeneration) return
    stopAudio()
    speechError.value = cloudAvailable.value === false
      ? 'Հայերեն ձայնային ծառայությունը դեռ միացված չէ։'
      : 'Չհաջողվեց լսել հարցը։ Սեղմիր «Լսել հարցը»՝ կրկին փորձելու համար։'
  }
}

function start() {
  clearFeedbackTimer()
  stopAudio()
  void feedbackAudio.unlock()
  rounds.value = chemistry.value ? createElementRounds('capital', allElements.value) : createCapitalRounds(capitalPairs, mode.value).map(({ pair, direction }) => ({
    direction: direction === 'capital' ? 'forward' : 'reverse',
    prompt: direction === 'capital' ? pair.country : pair.capital,
    expected: direction === 'capital' ? pair.capital : pair.country,
    aliases: direction === 'capital' ? pair.capitalAliases : pair.countryAliases,
    promptEn: (direction === 'capital' ? pair.countryAliases[0] : pair.capitalAliases[0])!,
    summary: `${pair.country} — ${pair.capital}`,
    reference: pair.countryCode,
  }))
  index.value = 0
  score.value = 0
  correctCount.value = 0
  answer.value = ''
  checked.value = false
  correct.value = false
  speechError.value = ''
  status.value = 'playing'
  if (autoRead.value) readQuestion()
  else startAutoListening()
}
function startAutoListening() {
  if (active && autoListen.value && speechSupported.value && status.value === 'playing' && !checked.value && !listening.value) listen()
}
function listen() {
  if (listening.value) { recognition?.stop(); return }
  if (!recognitionConstructor || checked.value || status.value !== 'playing') return
  stopAudio()
  speechError.value = ''
  const session = new recognitionConstructor()
  let hasFinalTranscript = false
  let microphoneCuePlayed = false
  recognition = session
  session.lang = 'hy-AM'
  session.continuous = false
  session.interimResults = true
  session.maxAlternatives = 1
  session.onaudiostart = () => {
    if (!active || recognition !== session || checked.value || microphoneCuePlayed) return
    microphoneCuePlayed = true
    void feedbackAudio.play('microphone')
  }
  session.onresult = event => {
    if (!active || recognition !== session || checked.value) return
    const transcript = Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? '').join(' ').trim()
    answer.value = formatVoiceTranscript(transcript, voiceAnswers.value, 'hy-AM')
    hasFinalTranscript = Array.from({ length: event.results.length }, (_, i) => event.results[i]).some(result => result?.isFinal)
  }
  session.onerror = event => {
    if (!active || recognition !== session) return
    const errors: Record<string, string> = {
      'not-allowed': 'Միկրոֆոնի թույլտվությունը մերժված է։ Թույլատրի՛ր բրաուզերի կարգավորումներում կամ գրիր պատասխանը։',
      'service-not-allowed': 'Բրաուզերը չի թույլատրում ձայնի ճանաչումը։ Կարող ես գրել պատասխանը։',
      'audio-capture': 'Միկրոֆոն չի գտնվել։ Միացրու միկրոֆոնը կամ գրիր պատասխանը։',
      'no-speech': 'Ձայն չլսվեց։ Փորձիր կրկին կամ գրիր պատասխանը։',
      'network': 'Ձայնի ճանաչման կապը ընդհատվեց։ Փորձիր կրկին կամ գրիր պատասխանը։',
      'language-not-supported': 'Այս բրաուզերը չի աջակցում հայերեն խոսքի ճանաչմանը։ Կարող ես գրել պատասխանը։',
    }
    speechError.value = errors[event.error] ?? 'Չհաջողվեց ճանաչել ձայնը։ Փորձիր կրկին կամ գրիր պատասխանը։'
    stopListening()
  }
  session.onend = () => {
    if (recognition !== session) return
    listening.value = false
    recognition = undefined
    clearTimeout(listenTimeout)
    if (hasFinalTranscript && answer.value.trim()) check()
  }
  try {
    session.start()
    listening.value = true
    listenTimeout = setTimeout(() => { if (recognition === session) session.stop() }, 12000)
  } catch {
    stopListening()
    speechError.value = 'Չհաջողվեց միացնել միկրոֆոնը։ Փորձիր կրկին կամ գրիր պատասխանը։'
  }
}
function check(skipped = false) {
  if (status.value !== 'playing' || checked.value || !question.value || (!skipped && !answer.value.trim())) return
  stopListening()
  correct.value = !skipped && isVoiceAnswerCorrect(question.value, answer.value)
  checked.value = true
  if (correct.value) { score.value += 100; correctCount.value++ }
  if (!skipped) void feedbackAudio.play(correct.value ? 'correct' : 'wrong')
  clearFeedbackTimer()
  const answeredIndex = index.value
  if (correct.value) {
    feedbackTimer = setTimeout(() => {
      if (active && status.value === 'playing' && checked.value && index.value === answeredIndex) next()
    }, 2500)
  }
}
function next() {
  clearFeedbackTimer()
  if (!checked.value) return
  stopAudio()
  if (index.value + 1 === rounds.value.length) { status.value = 'finished'; return }
  index.value++
  answer.value = ''
  checked.value = false
  correct.value = false
  speechError.value = ''
  if (autoRead.value) readQuestion()
  else startAutoListening()
}
function exit() { clearFeedbackTimer(); stopAudio(); status.value = 'idle'; speechError.value = '' }
watch(autoListen, enabled => { if (!enabled) stopListening() })
onMounted(() => {
  questionAudio = new Audio()
  void $fetch<{ available: boolean }>('/api/game-speech').then(result => {
    if (active) cloudAvailable.value = result.available
  }).catch(() => {})
  const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  recognitionConstructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition
  speechSupported.value = !!recognitionConstructor
})
onBeforeUnmount(() => {
  active = false
  clearFeedbackTimer()
  stopAudio()
})
</script>

<template>
  <section class="panel capital-quiz" :aria-labelledby="titleId">
    <div class="capital-intro">
      <span class="capital-eyebrow"><Mic :size="16" /> ՓՈՐՁԻՐ ՔՈ ԳԻՏԵԼԻՔՆԵՐԸ</span>
      <h2 :id="titleId">{{ chemistry ? 'Ճանաչիր քիմիական տարրերը' : 'Երկիր և մայրաքաղաք' }}</h2>
      <p>{{ chemistry ? 'Մենք ցույց ենք տալիս քիմիական նշանը, դու ասում ես տարրի հայերեն անունը։ Պատասխանիր ձայնով կամ գրիր պատասխանը և ստուգիր քո գիտելիքները։' : 'Մենք ասում ենք երկիրը, դու՝ մայրաքաղաքը։ Կամ հակառակը։ Պատասխանիր ձայնով և ստուգիր գիտելիքներդ։' }}</p>
    </div>
    <div class="capital-play">
      <VoiceChoice v-if="status !== 'finished'" v-model="readerVoice" :name="`${titleId}-voice`" class="capital-reader-settings" />
      <template v-if="status === 'idle'">
        <div v-if="!chemistry" class="capital-modes" role="group" aria-label="Խաղի ուղղությունը"><button v-for="item in modes" :key="item.id" :aria-pressed="mode === item.id" :class="{ 'is-selected': mode === item.id }" @click="mode = item.id">{{ item.label }}</button></div>
        <div v-if="chemistry" class="capital-settings"><label :for="`${titleId}-pool`">Տարրերի ընտրությունը</label><select :id="`${titleId}-pool`" v-model="allElements" class="input"><option :value="false">30 հիմնական տարր</option><option :value="true">Բոլոր 118 տարրերը</option></select></div>
        <p class="capital-description">10 հարց · յուրաքանչյուր ճիշտ պատասխան՝ 100 միավոր։ Խոսքն ավարտելուց հետո ճանաչված պատասխանը ստուգվում է ինքնաբերաբար։ Կարող ես նաև գրել պատասխանը։</p>
        <button class="btn capital-main" @click="start"><Mic :size="18" /> Սկսել խաղը</button>
      </template>
      <template v-else-if="status === 'playing' && question">
        <div class="capital-score"><span>Հարց {{ index + 1 }} / {{ rounds.length }}</span><strong><Trophy :size="16" /> {{ score }} միավոր</strong></div>
        <div class="capital-progress" role="progressbar" aria-label="Խաղի առաջընթաց" :aria-valuenow="index + (checked ? 1 : 0)" :aria-valuemin="0" :aria-valuemax="rounds.length"><span :style="{ width: `${(index + (checked ? 1 : 0)) / rounds.length * 100}%` }" /></div>
        <p class="capital-question-label">{{ chemistry ? (question.direction === 'forward' ? 'Ո՞ր տարրի քիմիական նշանն է' : 'Ասա այս տարրի քիմիական նշանը') : (question.direction === 'forward' ? 'Ասա այս երկրի մայրաքաղաքը' : 'Ո՞ր երկրի մայրաքաղաքն է') }}</p>
        <h3 class="capital-prompt">{{ prompt }}</h3>
        <div class="capital-question-actions">
          <button class="capital-read" :disabled="!voiceAvailable || listening" :aria-busy="readLoading" :aria-label="readLoading ? 'Հարցի ձայնը պատրաստվում է․ սեղմիր՝ չեղարկելու համար' : reading ? 'Դադարեցնել ընթերցումը' : 'Լսել հարցը'" @click="reading || readLoading ? stopAudio() : readQuestion()"><LoaderCircle v-if="readLoading" :size="17" class="capital-read-spinner" aria-hidden="true" /><Square v-else-if="reading" :size="17" aria-hidden="true" /><Volume2 v-else :size="17" aria-hidden="true" /> {{ reading ? 'Դադարեցնել ընթերցումը' : 'Լսել հարցը' }}</button>
          <button class="capital-read" @click="showOnMap"><MapPin :size="17" /> {{ chemistry ? 'Տեսնել աղյուսակում' : 'Տեսնել քարտեզում' }}</button>
        </div>
        <section v-if="elementLife" class="capital-element-life" :aria-labelledby="`${titleId}-life-title`">
          <h4 :id="`${titleId}-life-title`"><Lightbulb :size="17" aria-hidden="true" /> Տարրը մեր կյանքում</h4>
          <dl>
            <div><dt>Որտե՞ղ է օգտագործվում</dt><dd>{{ elementLife.uses }}</dd></div>
            <div><dt>Նշանակությունը մարդկանց կյանքում</dt><dd>{{ elementLife.importance }}</dd></div>
          </dl>
          <a :href="elementLife.source" target="_blank" rel="noopener noreferrer">Աղբյուր՝ Royal Society of Chemistry ↗</a>
        </section>
        <form class="capital-answer" @submit.prevent="check()">
          <label :for="`${titleId}-answer`">{{ listening ? 'Լսում ենք…' : 'Քո պատասխանը' }}</label>
          <div class="capital-answer-row"><input :id="`${titleId}-answer`" v-model="answer" class="input" type="text" autocomplete="off" :disabled="checked" placeholder="Ասա կամ գրիր պատասխանը" lang="hy" /><button type="button" class="capital-mic" :class="{ 'is-listening': listening }" :disabled="!speechSupported || checked" :aria-pressed="listening" :aria-label="listening ? 'Ավարտել ձայնի ճանաչումը' : 'Պատասխանել ձայնով'" @click="listen"><MicOff v-if="listening" :size="22" /><Mic v-else :size="22" /></button></div>
          <p v-if="chemistry && question.direction === 'reverse' && !checked" class="capital-note">Նշանը կարող ես ասել տառերով, օրինակ՝ Fe՝ «էֆ ի», կամ գրել լատինատառ։</p>
          <p v-if="speechError" class="capital-error" role="alert">{{ speechError }}</p>
          <p v-else-if="listening" class="capital-listening" role="status">Ասա պատասխանը հստակ։ Ճանաչված խոսքը կհայտնվի դաշտում։</p>
          <div v-if="checked" class="capital-feedback" :class="{ 'is-correct': correct }" role="status"><strong><Check v-if="correct" :size="19" /><X v-else :size="19" />{{ correct ? 'Ճիշտ է․ +100 միավոր' : 'Սխալ է․ ճիշտ պատասխանը՝ ' + expected }}</strong><p>{{ question.summary }}</p><p class="capital-note">{{ !correct ? 'Սեղմիր ներքևի կոճակը՝ շարունակելու համար։' : index + 1 === rounds.length ? 'Քիչ անց կտեսնես խաղի արդյունքը։' : 'Հաջորդ հարցը կբացվի ինքնաբերաբար։' }}</p></div>
          <div class="capital-actions"><button v-if="!checked" class="btn" type="submit" :disabled="!answer.trim() || listening">Ստուգել պատասխանը <Check :size="16" /></button><button v-else class="btn" type="button" @click="next">{{ index + 1 === rounds.length ? 'Տեսնել արդյունքը' : 'Հաջորդ հարցը' }} <ArrowRight :size="16" /></button><button v-if="!checked" type="button" class="capital-text-button" @click="check(true)">Բաց թողնել</button></div>
        </form>
        <button class="capital-text-button capital-exit" @click="exit">Ավարտել խաղը</button>
      </template>
      <template v-else>
        <div class="capital-result" role="status"><Trophy :size="42" /><h3>Խաղն ավարտված է</h3><strong>{{ score }} / {{ rounds.length * 100 }}</strong><p>{{ correctCount }} ճիշտ պատասխան՝ {{ rounds.length }} հարցից։</p></div>
        <button class="btn capital-main" @click="start"><RotateCcw :size="17" /> Խաղալ կրկին</button><button class="capital-text-button capital-exit" @click="exit">{{ chemistry ? 'Փոխել խաղի կարգավորումները' : 'Փոխել խաղի ուղղությունը' }}</button>
      </template>
      <p v-if="!speechSupported" class="capital-note">Այս բրաուզերում ձայնի ճանաչումը հասանելի չէ։ Կարող ես պատասխանել գրելով։</p>
      <p v-if="!voiceAvailable" class="capital-note" role="status">Հայերեն ձայնային ծառայությունը դեռ միացված չէ․ կարող ես շարունակել խաղը։</p>
      <label v-if="voiceAvailable" class="capital-auto"><input v-model="autoRead" type="checkbox" /> Հարցերը կարդալ ձայնով</label>
      <label v-if="speechSupported" class="capital-auto"><input v-model="autoListen" type="checkbox" /> Հարցից հետո ինքնաբերաբար միացնել միկրոֆոնը</label>
      <p class="capital-note">Միկրոֆոնը միանում է հարցի ընթերցումից հետո կամ կոճակը սեղմելիս՝ բրաուզերի թույլտվությամբ։ Ձայնի ճանաչումն իրականացնում է բրաուզերը և կարող է պահանջել ինտերնետ կապ։</p>
    </div>
  </section>
</template>

<style scoped>
.capital-quiz { display: grid; grid-template-columns: .9fr 1.1fr; margin-top: 28px; overflow: hidden; border-color: #dfc38f66; }
.capital-intro { padding: 34px; background: radial-gradient(ellipse at 0 0, #dfc38f14, transparent 75%); }
.capital-eyebrow { display: flex; align-items: center; gap: 9px; color: #dfc38f; font-size: 10px; letter-spacing: 1px; }
.capital-intro h2 { font-size: clamp(23px, 2.8vw, 32px); font-weight: 850; margin: 22px 0 14px; }
.capital-intro p { font-size: 14px; line-height: 2; }
.capital-play { padding: 30px; border-left: 1px solid #8997c02b; }
.capital-modes { display: flex; flex-wrap: wrap; gap: 8px; }
.capital-modes button { padding: 10px 12px; border: 1px solid #8997c044; border-radius: 12px; font-size: 11px; }
.capital-modes button.is-selected { color: #dfc38f; border-color: #dfc38f; background: #dfc38f10; }
.capital-settings { display: flex; align-items: center; gap: 14px; margin-top: 22px; font-size: 12px; }
.capital-settings select { width: auto; }
.capital-reader-settings { display: grid; gap: 14px; margin-bottom: 24px; }
.capital-description { margin: 20px 0; font-size: 13px; line-height: 1.9; }
.capital-main { display: flex; align-items: center; gap: 9px; width: 100%; }
.capital-score { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; }
.capital-score strong { display: flex; align-items: center; gap: 7px; color: #dfc38f; }
.capital-progress { height: 5px; border-radius: 5px; overflow: hidden; background: #8997c02b; margin: 14px 0 24px; }
.capital-progress span { display: block; height: 100%; background: linear-gradient(90deg, #b48a48, #ffe1a2); }
.capital-question-label { font-size: 12px; }
.capital-prompt { margin: 9px 0 12px; font-size: 32px; font-weight: 850; color: #dfc38f; }
.capital-read { display: flex; align-items: center; gap: 7px; min-height: 48px; color: #dfc38f; font-size: 12px; line-height: 1.6; }
.capital-read > svg { flex-shrink: 0; }
.capital-question-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; gap: 12px; }
.capital-read-spinner { animation: capital-read-spin .9s linear infinite; }
@keyframes capital-read-spin { to { transform: rotate(360deg); } }
.capital-element-life { margin-top: 20px; padding: 18px; border: 1px solid #dfc38f44; border-radius: 14px; background: #dfc38f08; }
.capital-element-life h4 { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; color: #dfc38f; font-size: 13px; font-weight: 750; }
.capital-element-life dl { display: grid; gap: 14px; }
.capital-element-life dt { font-size: 11px; font-weight: 750; margin-bottom: 5px; }
.capital-element-life dd { font-size: 12px; line-height: 1.9; }
.capital-element-life a { display: inline-block; margin-top: 14px; color: #dfc38f; font-size: 10px; text-decoration: underline; text-underline-offset: 3px; }
.capital-read:disabled { opacity: .4; }
.capital-answer { margin-top: 24px; }
.capital-answer > label { display: block; font-size: 12px; margin-bottom: 10px; }
.capital-answer-row { display: flex; gap: 10px; }
.capital-answer-row input { min-width: 0; }
.capital-mic { flex-shrink: 0; width: 50px; display: grid; place-items: center; border: 1px solid #dfc38f88; border-radius: 13px; color: #dfc38f; background: #dfc38f10; }
.capital-mic.is-listening { color: #ffb4ba; border-color: #fb7185; animation: capital-mic-pulse 1.4s ease-in-out infinite; }
.capital-mic:disabled, .capital-actions .btn:disabled { opacity: .4; cursor: default; }
.capital-listening, .capital-error { margin-top: 12px; font-size: 12px; line-height: 1.8; }
.capital-listening { color: #dfc38f; }.capital-error { color: #fb7185; }
.capital-feedback { margin-top: 18px; padding: 14px; border: 1px solid #fb718566; border-radius: 12px; background: #fb71850a; font-size: 13px; }
.capital-feedback.is-correct { border-color: #4ade8066; background: #4ade800a; }
.capital-feedback strong { display: flex; align-items: center; gap: 8px; }
.capital-feedback p { margin-top: 9px; font-size: 12px; }
.capital-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; margin-top: 20px; }
.capital-actions .btn { gap: 8px; font-size: 12px; }
.capital-text-button { font-size: 11px; text-decoration: underline; text-underline-offset: 4px; }
.capital-exit { display: block; margin: 22px auto 0; }
.capital-note { margin-top: 16px; color: #91a5bf; font-size: 11px; line-height: 1.8; }
.capital-auto { display: flex; align-items: center; gap: 8px; margin-top: 18px; font-size: 12px; }
.capital-auto input { accent-color: #dfc38f; }
.capital-result { display: grid; gap: 12px; text-align: center; justify-items: center; margin-bottom: 24px; }
.capital-result > svg, .capital-result > strong { color: #dfc38f; }.capital-result h3 { font-size: 22px; font-weight: 750; }.capital-result strong { font-size: 36px; }.capital-result p { font-size: 13px; }
.capital-modes button:focus-visible, .capital-read:focus-visible, .capital-mic:focus-visible, .capital-text-button:focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
@keyframes capital-mic-pulse { 50% { box-shadow: 0 0 0 6px #fb71851a; } }
@media (prefers-reduced-motion: reduce) { .capital-mic.is-listening, .capital-read-spinner { animation: none; } }
@media (max-width: 800px) { .capital-quiz { grid-template-columns: 1fr; }.capital-intro { padding: 24px; }.capital-play { padding: 24px; border-left: 0; border-top: 1px solid #8997c02b; } }
</style>
