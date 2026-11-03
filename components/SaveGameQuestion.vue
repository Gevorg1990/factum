<script setup lang="ts">
import { Bookmark, Check } from 'lucide-vue-next'
import { gameBookmarkId, type SavedGameQuestion } from '~/utils/gameBookmarks'

const props = defineProps<{
  game: SavedGameQuestion['game']
  disabled?: boolean
  question: string
}>()

const { saved, toggleSaved } = useProgress()
const bookmarkId = computed(() => gameBookmarkId(props.game, props.question))
const isSaved = computed(() => saved.value.includes(bookmarkId.value))
</script>

<template>
  <div class="game-question-bookmark">
    <button type="button" class="btn-secondary" :disabled="disabled" :aria-pressed="isSaved" :class="{ 'is-saved': isSaved }" @click="!disabled && toggleSaved(bookmarkId, $event)">
      <Check v-if="isSaved" :size="16" />
      <Bookmark v-else :size="16" />
      {{ isSaved ? 'Պահպանված է Իմ FACTUM-ում' : 'Պահպանել Իմ FACTUM-ում' }}
    </button>
    <p>{{ disabled ? 'Պատասխանիր հարցին՝ պահպանելու համար։' : 'Հարցը պահպանվում է ճիշտ պատասխանով և բացատրությամբ։' }}</p>
  </div>
</template>

<style scoped>
.game-question-bookmark { margin: 0; }
.game-question-bookmark button { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
.game-question-bookmark button:disabled { opacity: .45; cursor: not-allowed; }
.game-question-bookmark p { margin-top: 9px; font-size: 10px; line-height: 1.8; opacity: .75; }
.game-question-bookmark button.is-saved { background: #dfc38f16; }
</style>
