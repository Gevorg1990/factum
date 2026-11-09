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
export interface GlobePath {
  (object: GlobeObject): string | null
  digits(value: number): GlobePath
}
export type GlobeApi = {
  geoOrthographic(): GlobeProjection
  geoPath(projection: GlobeProjection): GlobePath
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

// Cache a lighter outline for motion. Keep every island, hole and closed ring.
export function simplifyGlobeFeature(feature: CountryFeature): CountryFeature {
  const simplifyRing = (ring: number[][]): number[][] => {
    if (ring.length <= 4) return ring
    const simplified = [ring[0]!]
    const minimumDistanceSquared = 0.16 ** 2
    for (let index = 1; index < ring.length - 1; index++) {
      const point = ring[index]!
      const previous = simplified[simplified.length - 1]!
      const distanceSquared = (point[0]! - previous[0]!) ** 2 + (point[1]! - previous[1]!) ** 2
      if (distanceSquared >= minimumDistanceSquared) simplified.push(point)
    }
    simplified.push(ring[ring.length - 1]!)
    if (simplified.length >= 4) return simplified

    // Tiny islands still need an outline, but not every original coastline vertex.
    const first = ring[0]!
    let farthestIndex = 1
    let largestDistance = 0
    for (let index = 1; index < ring.length - 1; index++) {
      const point = ring[index]!
      const distance = (point[0]! - first[0]!) ** 2 + (point[1]! - first[1]!) ** 2
      if (distance > largestDistance) {
        largestDistance = distance
        farthestIndex = index
      }
    }
    const farthest = ring[farthestIndex]!
    let thirdIndex = 1
    let largestArea = 0
    for (let index = 1; index < ring.length - 1; index++) {
      const point = ring[index]!
      const area = Math.abs((farthest[0]! - first[0]!) * (point[1]! - first[1]!) - (farthest[1]! - first[1]!) * (point[0]! - first[0]!))
      if (area > largestArea) {
        largestArea = area
        thirdIndex = index
      }
    }
    if (!largestArea) return ring
    const indices = [0, farthestIndex, thirdIndex].sort((left, right) => left - right)
    return [...indices.map(index => ring[index]!), ring[ring.length - 1]!]

  }
  const geometry = feature.geometry
  return {
    ...feature,
    geometry: geometry.type === 'Polygon'
      ? { type: 'Polygon', coordinates: geometry.coordinates.map(simplifyRing) }
      : { type: 'MultiPolygon', coordinates: geometry.coordinates.map(polygon => polygon.map(simplifyRing)) },
  }
}

export function rotateGlobe(start: [number, number, number], dx: number, dy: number, scale: number): [number, number, number] {
  const degrees = 180 / (Math.PI * scale)
  return [start[0] + dx * degrees, Math.max(-85, Math.min(85, start[1] - dy * degrees)), 0]
}
