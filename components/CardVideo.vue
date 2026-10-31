<script setup lang="ts">
const props = defineProps<{ src: string; poster: string }>()
const video = ref<HTMLVideoElement | null>(null)
const previewing = ref(false)
const completed = ref(false)
let card: HTMLElement | null = null
let motionPreference: MediaQueryList | undefined
let observer: IntersectionObserver | undefined
let visible = false
let hovered = false
let focused = false
let disposed = false
let playbackVersion = 0
function shouldPlay() {
  return !disposed && visible && (hovered || focused) && !document.hidden && !motionPreference?.matches
}
function updatePlayback() {
  const element = video.value
  if (!element) return
  const version = ++playbackVersion
  if (completed.value) {
    previewing.value = true
    element.pause()
    return
  }
  if (!shouldPlay()) {
    previewing.value = false
    element.pause()
    return
  }
  if (!element.getAttribute('src')) element.src = props.src
  void element.play().then(() => {
    if (version !== playbackVersion) return
    if (shouldPlay()) previewing.value = true
    else element.pause()
  }).catch(() => { if (version === playbackVersion) previewing.value = false })
}
function finishPlayback() {
  completed.value = true
  previewing.value = true
}
function restartPlayback() {
  completed.value = false
  previewing.value = false
  video.value?.pause()
  if (video.value?.getAttribute('src')) {
    try { video.value.currentTime = 0 } catch { /* Not yet seekable; first playback starts at zero. */ }
  }
  updatePlayback()
}
function pointerEnter(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  hovered = true
  restartPlayback()
}
function pointerLeave() { hovered = false; updatePlayback() }
function focusIn() {
  const restart = !focused && !hovered
  focused = true
  if (restart) restartPlayback()
  else updatePlayback()
}
function focusOut(event: FocusEvent) {
  focused = Boolean(card?.contains(event.relatedTarget as Node | null))
  updatePlayback()
}
onMounted(() => {
  card = video.value?.closest('a') ?? video.value?.parentElement ?? null
  card?.addEventListener('pointerenter', pointerEnter)
  card?.addEventListener('pointerleave', pointerLeave)
  card?.addEventListener('focusin', focusIn)
  card?.addEventListener('focusout', focusOut)
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', updatePlayback)
  document.addEventListener('visibilitychange', updatePlayback)
  if ('IntersectionObserver' in window && video.value) {
    observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .1)
      updatePlayback()
    }, { threshold: [0, .1] })
    observer.observe(video.value)
  } else visible = true
})
onBeforeUnmount(() => {
  disposed = true
  playbackVersion++
  observer?.disconnect()
  card?.removeEventListener('pointerenter', pointerEnter)
  card?.removeEventListener('pointerleave', pointerLeave)
  card?.removeEventListener('focusin', focusIn)
  card?.removeEventListener('focusout', focusOut)
  motionPreference?.removeEventListener('change', updatePlayback)
  document.removeEventListener('visibilitychange', updatePlayback)
  video.value?.pause()
})
</script>

<template>
  <div class="card-video" aria-hidden="true">
    <img :src="poster" alt="" loading="lazy" />
    <video ref="video" :class="{ previewing }" muted playsinline @ended="finishPlayback" preload="none" tabindex="-1" />
  </div>
</template>

<style scoped>
.card-video { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
.card-video > :is(img,video) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: inherit; }
.card-video > video { opacity: 0; transition: opacity .3s ease; }
.card-video > video.previewing { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .card-video > video { transition: none; } }
</style>
