<script setup lang="ts">
import { gameDifficulties, type GameDifficulty } from '~/utils/gameDifficulty'

const props = defineProps<{
  game: 'genius' | 'logic' | 'million'
  unlockedIndex: number
  embedded?: boolean
}>()

const emit = defineEmits<{
  select: [level: GameDifficulty]
}>()

const gameTitles = {
  genius: 'FACTUM Genius',
  logic: 'FACTUM Logic',
  million: 'FACTUM Million',
}
</script>

<template>
  <component :is="embedded ? 'section' : 'main'" class="shell difficulty-page">
    <NuxtLink to="/" class="gold back-link">← Գլխավոր էջ</NuxtLink>
    <p class="gold text-sm font-semibold mt-6">ԽԱՂԱՅԻՆ ՄԱԿԱՐԴԱԿՆԵՐ</p>
    <h1 class="heading mt-2">{{ gameTitles[game] }}</h1>
    <p class="muted mt-3 mb-7">{{ game === 'million' ? 'Յուրաքանչյուր ռեժիմում կա 15 հարց՝ բարդացող երեք հնգյակով։ Հաջորդ ռեժիմը կբացվի միայն բոլոր 15 հարցերին ճիշտ պատասխանելուց հետո։' : 'Անցիր մակարդակը՝ ճիշտ պատասխանելով հարցերի առնվազն 80%-ին։ Հաջորդ մակարդակը կբացվի միայն հաջող ավարտից հետո։' }}</p>

    <section class="difficulty-list" aria-label="Ընտրիր խաղի բարդությունը">
      <article v-for="(level, index) in gameDifficulties" :key="level.id" class="panel difficulty-card" :class="{ 'is-locked': index > unlockedIndex }">
        <div class="difficulty-icon" aria-hidden="true">{{ level.icon }}</div>
        <div class="difficulty-copy">
          <h2>{{ level.title }}</h2>
          <p v-if="index < unlockedIndex" class="difficulty-status is-complete">Անցած է</p>
          <p v-else-if="index === unlockedIndex" class="difficulty-status">Բաց է խաղալու համար</p>
          <p v-else class="difficulty-status">🔒 Բացվում է նախորդ մակարդակն անցնելուց հետո</p>
        </div>
        <button class="btn difficulty-button" type="button" :disabled="index > unlockedIndex" @click="emit('select', level.id)">
          {{ index > unlockedIndex ? 'Փակ է' : 'Խաղալ' }}
        </button>
      </article>
    </section>
  </component>
</template>

<style scoped>
.difficulty-page { max-width: 850px; padding-top: 32px; padding-bottom: 48px; }
.back-link { font-size: 13px; }
.difficulty-list { display: grid; gap: 14px; }
.difficulty-card { display: flex; align-items: center; gap: 18px; padding: 20px; }
.difficulty-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 48px; border-radius: 14px; background: #dfc38f18; font-size: 24px; }
.difficulty-copy { flex: 1; min-width: 0; }
.difficulty-copy h2 { font-size: 17px; font-weight: 750; }
.difficulty-status { margin-top: 5px; color: #aebbd0; font-size: 12px; }
.difficulty-status.is-complete { color: #86c6a2; }
.difficulty-card.is-locked { opacity: .58; }
.difficulty-button { min-width: 102px; }
.difficulty-button:disabled { cursor: not-allowed; opacity: .55; }
@media (max-width: 560px) {
  .difficulty-card { flex-wrap: wrap; gap: 12px; padding: 16px; }
  .difficulty-copy { flex-basis: calc(100% - 64px); }
  .difficulty-button { width: 100%; }
}
</style>
