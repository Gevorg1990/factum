import { armenianPeople } from '../../data/content'
import type { Person } from '../../data/personTypes'

export async function biographyPerson(id: unknown): Promise<Person | undefined> {
  if (typeof id !== 'string' || !id || id.length > 250) return undefined
  if (!process.env.DATABASE_URL) return armenianPeople.find(person => person.id === id)
  // Match the public page: read the published snapshot, never an editor's draft.
  // A configured database is authoritative, including archived/deleted people.
  const { db } = await import('./db')
  const record = await db.content.findUnique({
    where: { kind_key: { kind: 'PERSON', key: id } },
    select: { publishedData: true },
  })
  const person = record?.publishedData as unknown as Person | undefined
  return person?.isArmenian === true ? person : undefined
}
