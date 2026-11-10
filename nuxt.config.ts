export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Production builds must not replace a running dev server's generated aliases.
  $production: { buildDir: '.nuxt-build' },
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    hooks: {
      // Render current source during prerender, rather than serving HTML left by another build preset.
      'prerender:config': (config) => { config.serveStatic = false },
    },
    externals: { traceInclude: ['node_modules/ffmpeg-static/ffmpeg'] },
    vercel: { functions: { maxDuration: 60 } },
    prerender: { crawlLinks: false, routes: [] },
  },
  routeRules: {
    '/**': { prerender: false, headers: { 'cache-control': 'private, no-store' } },
    '/admin': { prerender: false, headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } },
    '/profile': { prerender: false, headers: { 'cache-control': 'private, no-store' } },
    '/login': { prerender: false },
    '/api/admin/**': { headers: { 'cache-control': 'private, no-store' } },
    '/api/account/**': { headers: { 'cache-control': 'private, no-store' } },
    '/api/auth/**': { headers: { 'cache-control': 'private, no-store' } },
    '/data/geography/**': { headers: { 'cache-control': 'public, max-age=86400, s-maxage=604800' } },
    '/vendor/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/geography/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/optimized/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/videos/previews/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },
  app: { head: { link: [
    { rel: 'icon', type: 'image/x-icon', sizes: '16x16 32x32 48x48', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/svg+xml', sizes: 'any', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'preload', href: '/fonts/noto-sans-armenian-armenian-v47.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    { rel: 'preload', href: '/fonts/noto-sans-armenian-latin-v47.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  ], title: 'FACTUM — Գիտելիքի աշխարհ', meta: [{ name: 'theme-color', content: '#081326' }, { name: 'application-name', content: 'FACTUM' }, { name: 'description', content: 'Հայկական կրթական հարթակ՝ հանրագիտարան, խաղեր և պատմություն' }] } },
  runtimeConfig: { geographySearchUrl: 'https://photon.komoot.io', azureSpeechKey: '', azureSpeechRegion: '', directusToken: process.env.DIRECTUS_SERVER_TOKEN || '', openaiApiKey: '', public: { siteUrl: process.env.NUXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''), directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL || '' } }
})
