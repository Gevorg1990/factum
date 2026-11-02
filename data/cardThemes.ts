import { FlaskConical, Atom, Orbit, Landmark, Leaf, Cpu, Dna, Globe2, Calculator, Languages, Film, Music, Users, BookOpen, BookOpenCheck, Grid3X3 } from 'lucide-vue-next'

export const cardThemes = {
  chemistry: { color:'#34d399', icon:FlaskConical },
  physics: { color:'#38bdf8', icon:Atom },
  space: { color:'#a78bfa', icon:Orbit },
  history: { color:'#fbbf24', icon:Landmark },
  nature: { color:'#a3e635', icon:Leaf },
  technology: { color:'#22d3ee', icon:Cpu },
  biology: { color:'#2dd4bf', icon:Dna },
  geography: { color:'#60a5fa', icon:Globe2 },
  mathematics: { color:'#fb923c', icon:Calculator },
  linguistics: { color:'#e879f9', icon:Languages },
  cinema: { color:'#f97373', icon:Film },
  music: { color:'#f472b6', icon:Music },
  'periodic-table': { color:'#86efac', icon:Grid3X3 },
  people: { color:'#facc99', icon:Users },
  bible: { color:'#e9d5a1', icon:BookOpen },
} as const

export function cardTheme(id: string) {
  return cardThemes[id as keyof typeof cardThemes] ?? {color:'#dfc38f',icon:BookOpenCheck}
}
export const gameAccents: Record<string,string> = { million:'#f5c76c', genius:'#65baff', logic:'#bd9bff' }
