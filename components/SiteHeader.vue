<script setup lang="ts">
import { Brain, UserRound, Menu, X } from 'lucide-vue-next'
import { SAVE_ANIMATION_EVENT, animateSaveFlight, type SaveAnimationDetail, type SaveFlight } from '~/utils/saveAnimation'
const nav=[['/','Գլխավոր'],['/subjects','Հանրագիտարան'],['/periodic-table','Մենդելեևի աղյուսակ'],['/globe','Երկրագունդ'],['/bible','Աստվածաշունչ']]
const mobile=ref(false)
function menuBeforeEnter(element: Element) { (element as HTMLElement).style.height = '0px' }
function menuEnter(element: Element) {
  void (element as HTMLElement).offsetHeight
  ;(element as HTMLElement).style.height = `${element.scrollHeight}px`
}
function menuAfterEnter(element: Element) { (element as HTMLElement).style.height = 'auto' }
function menuBeforeLeave(element: Element) { (element as HTMLElement).style.height = `${element.scrollHeight}px` }
function menuLeave(element: Element) {
  void (element as HTMLElement).offsetHeight
  ;(element as HTMLElement).style.height = '0px'
}
useProgress()
const savePulse = ref(false)
const flights = new Set<SaveFlight>()
let disposed = false
let pulseTimer: ReturnType<typeof setTimeout> | undefined
async function pulseSavedButton() {
  clearTimeout(pulseTimer)
  savePulse.value = false
  await nextTick()
  if (disposed) return
  savePulse.value = true
  pulseTimer = setTimeout(() => { savePulse.value = false }, 900)
}
async function handleSaveAnimation(event: Event) {
  const target = document.querySelector<HTMLElement>('[data-save-target]')
  const origin = (event as CustomEvent<SaveAnimationDetail>).detail?.origin
  if (!target || !origin || typeof target.animate !== 'function') {
    void pulseSavedButton()
    return
  }
  const rect = target.getBoundingClientRect()
  let flight: SaveFlight
  try {
    flight = animateSaveFlight(origin, { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 })
  } catch {
    void pulseSavedButton()
    return
  }
  flights.add(flight)
  const arrived = await flight.finished
  flights.delete(flight)
  if (arrived && !disposed) void pulseSavedButton()
}
onMounted(() => { window.addEventListener(SAVE_ANIMATION_EVENT, handleSaveAnimation) })
onUnmounted(() => {
  disposed = true
  window.removeEventListener(SAVE_ANIMATION_EVENT, handleSaveAnimation)
  clearTimeout(pulseTimer)
  flights.forEach(flight => flight.cancel())
  flights.clear()
})
</script>
<template>
<header class="factum-header"><div class="header-inner">
<NuxtLink to="/" class="brand" aria-label="FACTUM գլխավոր էջ"><span class="brand-icon"><Brain :size="38" :stroke-width="1.4"/></span><span><strong>FACTUM</strong><small>ԳԻՏԵԼԻՔԻ ԱՇԽԱՐՀ</small></span></NuxtLink>
<nav class="desktop-nav" aria-label="Հիմնական նավիգացիա"><NuxtLink v-for="item in nav" :key="item[0]" :to="item[0]" active-class="nav-active">{{item[1]}}</NuxtLink></nav>
<div class="header-actions"><NuxtLink to="/profile" aria-label="Իմ FACTUM-ը" data-save-target class="sign-in" :class="{ 'save-pulse': savePulse }"><UserRound :size="17"/> Իմ FACTUM-ը<span v-if="savePulse" class="save-sparkle" aria-hidden="true">✦</span></NuxtLink><span class="sr-only" role="status">{{ savePulse ? 'Ավելացվեց Իմ FACTUM-ում' : '' }}</span><button class="mobile-menu" :aria-label="mobile ? 'Փակել ընտրացանկը' : 'Բացել ընտրացանկը'" :aria-expanded="mobile" aria-controls="mobile-site-nav" @click="mobile=!mobile"><X v-if="mobile"/><Menu v-else/></button></div>
</div><Transition name="mobile-nav" @before-enter="menuBeforeEnter" @enter="menuEnter" @after-enter="menuAfterEnter" @before-leave="menuBeforeLeave" @leave="menuLeave"><div v-if="mobile" id="mobile-site-nav" class="mobile-nav-collapse"><div class="mobile-nav-clip"><nav class="mobile-nav" aria-label="Մոբայլ նավիգացիա"><NuxtLink v-for="item in nav" :key="item[0]" :to="item[0]" @click="mobile=false">{{item[1]}}</NuxtLink></nav></div></div></Transition></header>
</template>

