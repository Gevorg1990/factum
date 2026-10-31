export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  app: { head: { title: 'FACTUM — Գիտելիքի աշխարհ', meta: [{ name: 'description', content: 'Հայկական կրթական հարթակ՝ հանրագիտարան, խաղեր և պատմություն' }] } },
  runtimeConfig: { azureSpeechKey: '', azureSpeechRegion: '', directusToken: process.env.DIRECTUS_SERVER_TOKEN || '', openaiApiKey: process.env.OPENAI_API_KEY || '', public: { directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL || '' } }
})