import { collectionSubjects, people, subjects } from './data/content'

const prerenderedContentRoutes = [
  '/subjects',
  ...subjects.map(({ slug }) => `/subjects/${slug}`),
  ...collectionSubjects.map(({ slug }) => `/subjects/${slug}`),
  '/people',
  ...people.map(({ id }) => `/people/${id}`),
  '/facts',
  '/history',
  '/about',
  '/library',
  '/more',
  '/support',
  '/videos',
]

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vercel/speed-insights/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    vercel: { functions: { maxDuration: 60 } },
    prerender: { crawlLinks: false, routes: prerenderedContentRoutes },
  },
  routeRules: {
    '/games/results/**': { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } },
    '/': { prerender: true },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/optimized/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/videos/previews/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },
  app: { head: { link: [
    { rel: 'preload', href: '/fonts/noto-sans-armenian-armenian-v47.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    { rel: 'preload', href: '/fonts/noto-sans-armenian-latin-v47.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  ], title: 'FACTUM — Գիտելիքի աշխարհ', meta: [{ name: 'description', content: 'Հայկական կրթական հարթակ՝ հանրագիտարան, խաղեր և պատմություն' }] } },
  runtimeConfig: { azureSpeechKey: '', azureSpeechRegion: '', directusToken: process.env.DIRECTUS_SERVER_TOKEN || '', openaiApiKey: '', public: { directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL || '' } }
})
