<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { elementSamples } from '~/data/chemistry/elementAppearance'
import { elementFamilies, type PeriodicElement } from '~/data/periodicTable'
const props = defineProps<{ element: PeriodicElement; compact?: boolean }>()
const thumbnail = computed(() => props.compact ? elementSamples[props.element.number] : undefined)
const thumbnailFailed = ref(false)
watch(() => props.element.number, () => { thumbnailFailed.value = false })
</script>

<template>
  <div class="element-info" :class="{ 'element-info-compact': compact }" :style="{ '--element-accent': elementFamilies[element.family].color }">
    <div class="element-info-heading">
      <div class="element-info-badge" aria-hidden="true"><small>{{ element.number }}</small><strong>{{ element.symbol }}</strong></div>
      <div>
        <h2>{{ element.name }}</h2>
        <p class="element-info-english" lang="en">{{ element.nameEn }}</p>
        <p class="element-info-family">{{ elementFamilies[element.family].name }}</p>
      </div>
    </div>
    <figure v-if="thumbnail && !thumbnailFailed" class="element-info-thumbnail">
      <img v-if="thumbnail.kind !== 'symbol'" :key="element.number" :src="`/images/elements/${thumbnail.file}${thumbnail.kind === 'symbol' ? '.svg' : '-360.jpg'}`" :width="thumbnail.width" :height="thumbnail.height" :alt="thumbnail.caption" decoding="async" @error="thumbnailFailed = true" />
      <figcaption>
        <span>{{ thumbnail.caption }}</span>
        <details v-if="thumbnail.kind !== 'symbol'" class="element-thumbnail-credit">
          <summary>Աղբյուր և լիցենզիա</summary>
          <a :href="thumbnail.sourceUrl" target="_blank" rel="noopener noreferrer">{{ thumbnail.photographer }} ↗</a>
          <a :href="thumbnail.licenseUrl" target="_blank" rel="noopener noreferrer">{{ thumbnail.license }} ↗</a>
          <span v-if="thumbnail.kind !== 'symbol'">Չափը փոքրացված է։</span>
        </details>
      </figcaption>
    </figure>
    <p v-if="!compact" class="element-info-description">{{ elementFamilies[element.family].description }}</p>
    <dl class="element-info-facts">
      <div><dt>Ատոմային համար</dt><dd>{{ element.number }}</dd></div>
      <div><dt>Ատոմային զանգված, u</dt><dd>{{ element.atomicMass }}</dd></div>
      <div><dt>Պարբերություն</dt><dd>{{ element.period }}</dd></div>
      <div><dt>Խումբ</dt><dd>{{ element.group ?? 'f-շարք' }}</dd></div>
      <div><dt>Վիճակ</dt><dd>{{ element.stateLabel }}</dd></div>
      <div><dt>Էլեկտրաբացասականություն</dt><dd>{{ element.electronegativity || 'Տվյալ չկա' }}</dd></div>
      <div class="element-info-wide"><dt>Էլեկտրոնային կառուցվածք{{ element.configurationPredicted ? ' · կանխատեսված' : '' }}</dt><dd class="element-info-configuration">{{ element.electronConfiguration || 'Տվյալ չկա' }}</dd></div>
      <div v-if="!compact" class="element-info-wide"><dt>Օքսիդացման աստիճաններ</dt><dd>{{ element.oxidationStates || 'Տվյալ չկա' }}</dd></div>
    </dl>
  </div>
</template>

<style scoped>
.element-info { min-width: 0; color: #e9eefb; }
.element-info-thumbnail { display: flex; align-items: center; gap: 12px; margin: 14px 0 0; }
.element-info-thumbnail img { width: 96px; height: 80px; object-fit: contain; border-radius: 8px; background: #14263e; flex-shrink: 0; }
.element-info-thumbnail figcaption { display: grid; gap: 4px; min-width: 0; font-size: 9px; line-height: 1.5; color: #aebbd4; overflow-wrap: anywhere; }
.element-info-thumbnail figcaption > span { font-size: 11px; color: var(--element-accent); }
.element-thumbnail-credit summary { cursor: pointer; }
.element-thumbnail-credit a, .element-thumbnail-credit > span { display: block; margin-top: 4px; }
.element-info-thumbnail a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
:global(html.factum-light) .element-info-thumbnail figcaption { color: #4e6481; }
.element-info-heading { display: flex; gap: 18px; align-items: center; }
.element-info-badge { display: flex; flex-direction: column; justify-content: center; width: 82px; height: 90px; padding: 10px; flex-shrink: 0; border: 1px solid var(--element-accent); border-radius: 14px; color: var(--element-accent); background: #ffffff05; }
.element-info-badge small { font-size: 12px; }
.element-info-badge strong { font-size: 35px; line-height: 1.2; text-align: center; }
.element-info h2 { font-size: 24px; font-weight: 800; }
.element-info-english { color: #aebbd4; font-size: 13px; margin-top: 2px; }
.element-info-family { font-size: 12px; color: var(--element-accent); margin-top: 5px; }
.element-info-description { color: #b9c4d9; line-height: 1.8; margin: 18px 0; max-width: 75ch; }
.element-info-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 20px; margin-top: 18px; }
.element-info-facts div { min-width: 0; }
.element-info-facts dt { color: #aebbd4; font-size: 11px; margin-bottom: 4px; }
.element-info-facts dd { font-size: 14px; overflow-wrap: anywhere; }
.element-info-wide { grid-column: span 3; }
.element-info-configuration { font-family: monospace; direction: ltr; text-align: left; }
.element-info-compact h2 { font-size: 19px; }
.element-info-compact .element-info-badge { width: 62px; height: 68px; }
.element-info-compact .element-info-badge strong { font-size: 26px; }
.element-info-compact .element-info-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
.element-info-compact .element-info-wide { grid-column: span 2; }
@media (max-width: 540px) {
  .element-info-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .element-info-wide { grid-column: span 2; }
}
:global(html.factum-light) .element-info { color: #1b2f4b; }
:global(html.factum-light) .element-info-english,
:global(html.factum-light) .element-info-description,
:global(html.factum-light) .element-info-facts dt { color: #4e6481; }
:global(html.factum-light) .element-info-family { color: #4e6481; }
:global(html.factum-light) .element-info-badge { background: #132541; }
</style>
