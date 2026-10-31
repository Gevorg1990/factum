import { armenianPeople } from '../../data/content'

export function biographyPerson(id: unknown) {
  return typeof id === 'string' ? armenianPeople.find(person => person.id === id) : undefined
}
