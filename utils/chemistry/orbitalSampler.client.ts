import { sampleOrbital } from './orbitals'
import type { OrbitalCloud, OrbitalSelection } from './orbitals'
/** One active request; terminate stale jobs so rapid selection never builds a work queue. */
export function createOrbitalSampler() {
  let worker: Worker | undefined
  let pending: { reject: (reason: Error) => void } | undefined
  let generation = 0, disposed = false
  const cache = new Map<string, OrbitalCloud>()
  function cancel() {
    generation++
    worker?.terminate(); worker = undefined
    pending?.reject(new Error('Cancelled')); pending = undefined
  }
  async function sample(orbital: OrbitalSelection): Promise<OrbitalCloud> {
    cancel()
    if (disposed) throw new Error('Disposed')
    const key = `${orbital.n}:${orbital.l}:${orbital.m}`
    if (cache.has(key)) return cache.get(key)!
    const id = generation
    const cloud = await new Promise<OrbitalCloud>((resolve, reject) => {
      pending = { reject }
      if (typeof Worker === 'undefined') {
        setTimeout(() => {
          if (disposed || id !== generation) return
          try { resolve(sampleOrbital(orbital)) } catch (error) { reject(error) }
        }, 0)
        return
      }
      try {
        worker = new Worker(new URL('./orbitalWorker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = ({ data }) => {
          if (data.id !== id) return
          data.error ? reject(new Error('Orbital sampling failed')) : resolve(data.cloud)
        }
        worker.onerror = () => reject(new Error('Orbital worker failed'))
        worker.postMessage({ id, orbital })
      } catch (error) { reject(error) }
    }).finally(() => {
      if (id === generation) { worker?.terminate(); worker = undefined; pending = undefined }
    })
    if (disposed || id !== generation) throw new Error('Cancelled')
    if (cache.size >= 8) cache.delete(cache.keys().next().value!)
    cache.set(key, cloud)
    return cloud
  }
  return { sample, cancel, dispose() { disposed = true; cancel(); cache.clear() } }
}
