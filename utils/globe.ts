export type CountryProperties = {
  POINT?: [number, number]
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
  invert(point: [number, number]): [number, number] | null
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
export function orientCountry<T extends CountryFeature>(feature: T, area: (feature: CountryFeature) => number): T {
  const orientPolygon = (coordinates: number[][][]): number[][][] => {
    const polygon: CountryFeature = { ...feature, geometry: { type: 'Polygon', coordinates } }
    return area(polygon) > 2 * Math.PI ? coordinates.map(ring => [...ring].reverse()) : coordinates
  }
  const geometry = feature.geometry
  return {
    ...feature,
    geometry: geometry.type === 'Polygon'
      ? { type: 'Polygon', coordinates: orientPolygon(geometry.coordinates) }
      : { type: 'MultiPolygon', coordinates: geometry.coordinates.map(orientPolygon) },
  }
}

export function rotateGlobe(start: [number, number, number], dx: number, dy: number, scale: number): [number, number, number] {
  const degrees = 180 / (Math.PI * scale)
  return [start[0] + dx * degrees, Math.max(-85, Math.min(85, start[1] - dy * degrees)), 0]
}
