import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
const require = createRequire(import.meta.url), vue = require('vue'), ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const { descriptor } = parse(readFileSync(new URL('../components/BiographyReader.client.vue', import.meta.url), 'utf8'))
const script = compileScript(descriptor, { id: 'biography-player-test' })
const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const tick = () => new Promise(resolve => setImmediate(resolve))
function setup(personId = 'hambardzumyan') {
  const mounted = [], unmounted = [], requests = [], statusRequests = []
  let fetcher = async () => ({ ok: true, blob: async () => new Blob(['audio']) })
  const exports = {}
  runInNewContext(code, {
    exports, ...vue, require: name => name === 'vue' ? vue : {},
    onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => unmounted.push(fn),
    $fetch: async (...args) => { statusRequests.push(args); return { available: true, chunks: 3 } },
    fetch: async (...args) => { requests.push(args); return fetcher(...args) },
    URL, AbortController, Blob, DOMException,
  })
  const reader = exports.default.setup({ person: { id: personId } }, { expose() {} })
  const audio = { plays: 0, async play() { this.plays++ }, pause() {}, load() {}, removeAttribute() {} }
  reader.player.value = audio
  mounted.forEach(fn => fn())
  return { reader, audio, requests, statusRequests, setFetcher: fn => { fetcher = fn }, dispose: () => unmounted.forEach(fn => fn()) }
}
test('the next biography part loads during playback and is reused without a second request', async () => {
  const app = setup(); await tick()
  await app.reader.play(); await tick()
  assert.deepEqual(app.requests.map(([, request]) => JSON.parse(request.body).part), [0, 1])
  assert.equal(app.reader.state.value, 'reading')
  app.reader.next(); await tick()
  assert.deepEqual(app.requests.map(([, request]) => JSON.parse(request.body).part), [0, 1, 2])
  assert.equal(app.audio.plays, 2)
  app.dispose()
})
test('stopping aborts the prepared part and cannot restart playback when it arrives', async () => {
  const app = setup(); await tick()
  let resolve
  app.setFetcher(async (url, request) => JSON.parse(request.body).part === 1
    ? new Promise(done => { resolve = done })
    : ({ ok: true, blob: async () => new Blob(['first audio']) }))
  await app.reader.play()
  app.reader.stop()
  assert.equal(app.requests[1][1].signal.aborted, true)
  resolve({ ok: true, blob: async () => new Blob(['late audio']) }); await tick()
  assert.equal(app.audio.plays, 1)
  assert.equal(app.reader.state.value, 'idle')
  app.dispose()
})
test('each profile sends its person ID for both metadata and narration', async () => {
  for (const personId of ['komitas', 'tumanyan', 'abovyan']) {
    const app = setup(personId); await tick()
    await app.reader.play()
    assert.equal(app.statusRequests[0][1].query.personId, personId)
    assert.equal(JSON.parse(app.requests[0][1].body).personId, personId)
    app.dispose()
  }
})
