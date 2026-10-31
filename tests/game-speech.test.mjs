import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { moduleUrl } from './helpers/catalog.mjs'
const ts = createRequire(import.meta.url)('typescript')
const gameUrl = moduleUrl(new URL('../server/utils/gameSpeech.ts', import.meta.url))
const speechUrl = moduleUrl(new URL('../server/utils/armenianSpeech.ts', import.meta.url))
const { gameSpeechText } = await import(gameUrl)
const { capitalPairs } = await import(moduleUrl(new URL('../data/capitalQuiz.ts', import.meta.url)))
const { periodicElements } = await import(moduleUrl(new URL('../data/periodicTable.ts', import.meta.url)))
let config = {}, calls = [], fail = false, block
const wav = Buffer.alloc(48); wav.write('RIFF'); wav.write('WAVE', 8)
globalThis.__gameSpeech = {
  defineEventHandler: fn => fn, readBody: async event => event.body,
  useRuntimeConfig: () => config,
  createError: options => Object.assign(new Error(options.statusMessage), options),
  setHeader: (event, key, value) => { (event.headers ||= {})[key] = value },
  fetch: async (url, options) => {
    calls.push({ url, options }); if (block) await block
    if (fail) throw new Error('secret provider error')
    return { ok: true, arrayBuffer: async () => wav }
  },
}
async function load(file) {
  let source = 'const { defineEventHandler, readBody, useRuntimeConfig, createError, setHeader, fetch } = globalThis.__gameSpeech;\n' + readFileSync(new URL('../server/api/' + file, import.meta.url), 'utf8')
  source = source.replace("'../utils/gameSpeech'", JSON.stringify(gameUrl)).replace("'../utils/armenianSpeech'", JSON.stringify(speechUrl))
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return (await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))).default
}
const get = await load('game-speech.get.ts'), post = await load('game-speech.post.ts')
const body = (overrides = {}) => ({ body: { topic: 'geography', reference: 'ARM', direction: 'forward', voice: 'male', ...overrides } })
test('both directions are readable for every country and every chemical element', () => {
  for (const pair of capitalPairs) {
    assert.ok(gameSpeechText({ topic: 'geography', reference: pair.countryCode, direction: 'forward' }).startsWith(pair.country + '։'))
    assert.ok(gameSpeechText({ topic: 'geography', reference: pair.countryCode, direction: 'reverse' }).startsWith(pair.capital + '։'))
  }
  for (const element of periodicElements) {
    assert.match(gameSpeechText({ topic: 'chemistry', reference: String(element.number), direction: 'forward' }), /Ո՞ր քիմիական տարրի նշանն է/)
    assert.ok(gameSpeechText({ topic: 'chemistry', reference: String(element.number), direction: 'reverse' }).startsWith(element.name + '։'))
  }
  assert.ok(gameSpeechText({ topic: 'chemistry', reference: '26', direction: 'forward' }).startsWith('էֆ ի։'))
})
test('invalid or arbitrary text requests cannot reach the speech provider', async () => {
  for (const input of [null, { topic: 'unknown' }, { reference: 'not-a-country' }, { direction: 'unknown' }, { voice: 'arbitrary-voice' }, { topic: 'chemistry', reference: '119' }, { topic: 'chemistry', reference: 26 }]) {
    const event = input === null ? { body: null } : body(input)
    await assert.rejects(post(event), error => error.statusCode === 400)
  }
  for (const body of [{}, { text: 'read arbitrary text', voice: 'male' }]) {
    await assert.rejects(post({ body }), error => error.statusCode === 400)
  }
  assert.equal(calls.length, 0)
})
test('unconfigured service exposes only its availability and makes no external requests', async () => {
  assert.deepEqual(await get({}), { available: false })
  await assert.rejects(post(body()), error => error.statusCode === 503)
  assert.equal(calls.length, 0)
  config = { azureSpeechKey: 'private-key', azureSpeechRegion: 'eastus' }
  assert.deepEqual(await get({}), { available: true })
})
test('both games use the selected Armenian neural voice and return WAV', async () => {
  const first = body(); assert.deepEqual(await post(first), wav)
  assert.equal(first.headers['Content-Type'], 'audio/wav')
  assert.match(calls.at(-1).options.body, /hy-AM-HaykNeural/)
  assert.match(calls.at(-1).options.body, /Հայաստան։ Ո՞րն է այս երկրի մայրաքաղաքը/)
  const chemistry = body({ topic: 'chemistry', reference: '26', direction: 'forward', voice: 'female' })
  await post(chemistry)
  assert.match(calls.at(-1).options.body, /hy-AM-AnahitNeural/)
  assert.match(calls.at(-1).options.body, /էֆ ի։/)
})
test('repeated questions reuse audio while different voices generate separate audio', async () => {
  const before = calls.length
  await post(body()); assert.equal(calls.length, before)
  await post(body({ voice: 'female' })); assert.equal(calls.length, before + 1)
})
test('simultaneous requests for the same question share a single synthesis', async () => {
  let release; block = new Promise(resolve => { release = resolve })
  const before = calls.length
  const first = post(body({ reference: 'FRA' })), second = post(body({ reference: 'FRA' }))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls.length, before + 1)
  release(); await Promise.all([first, second]); block = undefined
})
test('provider failures remain retriable and do not expose private details', async () => {
  fail = true
  await assert.rejects(post(body({ reference: 'GEO' })), error => error.statusCode === 502 && !error.message.includes('secret'))
  fail = false
  assert.deepEqual(await post(body({ reference: 'GEO' })), wav)
})
