export default defineNuxtPlugin(() => {
  // FACTUM always uses its original dark theme.
  document.documentElement.classList.remove('factum-light')
  try { localStorage.removeItem('factum-theme') } catch { /* Storage may be unavailable. */ }
})
