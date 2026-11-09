<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const configuredUrl = String(config.public.siteUrl || '').trim()
const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(requestUrl.hostname)
const publicOrigin = configuredUrl || (isLocalHost ? '' : requestUrl.origin)
const socialImage = publicOrigin ? new URL('/images/social/factum-og.png', publicOrigin).href : '/images/social/factum-og.png'

useSeoMeta({
  ogType: 'website',
  ogSiteName: 'FACTUM',
  ogLocale: 'hy_AM',
  ogImage: socialImage,
  ogImageAlt: 'FACTUM — Գիտելիքի աշխարհ',
  twitterCard: 'summary_large_image',
})
useHead(() => ({
  htmlAttrs: { lang: 'hy' },
  meta: [
    ...(publicOrigin ? [{ property: 'og:url', content: new URL(route.path, publicOrigin).href }] : []),
  ],
  link: publicOrigin ? [{ rel: 'canonical', href: new URL(route.path, publicOrigin).href }] : [],
}))
</script>

<template><div class="min-h-screen factum-app"><ShootingStars/><SiteHeader/><NuxtPage/><footer class="border-t border-slate-800/70 mt-16 py-9 text-center muted text-sm">FACTUM · Գիտելիքը բոլորի համար · Զարգացման տարբերակ</footer></div></template>
