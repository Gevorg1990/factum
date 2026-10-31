import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
const require = createRequire(import.meta.url), ts = require('typescript'), { ref } = require('vue')
const source = readFileSync(new URL('../composables/useMillionAudio.ts', import.meta.url), 'utf8').replaceAll('import.meta.client', 'true')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup() {
  let resume
  const oscillators = [], cleanup = []
  class AudioContext {
    state = 'suspended'; currentTime = 0; destination = {}
    async resume() { await new Promise(resolve => { resume = resolve }); this.state = 'running' }
    async close() { this.state = 'closed' }
    createOscillator() {
      const node = { frequency: {}, connect() {}, disconnect() {}, start() {}, stop() {} }
      oscillators.push(node); return node
    }
    createGain() { return { connect() {}, disconnect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } }
  }
  const exports = {}
  runInNewContext(code, { exports, ref, AudioContext, onBeforeUnmount: fn => cleanup.push(fn) })
  const sound = exports.useMillionAudio(); sound.enabled.value = true
  return { sound, oscillators, resume: () => resume(), dispose: () => cleanup.forEach(fn => fn()) }
}
test('a stopped cue never starts after a delayed audio permission resume', async () => {
  const app = setup()
  const pending = app.sound.play('correct')
  app.sound.stop(); app.resume(); await pending
  assert.equal(app.oscillators.length, 0)
  await app.sound.play('wrong')
  assert.ok(app.oscillators.length > 0)
  app.dispose()
})
test('leaving the page prevents pending feedback from playing', async () => {
  const app = setup()
  const pending = app.sound.play('correct')
  app.dispose(); app.resume(); await pending
  assert.equal(app.oscillators.length, 0)
})
