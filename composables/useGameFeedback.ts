export function useGameFeedback() {
  const audio = useMillionAudio()
  audio.enabled.value = true
  let timer: ReturnType<typeof setTimeout> | undefined
  function cancelNext() {
    clearTimeout(timer)
    timer = undefined
  }
  function scheduleNext(next: () => void) {
    cancelNext()
    timer = setTimeout(() => {
      timer = undefined
      next()
    }, 2000)
  }
  onBeforeUnmount(cancelNext)
  return { ...audio, scheduleNext, cancelNext }
}
