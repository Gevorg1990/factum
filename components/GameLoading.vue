<script setup lang="ts">
withDefaults(defineProps<{ game?: 'million' | 'genius' | 'logic' }>(), { game: 'million' })
</script>

<template>
  <section class="game-loading panel" :class="`game-loading-${game}`" role="status" aria-live="polite" aria-busy="true">
    <span class="game-loading-emblem" aria-hidden="true">✦</span>
    <h2>Պատրաստում ենք խաղը</h2>
    <p class="muted">Մի պահ, և սկսում ենք…</p>
    <div class="game-loading-bars" aria-hidden="true"><span></span><span></span><span></span></div>
  </section>
</template>

<style scoped>
.game-loading { min-height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 32px; text-align: center; background: radial-gradient(ellipse at top, #b98b3720, transparent 70%), #0b192d; }
.game-loading-emblem { display: grid; place-items: center; width: 76px; height: 76px; border: 1px solid #b98b3766; border-radius: 50%; color: #f2d58b; font-size: 42px; }
.game-loading h2 { font-size: 22px; font-weight: 750; }
.game-loading-bars { display: flex; gap: 8px; margin-top: 8px; }
.game-loading-bars span { width: 40px; height: 4px; border-radius: 4px; background: #f2d58b; animation: game-loading-pulse 1.2s ease-in-out infinite alternate; }
.game-loading-bars span:nth-child(2) { animation-delay: .2s; }
.game-loading-bars span:nth-child(3) { animation-delay: .4s; }
@keyframes game-loading-pulse { from { opacity: .25; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .game-loading-bars span { animation: none; } }
</style>
