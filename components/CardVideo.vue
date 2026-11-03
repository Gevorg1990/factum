<script setup lang="ts">
const props = defineProps<{ src: string; poster: string }>()
const video = ref<HTMLVideoElement | null>(null)
const completed = ref(false)
const replayFrame = ref<HTMLCanvasElement | null>(null)
const holdingLastFrame = ref(false)
let frameCallback: number | undefined
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
  if (frameCallback !== undefined) element.cancelVideoFrameCallback?.(frameCallback)
  frameCallback = undefined
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
    if (holdingLastFrame.value) {
      const reveal = () => {
        if (version !== playbackVersion || !shouldPlay()) return
        frameCallback = undefined
        holdingLastFrame.value = false
      }
      if (typeof element.requestVideoFrameCallback === 'function') frameCallback = element.requestVideoFrameCallback(reveal)
      else reveal()
    }
  }).catch(() => { /* Keep the native poster/frame visible when playback is blocked. */ })
}
function finishPlayback() {
  completed.value = true
}
async function startPreview() {
  if (completed.value && video.value) {
    const element = video.value
    const canvas = replayFrame.value
    try {
      if (canvas && element.videoWidth && element.videoHeight) {
        canvas.width = element.videoWidth
        canvas.height = element.videoHeight
        const context = canvas.getContext('2d')
        if (context) {
          context.drawImage(element, 0, 0)
          holdingLastFrame.value = true
          await nextTick()
          // Commit the opaque final frame before seeking the video underneath.
          void canvas.offsetWidth
        }
      }
    } catch { /* Playback still works if a frame cannot be copied. */ }
    if (disposed) return
    completed.value = false
    element.currentTime = 0
  }
  updatePlayback()
}
function pointerEnter(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  hovered = true
  // A pointer inside the card confirms visibility without waiting for the observer.
  visible = true
  void startPreview()
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
  void startPreview()
}
function outsideTouch(event: PointerEvent) {
  if (event.pointerType !== 'touch' || card?.contains(event.target as Node)) return
  touchPreviewing.value = false
  updatePlayback()
}
function pointerLeave() { hovered = false; updatePlayback() }
function focusIn() {
  const entering = !focused && !hovered
  focused = true
  if (entering) void startPreview()
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
  if (frameCallback !== undefined) video.value?.cancelVideoFrameCallback?.(frameCallback)
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
    <canvas ref="replayFrame" class="replay-frame" :class="{ 'is-holding': holdingLastFrame }" />
  </div>
</template>

<style scoped>
.card-video { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
.card-video > :is(video, canvas) { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; margin: 0; padding: 0; border: 0; object-fit: cover; object-position: inherit; }
.replay-frame { opacity: 0; transition: opacity 260ms ease; }
.replay-frame.is-holding { opacity: 1; transition: none; }
</style>