<style scoped>
.factum-header { position: sticky; top: 0; z-index: 60; isolation: isolate; }
@media (max-width: 800px) {
  .factum-header { padding-top: env(safe-area-inset-top, 0px); }
  .header-inner {
    height: auto;
    min-height: 70px;
    padding-top: 14px;
    padding-bottom: 14px;
  }
}
.mobile-nav-collapse { overflow: hidden; opacity: 1; }
.mobile-nav-clip { min-height: 0; overflow: hidden; }
.mobile-nav-enter-active, .mobile-nav-leave-active { transition: height .4s ease, opacity .35s ease, transform .4s ease; }
.mobile-nav-enter-from, .mobile-nav-leave-to { opacity: 0; transform: translateY(-8px); }
.mobile-nav a[aria-current="page"] { color: #dfc38f; }
.sign-in { position: relative; }
@media (max-width: 480px) {
  .sign-in { justify-content: center; gap: 0; width: 36px; height: 36px; padding: 0; flex-shrink: 0; }
  .sign-in > svg { flex-shrink: 0; }
}
.sign-in.save-pulse { animation: factum-save-pulse .85s ease-out; }
.save-sparkle {
  position: absolute;
  right: -5px;
  top: -10px;
  font-size: 22px;
  color: #ffe2a2;
  pointer-events: none;
  text-shadow: 0 0 12px #efb44f;
  animation: factum-save-sparkle .85s ease-out both;
}
@keyframes factum-save-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 #f4c46c00; }
  35% { transform: scale(1.06); box-shadow: 0 0 0 5px #f4c46c30, 0 0 22px #f4c46c45; }
  70% { transform: scale(1.01); box-shadow: 0 0 0 10px #f4c46c00; }
}
@keyframes factum-save-sparkle {
  0% { opacity: 0; transform: translateY(6px) scale(.4) rotate(-30deg); }
  35% { opacity: 1; transform: translateY(0) scale(1.15) rotate(10deg); }
  100% { opacity: 0; transform: translateY(-12px) scale(.65) rotate(35deg); }
}
@media (prefers-reduced-motion: reduce) {
  .sign-in.save-pulse { animation: none; box-shadow: 0 0 0 2px #f4c46c; }
  .save-sparkle { animation: none; }
  .mobile-nav-enter-active, .mobile-nav-leave-active { transition: none; }
}
</style>

<style>
.factum-save-flight, .factum-save-origin-glow {
  position: fixed; z-index: 2147483647; pointer-events: none;
  width: 22px; height: 22px; border-radius: 50%;
  background: radial-gradient(circle, #fffbe0 0%, #ffe8a0 22%, #f3bd51 45%, #e5a52c00 75%);
  box-shadow: 0 0 12px #ffd474, 0 0 28px #e8ac4dbb;
  will-change: transform, opacity;
}
.factum-save-flight::before, .factum-save-flight::after {
  content: ''; position: absolute; inset: 9px -7px; border-radius: 50%;
  background: #fff4c8; box-shadow: 0 0 8px #ffe4a1;
}
.factum-save-flight::after { transform: rotate(90deg); }
.factum-save-trail { width: 7px; height: 7px; }
.factum-save-trail::before, .factum-save-trail::after { display: none; }
.factum-save-origin-glow { width: 50px; height: 50px; background: radial-gradient(circle, #ffe8a055, #f3bd5100 70%); }
</style>
