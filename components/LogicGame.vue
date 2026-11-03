<script setup lang="ts">
import { logicPuzzles, type LogicPuzzle } from '~/data/logicPuzzles'
import GameDifficultyPicker from '~/components/GameDifficultyPicker.vue'
import { difficultyIndex, difficultyTitle, requiredCorrectAnswers, saveDifficultyProgress, unlockedDifficultyIndex, type GameDifficulty } from '~/utils/gameDifficulty'

const route = useRoute()
const router = useRouter()

const { enabled: soundEnabled, play: playSound, stop: stopSound, toggle: toggleSound, cancelNext } = useGameFeedback()

const roundSize = 5
const unlockedIndex = ref(0)
const level = ref<GameDifficulty | null>(null)
const round = ref<LogicPuzzle[]>(logicPuzzles.slice(0, roundSize))
const index = ref(0)
const selected = ref<number | null>(null)
const score = ref(0)
const finished = ref(false)
const current = computed(() => round.value[index.value]!)
const answered = computed(() => index.value + (selected.value === null ? 0 : 1))
const passed = computed(() => score.value >= requiredCorrectAnswers(roundSize))
const nextLevel = computed<GameDifficulty | null>(() => {
  const next = level.value ? difficultyIndex(level.value) + 1 : 3
  return next >= 0 && next < 3 ? (['easy', 'medium', 'hard'] as const)[next]! : null
})
const choices = computed(() => current.value.answers.map((label, value) => ({ label, value })))

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
  const pool = logicPuzzles.filter(item => item.difficulty === level.value)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  round.value = pool.slice(0, roundSize)
  index.value = 0
  selected.value = null
  score.value = 0
  finished.value = false
  void playSound('question')
}
function choose(value: number) {
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
    if (passed.value && level.value) unlockedIndex.value = saveDifficultyProgress('logic', level.value)
    void playSound(score.value === roundSize ? 'win' : 'stage')
  }
  else {
    index.value++
    selected.value = null
    void playSound('question')
  }
}
onMounted(() => {
  unlockedIndex.value = unlockedDifficultyIndex('logic')
  const requestedLevel = String(route.query.level || '')
  if (difficultyIndex(requestedLevel) >= 0 && difficultyIndex(requestedLevel) <= unlockedIndex.value) {
    startLevel(requestedLevel as GameDifficulty)
  }
})
</script>

