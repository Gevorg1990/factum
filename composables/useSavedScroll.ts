/** Restore an explicit saved destination after Nuxt finishes replacing the page. */
export function useSavedScroll(target: () => string | undefined, prepare?: () => void) {
  const route = useRoute()
  const nuxtApp = useNuxtApp()
  let mounted = false
  let version = 0
  let frame = 0
  async function navigate() {
    const current = ++version
    cancelAnimationFrame(frame)
    if (!mounted) return
    const id = target()
    if (!id) return
    prepare?.()
    await nextTick()
    if (current !== version) return
    // Router scroll restoration and page rendering must finish first.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (current !== version) return
        const element = document.getElementById(id)
        element?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        })
        element?.focus({ preventScroll: true })
      })
    })
  }
  onMounted(() => { mounted = true; void navigate() })
  watch(() => route.fullPath, navigate, { flush: 'post' })
  const removeHook = nuxtApp.hook('page:finish', navigate)
  onBeforeUnmount(() => {
    mounted = false
    version++
    cancelAnimationFrame(frame)
    removeHook()
  })
}
