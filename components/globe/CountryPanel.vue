<script setup lang="ts">
import type { AtlasCountry, StatisticsSnapshot } from '~/utils/geography/types'
import { capitalName } from '~/data/geography/labels'
import { density, regions } from '~/utils/geography/core'
const props=defineProps<{country:AtlasCountry;countries:AtlasCountry[];statistics:StatisticsSnapshot|null;population?:{value:number;year:number;source:{name:string;url:string}}}>()
const emit=defineEmits<{select:[code:string]}>()
const stats=computed(()=>props.statistics?.countries[props.country.cca3])
const officialDensity=computed(()=>props.population?.year===props.statistics?.year?density(stats.value,props.country.area):undefined)
const populationDensity=computed(()=>officialDensity.value??(props.population&&Number.isFinite(props.population.value)&&props.population.value>=0&&Number.isFinite(props.country.area)&&props.country.area>0?props.population.value/props.country.area:undefined))
const densityCalculated=computed(()=>populationDensity.value!=null&&officialDensity.value==null)
const nf=new Intl.NumberFormat('hy-AM',{maximumFractionDigits:1})
const languages=new Intl.DisplayNames(['hy'],{type:'language'}),currencies=new Intl.DisplayNames(['hy'],{type:'currency'})
const missing='Տվյալը հասանելի չէ'
const languageNames=computed(()=>Object.keys(props.country.languages||{}).map(code=>{try{const name=languages.of(code);return name===code?missing:name}catch{return missing}}).join(', '))
const money=computed(()=>Object.keys(props.country.currencies||{}).map(code=>`${currencies.of(code)} (${code})`).join(', '))
const zones=computed(()=>(props.country.timezones||[]).map(zone=>{try{return new Intl.DateTimeFormat('hy-AM',{timeZone:zone,timeZoneName:'longOffset'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName')?.value}catch{return undefined}}).filter((v,i,a)=>v&&a.indexOf(v)===i).join(', '))
</script>
<template>
<div class="atlas-country">
  <div class="country-title"><CountryFlag :code="country.cca2"/><div><h2 :title="country.nameHy">{{country.nameHy}}</h2></div></div>
  <dl>
    <div><dt>Մայրաքաղաք՝ ըստ բազայի</dt><dd>{{capitalName(country.cca3,country.capital)}}</dd></div>
    <div><dt>Աշխարհամաս</dt><dd>{{regions[country.region]||missing}}</dd></div>
    <div><dt>Տարածք</dt><dd>{{country.area>0?`${nf.format(country.area)} կմ²`:missing}}</dd></div>
    <div><dt>Բնակչություն <small v-if="population">{{population.year}} թ․</small></dt><dd>{{population && Number.isFinite(population.value) && population.value>=0?nf.format(Math.round(population.value)):missing}}</dd></div>
    <div><dt>Բնակչության խտություն <small v-if="populationDensity!=null && population">{{population.year}} թ․</small></dt><dd>{{populationDensity!=null?`${nf.format(populationDensity)} մարդ/կմ²`:missing}}<small v-if="densityCalculated" class="density-note">Հաշվարկված՝ բնակչություն / ընդհանուր տարածք</small></dd></div>
    <div><dt>Լեզուներ՝ ըստ աղբյուրի</dt><dd>{{languageNames||missing}}</dd></div>
    <div><dt>Արժույթ</dt><dd>{{money||missing}}</dd></div>
    <div><dt>Ժամային շեղումներ՝ այսօր</dt><dd>{{zones||missing}}</dd></div>
    <div><dt>Աշխարհագրական դիրք</dt><dd>{{country.landlocked?'Ծովային ելք չունեցող երկիր':'Ծովային ափ ունեցող տարածք'}}</dd></div>
  </dl>
  <h3>Սահմանակից երկրներ</h3>
  <div class="border-countries"><button v-for="code in country.borders" :key="code" type="button" @click="emit('select',code)">{{countries.find(c=>c.cca3===code)?.nameHy||missing}}</button><p v-if="!country.borders.length">Ըստ աղբյուրի՝ ցամաքային սահմանակից երկիր չկա։</p></div>
  <footer class="country-sources"><a href="https://github.com/mledoze/countries" target="_blank" rel="noopener noreferrer">Countries · հիմնական տվյալներ ↗</a><a v-if="population" :href="population.source.url" target="_blank" rel="noopener noreferrer">Բնակչության աղբյուր · {{population.year}} ↗</a><a v-if="!densityCalculated && populationDensity!=null && statistics" href="https://data.worldbank.org/indicator/EN.POP.DNST" target="_blank" rel="noopener noreferrer">Խտություն · ցամաքային տարածքով · Համաշխարհային բանկ, {{statistics.year}} թ․ ↗</a><a v-if="densityCalculated" href="https://github.com/mledoze/countries" target="_blank" rel="noopener noreferrer">Խտության հաշվարկ · տվյալ տարվա բնակչություն / ընդհանուր տարածք ↗</a><a href="https://www.iana.org/time-zones" target="_blank" rel="noopener noreferrer">IANA · ժամային գոտիներ ↗</a></footer>
</div>
</template>
<style scoped>
.atlas-country{min-width:0;max-width:100%}.density-note{display:block;margin-top:6px;font-size:10px;color:#a9bbd4}.country-title{display:flex;align-items:center;gap:14px;margin-bottom:20px}.country-title :deep(img){width:46px;height:32px}.country-title>div{flex:1;min-width:0}.country-title :deep(.country-flag){flex-shrink:0}.country-title h2{min-width:0;font-size:24px;font-weight:800;margin:0;white-space:normal;overflow-wrap:anywhere;line-height:1.4}dl>div{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid #8997c022}dt{font-size:11px;color:#a9bbd4}dt small{display:block}dd{font-size:12px;overflow-wrap:anywhere;max-width:100%}p{font-size:12px;line-height:1.95;color:#c1cfe1}h3{font-size:14px;color:#dfc38f;margin:15px 0 10px}.border-countries{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}.border-countries button{padding:8px 10px;min-height:40px;border-radius:8px;background:#dfc38f10;font-size:11px;color:#dfc38f}.country-sources{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid #8997c022}.country-sources a{font-size:10px;color:#dfc38f;text-decoration:underline}button:focus-visible,a:focus-visible{outline:2px solid #dfc38f;outline-offset:3px}
@media(max-width:600px){.country-title{gap:8px}.country-title>div{gap:8px}.country-title :deep(img){width:32px;height:23px}.country-title h2{font-size:18px}}
</style>
