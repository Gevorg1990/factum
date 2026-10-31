import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { moduleUrl } from './helpers/catalog.mjs'
const require = createRequire(import.meta.url), ts = require('typescript')
const helperUrl = moduleUrl(new URL('../utils/biographySpeech.ts', import.meta.url))
const bioUrl = moduleUrl(new URL('../data/biographies/Viktor_Hambardzumyan_Biography.ts', import.meta.url))
const personUrl = moduleUrl(new URL('../server/utils/biographyPerson.ts', import.meta.url))
const contentUrl = moduleUrl(new URL('../data/content.ts', import.meta.url))
const { armenianPeople } = await import(contentUrl)
const viktor = armenianPeople.find(person => person.id === 'hambardzumyan')
const speechUrl = moduleUrl(new URL('../server/utils/armenianSpeech.ts', import.meta.url))
const { biographyChunks, biographySsml } = await import(helperUrl)
const { hambardzumyanBiography } = await import(bioUrl)
let config = {}, calls = [], fail = false
const wav = Buffer.alloc(48); wav.write('RIFF'); wav.write('WAVE', 8)
globalThis.__speechTest = {
  defineEventHandler: fn => fn, getQuery: event => event.query || {}, readBody: async event => event.body,
  useRuntimeConfig: () => config,
  createError: options => Object.assign(new Error(options.statusMessage), options),
  setHeader: (event, key, value) => { (event.headers ||= {})[key] = value },
  fetch: async (url, options) => { calls.push({ url, options }); if (fail) throw new Error('provider secret details'); return { ok: true, arrayBuffer: async () => wav } },
}
async function load(file) {
  let source = 'const { defineEventHandler, getQuery, readBody, useRuntimeConfig, createError, setHeader, fetch } = globalThis.__speechTest;\n' + readFileSync(new URL('../server/api/' + file, import.meta.url), 'utf8')
  source = source.replace("'../../utils/biographySpeech'", JSON.stringify(helperUrl)).replace("'../../data/biographies/Viktor_Hambardzumyan_Biography'", JSON.stringify(bioUrl))
  source = source.replace("'../utils/armenianSpeech'", JSON.stringify(speechUrl)).replace("'../utils/biographyPerson'", JSON.stringify(personUrl))
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return (await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))).default
}
const get = await load('biography-speech.get.ts'), post = await load('biography-speech.post.ts')
const body = (voice = 'female', part = 0) => ({ body: { personId: 'hambardzumyan', voice, part } })
test('chunks include the full biography, all sections and timeline without losing words', () => {
  const chunks = biographyChunks(hambardzumyanBiography)
  assert.ok(chunks.length > 1)
  assert.ok(chunks.every(part => part.length <= 1400))
  assert.ok(chunks[0].length <= 320, 'the first request stays short to reduce startup delay')
  const text = chunks.join(' ').replace(/\s+/g, ' ')
  const normalize = text => text.replace(/\s+/g, ' ').trim()
  assert.ok(text.includes(normalize(hambardzumyanBiography.bio)))
  for (const section of hambardzumyanBiography.biographySections) assert.ok(text.includes(normalize(section.text)))
  for (const event of hambardzumyanBiography.timeline) assert.ok(text.includes(normalize(event.text)))
})
test('SSML selects real Armenian female/male voices and escapes source text', () => {
  assert.match(biographySsml('<voice>&"\'', 'female'), /hy-AM-AnahitNeural/)
  assert.match(biographySsml('<voice>&"\'', 'female'), /&lt;voice&gt;&amp;&quot;&apos;/)
  assert.match(biographySsml('Հայերեն', 'male'), /hy-AM-HaykNeural/)
})
test('missing configuration is reported without external requests or secret exposure', async () => {
  config = {}
  assert.equal((await get({ query: { personId: 'hambardzumyan' } })).available, false)
  await assert.rejects(post(body()), error => error.statusCode === 503)
  assert.equal(calls.length, 0)
  config = { azureSpeechKey: 'private-key', azureSpeechRegion: 'westeurope' }
  assert.deepEqual(await get({ query: { personId: 'hambardzumyan' } }), { available: true, chunks: biographyChunks(viktor).length })
})
test('rejects unpublished people, arbitrary voices, invalid parts and missing bodies', async () => {
  for (const invalid of [null, {}, { personId: 'einstein', voice: 'female', part: 0 }, { personId: 'hambardzumyan', voice: '<voice>', part: 0 }, { personId: 'hambardzumyan', voice: 'male', part: -1 }, { personId: 'hambardzumyan', voice: 'male', part: '0' }, { personId: 'hambardzumyan', voice: 'male', part: 999 }]) {
    await assert.rejects(post({ body: invalid }), error => error.statusCode === 400)
  }
  assert.equal(calls.length, 0)
})
test('returns WAV, keeps credentials server-side and caches each voice independently', async () => {
  const first = body(); assert.deepEqual(await post(first), wav)
  assert.equal(first.headers['Content-Type'], 'audio/wav')
  assert.equal(calls[0].url, 'https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1')
  assert.equal(calls[0].options.headers['Ocp-Apim-Subscription-Key'], 'private-key')
  assert.equal(calls[0].options.headers['X-Microsoft-OutputFormat'], 'riff-24khz-16bit-mono-pcm')
  await post(body()); assert.equal(calls.length, 1)
  await post(body('male')); assert.equal(calls.length, 2)
  assert.match(calls[1].options.body, /hy-AM-HaykNeural/)
})
test('provider failures return a safe retriable error and are not cached', async () => {
  fail = true
  await assert.rejects(post(body('male', 1)), error => error.statusCode === 502 && !error.message.includes('secret'))
  const before = calls.length; fail = false
  await post(body('male', 1)); assert.equal(calls.length, before + 1)
})
test('Roman centuries are pronounced in Armenian while other Roman labels are preserved', () => {
  for (const [text, spoken] of [['XX դարի', 'քսաներորդ դարի'], ['XIX դարում', 'տասնիններորդ դարում'], ['XXI դար', 'քսանմեկերորդ դար'], ['IV դար', 'չորրորդ դար'], ['XIX–XX դարերի', 'տասնիններորդ–քսաներորդ դարերի']]) {
    assert.ok(biographySsml(text, 'male').includes(spoken))
  }
  assert.ok(biographySsml('XX և Au, Fe', 'male').includes('XX և Au, Fe'))
  const text = 'Նա XX դարի գիտնական էր։'
  biographySsml(text, 'male')
  assert.equal(text, 'Նա XX դարի գիտնական էր։')
})
test('every published Armenian biography exposes its own parts and can be read', async () => {
  for (const person of armenianPeople) {
    const status = await get({ query: { personId: person.id } })
    assert.equal(status.available, true, person.id)
    assert.equal(status.chunks, biographyChunks(person).length, person.id)
    const before = calls.length
    const result = await post({ body: { personId: person.id, voice: 'male', part: 0 } })
    assert.deepEqual(result, wav)
    if (calls.length > before) assert.ok(calls.at(-1).options.body.includes(person.name), person.id)
  }
  for (const personId of ['einstein', 'vazgen-sargsyan', 'unknown', undefined]) {
    await assert.rejects(async () => get({ query: { personId } }), error => error.statusCode === 404)
  }
})
