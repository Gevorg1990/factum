<script setup lang="ts">
import { logicPuzzles, type LogicPuzzle } from '~/data/logicPuzzles'

const roundSize = 5
const round = ref<LogicPuzzle[]>(logicPuzzles.slice(0, roundSize))
const index = ref(0)
const selected = ref<number | null>(null)
const score = ref(0)
const finished = ref(false)
const current = computed(() => round.value[index.value]!)
const answered = computed(() => index.value + (selected.value === null ? 0 : 1))
const choices = computed(() => current.value.answers.map((label, value) => ({ label, value })))

function newRound() {
  const pool = [...logicPuzzles]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  round.value = pool.slice(0, roundSize)
  index.value = 0
  selected.value = null
  score.value = 0
  finished.value = false
}
function choose(value: number) {
  if (selected.value !== null || finished.value) return
  selected.value = value
  if (value === current.value.correct) score.value++
}
function next() {
  if (selected.value === null || finished.value) return
  if (index.value === round.value.length - 1) finished.value = true
  else {
    index.value++
    selected.value = null
  }
}
onMounted(newRound)
</script>

<template>
  <main class="shell logic-game">
    <p class="gold text-sm font-semibold">ՏՐԱՄԱԲԱՆԱԿԱՆ ՄԱՐՏԱՀՐԱՎԵՐ</p>
    <h1 class="heading mt-3">FACTUM Logic</h1>
    <p class="muted mb-6">5 պատահական գլուխկոտրուկ։ Գտիր օրինաչափությունը և ընտրիր պատասխանը։ Յուրաքանչյուր ճիշտ լուծում՝ 1 միավոր։ Սխալվելուց հետո կարող ես շարունակել։</p>

    <section v-if="finished" class="panel p-7 text-center" aria-live="polite">
      <div class="text-5xl mb-4" aria-hidden="true">{{ score === roundSize ? '🏆' : '🧩' }}</div>
      <h2 class="text-2xl font-bold">Խաղն ավարտված է</h2>
      <p class="gold text-3xl font-bold my-5">{{ score }} / {{ roundSize }}</p>
      <p class="muted">{{ score === roundSize ? 'Գերազանց է․ բոլոր գլուխկոտրուկները լուծեցիր։' : score >= 3 ? 'Շատ լավ արդյունք։ Շարունակիր բացահայտել նոր գիտելիքներ։' : 'Ամեն փորձ նոր գիտելիք է։ Փորձիր կրկին։' }}</p>
      <button type="button" class="btn mt-6" @click="newRound">Խաղալ նորից ↻</button>
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
