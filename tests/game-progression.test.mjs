import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'
import { geniusStatements } from '../data/geniusStatements.ts'
import { logicPuzzles } from '../data/logicPuzzles.ts'
import { parseGeniusRecord, geniusRecordKey } from '../utils/geniusRecord.ts'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const { ref, computed } = require('vue')
const millionPool = await import(moduleUrl(new URL('../utils/millionQuestionPool.ts', import.meta.url)))
const transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup(mode, level = 'easy') {
  const filename = mode === 'million' ? 'pages/games/[mode].vue' : `components/${mode === 'genius' ? 'Genius' : 'Logic'}Game.vue`
  const { descriptor, errors } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'))
  assert.deepEqual(errors, [])
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: mode }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: mode, scoped: true }).errors, [])
  const cleanup = [], mounted = [], cues = [], values = new Map(level === 'easy' ? [] : [['factum-million-mode-progress-v2', '2']])
  const context = {
    ...millionPool, geniusStatements, logicPuzzles, parseGeniusRecord, geniusRecordKey,
    ref, computed, exports: {}, setTimeout, clearTimeout,
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    onBeforeUnmount: fn => cleanup.push(fn), onMounted: fn => mounted.push(fn), watch() {}, useHead() {},
    useRoute: () => ({ params: { mode }, path: `/games/${mode}`, query: {} }),
    useRouter: () => ({ replace() {} }),
    useMillionAudio() { const enabled = ref(false); return { enabled, play: cue => { if (enabled.value) cues.push(cue) }, stop() {}, toggle() { enabled.value = !enabled.value } } },
  }
  runInNewContext(transpile(readFileSync(new URL('../utils/gameDifficulty.ts', import.meta.url), 'utf8').replaceAll('import.meta.client', 'true')), context)
  Object.assign(context, context.exports)
  runInNewContext(transpile(readFileSync(new URL('../composables/useGameFeedback.ts', import.meta.url), 'utf8')), context)
  context.useGameFeedback = context.exports.useGameFeedback
  const source = descriptor.scriptSetup.content.replace(/^import .*$/gm, '').replaceAll('import.meta.client', 'true')
  const exported = mode === 'million' ? 'current: question, restart, stageTransition, continueStage, start: startMillionMode, swapQuestion, gameQuestions, replacementQuestions, swapUsed, useFifty, hiddenAnswers' : 'current, restart: newRound, start: startLevel'
  runInNewContext(transpile(source + `;globalThis.game = { choose, next, index, selected, score, finished, soundEnabled, toggleSound, ${exported} };`), context)
  mounted.forEach(fn => fn())
  context.game.start(level)
  return { game: context.game, cues, dispose() { cleanup.forEach(fn => fn()) } }
}
for (const mode of ['million', 'genius', 'logic']) {
  test(`${mode}: manual next completes the game without skipping answer feedback`, () => {
    const app = setup(mode), g = app.game
    const total = mode === 'million' ? 15 : 10
    for (let i = 0; i < total; i++) {
      assert.equal(g.index.value, i)
      g.choose(g.current.value.correct)
      g.choose(g.current.value.correct)
      assert.equal(g.score.value, i + 1)
      assert.equal(g.index.value, i)
      g.next()
      if (g.stageTransition?.value) g.continueStage()
    }
    assert.equal(g.finished.value, true)
    assert.ok(app.cues.includes('correct'))
    app.dispose()
  })
  test(`${mode}: wrong answers, restarting and mute retain the intended behavior`, () => {
    const app = setup(mode), g = app.game
    g.choose(typeof g.current.value.correct === 'boolean' ? !g.current.value.correct : (g.current.value.correct + 1) % 4)
    assert.equal(g.score.value, 0)
    assert.equal(g.finished.value, mode === 'million')
    assert.ok(app.cues.includes('wrong'))
    g.restart()
    assert.equal(g.index.value, 0)
    assert.equal(g.selected.value, null)
    assert.equal(g.finished.value, false)
    g.toggleSound()
    const count = app.cues.length
    g.choose(g.current.value.correct)
    assert.equal(app.cues.length, count)
    app.dispose()
  })
}
test('million: swaps the exact numbered counterpart once, keeping progress and other questions', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    const app = setup('million', level), g = app.game
    for (let position = 0; position < 15; position++) {
      g.restart()
      assert.equal(g.swapUsed.value, false)
      for (let i = 0; i < position; i++) {
        g.choose(g.current.value.correct)
        g.next()
        if (g.stageTransition.value) g.continueStage()
      }
      const original = g.current.value.question
      const reserved = g.replacementQuestions.value[position]
      const before = g.gameQuestions.value.map(q => q.question)
      g.swapQuestion()
      assert.equal(g.swapUsed.value, true)
      assert.equal(g.current.value.question, reserved.question)
      assert.notEqual(g.current.value.question, original)
      assert.equal(g.index.value, position)
      assert.equal(g.score.value, position)
      assert.equal(g.selected.value, null)
      for (let i = 0; i < 15; i++) if (i !== position) assert.equal(g.gameQuestions.value[i].question, before[i])
      assert.equal(new Set(g.gameQuestions.value.map(q => q.question)).size, 15)
      g.swapQuestion()
      assert.equal(g.current.value.question, reserved.question)
      g.useFifty()
      assert.equal(g.hiddenAnswers.value.length, 2)
      assert.ok(!g.hiddenAnswers.value.includes(g.current.value.correct))
    }
    app.dispose()
  }
})
