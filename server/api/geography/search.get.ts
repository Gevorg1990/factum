import { parsePlaceResults } from '../../../utils/geography/placeSearch'

// This endpoint is invoked after a typing debounce; never fetch an unfiltered place catalog.
// A bounded cache and shared pending requests keep repeated lookups off the provider.
const cache = new Map<string, { expires: number; items: ReturnType<typeof parsePlaceResults> }>()
const pending = new Map<string, Promise<ReturnType<typeof parsePlaceResults>>>()
let lastRequest = 0
export default defineEventHandler(async event => {
  const raw = getQuery(event).q
  const query = typeof raw === 'string' ? raw.normalize('NFKC').replace(/\s+/g,' ').trim() : ''
  if (query.length < 2 || query.length > 160) throw createError({ statusCode: 400, statusMessage: 'Search must contain 2–160 characters' })
  const provider = String(useRuntimeConfig(event).geographySearchUrl).replace(/\/$/,'')
  const key = provider + ':' + query.toLocaleLowerCase('hy-AM')
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return { items: cached.items }
  if (pending.has(key)) return { items: await pending.get(key)! }
  if (Date.now() - lastRequest < 1000 || pending.size >= 2) throw createError({ statusCode: 429, statusMessage: 'Please retry shortly' })
  lastRequest = Date.now()
  const request = (async () => {
    const data = await $fetch<unknown>(provider + '/api/', { query: { q: query, limit: 6, osm_tag: ['place:country','place:island','place:islet','place:archipelago','natural:rock','natural:reef'] }, headers: { 'User-Agent': 'FACTUM-Geography/1.0', 'Accept-Language': 'hy,en;q=0.8' }, timeout: 8000, retry: 0 })
    const items = parsePlaceResults(data)
    if (cache.size >= 500) cache.delete(cache.keys().next().value!)
    cache.set(key, { items, expires: Date.now() + (items.length ? 86400000 : 300000) })
    return items
  })()
  pending.set(key, request)
  try { return { items: await request } }
  catch { throw createError({ statusCode: 502, statusMessage: 'World search is temporarily unavailable' }) }
  finally { pending.delete(key) }
})
