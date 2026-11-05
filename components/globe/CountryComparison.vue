<script setup lang="ts">
import { capitalName } from '~/data/geography/labels'
import { density, regions } from '~/utils/geography/core'
const {countries,statistics,status,load}=useGeographyAtlas()
const left=ref('ARM'),right=ref('GEO')
const sorted=computed(()=>countries.value.filter(c=>c.independent).toSorted((a,b)=>a.nameHy.localeCompare(b.nameHy,'hy')))
const pair=computed(()=>[countries.value.find(c=>c.cca3===left.value),countries.value.find(c=>c.cca3===right.value)])
const nf=new Intl.NumberFormat('hy-AM',{maximumFractionDigits:1})
const metrics=[{id:'area',title:'Տարածք',unit:'կմ²'},{id:'population',title:'Բնակչություն',unit:'մարդ'},{id:'density',title:'Բնակչության խտություն',unit:'մարդ/կմ²'},{id:'gdp',title:'ՀՆԱ · ընթացիկ ԱՄՆ դոլար',unit:'$'},{id:'gdpPerCapita',title:'ՀՆԱ մեկ շնչի հաշվով',unit:'$'}]
function value(code:string,key:string){const c=countries.value.find(c=>c.cca3===code);const s=statistics.value?.countries[code];if(key==='area')return c?.area;if(key==='density')return c?density(s,c.area):undefined;return s?.[key as 'population'|'gdp'|'gdpPerCapita']}
function width(code:string,key:string){const a=value(left.value,key),b=value(right.value,key),v=value(code,key);return a!=null&&b!=null&&v!=null?100*v/Math.max(a,b,1):0}
</script>
<template>
<section id="globe-comparison" class="geo-section" aria-labelledby="geo-comparison-title"><header><p class="geo-kicker">ԵՐԿՈՒ ԵՐԿԻՐ · ՄԵԿ ՉԱՓԱՆԻՇ</p><h2 id="geo-comparison-title">Համեմատել երկրները</h2><p>Բնակչությունն ու տնտեսական ցուցանիշները նույն՝ {{statistics?.year||2024}} թվականի Համաշխարհային բանկի տվյալներից են։ Խտությունը՝ մեկ կմ² ցամաքային տարածքի հաշվով։</p></header>
<p v-if="status==='loading'" role="status">Բեռնում ենք տվյալները…</p><button v-if="status==='error'" type="button" class="geo-button" @click="load">Կրկին փորձել</button>
<div class="compare-selectors"><label>Առաջին երկիրը<select v-model="left"><option v-for="c in sorted" :key="c.cca3" :value="c.cca3" :disabled="c.cca3===right">{{c.nameHy}}</option></select></label><label>Երկրորդ երկիրը<select v-model="right"><option v-for="c in sorted" :key="c.cca3" :value="c.cca3" :disabled="c.cca3===left">{{c.nameHy}}</option></select></label></div>
<div class="compare-grid"><article v-for="c in pair" :key="c?.cca3" class="panel geo-card"><template v-if="c"><h3><CountryFlag :code="c.cca2"/> {{c.nameHy}}</h3><p>{{capitalName(c.cca3,c.capital)}} · {{regions[c.region]}}</p><p class="geo-note">{{c.landlocked?'Ծովային ելք չունի':'Ունի ծովային ափ'}} · {{c.borders.length}} ցամաքային հարևան՝ ըստ աղբյուրի</p><dl><div v-for="m in metrics" :key="m.id" class="compare-metric"><dt>{{m.title}}</dt><dd>{{value(c.cca3,m.id)!=null?`${nf.format(value(c.cca3,m.id)!)} ${m.unit}`:'Տվյալը հասանելի չէ'}}</dd><div v-if="value(left,m.id)!=null&&value(right,m.id)!=null" class="compare-bar" aria-hidden="true"><span :style="{width:`${width(c.cca3,m.id)}%`}"/></div></div></dl></template></article></div>
<p v-if="!statistics" class="geo-note" role="status">Վիճակագրությունը հասանելի չէ։ Համեմատվում են միայն հիմնական տեղեկությունները։</p><p class="geo-note">ՀՆԱ-ն ընթացիկ դոլարով է՝ առանց գնողունակության համարժեքության ճշգրտման։ Բացակայող արժեքները զրոյով չեն փոխարինվում։ Սյունակները յուրաքանչյուր ցուցանիշի զույգի մեջ են համեմատելի։</p><a class="geo-source" href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noopener noreferrer">Համաշխարհային բանկ · WDI ↗</a> · <a class="geo-source" href="https://github.com/mledoze/countries" target="_blank" rel="noopener noreferrer">Countries · տարածք և աշխարհագրություն ↗</a>
</section>
</template>
<style scoped>
.compare-selectors,.compare-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}.compare-grid h3{display:flex;align-items:center;gap:10px}.compare-metric{padding:14px 0;border-top:1px solid #8997c022}.compare-metric dt{color:#9db2cd;font-size:11px}.compare-metric dd{font-size:18px;color:#e6cfaa;margin:10px 0}.compare-bar{height:5px;border-radius:8px;background:#8ca4c522;overflow:hidden}.compare-bar span{display:block;height:100%;background:#dfc38f}.compare-grid article:nth-child(2) .compare-bar span{background:#76bcc7}@media(max-width:600px){.compare-selectors,.compare-grid{gap:8px}.compare-grid .geo-card{padding:12px}.compare-grid h3{font-size:13px;flex-wrap:wrap}.compare-metric dd{font-size:13px;overflow-wrap:anywhere}.compare-grid p{font-size:10px}}
</style>
