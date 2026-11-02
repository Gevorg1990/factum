<script setup lang="ts">
import { millionQuestions, millionReplacementQuestions, type MillionQuestion, millionQuestionBank, type MillionTier } from '~/data/millionQuestions'

const route = useRoute()
const mode = computed(() => String(route.params.mode))
const title = computed(() => ({ million: 'FACTUM Million', genius: 'FACTUM Genius', logic: 'FACTUM Logic' } as Record<string, string>)[mode.value] || 'FACTUM')
const isMillion = computed(() => mode.value === 'million')
const { enabled: soundEnabled, play: playSound, stop: stopSound, toggle: toggleSound, scheduleNext, cancelNext } = useGameFeedback()
function sound(cue: Parameters<typeof playSound>[0]) {
  if (isMillion.value) void playSound(cue)
}
function continueStage() {
  cancelNext()
  stageTransition.value = false
  stopSound()
  sound('question')
}

const index = ref(0)
const selected = ref<number | null>(null)
const score = ref(0)
const hintVisible = ref(false)
const swapUsed = ref(false)
const fiftyUsed = ref(false)
const hiddenAnswers = ref<number[]>([])
const finished = ref(false)
const stageTransition = ref(false)
const best = ref(0)
const gameQuestions = ref<MillionQuestion[]>([])
const demoQuestions = [millionQuestions[2], millionQuestions[5], millionQuestions[3]]
const total = computed(() => isMillion.value ? 15 : demoQuestions.length)
const question = computed<MillionQuestion>(() => isMillion.value ? (gameQuestions.value[index.value] || millionQuestions[index.value]) : demoQuestions[Math.min(index.value, demoQuestions.length - 1)])
const tier = (i: number): MillionTier => i < 5 ? 'easy' : i < 10 ? 'medium' : 'hard'
function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
function randomizeAnswers(item: MillionQuestion): MillionQuestion {
  const options = shuffled(item.answers.map((answer, index) => ({ answer, index })))
  return {
    ...item,
    answers: options.map(option => option.answer) as MillionQuestion['answers'],
    correct: options.findIndex(option => option.index === item.correct),
  }
}
function newRound() {
  gameQuestions.value = (['easy', 'medium', 'hard'] as MillionTier[])
    .flatMap(level => shuffled(millionQuestionBank[level]).slice(0, 5))
    .map(randomizeAnswers)
}
const correct = computed(() => selected.value !== null && selected.value === question.value.correct)
const progress = computed(() => Math.round((index.value / total.value) * 100))
const storageKey = 'factum-million-best-v1'

onMounted(() => {
  if (import.meta.client) {
    newRound()
    const saved = Number(localStorage.getItem(storageKey))
    best.value = Number.isFinite(saved) ? Math.min(15, Math.max(0, saved)) : 0
  }
})

function choose(answer: number) {
  if (selected.value !== null || finished.value) return
  selected.value = answer
  stopSound()
  sound('select')
  if (answer === question.value.correct) {
    score.value += 1
    sound('correct')
    scheduleNext(next)
  } else {
    sound('wrong')
    if (isMillion.value) finishGame()
  }
}
function finishGame() {
  cancelNext()
  finished.value = true
  if (score.value === total.value) {
    stopSound()
    sound('win')
  }
  if (isMillion.value && score.value > best.value) {
    best.value = score.value
    if (import.meta.client) localStorage.setItem(storageKey, String(best.value))
  }
}
function next() {
  if (selected.value === null || finished.value) return
  cancelNext()
  if (index.value + 1 >= total.value) {
    finishGame()
    return
  }
  index.value += 1
  selected.value = null
  hintVisible.value = false
  hiddenAnswers.value = []
  stageTransition.value = isMillion.value && (index.value === 5 || index.value === 10)
  stopSound()
  sound(stageTransition.value ? 'stage' : 'question')
  if (stageTransition.value) scheduleNext(continueStage)
}
function swapQuestion() {
  if (!isMillion.value || swapUsed.value || selected.value !== null || finished.value) return
  const current = question.value
  const candidates = millionQuestionBank[tier(index.value)].filter(item => !gameQuestions.value.some(used => used.question === item.question) && item.question !== current.question)
  if (!candidates.length) return
  gameQuestions.value[index.value] = randomizeAnswers(shuffled(candidates)[0])
  swapUsed.value = true
  stopSound()
  sound('question')
  hintVisible.value = false
  hiddenAnswers.value = []
}
function useFifty() {
  if (!isMillion.value || fiftyUsed.value || selected.value !== null || finished.value) return
  hiddenAnswers.value = shuffled([0, 1, 2, 3].filter(i => i !== question.value.correct)).slice(0, 2)
  fiftyUsed.value = true
}
function restart() {
  cancelNext()
  index.value = 0
  selected.value = null
  score.value = 0
  hintVisible.value = false
  swapUsed.value = false
  fiftyUsed.value = false
  hiddenAnswers.value = []
  newRound()
  finished.value = false
  stageTransition.value = false
  stopSound()
  sound('question')
}
watch(mode, () => { cancelNext(); stopSound() })
useHead({ title: `${title.value} — FACTUM` })
</script>

