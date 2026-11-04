import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'
const records = await import(moduleUrl(new URL('../utils/gameRecords.ts', import.meta.url)))
const gameResult = await import(moduleUrl(new URL('../utils/gameResult.ts', import.meta.url)))
const { optimizedImage } = await import(moduleUrl(new URL('../data/optimizedImages.ts', import.meta.url)))
const require = createRequire(import.meta.url)
const vue = require('vue'), ts = require('typescript')
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const filename = 'pages/profile.vue'
const { descriptor } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'), { filename })
const compiled = compileScript(descriptor, { id: 'profile-record-test' })
const code = ts.transpileModule(compiled.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup(savedIds = []) {
  const values = new Map([
    ['factum-genius-record-v1', '{"best":10,"bestLevel":"hard","completed":["easy","medium","hard"]}'],
    ['factum-million-best-v1-easy', '15'],
  ])
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  records.saveGameResult('logic', 9, 'medium', storage)
  const mounted = [], exports = {}
  runInNewContext(code, {
    ...vue, exports,
    useProgress: () => ({ saved: vue.ref(savedIds), removeSaved() {} }),
    onMounted: fn => mounted.push(fn), onBeforeUnmount() {},
    window: { addEventListener() {}, removeEventListener() {} },
    require: name => {
      if (name === 'vue') return vue
      if (name.includes('gameRecords')) return {
        ...records,
        readGameRecords: () => records.readGameRecords(storage),
        removeGameRecord: mode => records.removeGameRecord(mode, storage),
        restoreGameRecord: removed => records.restoreGameRecord(removed, storage),
      }
      if (name.includes('gameResult')) return gameResult
      if (name.includes('optimizedImages')) return { optimizedImage }
      if (name.includes('data/content')) return { allEncyclopediaQuestions: [], people: [], facts: [], timeline: [], subjects: [], collectionSubjects: [] }
      if (name.includes('data/bible')) return { bibleBooks: [] }
      if (name.includes('disintegrate')) return { disintegrate() {} }
      if (name.includes('millionBookmarks')) return { findMillionBookmark: () => ({ question: 'Պահպանված Միլիոնատերի հարց', answers: ['Ճիշտ', 'Սխալ', 'Այլ', 'Չորրորդ'], correct: 0, explanation: 'Պահպանված բացատրությունը։' }) }
      if (name.includes('gameBookmarks')) return { findGameBookmark() {} }
      if (name === 'lucide-vue-next') return {}
      throw Error('Unexpected import ' + name)
    },
  })
  const profile = exports.default.setup({}, { expose() {} })
  mounted.forEach(fn => fn())
  return profile
}
test('profile shows the three homepage best results, correct section counts, artwork and share data', () => {
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'profile-record-test' }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'profile-record-test', scoped: true }).errors, [])
  const profile = setup()
  assert.equal(profile.savedCount.value, 3)
  const sections = profile.shownSections.value
  assert.equal(sections.some(section => section.id === 'million'), false)
  assert.equal(sections.find(section => section.id === 'games').count, 3)
  const cards = sections.flatMap(section => section.records)
  assert.equal(cards.find(card => card.mode === 'million').score, 15)
  assert.equal(cards.find(card => card.mode === 'million').level, 'easy')
  for (const card of cards) {
    assert.ok(existsSync(new URL('../public' + optimizedImage(card.image), import.meta.url)))
    const path = gameResult.gameResultPath(card.mode, card.score, card.level)
    assert.ok(path.includes(String(card.score)))
    if (card.level) assert.ok(path.includes('level=' + card.level))
  }
})
test('profile removal and undo update the cards and counters immediately', () => {
  const profile = setup()
  profile.removeRecord('million')
  assert.equal(profile.savedCount.value, 2)
  assert.equal(profile.profileGameRecords.value.some(record => record.mode === 'million'), false)
  profile.undoGameRemoval()
  assert.equal(profile.savedCount.value, 3)
  assert.equal(profile.profileGameRecords.value.find(record => record.mode === 'million').score, 15)
})

test('Million bookmarks and all three records share the Games section without losing saved content', () => {
  const profile = setup(['million-example'])
  const games = profile.sections.value.find(section => section.id === 'games')
  assert.equal(games.count, 4)
  assert.equal(games.records.length, 3)
  assert.equal(games.items.length, 1)
  assert.equal(games.items[0].title, 'Պահպանված Միլիոնատերի հարց')
  assert.equal(games.items[0].answer, 'Ճիշտ')
  assert.equal(games.items[0].to, '/games/questions/million-example#saved-million-question')
  assert.equal(profile.savedCount.value, 4)
  assert.equal(profile.categoryTabs.value.some(tab => tab.id === 'million'), false)
})
