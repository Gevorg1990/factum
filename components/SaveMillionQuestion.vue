<script setup lang="ts">
import { Bookmark, Check } from 'lucide-vue-next'
import type { MillionaireQuestion as MillionQuestion } from '~/data/factum_millionaire_45'
import { millionBookmarkId } from '~/utils/millionBookmarks'
const props = defineProps<{ question: MillionQuestion; disabled?: boolean }>()
const { saved, toggleSaved } = useProgress()
const bookmarkId = computed(() => millionBookmarkId(props.question))
const isSaved = computed(() => saved.value.includes(bookmarkId.value))
</script>

<template>
  <div class="million-bookmark">
    <button type="button" class="btn-secondary" :disabled="disabled" :class="{'is-saved':isSaved}" :aria-pressed="isSaved" @click="!disabled && toggleSaved(bookmarkId, $event)"><Check v-if="isSaved" :size="16" /><Bookmark v-else :size="16" />{{ isSaved ? 'Պահպանված է Իմ COGNITIO-ում' : 'Պահպանել հարցը Իմ COGNITIO-ում' }}</button>
    <p>{{ disabled ? 'Պատասխանիր հարցին՝ պահպանելու համար։' : 'Հարցը պահպանվում է ճիշտ պատասխանով և բացատրությամբ։' }}</p>
  </div>
</template>
<style scoped>
.million-bookmark { margin-top: 18px; text-align: left; }
.million-bookmark button { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
.million-bookmark button:disabled { opacity: .45; cursor: not-allowed; }
.million-bookmark button.is-saved { background: #dfc38f16; }
.million-bookmark p { margin-top: 9px; font-size: 10px; line-height: 1.8; opacity: .75; }
</style>
