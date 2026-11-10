import { biographyChunks, type BiographyVoice } from '../../utils/biographySpeech'
import { biographyPerson } from '../utils/biographyPerson'

import { synthesizeArmenianSpeech } from '../utils/armenianSpeech'

export default defineEventHandler(async event => {
  const body = await readBody<{ personId?: string; voice?: string; part?: number }>(event)
  const person = await biographyPerson(body?.personId)
  const parts = person ? biographyChunks(person) : []
  if (!person || !['female', 'male'].includes(body.voice || '') ||
      !Number.isInteger(body.part) || body.part! < 0 || body.part! >= parts.length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid biography, voice or part' })
  }
  const audio = await synthesizeArmenianSpeech(parts[body.part!], body.voice as BiographyVoice, useRuntimeConfig(event), fetch)
  setHeader(event, 'Content-Type', 'audio/wav')
  setHeader(event, 'Cache-Control', 'private, no-store')
  return audio
})
