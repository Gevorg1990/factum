<script setup lang="ts">
import { optimizedImage } from '~/data/optimizedImages'
import { gameResultPath, parseGameResult, parseResultLevel, resultLevels } from '~/utils/gameResult'

const route = useRoute()
const result = computed(() => parseGameResult(String(route.params.mode), String(route.params.score)))
if (!result.value) throw createError({ statusCode: 404, statusMessage: 'Result not found' })
const level = computed(() => ['genius', 'logic'].includes(result.value?.mode || '') ? parseResultLevel(route.query.level) : null)
const levelTitle = computed(() => level.value ? `${resultLevels[level.value]} մակարդակ` : '')
const origin = useRequestURL().origin
const title = computed(() => `${result.value!.title}${levelTitle.value ? ` · ${levelTitle.value}` : ''}․ իմ արդյունքը՝ ${result.value!.score} / ${result.value!.total}`)
const description = 'Փորձիր քո գիտելիքները FACTUM-ում։ Խաղա և կիսվիր քո արդյունքով։'
const url = computed(() => new URL(gameResultPath(result.value!.mode, result.value!.score, level.value), origin).href)
const image = computed(() => new URL(optimizedImage(result.value!.image), origin).href)
useSeoMeta({
  title: () => title.value,
  description,
  ogTitle: () => title.value,
  ogDescription: description,
  ogType: 'website',
  ogSiteName: 'FACTUM',
  ogUrl: () => url.value,
  ogImage: () => image.value,
  ogImageAlt: () => result.value!.title,
  robots: 'noindex, follow',
})
useHead(() => ({ link: [{ rel: 'canonical', href: url.value }] }))
</script>

<template>
  <main v-if="result" class="shell result-page">
    <section class="panel p-7 text-center">
      <div class="text-5xl mb-4" aria-hidden="true">🏆</div>
      <h1 class="heading">{{ result.title }}</h1>
      <p v-if="levelTitle" class="gold mt-4 font-semibold">{{ levelTitle }}</p>
      <p class="muted mt-4">Խաղի արդյունքը</p>
      <p class="gold text-3xl font-bold my-5">{{ result.score }} / {{ result.total }}</p>
      <p class="muted">{{ description }}</p>
      <NuxtLink :to="result.playPath" class="btn mt-6">Խաղալ →</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.result-page { max-width: 750px; padding-top: 40px; padding-bottom: 40px; }
</style>
