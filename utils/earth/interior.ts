import { EARTH_RADIUS, earthLayers, temperatureAnchors } from '../../data/earth/interior'
export function clampDepth(depth: number) { return Number.isFinite(depth) ? Math.max(0, Math.min(EARTH_RADIUS, depth)) : 0 }
export function layerAtDepth(depth: number) {
  const d = clampDepth(depth)
  return earthLayers.find(layer => d < layer.bottom) || earthLayers[3]
}
export function temperatureAtDepth(depth: number) {
  const d = clampDepth(depth)
  const index = Math.max(1, temperatureAnchors.findIndex(point => point.depth >= d))
  const a = temperatureAnchors[index - 1]!, b = temperatureAnchors[index]!
  const t = (d - a.depth) / (b.depth - a.depth)
  return { low: a.low + t * (b.low - a.low), high: a.high + t * (b.high - a.high) }
}
/** Density (kg/m³), original PREM Table I polynomials, including ocean. */
export function premDensity(radiusKm: number) {
  const r = Math.max(0, Math.min(EARTH_RADIUS, radiusKm)), x = r / EARTH_RADIUS
  const rho = r < 1221.5 ? 13.0885 - 8.8381 * x ** 2
    : r < 3480 ? 12.5815 - 1.2638 * x - 3.6426 * x ** 2 - 5.5281 * x ** 3
    : r < 5701 ? 7.9565 - 6.4761 * x + 5.5283 * x ** 2 - 3.0807 * x ** 3
    : r < 5771 ? 5.3197 - 1.4836 * x
    : r < 5971 ? 11.2494 - 8.0298 * x
    : r < 6151 ? 7.1089 - 3.8045 * x
    : r < 6346.6 ? 2.6910 + .6924 * x
    : r < 6356 ? 2.9 : r < 6368 ? 2.6 : 1.02
  return rho * 1000
}
let profile: { radii: number[]; pressures: number[]; mass: number } | undefined
/** Integrate dM=4πr²ρdr outward then dP=-ρGM/r² dr inward.
 * Exact discontinuities included; midpoint quadrature <=2 km; P(surface)=0 gauge.
 */
export function pressureProfile() {
  if (profile) return profile
  const radii = [...new Set([0, EARTH_RADIUS, 1221.5, 3480, 5701, 5771, 5971, 6151, 6346.6, 6356, 6368, ...Array.from({ length: 3186 }, (_, i) => i * 2)])].sort((a,b) => a-b)
  const masses = [0], increments = [0], G = 6.67430e-11
  for (let i=1;i<radii.length;i++) {
    const a=radii[i-1]! * 1000, b=radii[i]! * 1000, r=(a+b)/2, rho=premDensity(r/1000)
    const shellMass=4*Math.PI/3*rho*(b**3-a**3)
    const m=masses[i-1]! + shellMass/2
    masses.push(masses[i-1]!+shellMass)
    increments.push(rho*G*m/(r*r)*(b-a)/1e9)
  }
  const pressures = Array<number>(radii.length).fill(0)
  for(let i=radii.length-2;i>=0;i--) pressures[i]=pressures[i+1]!+increments[i+1]!
  return profile={radii,pressures,mass:masses.at(-1)!}
}
export function pressureAtDepth(depth: number) {
  const {radii,pressures}=pressureProfile(), r=EARTH_RADIUS-clampDepth(depth)
  let low=1,high=radii.length-1
  while(low<high) { const m=(low+high)>>>1; if(radii[m]!<r) low=m+1; else high=m }
  const a=radii[low-1]!,b=radii[low]!,t=(r-a)/(b-a)
  return pressures[low-1]!*(1-t)+pressures[low]!*t
}
export function advanceJourney(depth: number, seconds: number, speed = 160) { return clampDepth(clampDepth(depth) + Math.max(0,Math.min(seconds,.1))*speed) }
