import { createHash } from 'node:crypto'
import { biographySsml, type BiographyVoice } from '../../utils/biographySpeech'

type SpeechConfig = { azureSpeechKey?: unknown; azureSpeechRegion?: unknown }
function speechError(options: { statusCode: number; statusMessage: string; data?: unknown }) {
  return Object.assign(new Error(options.statusMessage), options)
}
export function armenianSpeechAvailable(config: SpeechConfig) {
  return Boolean(config.azureSpeechKey && /^[a-z0-9-]+$/.test(String(config.azureSpeechRegion || '')))
}
const cache = new Map<string, { audio: Buffer; expires: number }>()
const pending = new Map<string, Promise<Buffer>>()

export async function synthesizeArmenianSpeech(text: string, voice: BiographyVoice, config: SpeechConfig, fetcher: typeof fetch = fetch): Promise<Buffer> {
  const region = String(config.azureSpeechRegion || '')
  if (!config.azureSpeechKey || !/^[a-z0-9-]+$/.test(region)) {
    throw speechError({ statusCode: 503, statusMessage: 'Speech service is not configured', data: { code: 'SPEECH_NOT_CONFIGURED' } })
  }
  const ssml = biographySsml(text, voice)
  const key = createHash('sha256').update(`${region}:${ssml}`).digest('hex')
  const cached = cache.get(key)
  let audio = cached && cached.expires > Date.now() ? cached.audio : undefined
  if (!audio) {
    let request = pending.get(key)
    if (!request) {
      if (pending.size >= 2) throw speechError({ statusCode: 429, statusMessage: 'Speech service is busy' })
      request = (async () => {
        const response = await fetcher(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST', signal: AbortSignal.timeout(30000),
          headers: {
            'Ocp-Apim-Subscription-Key': String(config.azureSpeechKey),
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'User-Agent': 'FACTUM',
          },
          body: ssml,
        })
        if (!response.ok) throw new Error('Speech provider unavailable')
        const buffer = Buffer.from(await response.arrayBuffer())
        if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Invalid speech audio')
        if (cache.size >= 64) cache.delete(cache.keys().next().value!)
        cache.set(key, { audio: buffer, expires: Date.now() + 3600000 })
        return buffer
      })().finally(() => pending.delete(key))
      pending.set(key, request)
    }
    try { audio = await request } catch {
      throw speechError({ statusCode: 502, statusMessage: 'Speech service is temporarily unavailable' })
    }
  }
  return audio!
}
