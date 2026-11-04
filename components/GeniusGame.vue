<script setup lang="ts">
import { saveGameResult } from '~/utils/gameRecords'
import { geniusStatements, type GeniusStatement } from '~/data/geniusStatements'
import { geniusRecordKey, parseGeniusRecord } from '~/utils/geniusRecord'
import GameDifficultyPicker from '~/components/GameDifficultyPicker.vue'
import { difficultyIndex, difficultyTitle, requiredCorrectAnswers, saveDifficultyProgress, unlockedDifficultyIndex, type GameDifficulty } from '~/utils/gameDifficulty'

const route = useRoute()
const router = useRouter()

const { enabled: soundEnabled, play: playSound, stop: stopSound, toggle: toggleSound, cancelNext } = useGameFeedback()

const completedLevels = ref<GameDifficulty[]>([])
const bestScore = ref(0)
const bestLevel = ref<GameDifficulty | null>(null)
const recordKey = geniusRecordKey
function loadRecord() {
  try {
    const saved = parseGeniusRecord(localStorage.getItem(recordKey))
    completedLevels.value = saved.completed
    bestLevel.value = saved.bestLevel
    bestScore.value = saved.best ?? 0
  } catch { /* Storage may be unavailable. */ }
}
function saveRecord() {
  saveGameResult('genius', score.value, level.value)
  if (score.value > bestScore.value || (score.value === bestScore.value && level.value && difficultyIndex(level.value) > difficultyIndex(bestLevel.value || undefined))) {
    bestScore.value = score.value
    bestLevel.value = level.value
  }
  if (passed.value && level.value && !completedLevels.value.includes(level.value)) completedLevels.value.push(level.value)
  try { localStorage.setItem(recordKey, JSON.stringify({ completed: completedLevels.value, best: bestScore.value, bestLevel: bestLevel.value })) } catch { /* Keep session progress. */ }
}
const roundSize = 10
const unlockedIndex = ref(0)
const level = ref<GameDifficulty | null>(null)
const round = ref<GeniusStatement[]>(geniusStatements.slice(0, roundSize))
const index = ref(0)
const selected = ref<boolean | null>(null)
const score = ref(0)
const finished = ref(false)
const newlyUnlockedLevel = ref<GameDifficulty | null>(null)
const current = computed(() => round.value[index.value]!)
const answered = computed(() => index.value + (selected.value === null ? 0 : 1))
const passed = computed(() => score.value >= requiredCorrectAnswers(roundSize))
const nextLevel = computed<GameDifficulty | null>(() => {
  const next = level.value ? difficultyIndex(level.value) + 1 : 3
  return next >= 0 && next < 3 ? (['easy', 'medium', 'hard'] as const)[next]! : null
})
const choices = [{ value: true, label: 'Ճիշտ է', icon: '✓' }, { value: false, label: 'Սխալ է', icon: '✕' }]

function startLevel(next: GameDifficulty) {
  if (difficultyIndex(next) > unlockedIndex.value) return
  level.value = next
  void router.replace({ path: route.path, query: { level: next } })
  newRound()
}

function returnToLevels() {
  level.value = null
  void router.replace({ path: route.path })
  cancelNext()
  stopSound()
}

function newRound() {
  if (!level.value) return
  cancelNext()
  stopSound()
  const pool = geniusStatements.filter(item => item.difficulty === level.value)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  round.value = pool.slice(0, roundSize)
  index.value = 0
  selected.value = null
  score.value = 0
  finished.value = false
  newlyUnlockedLevel.value = null
  void playSound('question')
}
function choose(value: boolean) {
  if (selected.value !== null || finished.value) return
  selected.value = value
  stopSound()
  void playSound('select')
  if (value === current.value.correct) {
    score.value++
    void playSound('correct')
  } else void playSound('wrong')
}
function next() {
  if (selected.value === null || finished.value) return
  cancelNext()
  stopSound()
  if (index.value === round.value.length - 1) {
    finished.value = true
    saveRecord()
    if (passed.value && level.value) {
      const previouslyUnlocked = Math.max(unlockedIndex.value, unlockedDifficultyIndex('genius'))
      unlockedIndex.value = saveDifficultyProgress('genius', level.value)
      newlyUnlockedLevel.value = nextLevel.value && difficultyIndex(nextLevel.value) > previouslyUnlocked ? nextLevel.value : null
    }
    if (!passed.value) void playSound('stage')
  }
  else {
    index.value++
    selected.value = null
    void playSound('question')
  }
}
onMounted(() => {
  unlockedIndex.value = unlockedDifficultyIndex('genius')
  loadRecord()
  const requestedLevel = String(route.query.level || '')
  if (difficultyIndex(requestedLevel) >= 0 && difficultyIndex(requestedLevel) <= unlockedIndex.value) {
    startLevel(requestedLevel as GameDifficulty)
  }
})
</script>

