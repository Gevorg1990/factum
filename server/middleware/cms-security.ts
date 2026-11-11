export default defineEventHandler(event => {
  const path = getRequestURL(event).pathname
  if (!/^\/api\/(auth|admin|account)(\/|$)/.test(path)) return
  setHeader(event, 'cache-control', 'private, no-store')
  setHeader(event, 'x-content-type-options', 'nosniff')
  if (['GET', 'HEAD', 'OPTIONS'].includes(event.method)) return
  const origin = getHeader(event, 'origin')
  const expected = process.env.NUXT_PUBLIC_SITE_URL
  const requestOrigin = getRequestURL(event).origin
  if (!origin || (origin !== requestOrigin && origin !== expected)) {
    throw createError({ statusCode: 403, statusMessage: 'Հարցման աղբյուրը չի թույլատրվում' })
  }
  const length = Number(getHeader(event, 'content-length') || 0)
  if (length > (path==='/api/admin/content'?8_000_000:1_000_000)) throw createError({ statusCode: 413, statusMessage: 'Տվյալները չափազանց մեծ են' })
})
