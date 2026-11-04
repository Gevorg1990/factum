<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PeriodicElement } from '~/data/periodicTable'
import { appearanceDescriptions, elementSamples } from '~/data/chemistry/elementAppearance'

const props = defineProps<{ element: PeriodicElement }>()
const expanded = ref(false)
const imageFailed = ref(false)
const sample = computed(() => elementSamples[props.element.number])
const imageSrc = computed(() => sample.value?.kind === 'symbol' ? `/images/elements/${sample.value.file}.svg` : `/images/elements/${sample.value?.file}-360.jpg`)
const imageSrcset = computed(() => sample.value?.kind === 'symbol' ? undefined : `/images/elements/${sample.value?.file}-360.jpg 360w, /images/elements/${sample.value?.file}-800.jpg 800w`)
const description = computed(() => appearanceDescriptions[props.element.number])
const sourceUrl = computed(() => {
  const names: Record<number, string> = { 13: 'aluminium', 55: 'caesium' }
  const slug = names[props.element.number] || props.element.nameEn.toLowerCase()
  return `https://periodic-table.rsc.org/element/${props.element.number}/${slug}`
})

watch(() => props.element.number, () => {
  expanded.value = false
  imageFailed.value = false
})

function toggle(event: Event) {
  expanded.value = (event.currentTarget as HTMLDetailsElement).open
}
</script>

<template>
  <details class="element-appearance" :open="expanded" @toggle="toggle">
    <summary>Տարրի իրական տեսքը</summary>
    <div v-if="expanded" class="element-appearance-content">
      <h3>{{ element.name }} <span>{{ element.symbol }}</span></h3>
      <p class="element-sample-intro">Լուսանկարի նկարագրությունը նշում է նմուշի տեսակը և պայմանները։ Լուսանկարի բացակայության դեպքում նշված է պատճառը։</p>
      <p v-if="description" class="element-appearance-description">{{ description }}</p>
      <figure v-if="sample">
        <img v-if="sample.kind !== 'symbol' && !imageFailed" :key="element.number" :src="imageSrc" :srcset="imageSrcset" sizes="(max-width: 540px) 85vw, 360px" :width="sample.width" :height="sample.height" :alt="sample.caption" loading="lazy" decoding="async" @error="imageFailed = true" />
        <p v-else-if="sample.kind !== 'symbol'" class="element-image-error" role="status">Լուսանկարը չի բեռնվել։ Բնօրինակը կարող ես բացել աղբյուրի հղումով։</p>
        <figcaption>{{ sample.caption }}</figcaption>
        <p v-if="sample.kind !== 'symbol'" class="element-photo-credit"><a :href="sample.sourceUrl" target="_blank" rel="noopener noreferrer">{{ sample.kind === 'symbol' ? 'Պատկեր' : 'Լուսանկար' }} · {{ sample.photographer }} ↗</a><a :href="sample.licenseUrl" target="_blank" rel="noopener noreferrer">{{ sample.license }} ↗</a><span v-if="sample.kind !== 'symbol'">Չափը փոքրացված է։</span></p>
      </figure>
      <p v-else class="element-photo-pending">Այս տարրի համար ստուգված լուսանկարը դեռ ավելացված չէ։ Աղբյուրում նշված վիճակը՝ {{ element.stateLabel }}։</p>
      <a class="element-appearance-source" :href="sourceUrl" target="_blank" rel="noopener noreferrer">Տեսքն ու հատկությունները · Royal Society of Chemistry ↗</a>
    </div>
  </details>
</template>

<style scoped>
.element-appearance { margin-top: 20px; border: 1px solid #89a8c344; border-radius: 12px; background: #101e3280; color: #c4d5e8; }
.element-appearance summary { min-height: 44px; padding: 13px 15px; color: #dfc38f; cursor: pointer; font-size: 12px; font-weight: 600; }
.element-appearance-content { padding: 0 15px 17px; }
.element-appearance h3 { font-size: 17px; color: #edf5ff; line-height: 1.7; }
.element-appearance h3 span { margin-left: 6px; color: #a7cce8; }
.element-sample-intro, .element-appearance-description, .element-photo-pending { margin: 10px 0 14px; font-size: 12px; line-height: 1.9; }
.element-sample-intro { color: #92aac4; font-size: 11px; }
.element-appearance img { display: block; width: 100%; height: auto; max-height: 320px; object-fit: contain; border-radius: 9px; background: #e7e9e9; }
.element-appearance figcaption { margin-top: 12px; font-size: 12px; line-height: 1.9; }
.element-photo-credit { display: grid; gap: 6px; margin: 12px 0; font-size: 10px; line-height: 1.8; color: #91a9c2; }
.element-appearance a { color: #dcc391; text-underline-offset: 3px; text-decoration: underline; overflow-wrap: anywhere; }
.element-appearance-source { display: inline-block; font-size: 11px; line-height: 1.8; margin-top: 12px; }
.element-image-error { padding: 20px; border-radius: 9px; background: #22334b; font-size: 12px; line-height: 1.9; }
.element-appearance :is(summary, a):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
:global(html.factum-light) .element-appearance { background: #edf3f9; color: #344c67; border-color: #91a6c4; }
:global(html.factum-light) .element-appearance :is(summary, a) { color: #755323; }
:global(html.factum-light) .element-appearance h3 { color: #1b2f4b; }
:global(html.factum-light) .element-sample-intro { color: #526b85; }
</style>
