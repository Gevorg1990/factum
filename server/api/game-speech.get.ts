import { armenianSpeechAvailable } from '../utils/armenianSpeech'
export default defineEventHandler(event => ({ available: armenianSpeechAvailable(useRuntimeConfig(event)) }))
