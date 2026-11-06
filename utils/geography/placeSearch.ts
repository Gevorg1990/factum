import { validCoordinates } from './core'
import type { Coordinates } from './types'
export type PlaceSearchResult = { id: string; label: string; context: string; coordinates: Coordinates; url: string }
export function parsePlaceResults(data: unknown): PlaceSearchResult[] {
  const features = (data as { features?: unknown[] } | null)?.features
  if (!Array.isArray(features)) return []
  const items: PlaceSearchResult[] = [], seen = new Set<string>()
  for (const value of features.slice(0, 30)) {
    const f = value as { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> }
    const p = f?.properties, coordinates = f?.geometry?.coordinates
    if (!p || f.geometry?.type !== 'Point' || !validCoordinates(coordinates)) continue
    const text = (key: string) => typeof p[key] === 'string' ? (p[key] as string).trim().slice(0, 240) : ''
    const category = `${text('osm_key')}:${text('osm_value')}`
    if (!['place:country','place:island','place:islet','place:archipelago','natural:rock','natural:reef'].includes(category)) continue
    const label = text('name')
    const kind = ({ N: 'node', W: 'way', R: 'relation' } as Record<string,string>)[text('osm_type')]
    if (!label || !kind || !/^\d+$/.test(String(p.osm_id))) continue
    const id = `${kind}/${p.osm_id}`
    if (seen.has(id) || items.some(item=>item.label===label && Math.hypot((item.coordinates[0]-coordinates[0])*Math.cos(coordinates[1]*Math.PI/180),item.coordinates[1]-coordinates[1])*111<5)) continue
    seen.add(id)
    items.push({ id, label, context: [...new Set([text('city'),text('state'),text('country')].filter(v=>v && v!==label))].join(' · '), coordinates, url: `https://www.openstreetmap.org/${id}` })
    if (items.length === 6) break
  }
  return items
}
