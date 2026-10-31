export type CountryProperties = {
  ADM0_A3: string
  ISO_A2: string
  NAME: string
  CONTINENT: string
  POP_EST: number
  POP_YEAR: number
}
export type CountryFeature = {
  type: 'Feature'
  properties: CountryProperties
  geometry: { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] }
}
export type CountryDetails = {
  cca3: string
  cca2: string
  capital: string[]
  area: number
  flag: string
  latlng: [number, number]
  languages: Record<string, string>
}
export interface GlobeProjection {
  (point: [number, number]): [number, number] | null
  rotate(): [number, number, number]
  rotate(rotation: [number, number, number]): GlobeProjection
  scale(value: number): GlobeProjection
  translate(value: [number, number]): GlobeProjection
  clipAngle(value: number): GlobeProjection
  precision(value: number): GlobeProjection
}
export type GlobeObject = CountryFeature | { type: 'Sphere' } | { type: 'MultiLineString'; coordinates: number[][][] }
export type GlobeApi = {
  geoOrthographic(): GlobeProjection
  geoPath(projection: GlobeProjection): (object: GlobeObject) => string | null
  geoGraticule10(): GlobeObject
  geoArea(object: CountryFeature): number
}

// D3 uses clockwise exterior rings; GeoJSON providers may use the opposite order.
export function orientCountry(feature: CountryFeature, area: (feature: CountryFeature) => number): CountryFeature {
  if (area(feature) <= 2 * Math.PI) return feature
  const geometry = feature.geometry
  return {
    ...feature,
    geometry: geometry.type === 'Polygon'
      ? { type: 'Polygon', coordinates: geometry.coordinates.map(ring => [...ring].reverse()) }
      : { type: 'MultiPolygon', coordinates: geometry.coordinates.map(polygon => polygon.map(ring => [...ring].reverse())) },
  }
}

export function rotateGlobe(start: [number, number, number], dx: number, dy: number, scale: number): [number, number, number] {
  const degrees = 180 / (Math.PI * scale)
  return [start[0] + dx * degrees, Math.max(-85, Math.min(85, start[1] - dy * degrees)), 0]
}
