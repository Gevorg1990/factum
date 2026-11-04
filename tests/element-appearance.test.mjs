import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'

const require = createRequire(import.meta.url)
const vue = require('vue'), ts = require('typescript')
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc')
const { renderToString } = require('@vue/server-renderer')
const appearances = await import(moduleUrl(new URL('../data/chemistry/elementAppearance.ts', import.meta.url)))
const { periodicElements } = await import(moduleUrl(new URL('../data/periodicTable.ts', import.meta.url)))
const filename = 'components/chemistry/ElementAppearance.vue'
const { descriptor } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'), { filename })

function component(inlineTemplate = false) {
  const source = compileScript(descriptor, { id: 'appearance-test', inlineTemplate }).content
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  runInNewContext(code, { exports, require: name => name === 'vue' ? vue : appearances })
  return exports.default
}

test('specimen card starts closed in SSR and requests no photograph before opening', async () => {
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'appearance-test' }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'appearance-test', scoped: true }).errors, [])
  const html = await renderToString(vue.createSSRApp(component(true), { element: periodicElements[25] }))
  assert.ok(html.includes('Տարրի իրական տեսքը'))
  assert.ok(!html.includes('<img') && !html.includes('/images/elements/'))
})

test('changing elements closes the old sample, resets failures and keeps gas/predicted elements honest', async () => {
  const props = vue.reactive({ element: periodicElements[25] })
  const card = component().setup(props, { expose() {} })
  card.toggle({ currentTarget: { open: true } })
  assert.equal(card.sample.value.file, 'iron')
  card.imageFailed.value = true
  props.element = periodicElements[0]
  await vue.nextTick()
  assert.equal(card.expanded.value, false)
  assert.equal(card.imageFailed.value, false)
  assert.ok(card.sample.value)
  assert.ok(card.description.value.includes('անգույն'))
  props.element = periodicElements[117]
  await vue.nextTick()
  assert.equal(card.sample.value.kind, 'symbol')
  assert.ok(card.sample.value.caption.includes('Լուսանկարը բացակայում է'))
  assert.ok(card.sourceUrl.value.endsWith('/118/oganesson'))
  props.element = periodicElements[12]
  assert.ok(card.sourceUrl.value.endsWith('/13/aluminium'))
})

test('all 118 elements have local images, attribution and explicit symbolic labels', () => {
  assert.equal(Object.keys(appearances.elementSamples).length, 118)
  for (const [number, sample] of Object.entries(appearances.elementSamples)) {
    assert.ok(periodicElements[Number(number) - 1])
    assert.ok(sample.photographer && sample.license && sample.caption)
    assert.ok(['commons.wikimedia.org', 'images-of-elements.com', 'periodic-table.rsc.org'].includes(new URL(sample.sourceUrl).hostname))
    if (sample.kind === 'symbol') {
      const svg = readFileSync(new URL(`../public/images/elements/${sample.file}.svg`, import.meta.url), 'utf8')
      assert.ok(svg.includes('Խորհրդանշական պատկեր'))
      assert.ok(sample.caption.includes('Լուսանկարը բացակայում է'))
      continue
    }
    for (const width of [360, 800]) {
      const file = new URL(`../public/images/elements/${sample.file}-${width}.jpg`, import.meta.url)
      assert.ok(statSync(file).size < 200 * 1024)
      assert.equal(readFileSync(file)[0], 0xff)
    }
  }
})
