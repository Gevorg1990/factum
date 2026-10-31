import { gameSpeechText } from '../utils/gameSpeech'
import { synthesizeArmenianSpeech } from '../utils/armenianSpeech'
import type { BiographyVoice } from '../../utils/biographySpeech'

export default defineEventHandler(async event => {
  const body = await readBody<{ topic?: string; reference?: string; direction?: string; voice?: string }>(event)
  const text = gameSpeechText(body)
  if (!text || !['male', 'female'].includes(body?.voice || '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game question or voice' })
  }
  const audio = await synthesizeArmenianSpeech(text, body.voice as BiographyVoice, useRuntimeConfig(event), fetch)
  setHeader(event, 'Content-Type', 'audio/wav')
  setHeader(event, 'Cache-Control', 'private, no-store')
  return audio
})
