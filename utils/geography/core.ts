import type { AtlasCountry, CountryStatistics, Coordinates } from './types'
export function normalizeGeoSearch(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('hy-AM').replace(/և/g,'եւ').replace(/եվ/g,'եւ').replace(/[\u0300-\u036f\u055a-\u055f\u0589\u058a]/g,'').replace(/\s+/g,' ').trim()
}
export function density(stats: CountryStatistics | undefined, _area: number) {
  return stats?.density != null && Number.isFinite(stats.density) && stats.density >= 0 ? stats.density : undefined
}
export function validCoordinates(value: unknown): value is Coordinates {
  return Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)&&Math.abs(value[0])<=180&&Math.abs(value[1])<=90
}
export function shuffled<T>(input: readonly T[], random = Math.random): T[] {
  const result=[...input]
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j]!,result[i]!]}
  return result
}
export const regions: Record<string,string> = {Africa:'Աֆրիկա',Americas:'Ամերիկա',Asia:'Ասիա',Europe:'Եվրոպա',Oceania:'Օվկիանիա',Antarctic:'Անտարկտիկա'}
export function countryLabel(country:AtlasCountry){return country.nameHy || 'Տվյալը հասանելի չէ'}
export function populationColor(value:number|undefined){
  if(value==null||!Number.isFinite(value)||value<0)return '#36445a'
  return value<1e6?'#83c8b4':value<1e7?'#4d9d98':value<5e7?'#b6ac69':value<2e8?'#d58b51':'#b84d57'
}
