import { biographyChunks } from '../../utils/biographySpeech'
import { biographyPerson } from '../utils/biographyPerson'

export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const person = biographyPerson(getQuery(event).personId)
  if (!person) throw createError({ statusCode: 404, statusMessage: 'Biography not found' })
  return {
    available: Boolean(config.azureSpeechKey && /^[a-z0-9-]+$/.test(String(config.azureSpeechRegion))),
    chunks: biographyChunks(person).length,
  }
})
