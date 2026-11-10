export type PersonCategory = 'Գրականություն' | 'Մշակույթ և պատմություն' | 'Կերպարվեստ և ճարտարապետություն' | 'Երաժշտություն' | 'Կինո և թատրոն' | 'Գիտություն և տեխնոլոգիա' | 'Սպորտ' | 'Պետական և ռազմական գործիչներ'
export interface PersonWork { description: string; significance: string; type?: string; date?: string; group?: string; sources?: { name: string; url: string }[] }
export interface Person {
  id: string
  name: string
  years: string
  role: string
  bio: string
  works: string[]
  isArmenian?: boolean
  category?: PersonCategory
  source?: { name: string; url: string }
  portrait?: string
  portraitTitle?: string
  portraitLanguage?: 'hy' | 'en'
  biographySections?: { title: string; text: string }[]
  timeline?: { date: string; text: string }[]
  biographyDocument?: { name: string; url: string }
  workInformation?: Record<string, PersonWork>
}
