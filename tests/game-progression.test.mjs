import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const { ref, computed } = require('vue')
const data = Object.assign({}, ...await Promise.all(['geniusStatements', 'logicPuzzles', 'millionQuestions'].map(name => import(moduleUrl(new URL(`../data/${name}.ts`, import.meta.url))))))
const transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup(mode) {
  const filename = mode === 'million' ? 'pages/games/[mode].vue' : `components/${mode === 'genius' ? 'Genius' : 'Logic'}Game.vue`
  const { descriptor, errors } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'))
  assert.deepEqual(errors, [])
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: mode }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: mode, scoped: true }).errors, [])
  const timers = new Map(), cleanup = [], cues = []
  let nextId = 0
  const context = {
    ...data, ref, computed, exports: {},
    setTimeout(fn) { const id = ++nextId; timers.set(id, fn); return id },
    clearTimeout(id) { timers.delete(id) },
    onBeforeUnmount: fn => cleanup.push(fn), onMounted() {}, watch() {}, useHead() {},
    useRoute: () => ({ params: { mode } }),
    useMillionAudio() { const enabled = ref(false); return { enabled, play: cue => { if (enabled.value) cues.push(cue) }, stop() {}, toggle() { enabled.value = !enabled.value } } },
  }
  runInNewContext(transpile(readFileSync(new URL('../composables/useGameFeedback.ts', import.meta.url), 'utf8')), context)
  context.useGameFeedback = context.exports.useGameFeedback
  const source = descriptor.scriptSetup.content.replace(/^import .*$/gm, '').replaceAll('import.meta.client', 'false')
  const exported = mode === 'million' ? 'current: question, restart, stageTransition' : 'current, restart: newRound'
  runInNewContext(transpile(source + `;globalThis.game = { choose, next, index, selected, score, finished, soundEnabled, toggleSound, ${exported} };`), context)
  return { game: context.game, cues, timers, tick() { const [id, fn] = timers.entries().next().value; timers.delete(id); fn() }, dispose() { cleanup.forEach(fn => fn()) } }
}
for (const mode of ['million', 'genius', 'logic']) {
  test(`${mode}: correct answers play sound and advance automatically through completion`, () => {
    const app = setup(mode), g = app.game
    g.restart()
    let answers = 0
    while (!g.finished.value) {
      assert.ok(answers++ < 16)
      const index = g.index.value
      g.choose(g.current.value.correct)
      g.choose(g.current.value.correct)
      assert.equal(g.score.value, index + 1)
      assert.equal(app.timers.size, 1)
      app.tick()
      if (g.stageTransition?.value) { assert.equal(app.timers.size, 1); app.tick(); assert.equal(g.stageTransition.value, false) }
    }
    assert.ok(app.cues.includes('correct'))
    assert.ok(app.cues.includes('win'))
    assert.equal(app.timers.size, 0)
  })
  test(`${mode}: manual next, restart and unmount cancel pending transitions; wrong answers do not advance`, () => {
    const app = setup(mode), g = app.game
    g.restart(); g.choose(g.current.value.correct); g.next()
    assert.equal(g.index.value, 1); assert.equal(app.timers.size, 0)
    g.choose(g.current.value.correct); g.restart()
    assert.equal(g.index.value, 0); assert.equal(app.timers.size, 0)
    const correct = g.current.value.correct
    g.choose(typeof correct === 'boolean' ? !correct : (correct + 1) % 4)
    assert.equal(app.timers.size, 0); assert.ok(app.cues.includes('wrong'))
    g.restart(); g.choose(g.current.value.correct); app.dispose()
    assert.equal(app.timers.size, 0)
    g.restart(); g.toggleSound(); const count = app.cues.length
    g.choose(g.current.value.correct)
    assert.equal(app.cues.length, count)
    assert.equal(app.timers.size, 1)
  })
}
