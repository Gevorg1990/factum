import { countryPopulations, type PopulationEstimate } from '~/data/countryPopulation'

export function usePopulationEstimates() {
  const estimates = useState<Record<string, PopulationEstimate | undefined>>('country-population-estimates', () => ({...countryPopulations}))
  const status = useState<'idle' | 'loading' | 'ready' | 'error'>('country-population-status', () => 'idle')
  async function refresh() {
    if (status.value === 'loading' || status.value === 'ready') return
    status.value = 'loading'
    try {
      const response = await $fetch<{ estimates:Record<string, PopulationEstimate> }>('/api/population', { retry:0, timeout:25000 })
      const merged = {...estimates.value}
      for (const [code, estimate] of Object.entries(response.estimates)) {
        if (Number.isFinite(estimate.value) && estimate.value >= 0 && Number.isInteger(estimate.year)
          && estimate.year >= (merged[code]?.year ?? 0)) merged[code] = estimate
      }
      estimates.value = merged
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }
  onMounted(refresh)
  return { estimates, status }
}