<template>
  <GameDifficultyPicker v-if="!level" game="genius" :unlocked-index="unlockedIndex" :completed-levels="completedLevels" @select="startLevel" />

  <main v-else class="shell genius-game">
    <p class="gold text-sm font-semibold">ՃԻՇՏ ԿԱՄ ՍԽԱԼ</p>
    <h1 class="heading mt-3">FACTUM Genius</h1>
    <button class="btn-secondary mb-4" type="button" :aria-pressed="soundEnabled" @click="toggleSound">{{ soundEnabled ? '🔊 Ձայնը միացված է' : '🔇 Միացնել ձայնը' }}</button>
    <p class="muted mb-6">{{ difficultyTitle(level) }} մակարդակ · 10 պատահական պնդում։ {{ requiredCorrectAnswers(roundSize) }} ճիշտ պատասխանով կանցնես այս փուլը։</p>
    <GameDifficultyProgress :current="level || 'easy'" :unlocked-index="unlockedIndex" :completed-levels="completedLevels" />

    <section v-if="finished" class="panel p-7 text-center result-panel" aria-live="polite">
      <h2 class="text-2xl font-bold">{{ passed ? 'Փուլն անցած է։ Ապրե՛ս։' : 'Խաղն ավարտված է' }}</h2>
      <p class="gold text-3xl font-bold my-5">{{ score }} / {{ roundSize }}</p>
      <p class="muted">{{ score === roundSize ? 'Գերազանց է․ բոլոր պնդումները ճիշտ գնահատեցիր։' : score >= 7 ? 'Շատ լավ արդյունք։ Շարունակիր բացահայտել նոր գիտելիքներ։' : 'Ամեն փորձ նոր գիտելիք է։ Փորձիր կրկին։' }}</p>
      <p v-if="newlyUnlockedLevel" class="text-green-400 mt-4">Հաջորդ՝ {{ difficultyTitle(newlyUnlockedLevel) }} մակարդակը բացվեց։</p>
      <p v-else-if="!passed" class="muted mt-4">Այս փուլն անցնելու համար պետք է առնվազն {{ requiredCorrectAnswers(roundSize) }} ճիշտ պատասխան։</p>
      <p v-if="passed && !nextLevel" class="text-green-400 mt-4">🏆 Բոլոր փուլերն անցած են, ներառյալ ամենադժվարը։</p>
      <p class="gold mt-4">Լավագույն արդյունքը՝ {{ bestScore }} / {{ roundSize }}<span v-if="bestLevel"> · {{ difficultyTitle(bestLevel) }} մակարդակ</span></p>
      <GameResultShare mode="genius" :score="bestScore" :level="bestLevel" />
      <div class="game-result-actions">
      <button v-if="passed && nextLevel" type="button" class="btn mt-6" @click="startLevel(nextLevel)">Անցնել {{ difficultyTitle(nextLevel) }} մակարդակին →</button>
      <button v-else type="button" class="btn mt-6" @click="newRound">Խաղալ նորից ↻</button>
      <button type="button" class="btn-secondary mt-3" @click="returnToLevels">Մակարդակների ցանկ</button>
      </div>
    </section>

    <section v-else class="panel p-7">
      <div class="flex flex-wrap justify-between gap-3 text-sm">
        <p class="gold font-semibold">Պնդում {{ index + 1 }} / {{ roundSize }}</p>
        <p class="muted">Միավորներ՝ {{ score }}</p>
      </div>
      <div class="genius-progress my-5" role="progressbar" aria-label="Խաղի առաջընթաց" :aria-valuenow="answered" :aria-valuemin="0" :aria-valuemax="roundSize">
        <div :style="{ width: `${answered / roundSize * 100}%` }" />
      </div>
      <p class="muted text-sm">{{ current.topic }}</p>
      <h2 class="text-xl font-bold my-6">{{ current.statement }}</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <button v-for="choice in choices" :key="String(choice.value)" type="button" class="genius-choice" :disabled="selected !== null" :class="{ 'is-correct': selected !== null && choice.value === current.correct, 'is-wrong': selected === choice.value && choice.value !== current.correct }" @click="choose(choice.value)">
          <span aria-hidden="true">{{ choice.icon }}</span> {{ choice.label }}
        </button>
      </div>
      <div v-if="selected !== null" class="genius-feedback mt-6" aria-live="polite">
        <p class="font-bold" :class="selected === current.correct ? 'text-green-400' : 'text-amber-300'">{{ selected === current.correct ? '✓ Ճիշտ գնահատեցիր։' : '✕ Այս անգամ սխալվեցիր։' }}</p>
        <p class="mt-2 font-semibold">Պնդումը {{ current.correct ? 'ճիշտ է' : 'սխալ է' }}։</p>
        <p class="muted mt-2">{{ current.explanation }}</p>
        <button type="button" class="btn mt-5" @click="next">{{ index === roundSize - 1 ? 'Տեսնել արդյունքը →' : 'Հաջորդ պնդումը →' }}</button>
      </div>
      <div class="flex justify-end mt-5"><SaveGameQuestion :disabled="selected === null" game="genius" :question="current.statement" /></div>
    </section>
  </main>
</template>

<style scoped>
.genius-game { max-width: 850px; padding-top: 32px; padding-bottom: 40px; }
.genius-progress { height: 8px; overflow: hidden; border-radius: 20px; background: #243954; }
.genius-progress > div { height: 100%; background: linear-gradient(90deg, #328aff, #79d5ff); transition: width .2s; }
.genius-choice { padding: 20px; border: 1px solid #426b96; border-radius: 14px; background: #10243c; color: #eef4ff; font-size: 20px; font-weight: 700; transition: background .2s, border-color .2s; }
.genius-choice:hover:not(:disabled) { background: #193b60; border-color: #79d5ff; }
.genius-choice:focus-visible { outline: 2px solid #79d5ff; outline-offset: 3px; }
.genius-choice.is-correct { border-color: #4ade80; background: #113e32; }
.genius-choice.is-wrong { border-color: #f87171; background: #4a202c; }
.genius-feedback { padding-top: 20px; border-top: 1px solid #294565; }
@media (prefers-reduced-motion: reduce) { .genius-progress > div, .genius-choice { transition: none; } }
</style>
