import type { AtlasCountry, StatisticsSnapshot } from '~/utils/geography/types'
let pending:Promise<void>|undefined
export function useGeographyAtlas(){
  const countries=useState<AtlasCountry[]>('geo-countries',()=>[])
  const statistics=useState<StatisticsSnapshot|null>('geo-statistics',()=>null)
  const status=useState<'idle'|'loading'|'ready'|'error'>('geo-status',()=> 'idle')
  async function load(){
    if(status.value==='ready')return
    if(pending)return pending
    status.value='loading'
    pending=(async()=>{
      const [a,b]=await Promise.allSettled([$fetch<AtlasCountry[]>('/data/geography/countries-v1.json',{timeout:10000,retry:1}),$fetch<StatisticsSnapshot>('/data/geography/statistics-2024-v1.json',{timeout:10000,retry:1})])
      if(a.status==='fulfilled'&&Array.isArray(a.value))countries.value=a.value
      if(b.status==='fulfilled'&&b.value.year===2024)statistics.value=b.value
      status.value=countries.value.length?'ready':'error'
    })().finally(()=>{pending=undefined})
    return pending
  }
  onMounted(load)
  return {countries,statistics,status,load}
}
