<script setup lang="ts">
import { Facebook } from 'lucide-vue-next'
import { facebookShareUrl, gameResultPath, type ResultLevel, type ShareableGame } from '~/utils/gameResult'

const props = defineProps<{ mode: ShareableGame; score: number; level?: ResultLevel | null }>()
const origin = useRequestURL().origin
const href = computed(() => facebookShareUrl(new URL(gameResultPath(props.mode, props.score, props.level), origin).href))
</script>

<template>
  <div class="game-result-share">
    <a :href="href" target="_blank" rel="noopener noreferrer" class="facebook-share">
      <Facebook :size="19" aria-hidden="true" /> Կիսվել Facebook-ում
    </a>
  </div>
</template>

<style scoped>
.game-result-share { margin-top: 20px; display: flex; justify-content: center; }
.facebook-share { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 18px; border-radius: 12px; background: #1877f2; color: #fff; font-weight: 600; text-align: center; }
.facebook-share:hover { background: #1666ce; }
.facebook-share:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
</style>
