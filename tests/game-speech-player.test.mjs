import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'
const voiceQuiz = await import(moduleUrl(new URL('../utils/voiceQuiz.ts', import.meta.url)))
const { capitalPairs } = await import(moduleUrl(new URL('../data/capitalQuiz.ts', import.meta.url)))
const require = createRequire(import.meta.url)
const vue = require('vue'), ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const filename = 'components/CapitalVoiceQuiz.client.vue'
const { descriptor } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'), { filename })
const script = compileScript(descriptor, { id: 'quiz-player-test' })
const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const tick = () => new Promise(resolve => setImmediate(resolve))
function setup(topic = 'geography', fakeTimers = false) {
  const timers = new Map()
  let timerId = 0
  const mounted = [], unmounted = [], audios = [], requests = [], utterances = [], recognitions = [], cues = [], roundModes = []
  let fetcher = async () => ({ ok: true, blob: async () => new Blob(['audio']) })
  class Audio {
    src = ''; playbackRate = 1; plays = 0; pauses = 0
    constructor() { audios.push(this) }
    async play() { this.plays++ }
    pause() { this.pauses++ }
    removeAttribute() { this.src = '' }
    load() {}
  }
  class Recognition { constructor() { recognitions.push(this) } abort() {} stop() {} start() {} }
  const pair = capitalPairs[0]
  const chemQuestion = { direction: 'forward', prompt: 'Fe', expected: 'Երկաթ', aliases: [], promptEn: 'F E', reference: '26', summary: 'Fe — Երկաթ' }
  const exports = {}
  runInNewContext(code, {
    exports, ...vue,
    require: name => {
      if (name === 'vue') return vue
      if (name.includes('capitalQuiz') && name.includes('data')) return { capitalPairs: [pair] }
      if (name.includes('capitalQuiz')) return { createCapitalRounds: () => [{ pair, direction: 'capital' }] }
      if (name.includes('elementQuiz')) return { createElementRounds: (mode, all) => { roundModes.push({ mode, all }); return [chemQuestion] }, symbolSpeechAliases: () => ['էֆ ի'] }
      if (name.includes('periodicTable')) return { periodicElements: [{ number: 26, name: 'Երկաթ', nameEn: 'Iron', symbol: 'Fe' }] }
      if (name.includes('voiceQuiz')) return voiceQuiz
      if (name.includes('elementLife')) return { getElementLife: () => undefined }
      if (name === 'lucide-vue-next') return {}
      throw new Error('Unexpected import ' + name)
    },
    onMounted: callback => mounted.push(callback), onBeforeUnmount: callback => unmounted.push(callback),
    window: { SpeechRecognition: Recognition, speechSynthesis: { getVoices: () => [{ lang: 'en-US' }], cancel() {}, resume() {}, speak: utterance => utterances.push(utterance), addEventListener() {}, removeEventListener() {} } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text } },
    Audio, AbortController, Blob, URL,
    setTimeout: fakeTimers ? (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id } : setTimeout,
    clearTimeout: fakeTimers ? id => timers.delete(id) : clearTimeout,
    useMillionAudio: () => ({ enabled: vue.ref(false), stop() {}, unlock: async () => {}, play: async cue => { cues.push(cue) } }),
    $fetch: async () => ({ available: true }),
    fetch: async (...args) => { requests.push(args); return fetcher(...args) },
  })
  const quiz = exports.default.setup({ topic }, { expose() {}, emit() {} })
  mounted.forEach(callback => callback())
  return { quiz, audios, requests, utterances, recognitions, cues, roundModes,
    advanceFeedback: () => { for (const [id, timer] of [...timers]) if (timer.delay === 2500) { timers.delete(id); timer.fn() } },
    feedbackCount: () => [...timers.values()].filter(timer => timer.delay === 2500).length, setFetcher: fn => { fetcher = fn }, dispose: () => unmounted.forEach(callback => callback()) }
}
test('both game blocks default to Hayk and send only the stored question reference', async () => {
  for (const topic of ['geography', 'chemistry']) {
    const app = setup(topic)
    app.quiz.start(); await tick()
    assert.equal(app.quiz.readerVoice.value, 'male')
    assert.equal(app.quiz.reading.value, true)
    assert.deepEqual(JSON.parse(app.requests[0][1].body), { topic, reference: topic === 'geography' ? 'ARM' : '26', direction: 'forward', voice: 'male' })
    assert.equal(app.audios[0].plays, 1)
    app.dispose()
  }
})
test('starting the microphone cancels a pending read and prevents late audio playback', async () => {
  const app = setup()
  let resolve
  app.setFetcher(() => new Promise(done => { resolve = done }))
  app.quiz.start(); await tick()
  app.quiz.listen()
  assert.equal(app.requests[0][1].signal.aborted, true)
  assert.equal(app.quiz.listening.value, true)
  resolve({ ok: true, blob: async () => new Blob(['late audio']) }); await tick()
  assert.equal(app.audios[0].plays, 0)
  app.dispose()
})
test('switching voices preserves playback and the next read uses Anahit', async () => {
  const app = setup()
  app.quiz.start(); await tick()
  app.quiz.readerVoice.value = 'female'; await vue.nextTick()
  assert.equal(app.quiz.reading.value, true)
  await app.quiz.readQuestion()
  assert.equal(JSON.parse(app.requests.at(-1)[1].body).voice, 'female')
  app.dispose()
})
test('Erevan speech is displayed as Երևան and scores as a correct answer', async () => {
  const app = setup()
  app.quiz.start(); await tick()
  app.quiz.listen()
  const recognition = app.recognitions[0]
  assert.equal(recognition.lang, 'hy-AM')
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, length: 1, 0: { transcript: 'Erevan' } }] })
  recognition.onend()
  assert.equal(app.quiz.answer.value, 'Երևան')
  assert.equal(app.quiz.checked.value, true)
  app.quiz.check()
  assert.equal(app.quiz.correct.value, true)
  assert.equal(app.quiz.score.value, 100)
  app.dispose()
})
test('leaving the page cancels pending playback', async () => {
  const app = setup()
  let resolve
  app.setFetcher(() => new Promise(done => { resolve = done }))
  app.quiz.start(); await tick(); app.dispose()
  assert.equal(app.requests[0][1].signal.aborted, true)
  resolve({ ok: true, blob: async () => new Blob(['late audio']) }); await tick()
  assert.equal(app.audios[0].plays, 0)
})
test('game reading and microphone recognition use Armenian only', async () => {
  for (const topic of ['geography', 'chemistry']) {
    const app = setup(topic)
    app.quiz.start(); await tick()
    assert.equal(app.requests.length, 1)
    assert.equal(app.utterances.length, 0)
    app.quiz.listen()
    assert.equal(app.recognitions[0].lang, 'hy-AM')
    app.dispose()
  }
})
test('correct and wrong answers get distinct cues once in each game; skips stay silent', async () => {
  for (const topic of ['geography', 'chemistry']) {
    for (const [answer, cue] of [[topic === 'geography' ? 'Երևան' : 'Երկաթ', 'correct'], ['Սխալ պատասխան', 'wrong']]) {
      const app = setup(topic)
      app.quiz.autoRead.value = false
      app.quiz.start()
      app.quiz.answer.value = answer
      app.quiz.check()
      app.quiz.check()
      assert.deepEqual(app.cues, [cue])
      app.dispose()
    }
    const app = setup(topic)
    app.quiz.autoRead.value = false
    app.quiz.start()
    app.quiz.check()
    assert.deepEqual(app.cues, [])
    app.quiz.check(true)
    assert.deepEqual(app.cues, [])
    app.dispose()
  }
})
test('map/table buttons and checking an answer preserve the current reading', async () => {
  for (const topic of ['geography', 'chemistry']) {
    const app = setup(topic)
    app.quiz.start(); await tick()
    const pauses = app.audios[0].pauses
    app.quiz.showOnMap()
    assert.equal(app.audios[0].pauses, pauses)
    assert.equal(app.quiz.reading.value, true)
    app.quiz.answer.value = topic === 'geography' ? 'Երևան' : 'Երկաթ'
    app.quiz.check()
    assert.equal(app.audios[0].pauses, pauses)
    assert.equal(app.quiz.reading.value, true)
    assert.equal(app.quiz.checked.value, true)
    app.quiz.next()
    assert.equal(app.quiz.reading.value, false)
    app.dispose()
  }
})
test('turning off automatic reading does not cut off the current question', async () => {
  const app = setup()
  app.quiz.start(); await tick()
  const pauses = app.audios[0].pauses
  app.quiz.autoRead.value = false; await vue.nextTick()
  assert.equal(app.audios[0].pauses, pauses)
  assert.equal(app.quiz.reading.value, true)
  app.dispose()
})
test('checking while audio loads does not cancel the pending question', async () => {
  const app = setup()
  let resolve
  app.setFetcher(() => new Promise(done => { resolve = done }))
  app.quiz.start(); await tick()
  app.quiz.answer.value = 'Երևան'
  app.quiz.check()
  assert.equal(app.requests[0][1].signal.aborted, false)
  resolve({ ok: true, blob: async () => new Blob(['question audio']) }); await tick()
  assert.equal(app.audios[0].plays, 1)
  assert.equal(app.quiz.reading.value, true)
  app.dispose()
})
test('feedback stays visible before automatically advancing, including the last result', () => {
  for (const answer of ['Երևան']) {
    const app = setup('geography', true)
    app.quiz.autoRead.value = false
    app.quiz.start()
    app.quiz.rounds.value = [app.quiz.rounds.value[0], app.quiz.rounds.value[0]]
    app.quiz.answer.value = answer
    app.quiz.check()
    assert.equal(app.quiz.index.value, 0)
    assert.equal(app.quiz.checked.value, true)
    assert.equal(app.quiz.correct.value, answer === 'Երևան')
    assert.equal(app.feedbackCount(), 1)
    app.advanceFeedback()
    assert.equal(app.quiz.index.value, 1)
    assert.equal(app.quiz.checked.value, false)
    app.quiz.answer.value = answer
    app.quiz.check()
    app.advanceFeedback()
    assert.equal(app.quiz.status.value, 'finished')
    app.dispose()
  }
})
test('manual next, exit, restart and unmount cancel automatic advancement', () => {
  for (const action of ['next', 'exit', 'start', 'dispose']) {
    const app = setup('geography', true)
    app.quiz.autoRead.value = false
    app.quiz.start()
    app.quiz.rounds.value = [app.quiz.rounds.value[0], app.quiz.rounds.value[0], app.quiz.rounds.value[0]]
    app.quiz.answer.value = 'Երևան'; app.quiz.check()
    if (action === 'dispose') app.dispose()
    else app.quiz[action]()
    assert.equal(app.feedbackCount(), 0)
    const index = app.quiz.index.value
    app.advanceFeedback()
    assert.equal(app.quiz.index.value, index)
    app.dispose()
  }
})
test('wrong answers and skipped questions never advance automatically', () => {
  for (const skip of [false, true]) {
    const app = setup('geography', true)
    app.quiz.autoRead.value = false
    app.quiz.start()
    app.quiz.rounds.value = [app.quiz.rounds.value[0], app.quiz.rounds.value[0]]
    app.quiz.answer.value = 'Սխալ պատասխան'
    app.quiz.check(skip)
    assert.equal(app.quiz.correct.value, false)
    assert.equal(app.quiz.checked.value, true)
    assert.equal(app.feedbackCount(), 0)
    app.advanceFeedback()
    assert.equal(app.quiz.index.value, 0)
    app.quiz.next()
    assert.equal(app.quiz.index.value, 1)
    app.dispose()
  }
})
test('microphone starts automatically only after question playback ends in both games', async () => {
  for (const topic of ['geography', 'chemistry']) {
    const app = setup(topic)
    app.quiz.start(); await tick()
    assert.equal(app.recognitions.length, 0)
    app.audios[0].onended()
    assert.equal(app.recognitions.length, 1)
    assert.equal(app.quiz.listening.value, true)
    assert.equal(app.recognitions[0].lang, 'hy-AM')
    app.dispose()
  }
})
test('automatic microphone respects the opt-out and already checked questions', async () => {
  for (const action of ['opt-out', 'checked']) {
    const app = setup()
    app.quiz.start(); await tick()
    if (action === 'opt-out') { app.quiz.autoListen.value = false; await vue.nextTick() }
    else { app.quiz.answer.value = 'Սխալ պատասխան'; app.quiz.check() }
    app.audios[0].onended()
    assert.equal(app.recognitions.length, 0)
    app.dispose()
  }
})
test('a stale playback end cannot enable the microphone after exit', async () => {
  const app = setup()
  app.quiz.start(); await tick()
  const ended = app.audios[0].onended
  app.quiz.exit(); ended()
  assert.equal(app.recognitions.length, 0)
  app.dispose()
})
test('manual and automatic microphone activation play one cue only after capture starts', async () => {
  for (const automatic of [false, true]) {
    const app = setup()
    app.quiz.start(); await tick()
    if (automatic) app.audios[0].onended()
    else app.quiz.listen()
    assert.deepEqual(app.cues, [])
    const session = app.recognitions[0]
    session.onaudiostart(); session.onaudiostart()
    assert.deepEqual(app.cues, ['microphone'])
    app.dispose()
  }
})
test('denied permission and stale microphone callbacks never play the activation cue', async () => {
  const app = setup()
  app.quiz.start(); await tick(); app.quiz.listen()
  const session = app.recognitions[0], started = session.onaudiostart
  session.onerror({ error: 'not-allowed' })
  started()
  assert.deepEqual(app.cues, [])
  assert.equal(app.quiz.listening.value, false)
  app.dispose()
})
test('chemistry offers only symbol-to-name rounds, while geography keeps all directions', () => {
  const chemistry = setup('chemistry')
  chemistry.quiz.autoRead.value = false
  assert.equal(chemistry.quiz.mode.value, 'capital')
  assert.deepEqual(Array.from(chemistry.quiz.modes.value, item => item.id), ['capital'])
  chemistry.quiz.start()
  assert.equal(chemistry.roundModes[0].mode, 'capital')
  chemistry.quiz.mode.value = 'country'
  chemistry.quiz.start()
  assert.equal(chemistry.roundModes[1].mode, 'capital')
  chemistry.dispose()
  const geography = setup('geography')
  assert.deepEqual(Array.from(geography.quiz.modes.value, item => item.id), ['capital', 'country', 'mixed'])
  geography.dispose()
})