<template>
  <GameDifficultyPicker v-if="!level" game="logic" :unlocked-index="unlockedIndex" @select="startLevel" />

  <main v-else class="shell logic-game">
    <p class="gold text-sm font-semibold">ՏՐԱՄԱԲԱՆԱԿԱՆ ՄԱՐՏԱՀՐԱՎԵՐ</p>
    <h1 class="heading mt-3">FACTUM Logic</h1>
    <button class="btn-secondary mb-4" type="button" :aria-pressed="soundEnabled" @click="toggleSound">{{ soundEnabled ? '🔊 Ձայնը միացված է' : '🔇 Միացնել ձայնը' }}</button>
    <p class="muted mb-6">{{ difficultyTitle(level) }} մակարդակ · 5 պատահական գլուխկոտրուկ։ 4 ճիշտ պատասխանով կբացվի հաջորդ մակարդակը։</p>
    <GameDifficultyProgress :current="level || 'easy'" :unlocked-index="unlockedIndex" />

    <section v-if="finished" class="panel p-7 text-center" aria-live="polite">
      <div class="text-5xl mb-4" aria-hidden="true">{{ score === roundSize ? '🏆' : '🧩' }}</div>
      <h2 class="text-2xl font-bold">Խաղն ավարտված է</h2>
      <p class="gold text-3xl font-bold my-5">{{ score }} / {{ roundSize }}</p>
      <p class="muted">{{ score === roundSize ? 'Գերազանց է․ բոլոր գլուխկոտրուկները լուծեցիր։' : score >= 3 ? 'Շատ լավ արդյունք։ Շարունակիր բացահայտել նոր գիտելիքներ։' : 'Ամեն փորձ նոր գիտելիք է։ Փորձիր կրկին։' }}</p>
      <p v-if="passed && nextLevel" class="text-green-400 mt-4">Հաջորդ՝ {{ difficultyTitle(nextLevel) }} մակարդակը բացվեց։</p>
      <p v-else-if="!passed" class="muted mt-4">Հաջորդ մակարդակը բացելու համար պետք է առնվազն 4 ճիշտ պատասխան։</p>
      <GameResultShare mode="logic" :score="score" />
      <div class="game-result-actions">
      <button v-if="passed && nextLevel" type="button" class="btn mt-6" @click="startLevel(nextLevel)">Անցնել {{ difficultyTitle(nextLevel) }} մակարդակին →</button>
      <button v-else type="button" class="btn mt-6" @click="newRound">Խաղալ նորից ↻</button>
      <button type="button" class="btn-secondary mt-3" @click="returnToLevels">Մակարդակների ցանկ</button>
      </div>
    </section>

    <section v-else class="panel p-7">
      <div class="flex flex-wrap justify-between gap-3 text-sm">
        <p class="gold font-semibold">Խնդիր {{ index + 1 }} / {{ roundSize }}</p>
        <p class="muted">Միավորներ՝ {{ score }}</p>
      </div>
      <div class="logic-progress my-5" role="progressbar" aria-label="Խաղի առաջընթաց" :aria-valuenow="answered" :aria-valuemin="0" :aria-valuemax="roundSize">
        <div :style="{ width: `${answered / roundSize * 100}%` }" />
      </div>
      <p class="muted text-sm">{{ current.title }}</p>
      <h2 class="text-xl font-bold my-6">{{ current.question }}</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <button v-for="choice in choices" :key="String(choice.value)" type="button" class="logic-choice" :disabled="selected !== null" :class="{ 'is-correct': selected !== null && choice.value === current.correct, 'is-wrong': selected === choice.value && choice.value !== current.correct }" @click="choose(choice.value)">
          <span class="gold" aria-hidden="true">{{ ['Ա', 'Բ', 'Գ', 'Դ'][choice.value] }}.</span> {{ choice.label }}
        </button>
      </div>
      <div v-if="selected !== null" class="logic-feedback mt-6" aria-live="polite">
        <p class="font-bold" :class="selected === current.correct ? 'text-green-400' : 'text-amber-300'">{{ selected === current.correct ? '✓ Ճիշտ լուծեցիր։' : '✕ Այս անգամ սխալվեցիր։' }}</p>
        <p class="mt-2 font-semibold">Ճիշտ պատասխանը՝ {{ current.answers[current.correct] }}</p>
        <p class="muted mt-2">{{ current.explanation }}</p>
        <button type="button" class="btn mt-5" @click="next">{{ index === roundSize - 1 ? 'Տեսնել արդյունքը →' : 'Հաջորդ խնդիրը →' }}</button>
      </div>
      <div class="flex justify-end mt-5"><SaveGameQuestion game="logic" :question="current.question" /></div>
    </section>
  </main>
</template>

<style scoped>
.logic-game { max-width: 850px; padding-top: 32px; padding-bottom: 40px; }
.logic-progress { height: 8px; overflow: hidden; border-radius: 20px; background: #243954; }
.logic-progress > div { height: 100%; background: linear-gradient(90deg, #944de0, #e2a0ff); transition: width .2s; }
.logic-choice { padding: 20px; border: 1px solid #426b96; border-radius: 14px; background: #10243c; color: #eef4ff; font-size: 20px; font-weight: 700; transition: background .2s, border-color .2s; }
.logic-choice:hover:not(:disabled) { background: #193b60; border-color: #e2a0ff; }
.logic-choice:focus-visible { outline: 2px solid #e2a0ff; outline-offset: 3px; }
.logic-choice.is-correct { border-color: #4ade80; background: #113e32; }
.logic-choice.is-wrong { border-color: #f87171; background: #4a202c; }
.logic-feedback { padding-top: 20px; border-top: 1px solid #294565; }
@media (prefers-reduced-motion: reduce) { .logic-progress > div, .logic-choice { transition: none; } }
</style>
