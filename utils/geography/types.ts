import type { CountryDetails } from '../globe'
export type Coordinates = [longitude: number, latitude: number]
export type MapLocation = { coordinates: Coordinates; label: string; requestId?: number }
export type AtlasCountry = CountryDetails & {
  nameHy: string; nameEn: string; region: string; subregion: string; independent: boolean | null; timezones?: string[]
  currencies: Record<string, { name: string; symbol?: string }>; borders: string[]; landlocked: boolean
}
export type CountryStatistics = { population?: number; density?: number; gdp?: number; gdpPerCapita?: number }
export type StatisticsSnapshot = { year: number; retrieved: string; source: { name: string; url: string }; countries: Record<string, CountryStatistics> }
export type GeoSource = { name: string; url: string }
export type GeoFact = { id: string; title: string; detail: string; category: string; coordinates?: Coordinates; countryCode?: string; source: GeoSource; dataYear?: number }
export type WorldRecord = GeoFact & { measure: string; location: string; kind: 'mountain' | 'water' | 'land' | 'nature' | 'country' }
export type CountryStory = { history: string; culture: string; nature: string; places: string[]; source: GeoSource }
