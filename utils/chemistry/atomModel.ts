import { periodicElements } from '../../data/periodicTable'
import isotopeData from '../../data/chemistry/atomIsotopes.json'

export type AtomIsotope = { massNumber: number; abundance: number | null }
export type ElectronSubshell = { n: number; l: number; label: string; count: number }
export type ElectronShell = { number: number; count: number }
export type AtomModel = {
  number: number
  massNumber: number
  protons: number
  neutrons: number
  electrons: number
  shells: ElectronShell[]
  subshells: ElectronSubshell[]
  configurationPredicted: boolean
}
export const atomIsotopeSource = isotopeData.source

export function atomIsotopes(number: number): readonly AtomIsotope[] {
  return (isotopeData.elements as Record<string, AtomIsotope[]>)[String(number)] || []
}

/** Pick a stated isotope, never a rounded relative atomic weight. */
export function defaultIsotope(number: number): number | null {
  const isotopes = atomIsotopes(number)
  if (!isotopes.length) return null
  return isotopes.reduce((chosen, isotope) => (isotope.abundance ?? -1) > (chosen.abundance ?? -1) ? isotope : chosen).massNumber
}

/** Expand the existing PubChem configuration, including noble-gas cores and exceptions. */
export function electronSubshells(number: number): ElectronSubshell[] {
  const element = periodicElements.find(item => item.number === number)
  if (!element) throw new Error('Unknown element')
  const counts = new Map<string, ElectronSubshell>()
  const expand = (configuration: string, seen = new Set<string>()) => {
    let remaining = configuration.replace(/\s*\((?:calculated|predicted)\)/g, '').replace(/\[([A-Z][a-z]?)\]/g, (_, symbol: string) => {
      const core = periodicElements.find(item => item.symbol === symbol)
      if (!core || seen.has(symbol)) throw new Error('Invalid electron core')
      expand(core.electronConfiguration, new Set([...seen, symbol]))
      return ''
    })
    remaining = remaining.replace(/([1-7])([spdfgh])(\d+)/g, (_, shell: string, orbital: string, occupation: string) => {
      const count = Number(occupation)
      const capacity = { s: 2, p: 6, d: 10, f: 14, g: 18, h: 22 }[orbital]!
      if (count > capacity || count < 1) throw new Error('Invalid orbital occupation')
      const label = shell + orbital
      counts.set(label, { n: Number(shell), l: 'spdfgh'.indexOf(orbital), label, count: (counts.get(label)?.count || 0) + count })
      return ''
    })
    if (remaining.trim()) throw new Error('Unsupported electron configuration')
  }
  expand(element.electronConfiguration)
  const subshells = [...counts.values()].sort((a, b) => a.n - b.n || a.l - b.l)
  if (subshells.reduce((sum, item) => sum + item.count, 0) !== number) throw new Error('Electron count does not match atomic number')
  return subshells
}

export function electronShells(number: number): ElectronShell[] {
  const counts = new Map<number, number>()
  for (const item of electronSubshells(number)) counts.set(item.n, (counts.get(item.n) || 0) + item.count)
  return [...counts].map(([shell, count]) => ({ number: shell, count }))
}

export function createAtomModel(number: number, massNumber: number): AtomModel {
  const element = periodicElements.find(item => item.number === number)
  if (!element || !atomIsotopes(number).some(isotope => isotope.massNumber === massNumber)) throw new Error('Unlisted isotope')
  return {
    number, massNumber, protons: element.number, neutrons: massNumber - element.number,
    electrons: element.number, shells: electronShells(number), subshells: electronSubshells(number), configurationPredicted: element.configurationPredicted || /\((?:calculated|predicted)\)/.test(element.electronConfiguration),
  }
}
