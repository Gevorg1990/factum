<script setup lang="ts">
import { saveGameResult } from '~/utils/gameRecords'
import { millionSlotPairs } from '~/shared/millionStages'
import { millionQuestions, type MillionQuestion, millionTiers, createMillionRound, type MillionTier } from '~/utils/millionQuestionPool'
import { difficultyIndex, type GameDifficulty } from '~/utils/gameDifficulty'

const roundLoading=ref(false),roundError=ref('')
const route = useRoute()
const router = useRouter()
const mode = computed(() => String(route.params.mode))
const title = computed(() => ({ million: 'FACTUM Million', genius: 'FACTUM Genius', logic: 'FACTUM Logic' } as Record<string, string>)[mode.value] || 'FACTUM')
const isMillion = computed(() => mode.value === 'million')
const { enabled: soundEnabled, play: playSound, stop: stopSound, toggle: toggleSound, cancelNext } = useGameFeedback()
function sound(cue: Parameters<typeof playSound>[0]) { if (isMillion.value) void playSound(cue) }

const gameReady = ref(false)
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
const unlockedMillionIndex = ref(0)
const selectedMillionMode = ref<GameDifficulty | null>(null)
const gameQuestions = ref<MillionQuestion[]>([])
const replacementQuestions = ref<MillionQuestion[]>([])
const demoQuestions = [millionQuestions[2], millionQuestions[5], millionQuestions[3]]
const total = computed(() => isMillion.value ? 15 : demoQuestions.length)
const question = computed<MillionQuestion>(() => isMillion.value ? (gameQuestions.value[index.value] || millionQuestions[index.value]) : demoQuestions[Math.min(index.value, demoQuestions.length - 1)])
const currentDifficulty = computed<GameDifficulty>(() => selectedMillionMode.value || 'easy')
const currentTierName = computed(() => ({ easy: 'Հեշտ', medium: 'Միջին', hard: 'Բարդ' } as Record<MillionTier, string>)[millionTiers[Math.floor(index.value / 5)] || 'easy'])
const correct = computed(() => selected.value !== null && selected.value === question.value.correct)
const progress = computed(() => Math.round((index.value / total.value) * 100))
const storageKey = computed(() => `factum-million-best-v1-${selectedMillionMode.value || 'easy'}`)
const millionProgressKey = 'factum-million-mode-progress-v2'

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]] }
  return copy
}
function readMillionProgress(): number {
  try {
    const value = Number(localStorage.getItem(millionProgressKey) || 0)
    return Number.isInteger(value) ? Math.max(0, Math.min(2, value)) : 0
  } catch { return 0 }
}
function saveMillionProgress(level: GameDifficulty): number {
  const unlocked = Math.max(readMillionProgress(), Math.min(2, difficultyIndex(level) + 1))
  try { localStorage.setItem(millionProgressKey, String(unlocked)) } catch { /* Session can continue without storage. */ }
  return unlocked
}
async function newRound() {
  if (!selectedMillionMode.value) return
  roundLoading.value=true;roundError.value=''
  try {
    const result = await $fetch<{items:(MillionQuestion & {slot?:number;variant?:string;stage?:string})[]}>('/api/games-round',{query:{mode:'million',difficulty:selectedMillionMode.value}})
    let pairs
    try{pairs=millionSlotPairs(result.items)}catch(error){roundError.value=error instanceof Error?error.message:'Փուլերի հարցերը բավարար չեն';return}
    const round=createMillionRound(selectedMillionMode.value,Math.random,pairs)
    gameQuestions.value = round.questions
    replacementQuestions.value = round.replacements
  } catch {roundError.value='Հարցերը չհաջողվեց բեռնել․ փորձեք կրկին'} finally {roundLoading.value=false}
}
function resetRound() {
  cancelNext(); index.value = 0; selected.value = null; score.value = 0; hintVisible.value = false
  swapUsed.value = false; fiftyUsed.value = false; hiddenAnswers.value = []; finished.value = false; stageTransition.value = false
  newRound(); best.value = Number(localStorage.getItem(storageKey.value) || 0) || 0; stopSound(); sound('question')
}
function startMillionMode(level: GameDifficulty) {
  if (difficultyIndex(level) > unlockedMillionIndex.value) return
  selectedMillionMode.value = level
  void router.replace({ query: { ...route.query, level } })
  resetRound()
}
function backToModes() {
  cancelNext(); stopSound(); selectedMillionMode.value = null; finished.value = false
  const query = { ...route.query }; delete query.level
  void router.replace({ query })
}
function continueStage() { cancelNext(); stageTransition.value = false; stopSound(); sound('question') }