<template>
  <main v-if="mode !== 'genius' && mode !== 'logic'" class="shell py-10 max-w-3xl million-game">
    <h1 class="heading mt-4">{{ title }}</h1>
    <button v-if="isMillion" class="million-tool mb-4" type="button" :aria-pressed="soundEnabled" @click="toggleSound">
      {{ soundEnabled ? '🔊 Ձայնը միացված է' : '🔇 Միացնել ձայնը' }}
    </button>
    <p v-if="isMillion" class="muted mt-2 mb-5">15 պատահական հարց՝ 5 հեշտ՝ պատասխանների հումորային տարբերակներով, 5 միջին և 5 շատ բարդ։ Սխալ պատասխանը ավարտում է խաղը։</p>

    <div v-if="finished" class="panel p-7 text-center million-finish">
      <div class="text-5xl mb-4">🏆</div>
      <h2 class="text-2xl font-bold mb-3">Խաղն ավարտված է</h2>
      <div v-if="selected !== null && !correct" class="million-hint mt-4 mb-5 text-left" role="status">
        <p class="font-semibold">{{ question.question }}</p>
        <p class="mt-2">Քո պատասխանը՝ {{ question.answers[selected] }}</p>
        <p class="mt-2 text-green-400"><strong>Ճիշտ պատասխանը՝ {{ question.answers[question.correct] }}</strong></p>
        <p class="mt-2">{{ question.explanation }}</p>
      </div>
      <SaveMillionQuestion v-if="isMillion && selected !== null" :question="question" />
      <p class="text-xl mt-5">Ճիշտ պատասխաններ՝ <strong class="gold">{{ score }} / {{ total }}</strong></p>
      <p v-if="isMillion" class="muted mt-2">Լավագույն արդյունք՝ {{ best }} / 15</p>
      <p class="mt-4">{{ score === total ? 'Գերազանց արդյունք։' : score >= 10 ? 'Շատ լավ արդյունք։' : 'Շարունակիր սովորել և փորձիր կրկին։' }}</p>
      <GameResultShare v-if="isMillion" mode="million" :score="score" />
      <button class="btn mt-6" type="button" @click="restart">Խաղալ նորից ↻</button>
    </div>

    <div v-else-if="stageTransition" class="panel p-7 text-center million-stage" role="status" aria-live="polite">
      <p class="gold text-sm font-semibold">Մակարդակ {{ index === 5 ? 2 : 3 }} / 3</p>
      <div class="text-4xl my-5" aria-hidden="true">{{ index === 5 ? '⚡' : '🔥' }}</div>
      <h2 class="text-2xl font-bold">{{ index === 5 ? 'Անցնում ենք միջին մակարդակին' : 'Անցնում ենք ամենաբարդ մակարդակին' }}</h2>
      <p class="muted mt-4">{{ index === 5 ? 'Հեշտ հարցերը հաղթահարված են։ Առջևում 5 միջին բարդության հարց է։' : 'Միջին մակարդակը հաղթահարված է։ Առջևում վերջին 5 ամենաբարդ հարցերն են։' }}</p>
      <p class="gold mt-4">Ճիշտ պատասխաններ՝ {{ score }} / {{ total }}</p>
      <button class="btn mt-6" type="button" @click="continueStage">Շարունակել →</button>
    </div>

    <div v-else class="panel p-7">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="gold text-sm font-semibold">Հարց {{ index + 1 }} / {{ total }}</p>
        <p class="muted text-sm">Ճիշտ պատասխաններ՝ {{ score }}<span v-if="isMillion"> · Ռեկորդ՝ {{ best }}</span></p>
      </div>
      <div class="million-progress mt-4" role="progressbar" :aria-valuenow="index" :aria-valuemin="0" :aria-valuemax="total" aria-label="Խաղի առաջընթաց">
        <div :style="{ width: `${progress}%` }"></div>
      </div>
      <p v-if="isMillion" class="muted text-xs mt-2">{{ index < 5 ? 'Հեշտ հարցեր · Հումորային պատասխաններ' : index < 10 ? 'Միջին մակարդակ' : 'Ամենաբարդ մակարդակ' }}</p>
      <h2 class="text-xl font-bold my-6">{{ question.question }}</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <button
          v-for="(answer, answerIndex) in question.answers"
          :key="answerIndex"
          type="button"
          :disabled="selected !== null || hiddenAnswers.includes(answerIndex)"
          class="million-answer border rounded-xl p-4 text-left"
          :class="selected !== null && answerIndex === question.correct ? 'border-green-400 bg-green-900/30' : selected === answerIndex ? 'border-red-400 bg-red-900/30' : hiddenAnswers.includes(answerIndex) ? 'million-answer-hidden border-slate-700' : 'border-slate-600 hover:border-amber-400'"
          @click="choose(answerIndex)"
        >
          <span class="gold mr-2">{{ ['Ա', 'Բ', 'Գ', 'Դ'][answerIndex] }}.</span>{{ hiddenAnswers.includes(answerIndex) ? '—' : answer }}
        </button>
      </div>

      <div v-if="isMillion" class="million-tools mt-6 flex flex-wrap gap-3">
        <button class="million-tool" type="button" :aria-expanded="hintVisible" @click="hintVisible = !hintVisible">💡 {{ hintVisible ? 'Թաքցնել հուշումը' : 'Հուշում' }}</button>
        <button class="million-tool" type="button" :disabled="swapUsed || selected !== null" @click="swapQuestion">🔄 {{ swapUsed ? 'Հարցը փոխված է' : 'Փոխել հարցը (1 անգամ)' }}</button>
        <button class="million-tool" type="button" :disabled="fiftyUsed || selected !== null" @click="useFifty">✂️ {{ fiftyUsed ? "50/50 օգտագործված է" : "50/50 (1 անգամ)" }}</button>
      </div>
      <div v-if="hintVisible && isMillion" class="million-hint mt-4" role="status"><strong>Հուշում․</strong> {{ question.hint }}</div>

      <div v-if="selected !== null && !finished" class="mt-6" aria-live="polite">
        <p :class="correct ? 'text-green-400' : 'text-amber-300'" class="font-semibold">{{ correct ? '✓ Ճիշտ է։' : '✕ Սխալ պատասխան։' }}</p>
        <p class="mt-2">{{ question.explanation }}</p>
        <SaveMillionQuestion v-if="isMillion" :question="question" />
        <p v-if="correct" class="muted text-sm mt-3">Քիչ անց խաղը կշարունակվի ինքնաբերաբար։</p>
        <button class="btn mt-4" type="button" @click="next">{{ index + 1 === total ? 'Տեսնել արդյունքը →' : 'Հաջորդ հարցը →' }}</button>
      </div>
    </div>
    <p v-if="!isMillion" class="muted text-sm mt-5">Այս խաղի ընդլայնված տարբերակը դեռ մշակման փուլում է։</p>
  </main>
  <GeniusGame v-else-if="mode === 'genius'" />
  <LogicGame v-else />
</template>

<style scoped>
.million-game { padding-top: 32px; }
.million-progress { height: 9px; overflow: hidden; border-radius: 999px; background: #263b5b; }
.million-progress > div { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #b98b37, #f2d58b); transition: width .25s ease; }
.million-answer { color: inherit; transition: background .2s ease, border-color .2s ease; min-height: 64px; }
.million-answer:disabled { cursor: default; }
.million-answer-hidden { opacity: .25; pointer-events: none; }
.million-tool { border: 1px solid #b98b37; color: #f3d391; background: #1a2d4a; border-radius: 12px; padding: 10px 16px; font-weight: 600; }
.million-tool:hover:not(:disabled) { background: #263e5f; }
.million-tool:disabled { opacity: .45; cursor: not-allowed; }
.million-hint { padding: 14px 16px; border: 1px solid #9b7a3e; border-radius: 12px; color: #f3e5bd; background: #24334b; line-height: 1.75; }
.million-finish { padding-top: 45px; padding-bottom: 45px; }
</style>
