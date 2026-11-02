export const SAVE_ANIMATION_EVENT = 'factum:save-animation'
export type SaveAnimationOrigin = { x: number; y: number }
export type SaveAnimationDetail = { origin?: SaveAnimationOrigin }
export type SaveFlight = { finished: Promise<boolean>; cancel: () => void }

export function requestSaveAnimation(event?: Event) {
  if (typeof window === 'undefined') return
  const source = event?.currentTarget instanceof Element ? event.currentTarget : document.activeElement
  const rect = source?.getBoundingClientRect()
  const origin = rect && rect.width && rect.height ? { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 } : undefined
  window.dispatchEvent(new CustomEvent<SaveAnimationDetail>(SAVE_ANIMATION_EVENT, { detail:{origin} }))
}

/** Viewport coordinates keep the flight aligned with a sticky header. */
export function animateSaveFlight(origin: SaveAnimationOrigin, destination: SaveAnimationOrigin): SaveFlight {
  const nodes: HTMLElement[] = []
  const animations: Animation[] = []
  let cancelled = false
  const create = (className: string) => {
    const node = document.createElement('span')
    node.className = className
    node.setAttribute('aria-hidden', 'true')
    node.style.left = `${origin.x}px`
    node.style.top = `${origin.y}px`
    document.body.appendChild(node)
    nodes.push(node)
    return node
  }
  const dx = destination.x - origin.x
  const dy = destination.y - origin.y
  try {
  animations.push(create('factum-save-origin-glow').animate([
    { transform:'translate(-50%, -50%) scale(.3)', opacity:0 },
    { transform:'translate(-50%, -50%) scale(1)', opacity:1, offset:.3 },
    { transform:'translate(-50%, -50%) scale(2.2)', opacity:0 },
  ], { duration:420, easing:'ease-out', fill:'both' }))
  for (let i = 0; i < 6; i++) {
    const node = create(i === 0 ? 'factum-save-flight' : 'factum-save-flight factum-save-trail')
    const delay = i * 24
    animations.push(node.animate([
      { transform:'translate(-50%, -50%) scale(.3)', opacity:0 },
      { transform:`translate(calc(-50% + ${dx * .12}px), calc(-50% + ${dy * .2 - 45}px)) scale(1)`, opacity:1, offset:.22 },
      { transform:`translate(calc(-50% + ${dx * .55}px), calc(-50% + ${dy * .65 - 70}px)) scale(.85)`, opacity:.95, offset:.65 },
      { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.12)`, opacity:0 },
    ], { duration:950 - delay, delay, easing:'cubic-bezier(.25,.1,.3,1)', fill:'both' }))
  }
  } catch (error) {
    animations.forEach(animation => { void animation.finished.catch(() => {}); animation.cancel() })
    nodes.forEach(node => node.remove())
    throw error
  }
  const remove = () => { nodes.forEach(node => node.remove()) }
  const finished = Promise.all(animations.map(animation => animation.finished.catch(() => { cancelled = true })))
    .then(() => { remove(); return !cancelled })
  return { finished, cancel:() => { cancelled = true; animations.forEach(animation => animation.cancel()); remove() } }
}