onMounted(() => {
  unlockedMillionIndex.value = readMillionProgress()
  const requested = String(route.query.level || '')
  if (['easy', 'medium', 'hard'].includes(requested) && difficultyIndex(requested) <= unlockedMillionIndex.value) {
    selectedMillionMode.value = requested as GameDifficulty
    best.value = Number(localStorage.getItem(storageKey.value) || 0) || 0
    newRound()
  }
  gameReady.value = true
})

function choose(answer: number) {
  if (selected.value !== null || finished.value) return
  selected.value = answer; stopSound(); sound('select')
  if (answer === question.value.correct) { score.value += 1; sound('correct') }
  else { sound('wrong'); if (isMillion.value) finishGame() }
}
function finishGame() {
  cancelNext(); finished.value = true
  if (isMillion.value) saveGameResult('million', score.value, selectedMillionMode.value)
  if (score.value === total.value) {
    stopSound(); sound('win')
    if (isMillion.value && selectedMillionMode.value) unlockedMillionIndex.value = saveMillionProgress(selectedMillionMode.value)
  }
  if (isMillion.value && score.value > best.value) {
    best.value = score.value
    if (import.meta.client) localStorage.setItem(storageKey.value, String(best.value))
  }
}
function next() {
  if (selected.value === null || finished.value) return
  cancelNext()
  if (index.value + 1 >= total.value) { finishGame(); return }
  index.value += 1; selected.value = null; hintVisible.value = false; hiddenAnswers.value = []
  stageTransition.value = isMillion.value && (index.value === 5 || index.value === 10)
  stopSound(); sound(stageTransition.value ? 'stage' : 'question')
}
function swapQuestion() {
  if (!isMillion.value || swapUsed.value || selected.value !== null || finished.value) return
  const replacement = replacementQuestions.value[index.value]
  if (!replacement) return
  gameQuestions.value[index.value] = replacement
  swapUsed.value = true
  stopSound(); sound('question'); hintVisible.value = false; hiddenAnswers.value = []
}
function useFifty() {
  if (!isMillion.value || fiftyUsed.value || selected.value !== null || finished.value) return
  hiddenAnswers.value = shuffled([0, 1, 2, 3].filter(answerIndex => answerIndex !== question.value.correct)).slice(0, 2); fiftyUsed.value = true
}
function restart() { resetRound() }
watch(mode, () => { cancelNext(); stopSound() })
useHead({ title: `${title.value} — FACTUM` })
</script>

