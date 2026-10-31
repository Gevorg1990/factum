<script setup lang="ts">
import { Volume2, Pause, Play, Square } from 'lucide-vue-next'
import type { Person } from '~/data/personTypes'

const props = defineProps<{ person: Person }>()
const player = ref<HTMLAudioElement>()
const voice = ref<'female' | 'male'>('male')
const speed = ref(1)
const state = ref<'idle' | 'loading' | 'reading' | 'paused'>('idle')
const error = ref('')
const available = ref<boolean | null>(null)
let generation = 0
let part = 0
let count = 0
let audioUrl = ''
let request: AbortController | undefined
let prepared: { part: number; controller: AbortController; audio: Promise<Blob | null> } | undefined

function applySpeed() {
  if (!player.value) return
  player.value.playbackRate = speed.value
  player.value.preservesPitch = true
}

function releaseAudio() {
  player.value?.pause()
  player.value?.removeAttribute('src')
  player.value?.load()
  if (audioUrl) URL.revokeObjectURL(audioUrl)
  audioUrl = ''
}
function stop() {
  generation++
  request?.abort()
  request = undefined
  prepared?.controller.abort()
  prepared = undefined
  releaseAudio()
  part = 0
  state.value = 'idle'
}
async function status() {
  const result = await $fetch<{ available: boolean; chunks: number }>('/api/biography-speech', { query: { personId: props.person.id } })
  available.value = result.available
  count = result.chunks
  return result.available
}
async function fetchPart(index: number, signal: AbortSignal): Promise<Blob> {
  const response = await fetch('/api/biography-speech', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId: props.person.id, voice: voice.value, part: index }),
  })
  if (!response.ok) {
    if (response.status === 503 && !signal.aborted) available.value = false
    throw new Error('Speech unavailable')
  }
  return response.blob()
}
function prepareNext(token: number) {
  if (token !== generation || part + 1 >= count || prepared) return
  const controller = new AbortController()
  prepared = { part: part + 1, controller, audio: fetchPart(part + 1, controller.signal).catch(() => null) }
}
async function playPart(token: number) {
  if (!player.value || token !== generation) return
  state.value = 'loading'
  request = new AbortController()
  try {
    let blob: Blob | null = null
    if (prepared?.part === part) {
      const next = prepared
      prepared = undefined
      request = next.controller
      blob = await next.audio
    }
    if (token !== generation) return
    if (!blob) {
      request = new AbortController()
      blob = await fetchPart(part, request.signal)
    }
    if (token !== generation) return
    releaseAudio()
    audioUrl = URL.createObjectURL(blob)
    player.value.src = audioUrl
    applySpeed()
    try {
      await player.value.play()
      if (token === generation) { state.value = 'reading'; prepareNext(token) }
    } catch (failure) {
      if (token !== generation) return
      if (failure instanceof DOMException && failure.name === 'NotAllowedError') {
        state.value = 'paused'
        error.value = 'Ձայնը պատրաստ է։ Սեղմիր «Շարունակել»՝ լսելու համար։'
      } else throw failure
    }
  } catch {
    if (token !== generation) return
    stop()
    error.value = available.value === false ? 'Ձայնային ծառայությունը դեռ միացված չէ։' : 'Չհաջողվեց միացնել ընթերցումը։ Փորձիր կրկին։'
  }
}
async function play() {
  error.value = ''
  if (state.value === 'paused' && player.value && audioUrl) {
    const token = generation
    try {
      applySpeed()
      await player.value.play()
      if (token === generation) { state.value = 'reading'; prepareNext(token) }
    } catch { error.value = 'Չհաջողվեց շարունակել ընթերցումը։ Փորձիր կրկին։' }
    return
  }
  stop()
  const token = generation
  state.value = 'loading'
  try {
    const ready = available.value === true && count > 0 ? true : await status()
    if (token !== generation) return
    if (!ready) {
      state.value = 'idle'
      error.value = 'Ձայնային ծառայությունը դեռ միացված չէ։'
      return
    }
    await playPart(token)
  } catch {
    if (token !== generation) return
    state.value = 'idle'
    error.value = 'Չհաջողվեց միացնել ընթերցումը։ Փորձիր կրկին։'
  }
}
function pause() {
  player.value?.pause()
  state.value = 'paused'
}
function next() {
  part++
  if (part >= count) stop()
  else void playPart(generation)
}
watch([() => props.person.id, voice], () => { stop(); error.value = '' })
watch(speed, applySpeed)
onMounted(() => { void status().catch(() => {}) })
onBeforeUnmount(stop)
</script>

