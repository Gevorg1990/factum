<script setup lang="ts">
import { ArrowLeft, Trophy, Check, ArrowRight } from 'lucide-vue-next'
import { findMillionBookmark } from '~/utils/millionBookmarks'
const route = useRoute()
const question = computed(() => findMillionBookmark(String(route.params.id)))
useHead({title: computed(() => `${question.value?.question ?? 'Միլիոնատերի հարց'} — FACTUM`)})
useSavedScroll(() => question.value && route.hash === '#saved-million-question' ? 'saved-million-question' : undefined)
</script>
<template>
  <main class="shell py-10 max-w-3xl saved-million-page">
    <NuxtLink to="/profile" class="gold saved-million-back"><ArrowLeft :size="16" /> Իմ FACTUM-ը</NuxtLink>
    <article v-if="question" id="saved-million-question" class="panel saved-million-card saved-destination" tabindex="-1"><p class="gold saved-million-label"><Trophy :size="18" /> ՄԻԼԻՈՆԱՏԵՐ · ՀԱՐՑ ԵՎ ՊԱՏԱՍԽԱՆ</p><h1 class="heading">{{question.question}}</h1><div class="saved-million-options"><div v-for="(answer,index) in question.answers" :key="index" :class="{'is-correct':index === question.correct}"><span>{{['Ա','Բ','Գ','Դ'][index]}}.</span><strong>{{answer}}</strong><Check v-if="index === question.correct" :size="19" /></div></div><section class="saved-million-explanation"><h2><Check :size="18" /> Ճիշտ պատասխանը՝ {{question.answers[question.correct]}}</h2><p>{{question.explanation}}</p></section><SaveMillionQuestion :question="question" /><NuxtLink to="/games/million" class="gold saved-million-play">Խաղալ նոր խաղ <ArrowRight :size="16" /></NuxtLink></article>
    <div v-else class="panel saved-million-card"><h1 class="heading">Հարցը չի գտնվել</h1><p class="muted">Այս հարցն այլևս հասանելի չէ։ Մյուս պահպանված հարցերը կարող ես գտնել «Իմ FACTUM»-ում։</p></div>
  </main>
</template>
<style scoped>
.saved-million-back { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; font-size: 13px; }.saved-million-card { padding: 30px; }.saved-million-label { display: flex; align-items: center; gap: 9px; font-size: 10px; letter-spacing: 1px; margin-bottom: 22px; }.saved-million-card .heading { font-size: clamp(21px,3vw,28px); line-height: 1.7; }.saved-million-options { display: grid; gap: 12px; }.saved-million-options > div { display: flex; align-items: center; gap: 10px; padding: 16px; border: 1px solid #8997c044; border-radius: 12px; font-size: 13px; }.saved-million-options > div.is-correct { border-color: #86c6a2; background: #86c6a210; }.saved-million-options span { color: #dfc38f; }.saved-million-options strong { flex: 1; font-weight: 600; }.saved-million-options svg { color: #86c6a2; flex-shrink: 0; }.saved-million-explanation { margin-top: 24px; padding-top: 22px; border-top: 1px solid #8997c02b; }.saved-million-explanation h2 { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; line-height: 1.9; }.saved-million-explanation h2 svg { flex-shrink: 0; margin-top: 4px; color: #86c6a2; }.saved-million-explanation p { margin-top: 14px; font-size: 13px; line-height: 2; }.saved-million-play { display: inline-flex; align-items: center; gap: 8px; margin-top: 26px; font-size: 12px; }
@media(max-width:600px) { .saved-million-card { padding: 22px; } }
</style>
