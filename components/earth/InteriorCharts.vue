<script setup lang="ts">
import { EARTH_RADIUS, temperatureAnchors } from '~/data/earth/interior'
import { pressureAtDepth, temperatureAtDepth } from '~/utils/earth/interior'
const props=defineProps<{depth:number}>()
const emit=defineEmits<{select:[depth:number]}>()
const x=(depth:number)=>40+depth/EARTH_RADIUS*330
const y=(value:number,max:number)=>166-value/max*134
const pressure=Array.from({length:100},(_,i)=>({depth:i*EARTH_RADIUS/99,value:pressureAtDepth(i*EARTH_RADIUS/99)}))
const pressurePath=pressure.map((p,i)=>`${i?'L':'M'}${x(p.depth)},${y(p.value,400)}`).join(' ')
const temperatureBand=[...temperatureAnchors.map(p=>`${x(p.depth)},${y(p.high,7000)}`),...[...temperatureAnchors].reverse().map(p=>`${x(p.depth)},${y(p.low,7000)}`)].join(' ')
const currentTemperature=computed(()=>temperatureAtDepth(props.depth))
const chartDepths=[0,2000,4000,6371]
function pick(event:MouseEvent) {
  const svg=event.currentTarget as SVGSVGElement
  const rect=svg.getBoundingClientRect()
  emit('select',Math.round(Math.max(0,Math.min(EARTH_RADIUS,((event.clientX-rect.left)/rect.width*400-40)/330*EARTH_RADIUS))))
}
</script>
<template>
  <section class="earth-charts" aria-label="Ջերմաստիճանի և ճնշման փոփոխությունը խորության հետ">
    <figure class="panel earth-chart"><figcaption>Ջերմաստիճան · °C <span>Մոտավոր գնահատումների միջակայք</span></figcaption>
      <svg viewBox="0 0 400 210" role="img" aria-label="Ջերմաստիճանի մոտավոր միջակայքը խորության հետ։ Մգացված գոտին գնահատումների սահմաններն են, ոչ վստահության վիճակագրական միջակայք։" @click="pick">
        <g v-for="tick in [0,3500,7000]" :key="tick"><line x1="40" x2="370" :y1="y(tick,7000)" :y2="y(tick,7000)" class="chart-grid"/><text x="33" :y="y(tick,7000)+4" text-anchor="end">{{ tick }}</text></g>
        <polygon :points="temperatureBand" class="chart-temperature"/>
        <line :x1="x(depth)" :x2="x(depth)" y1="25" y2="166" class="chart-cursor"/>
        <circle :cx="x(depth)" :cy="y((currentTemperature.low+currentTemperature.high)/2,7000)" r="4" fill="#ffd093"/>
        <text v-for="d in chartDepths" :key="d" :x="x(d)" y="185" text-anchor="middle">{{ d }}</text><text x="205" y="205" text-anchor="middle">Խորություն · կմ</text>
      </svg>
      <p>Միջակայքը աղբյուրների վրա հիմնված ուսուցողական մոտավորություն է։ Կետերի միջև՝ գծային միջարկում։ Կենտրոնում պահվում է ներքին միջուկի սահմանի լայն միջակայքը․ առանձին չափում չկա։</p>
    </figure>
    <figure class="panel earth-chart"><figcaption>Ճնշում · ԳՊա <span>Հաշվարկ՝ PREM-ի խտություններից</span></figcaption>
      <svg viewBox="0 0 400 210" role="img" aria-label="Ճնշումն աճում է մակերևույթից մինչև մոտ 364 գիգապասկալ կենտրոնում։ Սեղմելով կարող ես ընտրել խորությունը։" @click="pick">
        <g v-for="tick in [0,200,400]" :key="tick"><line x1="40" x2="370" :y1="y(tick,400)" :y2="y(tick,400)" class="chart-grid"/><text x="33" :y="y(tick,400)+4" text-anchor="end">{{ tick }}</text></g>
        <path :d="pressurePath" fill="none" stroke="#79d2ed" stroke-width="2.5"/>
        <line :x1="x(depth)" :x2="x(depth)" y1="25" y2="166" class="chart-cursor"/><circle :cx="x(depth)" :cy="y(pressureAtDepth(depth),400)" r="4" fill="#bcf4ff"/>
        <text v-for="d in chartDepths" :key="d" :x="x(d)" y="185" text-anchor="middle">{{ d }}</text><text x="205" y="205" text-anchor="middle">Խորություն · կմ</text>
      </svg>
      <p>Գնդային համաչափություն և հիդրոստատիկ հավասարակշռություն։ Մակերևույթում ճնշումը պայմանական զրո է՝ մթնոլորտային ճնշումը հանած։ 1 ԳՊա = 1 միլիարդ պասկալ։</p>
    </figure>
  </section>
</template>
<style scoped>
.earth-charts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}.earth-chart{padding:20px;min-width:0}.earth-chart figcaption{font-size:14px;color:#e7d4ad;font-weight:700}.earth-chart figcaption span{display:block;font-size:11px;color:#9cb3cf;font-weight:400;margin-top:8px}.earth-chart svg{display:block;width:100%;height:auto;margin-top:14px;cursor:crosshair}.earth-chart text{fill:#a7bdd6;font-size:12px}.chart-grid{stroke:#8098b42b;stroke-dasharray:3 5}.chart-temperature{fill:#f3aa654d;stroke:#f4b56d;stroke-width:1.5}.chart-cursor{stroke:#e8f5ff;stroke-width:1;stroke-dasharray:4 4}.earth-chart p{font-size:11px;line-height:1.9;color:#98acc6;margin-top:10px}@media(max-width:800px){.earth-charts{grid-template-columns:1fr}.earth-chart{padding:16px}}
</style>
