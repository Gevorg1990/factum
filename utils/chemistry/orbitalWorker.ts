import { sampleOrbital } from './orbitals'
import type { OrbitalSelection } from './orbitals'
const scope = self as unknown as { onmessage: ((event: MessageEvent<{ id: number; orbital: OrbitalSelection }>) => void) | null; postMessage: (data: unknown, transfer?: Transferable[]) => void }
scope.onmessage = ({ data }) => {
  try {
    const cloud = sampleOrbital(data.orbital)
    scope.postMessage({ id: data.id, cloud }, [cloud.positions.buffer as ArrayBuffer, cloud.phases.buffer as ArrayBuffer])
  } catch { scope.postMessage({ id: data.id, error: true }) }
}
