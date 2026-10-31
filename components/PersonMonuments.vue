<script setup lang="ts">
import { MapPin, CalendarDays, ArrowUpRight, Landmark } from 'lucide-vue-next'
import { personMonuments, monumentMapUrl } from '~/data/personMonuments'
const props = defineProps<{ personId: string; name: string }>()
const monuments = computed(() => personMonuments.filter(monument => monument.personId === props.personId))
const failedImages = ref<string[]>([])
watch(() => props.personId, () => { failedImages.value = [] })
</script>

<template>
  <section v-if="monuments.length" class="person-monuments" aria-labelledby="person-monuments-title">
    <h2 id="person-monuments-title"><Landmark :size="23" aria-hidden="true" /> Հուշարձաններ</h2>
    <p class="muted monuments-intro">{{ name }}ին նվիրված հուշարձաններ՝ տեղադրությամբ և տարեթվերով։</p>
    <div class="monuments-grid">
      <article v-for="monument in monuments" :key="monument.id" class="monument-card">
        <figure v-if="monument.image">
          <a v-if="!failedImages.includes(monument.id)" :href="monument.image.src" target="_blank" rel="noopener noreferrer" class="monument-photo" :aria-label="`${monument.name}․ դիտել լուսանկարը մեծ չափով`" title="Դիտել լուսանկարը մեծ չափով">
            <img class="monument-photo-backdrop" :src="monument.image.src" alt="" aria-hidden="true" loading="lazy" decoding="async">
            <img class="monument-photo-image" :style="{ objectFit: monument.image.fit || 'contain', objectPosition: monument.image.position || 'center' }" :src="monument.image.src" :alt="monument.image.alt" loading="lazy" decoding="async" @error="failedImages.push(monument.id)">
          </a>
          <a v-else :href="monument.image.sourceUrl" target="_blank" rel="noopener noreferrer" class="monument-image-fallback">Դիտել հուշարձանի լուսանկարը աղբյուրում <ArrowUpRight :size="17" aria-hidden="true" /></a>
          <figcaption>Լուսանկար՝ <a :href="monument.image.sourceUrl" target="_blank" rel="noopener noreferrer">{{ monument.image.credit }}</a> · <a :href="monument.image.licenseUrl" target="_blank" rel="noopener noreferrer">{{ monument.image.license }}</a></figcaption>
        </figure>
        <div class="monument-copy">
          <h3>{{ monument.name }}</h3>
          <dl>
            <div><dt><MapPin :size="16" aria-hidden="true" /> Տեղադրություն</dt><dd>{{ monument.city }} · {{ monument.location }}</dd></div>
            <div v-if="monument.openedYear"><dt><CalendarDays :size="16" aria-hidden="true" /> Բացում</dt><dd>{{ monument.openedDate || `${monument.openedYear} թ.` }}</dd></div>
            <div v-if="monument.installedYear && monument.installedYear !== monument.openedYear"><dt>Տեղադրում</dt><dd>{{ monument.installedYear }} թ.</dd></div>
            <div v-if="monument.sculptor"><dt>Քանդակագործ</dt><dd>{{ monument.sculptor }}</dd></div>
            <div v-if="monument.architect"><dt>Ճարտարապետ</dt><dd>{{ monument.architect }}</dd></div>
          </dl>
          <div class="monument-links">
            <a :href="monumentMapUrl(monument)" target="_blank" rel="noopener noreferrer"><MapPin :size="15" aria-hidden="true" /> Դիտել քարտեզի վրա <ArrowUpRight :size="14" aria-hidden="true" /></a>
            <a :href="monument.source.url" target="_blank" rel="noopener noreferrer">Աղբյուր՝ {{ monument.source.name }} <ArrowUpRight :size="13" aria-hidden="true" /></a>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.person-monuments { margin-top: 36px; }
.person-monuments > h2 { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 700; }
.person-monuments > h2 svg { color: #dfc38f; }
.monuments-intro { margin: 10px 0 20px; font-size: 13px; line-height: 1.8; }
.monuments-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 20px; }
.monument-card { min-width: 0; overflow: hidden; border: 1px solid #8997c033; border-radius: 16px; }
.monument-card figure { margin: 0; }
.monument-photo { position: relative; display: block; height: clamp(280px, 45vw, 560px); overflow: hidden; isolation: isolate; background: #8997c014; }
.monument-photo img { display: block; width: 100%; height: 100%; object-position: center; }
.monument-photo-backdrop { position: absolute; inset: 0; object-fit: cover; filter: blur(24px) brightness(.55); transform: scale(1.12); pointer-events: none; }
.monument-photo-image { position: relative; z-index: 1; object-fit: contain; }
.monument-card figcaption { padding: 9px 16px; color: #a8b8d4; font-size: 10px; line-height: 1.8; border-bottom: 1px solid #8997c022; }
.monument-card figcaption a { text-decoration: underline; text-underline-offset: 2px; }
.monument-copy { padding: 20px; }
.monument-copy h3 { font-size: 18px; line-height: 1.6; font-weight: 700; }
.monument-copy dl { display: grid; gap: 14px; margin: 20px 0; }
.monument-copy dt { display: flex; align-items: center; gap: 7px; color: #dfc38f; font-size: 12px; }
.monument-copy dd { margin: 5px 0 0; font-size: 14px; line-height: 1.8; }
.monument-links { display: flex; flex-wrap: wrap; gap: 14px; padding-top: 16px; border-top: 1px solid #8997c022; }
.monument-links a { display: inline-flex; align-items: center; gap: 5px; color: #dfc38f; font-size: 12px; line-height: 1.7; }
.monument-image-fallback { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 240px; padding: 24px; color: #dfc38f; background: #8997c014; font-size: 14px; }
.person-monuments a:focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
:global(html.factum-light) .monument-copy dt, :global(html.factum-light) .monument-links a { color: #78501b; }
:global(html.factum-light) .monument-card figcaption { color: #4e6481; }
</style>
