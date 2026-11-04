<script setup lang="ts">
import { difficultyIndex, gameDifficulties, type GameDifficulty } from '~/utils/gameDifficulty'

const props = defineProps<{
  current: GameDifficulty
  unlockedIndex: number
  completedLevels?: GameDifficulty[]
}>()

const currentIndex = computed(() => difficultyIndex(props.current))
</script>

<template>
  <ol class="difficulty-progress" aria-label="Խաղի բարդության փուլերը">
    <li
      v-for="(level, index) in gameDifficulties"
      :key="level.id"
      class="difficulty-step"
      :class="{
        'is-current': index === currentIndex,
        'is-complete': completedLevels?.includes(level.id) || index < unlockedIndex,
        'is-locked': index > unlockedIndex,
      }"
      :aria-current="index === currentIndex ? 'step' : undefined"
    >
      <span class="step-number" aria-hidden="true">{{ level.icon }}</span>
      <span class="step-copy">
        <strong>{{ level.title }}</strong>
        <small>
          {{ (completedLevels?.includes(level.id) || index < unlockedIndex) ? 'Անցած փուլ' : index === currentIndex ? 'Ընթացիկ փուլ' : index === unlockedIndex ? 'Հաջորդը բաց է' : 'Փակ է' }}
        </small>
      </span>
      <span v-if="index < gameDifficulties.length - 1" class="step-connector" aria-hidden="true" />
    </li>
  </ol>
</template>

<style scoped>
.difficulty-progress { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 18px 0 22px; }
.difficulty-step { position: relative; display: flex; align-items: center; gap: 10px; min-width: 0; padding: 12px; border: 1px solid #94a3b833; border-radius: 13px; background: #101e32; color: #aebbd0; }
.step-number { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border: 1px solid currentColor; border-radius: 50%; font-size: 18px; line-height: 1; }
.step-copy { display: grid; min-width: 0; gap: 2px; }
.step-copy strong { color: #e5edf7; font-size: 13px; }
.step-copy small { font-size: 10px; }
.difficulty-step.is-current { border-color: #dfc38f99; background: #dfc38f12; color: #dfc38f; }
.difficulty-step.is-current .step-copy strong { color: #f3dba9; }
.difficulty-step.is-complete { background: #86c6a20a; border-color: #86c6a266; color: #86c6a2; }
.difficulty-step.is-complete .step-copy strong { color: #b7e0c6; }
.difficulty-step.is-locked { opacity: .52; }
@media (max-width: 560px) {
  .difficulty-progress { gap: 6px; }
  .difficulty-step { align-items: flex-start; flex-direction: column; gap: 7px; padding: 10px 8px; }
  .step-copy strong { font-size: 12px; }
  .step-copy small { font-size: 9px; }
}
</style>
