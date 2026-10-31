export type PopulationEstimate = {
  value: number
  year: number
  source: { name: string; url: string }
}

// Reviewed baseline estimates. The live dataset supplements these without
// replacing newer observations with older ones.
export const countryPopulations: Readonly<Record<string, PopulationEstimate | undefined>> = {
  IND: {
    value: 1_463_900_000,
    year: 2025,
    source: { name: 'ՄԱԿ-ի Բնակչության հիմնադրամ', url: 'https://www.unfpa.org/data/world-population/IN' },
  },
}

export function countryPopulation(code: string, fallbackValue: number, fallbackYear: number, latest: Readonly<Record<string, PopulationEstimate | undefined>> = {}): PopulationEstimate {
  const fallback = {
    value: fallbackValue,
    year: fallbackYear,
    source: { name: 'Natural Earth', url: 'https://www.naturalearthdata.com/' },
  }
  return [countryPopulations[code], latest[code]].reduce<PopulationEstimate>((best, candidate) =>
    candidate && candidate.year >= best.year ? candidate : best, fallback)
}
