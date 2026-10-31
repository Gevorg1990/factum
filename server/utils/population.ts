import type { PopulationEstimate } from '../../data/countryPopulation'

export function parseLatestPopulation(response: unknown): Record<string, PopulationEstimate> {
  if (!Array.isArray(response) || response.length !== 2 || !Array.isArray(response[1]) || Number(response[0]?.pages) !== 1) throw new Error('Incomplete population response')
  const estimates: Record<string, PopulationEstimate> = {}
  for (const row of response[1]) {
    if (!row || typeof row.countryiso3code !== 'string' || !/^[A-Z]{3}$/.test(row.countryiso3code)
      || typeof row.date !== 'string' || !/^\d{4}$/.test(row.date)
      || typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0) continue
    const code = row.countryiso3code
    const year = Number(row.date)
    if (year < 1900 || year > new Date().getUTCFullYear() || (estimates[code]?.year ?? 0) > year) continue
    estimates[code] = {
      value: Math.round(row.value), year,
      source: { name:'Համաշխարհային բանկ', url:`https://data.worldbank.org/indicator/SP.POP.TOTL?locations=${/^[A-Z]{2}$/.test(row.country?.id) ? row.country.id : code}` },
    }
  }
  if (!Object.keys(estimates).length) throw new Error('Population estimates not found')
  return estimates
}
