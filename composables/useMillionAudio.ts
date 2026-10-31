type Cue = 'question' | 'select' | 'correct' | 'wrong' | 'stage' | 'win' | 'microphone'

// Original synthesized cues: [frequency in Hz, start offset, duration].
const cues: Record<Cue, number[][]> = {
  microphone: [[880, 0, .11], [1174.66, .1, .12]],
  question: [[130.81, 0, .6], [196, .15, .5], [261.63, .3, .7]],
  select: [[164.81, 0, .18], [174.61, .12, .22]],
  correct: [[523.25, .35, .2], [659.25, .5, .2], [783.99, .65, .5]],
  wrong: [[196, .35, .3], [146.83, .55, .35], [65.41, .7, .9]],
  stage: [[130.81, 0, .6], [196, .2, .6], [261.63, .4, .6], [392, .6, .8]],
  win: [[261.63, 0, .25], [329.63, .2, .25], [392, .4, .25], [523.25, .6, 1], [659.25, .6, 1], [783.99, .6, 1]],
}

export function useMillionAudio() {
  const enabled = ref(false)
  let context: AudioContext | undefined
  const active = new Set<OscillatorNode>()
  let generation = 0

  function stop() {
    generation++
    for (const oscillator of active) {
      oscillator.stop()
      oscillator.disconnect()
    }
    active.clear()
  }

  async function unlock() {
    if (!enabled.value || !import.meta.client) return
    try {
      context ??= new AudioContext()
      if (context.state === 'suspended') await context.resume()
    } catch { enabled.value = false; stop() }
  }

  async function play(cue: Cue) {
    if (!enabled.value || !import.meta.client) return
    const token = generation
    try {
      await unlock()
      if (token !== generation || !enabled.value || context?.state !== 'running') return
      const now = context.currentTime
      for (const [frequency, offset, duration] of cues[cue]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = cue === 'wrong' ? 'triangle' : 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0, now + offset)
        gain.gain.linearRampToValueAtTime(.055, now + offset + .025)
        gain.gain.exponentialRampToValueAtTime(.001, now + offset + duration)
        oscillator.connect(gain)
        gain.connect(context.destination)
        active.add(oscillator)
        oscillator.onended = () => {
          active.delete(oscillator)
          oscillator.disconnect()
          gain.disconnect()
        }
        oscillator.start(now + offset)
        oscillator.stop(now + offset + duration)
      }
    } catch {
      // Gameplay remains available when audio is unsupported or blocked.
      enabled.value = false
      stop()
    }
  }

  function toggle() {
    enabled.value = !enabled.value
    if (enabled.value) void play('question')
    else stop()
  }

  onBeforeUnmount(() => {
    enabled.value = false
    stop()
    void context?.close().catch(() => {})
  })

  return { enabled, play, stop, toggle, unlock }
}
