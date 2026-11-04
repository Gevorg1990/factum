import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'
const require = createRequire(import.meta.url)
const vue = require('vue'), ts = require('typescript')
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const elements = await import(moduleUrl(new URL('../data/periodicTable.ts', import.meta.url)))
const filename = 'pages/periodic-table.vue'
const { descriptor } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'), { filename })
const code = ts.transpileModule(compileScript(descriptor, { id: 'periodic-lab-test' }).content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup() {
  const mounted = [], cleanup = [], focused = [], exports = {}
  runInNewContext(code, {
    ...vue, exports, useHead() {}, setTimeout, clearTimeout,
    onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => cleanup.push(fn),
    window: { matchMedia: () => ({ matches: false }), addEventListener() {}, removeEventListener() {} },
    document: { getElementById: id => ({ focus: () => focused.push(id), scrollIntoView() {} }) },
    require: name => {
      if (name === 'vue') return vue
      if (name.includes('periodicTable')) return elements
      if (name === 'lucide-vue-next') return {}
      throw Error('Unexpected eager import ' + name)
    },
  })
  const page = exports.default.setup({}, { expose() {} })
  mounted.forEach(fn => fn())
  return { page, focused, dispose: () => cleanup.forEach(fn => fn()) }
}
test('original search and family filters survive atom navigation; the table is the default tab', async () => {
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'periodic-lab-test' }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'periodic-lab-test', scoped: true }).errors, [])
  const { page, dispose } = setup()
  assert.equal(page.labTab.value, 'table')
  assert.equal(page.matchCount.value, 118)
  page.query.value = 'երկաթ'
  assert.equal(page.matchCount.value, 1)
  const iron = elements.periodicElements.find(element => element.symbol === 'Fe')
  await page.openAtom(iron)
  assert.equal(page.labTab.value, 'atoms')
  assert.equal(page.selected.value.number, 26)
  page.selectAtomElement(8)
  assert.equal(page.selected.value.symbol, 'O')
  page.switchLabTab('table')
  assert.equal(page.query.value, 'երկաթ')
  page.clearFilters()
  page.family.value = 'noble'
  assert.equal(page.matchCount.value, 7)
  dispose()
})
test('tab navigation supports arrows, Home and End; the existing quiz can still locate a cell', async () => {
  const { page, focused, dispose } = setup()
  await page.labTabKeyboard({ key: 'End', preventDefault() {} })
  assert.equal(page.labTab.value, 'atoms')
  assert.equal(focused.at(-1), 'chemistry-tab-atoms')
  await page.labTabKeyboard({ key: 'Home', preventDefault() {} })
  assert.equal(page.labTab.value, 'table')
  await page.openAtom()
  await page.showInTable(26)
  assert.equal(page.labTab.value, 'table')
  assert.equal(page.selected.value.number, 26)
  assert.equal(focused.at(-1), 'periodic-element-26')
  dispose()
})

test('filtered-out elements cannot open a hover card and filter changes close stale cards', async () => {
  const { page, dispose } = setup()
  const iron = elements.periodicElements.find(element => element.symbol === 'Fe')
  const helium = elements.periodicElements.find(element => element.symbol === 'He')
  page.family.value = 'noble'
  await vue.nextTick()
  page.showTooltip(iron, {})
  assert.equal(page.hovered.value, null)
  page.hovered.value = helium
  page.query.value = 'He'
  await vue.nextTick()
  assert.equal(page.hovered.value.symbol, 'He')
  page.query.value = 'Ne'
  await vue.nextTick()
  assert.equal(page.hovered.value, null)
  dispose()
})
