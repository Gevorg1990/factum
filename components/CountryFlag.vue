<script setup lang="ts">
const props = defineProps<{ code?: string }>()
const failed = ref(false)
const code = computed(() => /^[a-z]{2}$/i.test(props.code || '') ? props.code!.toLowerCase() : '')
watch(code, () => { failed.value = false })
</script>

<template>
  <span class="country-flag" aria-hidden="true">
    <img v-if="code && !failed" :src="`https://flagcdn.com/w80/${code}.png`" alt="" width="40" height="28" loading="lazy" decoding="async" @error="failed = true" />
    <span v-else>{{ code ? code.toUpperCase() : '—' }}</span>
  </span>
</template>

<style scoped>
.country-flag { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 24px; height: 18px; vertical-align: middle; }
.country-flag img { display: block; width: 100%; height: 100%; object-fit: contain; }
.country-flag > span { font-size: 10px; font-weight: 700; line-height: 1; }
</style>
