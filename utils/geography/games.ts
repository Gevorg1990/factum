import type {PopulationEstimate} from '../../data/countryPopulation'
import {geographyCountryQuestions} from '../../data/geography/gameQuestions'
import type {GeographyGame} from '../../data/geography/gameQuestions'
import type {AtlasCountry,StatisticsSnapshot} from './types'
import {shuffled,regions} from './core'
export type GeographyQuestion={id:string;prompt:string;answer:string;options:string[];explanation:string;flag?:string;countryCode?:string}
export function makeGeographyQuestions(mode:GeographyGame,countries:AtlasCountry[],stats:StatisticsSnapshot|null,random=Math.random,latest:Readonly<Record<string,PopulationEstimate|undefined>>={}):GeographyQuestion[]{
 const count=mode==='guess'?15:8
 const available=geographyCountryQuestions.filter(q=>countries.some(c=>c.cca3===q.countryCode))
 const pool=available
 const byCode=new Map(countries.map(c=>[c.cca3,c]))
 if(mode==='larger'){
  const questions:GeographyQuestion[]=[]
  for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)for(const metric of ['area','population'] as const){
   const a=pool[i]!,b=pool[j]!,ca=byCode.get(a.countryCode)!,cb=byCode.get(b.countryCode)!
   const latestA=latest[ca.cca3],latestB=latest[cb.cca3]
   const newer=!!(latestA&&latestA.year>=(stats?.year??0)||latestB&&latestB.year>=(stats?.year??0))
   if(metric==='population'&&newer&&(!latestA||!latestB||latestA.year!==latestB.year))continue
   const year=newer?latestA?.year:stats?.year
   const va=metric==='area'?ca.area:newer?latestA?.value:stats?.countries[ca.cca3]?.population,vb=metric==='area'?cb.area:newer?latestB?.value:stats?.countries[cb.cca3]?.population
   if(va==null||vb==null||!Number.isFinite(va)||!Number.isFinite(vb)||va<=0||vb<=0||va===vb)continue
   const fmt=new Intl.NumberFormat('hy-AM',{maximumFractionDigits:0}),unit=metric==='area'?'կմ²':`մարդ՝ ${year} թ․`
   questions.push({id:`${metric}-${ca.cca3}-${cb.cca3}`,prompt:metric==='area'?'Ո՞ր երկրի տարածքն է ավելի մեծ։':`Ո՞ր երկրի բնակչությունն է ավելի մեծ՝ ${year} թ․։`,answer:va>vb?ca.cca3:cb.cca3,options:shuffled([ca.cca3,cb.cca3],random),explanation:`${a.country}՝ ${fmt.format(va)} ${unit}, ${b.country}՝ ${fmt.format(vb)} ${unit}։ Աղբյուր՝ ${metric==='area'?'Countries':newer?latestA!.source.name:'Համաշխարհային բանկ · WDI'}։`})
  }
  return shuffled(questions,random).slice(0,count)
 }
 const sequence=shuffled(pool,random).slice(0,count)
 return sequence.map(p=>{
  const c=byCode.get(p.countryCode)!,flag=mode==='guess'
  return {id:`${mode}-${p.countryCode}`,prompt:mode==='map'?`Գտիր ${p.country} երկիրը։`:flag?'Ո՞ր երկրի դրոշն է սա։':`Ո՞ր երկրի մայրաքաղաքն է ${p.capital} քաղաքը։`,answer:p.countryCode,countryCode:p.countryCode,flag:flag?c.cca2:undefined,options:mode==='map'?[]:shuffled([p.countryCode,...shuffled(pool.filter(q=>q.countryCode!==p.countryCode),random).slice(0,3).map(q=>q.countryCode)],random),explanation:`${p.country} երկրի մայրաքաղաքը ${p.capital} քաղաքն է։ Այն գտնվում է ${regions[c.region]} աշխարհամասում։ Աղբյուր՝ Countries։`}
 })
}