<template>
  <section class="biography-reader mt-6" aria-label="Կենսագրության ձայնային ընթերցում">
    <div class="flex items-center gap-2 flex-wrap">
      <Volume2 :size="20" class="gold" aria-hidden="true" />
      <strong>Լսել կենսագրությունը</strong>
    </div>
    <div class="reader-settings mt-4">
      <VoiceChoice v-model="voice" name="biography-reader-voice" />
      <div class="reader-speed">
        <p id="biography-speed-label" class="text-sm">Ընթերցման արագությունը</p>
        <div class="reader-speed-options mt-2" role="group" aria-labelledby="biography-speed-label">
          <button v-for="value in [1, 1.25, 1.5, 1.75, 2]" :key="value" type="button" :aria-pressed="speed === value" :aria-label="`${value} անգամ արագություն`" :class="{ 'is-selected': speed === value }" @click="speed = value">{{ value }}×</button>
        </div>
      </div>
    </div>
    <audio ref="player" preload="none" @loadedmetadata="applySpeed" @ended="next" />
    <div class="reader-actions mt-3">
      <button type="button" class="btn-secondary reader-primary" :disabled="state === 'loading'" @click="state === 'reading' ? pause() : play()">
        <Pause v-if="state === 'reading'" :size="16" aria-hidden="true" /><Play v-else :size="16" aria-hidden="true" />
        {{ state === 'loading' ? 'Սպասիր…' : state === 'reading' ? 'Դադար տալ' : state === 'paused' ? 'Շարունակել' : 'Լսել' }}
      </button>
      <button type="button" class="btn-secondary reader-stop" :class="{ 'is-hidden': state === 'idle' }" :disabled="state === 'idle'" :aria-hidden="state === 'idle'" @click="stop"><Square :size="16" aria-hidden="true" /> Դադարեցնել</button>
    </div>
    <p class="reader-status muted text-sm mt-3" :role="error ? 'alert' : 'status'" aria-live="polite">
      <span>
      <template v-if="error">{{ error }}</template>
      <template v-else-if="available === false">Ձայնային ծառայությունը դեռ միացված չէ։</template>
      <template v-else-if="state === 'loading'">Ընթերցումը պատրաստվում է…</template>
      <template v-else-if="state === 'paused'">Ընթերցումը դադար է տրված։</template>
      <template v-else-if="state === 'reading'">Կարդում է կենսագրությունը…</template>
      <template v-else>Կենսագրության ընթերցում՝ ընտրված հայերեն ձայնով։</template>
      </span>
    </p>
  </section>
</template>

<style scoped>
.biography-reader { border: 1px solid #dfc38f44; border-radius: 12px; padding: 16px; background: #dfc38f08; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; }
button > svg { flex-shrink: 0; }
.reader-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.reader-primary { min-width: 160px; }
.reader-stop.is-hidden { visibility: hidden; }
.reader-status { display: grid; line-height: 1.8; }
.reader-status::before { content: 'Կենսագրության ընթերցում՝ ընտրված հայերեն ձայնով։'; grid-area: 1 / 1; visibility: hidden; }
.reader-status > span { grid-area: 1 / 1; }
.reader-settings { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; }
.reader-settings > div { min-width: 0; }
.reader-speed-options { display: flex; flex-wrap: wrap; gap: 8px; }
.reader-speed-options button { min-height: 38px; min-width: 48px; padding: 6px 10px; border: 1px solid #8997c055; border-radius: 10px; font-size: 12px; }
.reader-speed-options button:hover { border-color: #dfc38f99; background: #dfc38f0d; }
.reader-speed-options button.is-selected { border-color: #dfc38f; background: #dfc38f18; box-shadow: inset 0 0 0 1px #dfc38f; }
.reader-speed-options button:focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
@media (max-width: 1023px) { .reader-settings { grid-template-columns: 1fr; } }
</style>
