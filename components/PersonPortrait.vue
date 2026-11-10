<script setup lang="ts">
import { localPortraits } from '~/data/personPortraits'
interface PersonReference {
  id: string
  name: string
  portrait?: string
}

const props = defineProps<{
  person: PersonReference
  size?: 'small' | 'large' | 'biography'
}>()



const localImage = computed(() => props.person.portrait || localPortraits[props.person.id] || null)
const failed = ref(false)

// Request a fallback portrait only when no local image exists.
const { data } = await useFetch<{ url: string | null; source: string | null }>(
  () => '/api/portrait/' + encodeURIComponent(props.person.id),
  {
    key: 'portrait-' + props.person.id,
    server: false,
    immediate: !localImage.value
  }
)
</script>

<template>
  <div class="portrait" :class="`portrait-${size || 'large'}`">
    <img
      v-if="(localImage || data?.url) && !failed"
      :src="localImage || data?.url || ''"
      :alt="person.name + ' — դիմանկար'"
      loading="lazy"
      @error="failed = true"
    />
    <div v-else class="portrait-placeholder">
      <span>👤</span>
      <span class="text-xs px-2 text-center">{{ person.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.portrait {
  position: relative;
  overflow: hidden;
  border: 1px solid #5b6b86;
  border-radius: 14px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #233854, #0a1528);
}
.portrait-small { width: 76px; height: 88px; }
.portrait-large { width: 100%; height: 230px; }
.portrait-biography { position: relative; width: 100%; aspect-ratio: 4 / 5; }
.portrait-biography > :is(img,.portrait-placeholder) { position: absolute; inset: 0; }
.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 28%;
}
.portrait-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #edca8d;
}
.portrait-placeholder > span:first-child { font-size: 2rem; }
</style>
