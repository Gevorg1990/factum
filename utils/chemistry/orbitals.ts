/** Non-relativistic hydrogenic basis, Z=1, r in Bohr radii; real harmonics are linear combinations of ±m. */
export type OrbitalSelection = { n: number; l: number; m: number }
export type OrbitalCloud = {
  positions: Float32Array
  phases: Int8Array
  radius95: number
  integratedProbability: number
}
export const orbitalSource = 'https://www.ocw.mit.edu/courses/5-61-physical-chemistry-fall-2007/c2078ff25c61c136e67ceb6fd8eb9b34_lecture21to22.pdf'
const labels: Record<number, Record<number, string>> = {
  0: { 0: 's' },
  1: { 1: 'p_x', '-1': 'p_y', 0: 'p_z' },
  2: { 2: 'd_(x²−y²)', '-2': 'd_xy', 1: 'd_xz', '-1': 'd_yz', 0: 'd_z²' },
  3: { 3: 'f_x(x²−3y²)', '-3': 'f_y(3x²−y²)', 2: 'f_z(x²−y²)', '-2': 'f_xyz', 1: 'f_x(5z²−r²)', '-1': 'f_y(5z²−r²)', 0: 'f_z(5z²−3r²)' },
}
export function orbitalOrientations(l: number): { m: number; label: string }[] {
  return Object.entries(labels[l] || {}).map(([m, label]) => ({ m: Number(m), label }))
}
export function orbitalLabel(orbital: OrbitalSelection): string {
  return `${orbital.n}${labels[orbital.l]?.[orbital.m] || '?'}`
}
function validate({ n, l, m }: OrbitalSelection) {
  if (![n, l, m].every(Number.isInteger) || n < 1 || n > 7 || l < 0 || l > 3 || l >= n || Math.abs(m) > l) throw new Error('Invalid orbital')
}
function factorial(n: number): number {
  let value = 1
  for (let i = 2; i <= n; i++) value *= i
  return value
}
export function laguerre(k: number, alpha: number, x: number): number {
  if (k === 0) return 1
  let previous = 1, current = 1 + alpha - x
  for (let i = 2; i <= k; i++) {
    const next = ((2 * i - 1 + alpha - x) * current - (i - 1 + alpha) * previous) / i
    previous = current; current = next
  }
  return current
}
export function radialWavefunction(n: number, l: number, r: number): number {
  if (!Number.isFinite(r) || r < 0 || n < 1 || l < 0 || l >= n) return 0
  const rho = 2 * r / n
  const norm = Math.sqrt((2 / n) ** 3 * factorial(n - l - 1) / (2 * n * factorial(n + l)))
  return norm * Math.exp(-rho / 2) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho)
}
function associatedLegendre(l: number, m: number, x: number): number {
  let pmm = 1
  for (let i = 1; i <= m; i++) pmm *= -(2 * i - 1) * Math.sqrt(Math.max(0, 1 - x * x))
  if (l === m) return pmm
  let previous = pmm, current = x * (2 * m + 1) * pmm
  for (let degree = m + 2; degree <= l; degree++) {
    const next = ((2 * degree - 1) * x * current - (degree + m - 1) * previous) / (degree - m)
    previous = current; current = next
  }
  return current
}
export function realSphericalHarmonic(l: number, m: number, cosTheta: number, phi: number): number {
  const order = Math.abs(m)
  const norm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * factorial(l - order) / factorial(l + order))
  const base = norm * associatedLegendre(l, order, Math.max(-1, Math.min(1, cosTheta)))
  return m === 0 ? base : Math.SQRT2 * base * (m > 0 ? Math.cos(order * phi) : Math.sin(order * phi))
}
export function orbitalAmplitude(orbital: OrbitalSelection, x: number, y: number, z: number): number {
  validate(orbital)
  const r = Math.hypot(x, y, z)
  return radialWavefunction(orbital.n, orbital.l, r) * realSphericalHarmonic(orbital.l, orbital.m, r ? z / r : 1, Math.atan2(y, x))
}
export function orbitalDensity(orbital: OrbitalSelection, x: number, y: number, z: number): number {
  return orbitalAmplitude(orbital, x, y, z) ** 2
}
export type RadialDistribution = { radii: Float64Array; cdf: Float64Array; integratedProbability: number }
const radialCache = new Map<string, RadialDistribution>()
export function radialDistribution(n: number, l: number): RadialDistribution {
  validate({ n, l, m: 0 })
  const key = `${n}:${l}`
  if (radialCache.has(key)) return radialCache.get(key)!
  const steps = 4096, radius = 12 * n * n
  const radii = new Float64Array(steps + 1), cdf = new Float64Array(steps + 1)
  let previousDensity = 0
  for (let i = 1; i <= steps; i++) {
    const r = radius * (i / steps) ** 2
    const density = r * r * radialWavefunction(n, l, r) ** 2
    radii[i] = r
    cdf[i] = cdf[i - 1]! + (density + previousDensity) * (r - radii[i - 1]!) / 2
    previousDensity = density
  }
  const integratedProbability = cdf[steps]!
  if (!Number.isFinite(integratedProbability) || Math.abs(integratedProbability - 1) > .001) throw new Error('Orbital normalization failed')
  for (let i = 0; i <= steps; i++) cdf[i] = cdf[i]! / integratedProbability
  const result = { radii, cdf, integratedProbability }
  if (radialCache.size >= 24) radialCache.delete(radialCache.keys().next().value!)
  radialCache.set(key, result)
  return result
}
export function radialQuantile(distribution: RadialDistribution, u: number): number {
  let low = 1, high = distribution.cdf.length - 1
  while (low < high) {
    const middle = (low + high) >>> 1
    if (distribution.cdf[middle]! < u) low = middle + 1
    else high = middle
  }
  const before = distribution.cdf[low - 1]!, after = distribution.cdf[low]!
  const t = after > before ? (u - before) / (after - before) : 0
  return distribution.radii[low - 1]! + t * (distribution.radii[low]! - distribution.radii[low - 1]!)
}
function randomGenerator(seed: number) {
  let state = seed >>> 0
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return (state + .5) / 4294967296 }
}
/** Sample r²|R|² dr and |Y|² dΩ independently; every point represents a possible observation, not an electron. */
export function sampleOrbital(orbital: OrbitalSelection, count = 12000, seed = 1969): OrbitalCloud {
  validate(orbital)
  if (!Number.isInteger(count) || count < 128 || count > 20000) throw new Error('Invalid sample count')
  const radial = radialDistribution(orbital.n, orbital.l)
  const random = randomGenerator(seed)
  const positions = new Float32Array(count * 3), phases = new Int8Array(count)
  const bound = (2 * orbital.l + 1) / (4 * Math.PI)
  for (let i = 0; i < count; i++) {
    const r = radialQuantile(radial, random())
    let cosTheta = 0, phi = 0, angular = 0, accepted = false
    for (let attempt = 0; attempt < 2048; attempt++) {
      cosTheta = 2 * random() - 1
      phi = 2 * Math.PI * random()
      angular = realSphericalHarmonic(orbital.l, orbital.m, cosTheta, phi)
      if (random() * bound <= angular * angular) { accepted = true; break }
    }
    if (!accepted) throw new Error('Angular sampling failed')
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
    positions[3 * i] = r * sinTheta * Math.cos(phi)
    positions[3 * i + 1] = r * sinTheta * Math.sin(phi)
    positions[3 * i + 2] = r * cosTheta
    phases[i] = radialWavefunction(orbital.n, orbital.l, r) * angular >= 0 ? 1 : -1
  }
  return { positions, phases, radius95: radialQuantile(radial, .95), integratedProbability: radial.integratedProbability }
}
