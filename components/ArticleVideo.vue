<script setup lang="ts">
import { Play } from 'lucide-vue-next'
import { articleVideoSource } from '~/shared/articleVideo'
const props = defineProps<{ src: string; title?: string; poster?: string }>()
const active = ref(false)
const failed = ref(false)
const source = computed(() => articleVideoSource(props.src))
watch(() => props.src, () => { active.value = false; failed.value = false })
</script>

<template>
  <section v-if="source" class="article-video" aria-label="Հարցի վիդեոն">
    <button v-if="!active" type="button" class="article-video-start" @click="active = true">
      <img v-if="poster" :src="poster" alt="" loading="lazy" decoding="async">
      <span><Play :size="28" aria-hidden="true" /> Դիտել վիդեոն</span>
    </button>
    <iframe v-else-if="source.kind === 'embed'" :src="source.src" :title="title || 'Հարցի վիդեոն'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" />
    <video v-else :src="source.src" :poster="poster" :aria-label="title || 'Հարցի վիդեոն'" controls autoplay playsinline preload="none" @error="failed = true" />
    <p v-if="failed" role="alert">Վիդեոն չհաջողվեց բացել։ <a :href="src" target="_blank" rel="noopener noreferrer">Դիտել սկզբնաղբյուրում ↗</a></p>
  </section>
</template>

<style scoped>
.article-video { margin-block: 24px; border: 1px solid #8997c044; border-radius: 14px; overflow: hidden; background: #071426; }
.article-video-start { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 16 / 9; min-height: 160px; color: #f4d493; background: radial-gradient(ellipse at top, #243e5c, #071426); }
.article-video-start img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: .65; }
.article-video-start span { position: relative; display: flex; align-items: center; gap: 12px; padding: 16px 22px; border-radius: 999px; background: #071426dd; font-weight: 700; }
.article-video-start:focus-visible { outline: 3px solid #f4d493; outline-offset: -4px; }
.article-video :is(video,iframe) { display: block; width: 100%; aspect-ratio: 16 / 9; max-height: 75vh; border: 0; background: #000; }
.article-video p { padding: 16px; line-height: 1.8; color: #eab3a9; }
.article-video a { text-decoration: underline; }
</style>
