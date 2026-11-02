<script setup lang="ts">
const props = defineProps<{ src: string; poster: string }>()
const video = ref<HTMLVideoElement | null>(null)
const completed = ref(false)
let card: HTMLElement | null = null
let observer: IntersectionObserver | undefined
let visible = false
let hovered = false
let focused = false
let touchPressed = false
const touchPreviewing = ref(false)
let disposed = false
let playbackVersion = 0
function shouldPlay() {
  return !disposed && visible && (hovered || focused || touchPreviewing.value) && !document.hidden
}
function updatePlayback() {
  const element = video.value
  if (!element) return
  const version = ++playbackVersion
  if (completed.value) {
    element.pause()
    return
  }
  if (!shouldPlay()) {
    element.pause()
    return
  }
  // Set media properties before play(), including on browsers that treat the
  // HTML muted attribute only as the initial default.
  element.muted = true
  element.defaultMuted = true
  element.playsInline = true
  if (!element.getAttribute('src')) element.src = props.src
  void element.play().then(() => {
    if (version !== playbackVersion) return
    if (!shouldPlay()) { element.pause(); return }
  }).catch(() => { /* Keep the native poster/frame visible when playback is blocked. */ })
}
function finishPlayback() {
  completed.value = true
}
function restartPlayback() {
  completed.value = false
  video.value?.pause()
  if (video.value?.getAttribute('src')) {
    try { video.value.currentTime = 0 } catch { /* Not yet seekable; first playback starts at zero. */ }
  }
  updatePlayback()
}
function pointerEnter(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  hovered = true
  // A pointer inside the card confirms visibility without waiting for the observer.
  visible = true
  restartPlayback()
}
function pointerDown(event: PointerEvent) { touchPressed = event.pointerType === 'touch' }
function pointerCancel() { touchPressed = false }
function captureTouchClick(event: MouseEvent) {
  if (!touchPressed || event.detail === 0) return
  touchPressed = false
  if (touchPreviewing.value) return
  event.preventDefault()
  touchPreviewing.value = true
  // A touch on an onscreen card is itself the user's play gesture. Start now
  // instead of waiting for IntersectionObserver, which can lose iOS activation.
  visible = true
  restartPlayback()
}
function outsideTouch(event: PointerEvent) {
  if (event.pointerType !== 'touch' || card?.contains(event.target as Node)) return
  touchPreviewing.value = false
  updatePlayback()
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
  card?.addEventListener('pointerdown', pointerDown)
  card?.addEventListener('pointercancel', pointerCancel)
  card?.addEventListener('click', captureTouchClick, true)
  card?.addEventListener('pointerleave', pointerLeave)
  card?.addEventListener('focusin', focusIn)
  card?.addEventListener('focusout', focusOut)
  document.addEventListener('visibilitychange', updatePlayback)
  document.addEventListener('pointerdown', outsideTouch)
  if ('IntersectionObserver' in window && video.value) {
    observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .1)
      updatePlayback()
    }, { threshold: [0, .1] })
    observer.observe(video.value)
  } else visible = true
  // Hydration can attach listeners after the mouse has already entered the card.
  if (card?.matches(':hover')) pointerEnter({ pointerType: 'mouse' } as PointerEvent)
})
onBeforeUnmount(() => {
  disposed = true
  playbackVersion++
  observer?.disconnect()
  card?.removeEventListener('pointerenter', pointerEnter)
  card?.removeEventListener('pointerdown', pointerDown)
  card?.removeEventListener('pointercancel', pointerCancel)
  card?.removeEventListener('click', captureTouchClick, true)
  card?.removeEventListener('pointerleave', pointerLeave)
  card?.removeEventListener('focusin', focusIn)
  card?.removeEventListener('focusout', focusOut)
  document.removeEventListener('visibilitychange', updatePlayback)
  document.removeEventListener('pointerdown', outsideTouch)
  video.value?.pause()
})
</script>

<template>
  <div class="card-video" aria-hidden="true">
    <video ref="video" :poster="poster" muted playsinline @ended="finishPlayback" preload="none" loading="lazy" tabindex="-1" />
  </div>
</template>

<style scoped>
.card-video { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
.card-video > video { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; margin: 0; padding: 0; border: 0; object-fit: cover; object-position: inherit; }
</style>
