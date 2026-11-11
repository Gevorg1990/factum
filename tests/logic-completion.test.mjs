import { moduleUrl } from './helpers/catalog.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { logicPuzzles } from '../data/logicPuzzles.ts'
const { saveGameResult: saveResult, readGameRecords } = await import(moduleUrl(new URL('../utils/gameRecords.ts', import.meta.url)))
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { ref, computed } = require('vue')
const { parse, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup(random = Math.random, fetchRound) {
  const values = new Map()
  const mounted = []
  const randomMath = Object.create(Math)
  randomMath.random = random
  const context = {
    saveGameResult: (mode, score, level) => saveResult(mode, score, level, context.localStorage),
    $fetch: fetchRound || (async (_url, options) => ({ items: logicPuzzles.filter(item => item.difficulty === options.query.difficulty) })),
    Math: randomMath,
    ref, computed, logicPuzzles, exports: {},
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    useRoute: () => ({ path: '/games/logic', query: {} }),
    useRouter: () => ({ replace() {} }),
    onMounted: fn => mounted.push(fn),
    useGameFeedback: () => ({ enabled: ref(false), play() {}, stop() {}, toggle() {}, cancelNext() {} }),
  }
  runInNewContext(transpile(readFileSync(new URL('../utils/gameDifficulty.ts', import.meta.url), 'utf8').replaceAll('import.meta.client', 'true')), context)
  Object.assign(context, context.exports)
  const filename = 'LogicGame.vue'
  const { descriptor } = parse(readFileSync(new URL('../components/LogicGame.vue', import.meta.url), 'utf8'))
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'logic' }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'logic', scoped: true }).errors, [])
  runInNewContext(transpile(descriptor.scriptSetup.content.replace(/^import .*$/gm, '') + ';globalThis.game = { gameReady, roundLoading, startLevel, choose, next, current, finished, newlyUnlockedLevel, completedLevels, unlockedIndex, round };'), context)
  mounted.forEach(fn => fn())
  return context.game
}
async function finish(game, level, correct = true) {
  game.startLevel(level)
  await new Promise(resolve => setImmediate(resolve))
  for (let i = 0; i < 10; i++) {
    game.choose(correct ? game.current.value.correct : (game.current.value.correct + 1) % 4)
    game.next()
  }
  assert.equal(game.finished.value, true)
}
test('first wins unlock levels; replaying a completed level never announces another unlock', async () => {
  const game = setup()
  await finish(game, 'easy')
  assert.equal(game.newlyUnlockedLevel.value, 'medium')
  await finish(game, 'easy')
  assert.equal(game.newlyUnlockedLevel.value, null)
  await finish(game, 'medium')
  assert.equal(game.newlyUnlockedLevel.value, 'hard')
  await finish(game, 'easy')
  assert.equal(game.newlyUnlockedLevel.value, null)
  await finish(game, 'hard')
  assert.equal(game.newlyUnlockedLevel.value, null)
  assert.deepEqual([...game.completedLevels.value], ['easy', 'medium', 'hard'])
  await finish(game, 'medium', false)
  assert.equal(game.newlyUnlockedLevel.value, null)
})

test('each level draws ten unique questions from its own twenty-question pool', async () => {
  assert.equal(logicPuzzles.length, 60)
  assert.equal(new Set(logicPuzzles.map(item => item.question)).size, 60)
  const first = setup(() => 0)
  const refreshed = setup(() => .99999)
  for (const level of ['easy', 'medium', 'hard']) {
    const pool = logicPuzzles.filter(item => item.difficulty === level)
    assert.equal(pool.length, 20)
    first.unlockedIndex.value = 2
    refreshed.unlockedIndex.value = 2
    first.startLevel(level)
    refreshed.startLevel(level)
    await new Promise(resolve => setImmediate(resolve))
    for (const game of [first, refreshed]) {
      const selected = [...game.round.value]
      assert.equal(selected.length, 10)
      assert.equal(new Set(selected.map(item => item.question)).size, 10)
      assert.ok(selected.every(item => item.difficulty === level && pool.some(question => question.question === item.question)))
    }
    assert.notDeepEqual([...first.round.value], [...refreshed.round.value])
  }
})

test('every logic puzzle has four answers and a valid correct-answer index', () => {
  for (const puzzle of logicPuzzles) {
    assert.equal(puzzle.answers.length, 4, puzzle.question)
    assert.ok(puzzle.answers.every(answer => typeof answer === 'string' && answer.trim()), puzzle.question)
    assert.ok(Number.isInteger(puzzle.correct) && puzzle.correct >= 0 && puzzle.correct < 4, puzzle.question)
    assert.ok(puzzle.explanation.trim(), puzzle.question)
  }
})

// Hold the network response to verify the waiting state covers the full request.
test('waiting state remains active until the round response is ready', async () => {
  let complete
  const game = setup(Math.random, () => new Promise(resolve => { complete = resolve }))
  assert.equal(game.gameReady.value, true)
  game.startLevel('easy')
  assert.equal(game.roundLoading.value, true)
  complete({ items: logicPuzzles.filter(item => item.difficulty === 'easy') })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(game.roundLoading.value, false)
  assert.equal(game.round.value.length, 10)
})
