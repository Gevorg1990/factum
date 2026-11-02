export type Disintegration = { finished: Promise<void>; cancel: () => void }

// Draw only the clicked card. No screenshot service, font request or image download.
function cardSnapshot(element: HTMLElement, width: number, height: number) {
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 640 / width, 560 / height)
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const context = canvas.getContext('2d')
  if (!context) return null
  context.scale(scale, scale)
  const origin = element.getBoundingClientRect()
  const rootStyle = getComputedStyle(element)
  context.fillStyle = document.documentElement.classList.contains('factum-light') ? '#f4f7fc' : '#0b192c'
  context.beginPath()
  context.roundRect(0, 0, width, height, parseFloat(rootStyle.borderRadius) || 18)
  context.fill()
  context.strokeStyle = rootStyle.borderColor
  context.stroke()
  for (const child of Array.from(element.querySelectorAll<HTMLElement>('*')).slice(0, 60)) {
    const style = getComputedStyle(child)
    if (!style.backgroundColor || style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') continue
    const rect = child.getBoundingClientRect()
    context.fillStyle = style.backgroundColor
    context.beginPath()
    context.roundRect(rect.left - origin.left, rect.top - origin.top, rect.width, rect.height, parseFloat(style.borderRadius) || 0)
    context.fill()
  }
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  context.textBaseline = 'top'
  let node: Node | null
  let words = 0
  while ((node = walker.nextNode()) && words < 220) {
    const parent = node.parentElement
    if (!parent || parent.closest('svg')) continue
    const style = getComputedStyle(parent)
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    context.fillStyle = style.color
    for (const match of (node.textContent || '').matchAll(/\S+/gu)) {
      if (++words > 220) break
      range.setStart(node, match.index!)
      range.setEnd(node, match.index! + match[0].length)
      const rect = range.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      context.fillText(match[0], rect.left - origin.left, rect.top - origin.top)
    }
  }
  return canvas
}

export function disintegrate(element: HTMLElement): Disintegration {
  let resolve!: () => void
  const finished = new Promise<void>(done => { resolve = done })
  let frame = 0
  let timeout: ReturnType<typeof setTimeout> | undefined
  let overlay: HTMLCanvasElement | undefined
  let settled = false
  const opacity = element.style.opacity
  function cancel() {
    if (settled) return
    settled = true
    cancelAnimationFrame(frame)
    clearTimeout(timeout)
    overlay?.remove()
    element.style.opacity = opacity
    resolve()
  }
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancel()
      return { finished, cancel }
    }
    const rect = element.getBoundingClientRect()
    if (!rect.width || !rect.height) { cancel(); return { finished, cancel } }
    const snapshot = cardSnapshot(element, rect.width, rect.height)
    if (!snapshot) { cancel(); return { finished, cancel } }
    const padding = 100
    overlay = document.createElement('canvas')
    const width = rect.width + padding * 2
    const height = rect.height + padding * 2
    const scale = Math.min(window.devicePixelRatio || 1, 1.5)
    overlay.width = Math.ceil(width * scale)
    overlay.height = Math.ceil(height * scale)
    Object.assign(overlay.style, {
      position: 'fixed', left: `${rect.left - padding}px`, top: `${rect.top - padding}px`,
      width: `${width}px`, height: `${height}px`, pointerEvents: 'none', zIndex: '1000',
    })
    overlay.setAttribute('aria-hidden', 'true')
    const context = overlay.getContext('2d')
    if (!context) { cancel(); return { finished, cancel } }
    context.scale(scale, scale)
    const cell = Math.max(7, Math.sqrt(rect.width * rect.height / 700))
    const particles: { x: number; y: number; w: number; h: number; delay: number; dx: number; dy: number; turn: number }[] = []
    for (let y = 0; y < rect.height; y += cell) {
      for (let x = 0; x < rect.width; x += cell) {
        particles.push({ x, y, w: Math.min(cell, rect.width - x), h: Math.min(cell, rect.height - y),
          delay: (x / rect.width) * 260 + Math.random() * 100,
          dx: 25 + Math.random() * 65, dy: -20 - Math.random() * 65, turn: (Math.random() - .5) * 2 })
      }
    }
    document.body.appendChild(overlay)
    element.style.opacity = '0'
    let start: number | undefined
    function draw(now: number) {
      if (settled || !context) return
      start ??= now
      const elapsed = now - start
      context.clearRect(0, 0, width, height)
      for (const p of particles) {
        const progress = Math.max(0, Math.min(1, (elapsed - p.delay) / 750))
        if (progress >= 1) continue
        context.save()
        context.globalAlpha = 1 - progress
        context.translate(padding + p.x + p.w / 2 + p.dx * progress, padding + p.y + p.h / 2 + p.dy * progress)
        context.rotate(p.turn * progress)
        context.drawImage(snapshot!, p.x / rect.width * snapshot!.width, p.y / rect.height * snapshot!.height,
          p.w / rect.width * snapshot!.width, p.h / rect.height * snapshot!.height,
          -p.w / 2, -p.h / 2, p.w * (1 - progress * .5), p.h * (1 - progress * .5))
        context.restore()
      }
      if (elapsed >= 1120) cancel()
      else frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    // Background tabs and interrupted animation frames must never block removal.
    timeout = setTimeout(cancel, 1400)
  } catch { cancel() }
  return { finished, cancel }
}
