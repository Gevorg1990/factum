<script setup lang="ts">
import { Bookmark, Check } from 'lucide-vue-next'
import { gameBookmarkId, type SavedGameQuestion } from '~/utils/gameBookmarks'

const props = defineProps<{
  game: SavedGameQuestion['game']
  question: string
}>()

const { saved, toggleSaved } = useProgress()
const bookmarkId = computed(() => gameBookmarkId(props.game, props.question))
const isSaved = computed(() => saved.value.includes(bookmarkId.value))
</script>

<template>
  <div class="game-question-bookmark">
    <button type="button" class="btn-secondary" :aria-pressed="isSaved" :class="{ 'is-saved': isSaved }" @click="toggleSaved(bookmarkId, $event)">
      <Check v-if="isSaved" :size="16" />
      <Bookmark v-else :size="16" />
      {{ isSaved ? 'Պահպանված է Իմ FACTUM-ում' : 'Պահպանել Իմ FACTUM-ում' }}
    </button>
  </div>
</template>

<style scoped>
.game-question-bookmark { margin: 0; }
.game-question-bookmark button { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
.game-question-bookmark button.is-saved { background: #dfc38f16; }
</style>