<template>
  <main v-if="mode !== 'genius' && mode !== 'logic'" class="shell py-10 max-w-3xl million-game">
    <h1 class="heading mt-4">{{ title }}</h1>
    <button v-if="isMillion" class="million-tool mb-4" type="button" :aria-pressed="soundEnabled" @click="toggleSound">
      {{ soundEnabled ? '🔊 Ձայնը միացված է' : '🔇 Միացնել ձայնը' }}
    </button>
    <p v-if="isMillion" class="muted mt-2 mb-5">Ընտրիր ռեժիմը․ յուրաքանչյուրն ունի 15 հարց՝ բարդացող երեք հնգյակով։ Սխալ պատասխանը ավարտում է ընթացիկ խաղը։</p>
    <section v-if="isMillion && (!gameReady || roundLoading)" class="million-loading panel" role="status" aria-live="polite" aria-busy="true">
      <span class="million-loading-emblem" aria-hidden="true">✦</span>
      <h2>Պատրաստում ենք խաղը</h2>
      <p class="muted">Մի պահ, և սկսում ենք…</p>
      <div class="million-loading-bars" aria-hidden="true"><span></span><span></span><span></span></div>
    </section>
    <GameDifficultyPicker v-else-if="isMillion && !selectedMillionMode" game="million" :unlocked-index="unlockedMillionIndex" embedded @select="startMillionMode" />
    <div v-else-if="roundError" class="panel million-hint" role="alert">{{ roundError }} <button class="gold" @click="newRound">Կրկնել</button></div>
    <template v-else>
    <GameDifficultyProgress v-if="isMillion" :current="currentDifficulty" :unlocked-index="unlockedMillionIndex" />

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
      <p class="text-xl mt-5">Ճիշտ պատասխաններ՝ <strong class="gold">{{ score }} / {{ total }}</strong> · {{ currentDifficulty === 'easy' ? 'Հեշտ' : currentDifficulty === 'medium' ? 'Միջին' : 'Բարդ' }} ռեժիմ</p>
      <p v-if="isMillion" class="muted mt-2">Լավագույն արդյունք՝ {{ best }} / 15</p>
      <p class="mt-4">{{ score === total ? 'Գերազանց արդյունք։' : score >= 10 ? 'Շատ լավ արդյունք։' : 'Շարունակիր սովորել և փորձիր կրկին։' }}</p>
      <GameResultShare v-if="isMillion" mode="million" :score="score" />
      <div class="game-result-actions">
      <button class="btn mt-6" type="button" @click="restart">Խաղալ այս ռեժիմը կրկին ↻</button>
      <button v-if="isMillion" class="million-tool ml-2" type="button" @click="backToModes">Մակարդակների ցանկ</button>
      <button v-if="isMillion && score === total && selectedMillionMode && difficultyIndex(selectedMillionMode) < 2" class="btn mt-4" type="button" @click="startMillionMode((['easy', 'medium', 'hard'] as GameDifficulty[])[difficultyIndex(selectedMillionMode) + 1])">Բացել հաջորդ ռեժիմը →</button>
      </div>
    </div>

    <div v-else-if="stageTransition" class="panel p-7 text-center million-stage" role="status" aria-live="polite">
      <p class="gold text-sm font-semibold">{{ currentDifficulty === 'easy' ? 'Հեշտ' : currentDifficulty === 'medium' ? 'Միջին' : 'Բարդ' }} ռեժիմ · փուլ {{ index === 5 ? 2 : 3 }} / 3</p>
      <div class="text-4xl my-5" aria-hidden="true">{{ index === 5 ? '⚡' : '🔥' }}</div>
      <h2 class="text-2xl font-bold">Հաջորդ 5 հարցերը՝ {{ currentTierName.toLowerCase() }}</h2>
      <p class="muted mt-4">Այս ռեժիմի նախորդ հնգյակն ավարտված է։ Առջևում բարդության հաջորդ աստիճանն է։</p>
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
      <p v-if="isMillion" class="muted text-xs mt-2">{{ currentTierName }} հարցեր · փուլ {{ Math.floor(index / 5) + 1 }} / 3</p>
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
        <button class="btn mt-4" type="button" @click="next">{{ index + 1 === total ? 'Տեսնել արդյունքը →' : 'Հաջորդ հարցը →' }}</button>
      </div>
      <div v-if="isMillion" class="flex justify-end mt-5"><SaveMillionQuestion :disabled="selected === null" :question="question" /></div>
    </div>
    <p v-if="!isMillion" class="muted text-sm mt-5">Այս խաղի ընդլայնված տարբերակը դեռ մշակման փուլում է։</p>
    </template>
  </main>
  <GeniusGame v-else-if="mode === 'genius'" />
  <LogicGame v-else />
</template>

<style scoped>
.million-loading { min-height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 32px; text-align: center; background: radial-gradient(ellipse at top, #b98b3720, transparent 70%), #0b192d; }
.million-loading-emblem { display: grid; place-items: center; width: 76px; height: 76px; border: 1px solid #b98b3766; border-radius: 50%; color: #f2d58b; font-size: 42px; }
.million-loading h2 { font-size: 22px; font-weight: 750; }
.million-loading-bars { display: flex; gap: 8px; margin-top: 8px; }
.million-loading-bars span { width: 40px; height: 4px; border-radius: 4px; background: #f2d58b; animation: million-loading-pulse 1.2s ease-in-out infinite alternate; }
.million-loading-bars span:nth-child(2) { animation-delay: .2s; }
.million-loading-bars span:nth-child(3) { animation-delay: .4s; }
@keyframes million-loading-pulse { from { opacity: .25; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .million-loading-bars span { animation: none; } }
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
