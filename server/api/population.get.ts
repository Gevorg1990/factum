import type { PopulationEstimate } from '../../data/countryPopulation'
import { parseLatestPopulation } from '../utils/population'

type PopulationResponse = { estimates: Record<string, PopulationEstimate> }

const loadLatestPopulation = defineCachedFunction(async (): Promise<PopulationResponse> => {
  const response: unknown = await $fetch<unknown>('https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL', {
    query:{ format:'json', per_page:400, mrnev:1, source:2 }, timeout:10000, retry:1,
  })
  return { estimates:parseLatestPopulation(response) }
}, { name:'latest-country-population-v1', maxAge:86400, swr:true })

export default defineEventHandler(async (): Promise<PopulationResponse> => {
  try {
    return await loadLatestPopulation()
  } catch (error) {
    console.error('[population] Latest estimates unavailable', error)
    throw createError({ statusCode:502, statusMessage:'Population estimates temporarily unavailable' })
  }
})
