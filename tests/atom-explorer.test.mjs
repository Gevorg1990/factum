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
const lessons = await import(moduleUrl(new URL('../data/chemistry/atomLessons.ts', import.meta.url)))
const orbitals = await import(moduleUrl(new URL('../utils/chemistry/orbitals.ts', import.meta.url)))
const atoms = await import(moduleUrl(new URL('../utils/chemistry/atomModel.ts', import.meta.url)))
const filename = 'components/chemistry/AtomExplorer.client.vue'
const { descriptor } = parse(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'), { filename })
const code = ts.transpileModule(compileScript(descriptor, { id: 'atom-test' }).content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const tick = () => new Promise(resolve => setImmediate(resolve))
function setup({ reduced = false, unsupported = false, delayed = false } = {}) {
  const mounted = [], cleanup = [], calls = [], changes = new Set()
  const props = vue.reactive({ elementNumber: 26 })
  let release
  const scene = Object.fromEntries(['focusParticle', 'setView', 'setOrbitalCloud', 'clearCloud', 'setAxes', 'setCutaway', 'setDensity', 'setAtom', 'setMotion', 'setShell', 'setLabels', 'zoom', 'rotate', 'resetView', 'dispose'].map(name => [name, (...args) => calls.push([name, ...args])]))
  const module = { createAtomScene() { calls.push(['create']); if (unsupported) throw Error('No WebGL'); return scene } }
  const pending = delayed ? new Promise(resolve => { release = () => resolve(module) }) : module
  const exports = {}
  runInNewContext(code, {
    ...vue, exports,
    onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => cleanup.push(fn),
    window: { matchMedia: () => ({ matches: reduced, addEventListener: (_, fn) => changes.add(fn), removeEventListener: (_, fn) => changes.delete(fn) }) },
    require: name => {
      if (name === 'vue') return vue
      if (name.includes('AtomSelect.vue')) return {}
      if (name.includes('atomLessons')) return lessons
      if (name.includes('periodicTable')) return elements
      if (name.includes('orbitals')) return orbitals
      if (name.includes('orbitalSampler')) return { createOrbitalSampler: () => ({ sample: async orbital => orbitals.sampleOrbital(orbital, 128), cancel() {}, dispose() { calls.push(['samplerDispose']) } }) }
      if (name.includes('atomModel')) return atoms
      if (name.includes('atomScene.client')) return pending
      if (name === 'lucide-vue-next') return {}
      throw Error('Unexpected import ' + name)
    },
  })
  const viewer = exports.default.setup(props, { expose() {}, emit() {} })
  viewer.viewport.value = {}
  mounted.forEach(fn => fn())
  return { viewer, props, calls, changes, release, dispose: () => cleanup.forEach(fn => fn()) }
}
test('atom interface compiles and switching elements/isotopes updates the real model and renderer', async () => {
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: 'atom-test' }).errors, [])
  assert.deepEqual(compileStyle({ source: descriptor.styles[0].content, filename, id: 'atom-test', scoped: true }).errors, [])
  const app = setup()
  await tick()
  assert.equal(app.viewer.loading.value, false)
  assert.equal(app.viewer.error.value, false)
  assert.equal(app.viewer.model.value.neutrons, 30)
  app.viewer.massNumber.value = 54
  await vue.nextTick()
  assert.equal(app.viewer.model.value.neutrons, 28)
  app.props.elementNumber = 1
  await vue.nextTick()
  assert.equal(app.viewer.massNumber.value, 1)
  assert.equal(app.viewer.model.value.neutrons, 0)
  assert.equal(app.calls.filter(call => call[0] === 'setAtom').at(-1)[1].number, 1)
  app.dispose()
  assert.equal(app.calls.filter(call => call[0] === 'dispose').length, 1)
  assert.equal(app.changes.size, 0)
})
test('reduced motion starts paused, keyboard works, and preference changes stop movement', async () => {
  const app = setup({ reduced: true })
  await tick()
  assert.equal(app.viewer.playing.value, false)
  const event = key => ({ key, preventDefault() {} })
  app.viewer.keyboard(event('ArrowRight'))
  app.viewer.keyboard(event('+'))
  app.viewer.keyboard(event('Home'))
  app.viewer.keyboard(event(' '))
  await vue.nextTick()
  assert.ok(app.calls.some(call => call[0] === 'rotate'))
  assert.ok(app.calls.some(call => call[0] === 'zoom'))
  assert.ok(app.calls.some(call => call[0] === 'resetView'))
  assert.equal(app.viewer.playing.value, true)
  app.changes.forEach(fn => fn({ matches: true }))
  await vue.nextTick()
  assert.equal(app.viewer.playing.value, false)
  app.dispose()
})
test('unsupported WebGL leaves accurate isotope information and a retry state', async () => {
  const app = setup({ unsupported: true })
  await tick()
  assert.equal(app.viewer.error.value, true)
  assert.equal(app.viewer.loading.value, false)
  assert.equal(app.viewer.playing.value, false)
  assert.equal(app.viewer.model.value.protons, 26)
  const count = app.calls.length
  app.viewer.keyboard({ key: '+', preventDefault() {} })
  assert.equal(app.calls.length, count)
  app.dispose()
})
test('closing while the lazy renderer loads never creates a detached scene', async () => {
  const app = setup({ delayed: true })
  app.dispose()
  app.release()
  await tick()
  assert.equal(app.calls.some(call => call[0] === 'create'), false)
})

test('quantum-only viewer starts with a real cloud and updates occupied subshells and orientations', async () => {
  const app = setup()
  await tick()
  await vue.nextTick(); await tick()
  assert.equal(app.viewer.subshell.value.label, '4s')
  assert.ok(app.calls.some(call => call[0] === 'setOrbitalCloud' && call[1].positions.length === 384))
  app.viewer.subshellLabel.value = '3d'
  await vue.nextTick(); await tick()
  assert.equal(app.viewer.orientations.value.length, 5)
  app.viewer.orientation.value = -2
  await vue.nextTick(); await tick()
  assert.equal(app.viewer.orbitalName.value, '3d_xy')
  app.viewer.cutaway.value = true
  app.viewer.density.value = .3
  await vue.nextTick()
  assert.ok(app.calls.some(call => call[0] === 'setCutaway' && call[1] === true))
  assert.ok(app.calls.filter(call => call[0] === 'setView').every(call => call[1] === 'cloud'))
  assert.ok(!descriptor.template.content.includes('atom-view-switch'))
  assert.ok(!descriptor.template.content.includes('atom-shells'))
  app.props.elementNumber = 1
  await vue.nextTick(); await tick()
  assert.equal(app.viewer.subshell.value.label, '1s')
  assert.equal(app.viewer.orientation.value, 0)
  app.dispose()
})
test('lesson tabs only change explanatory text and never alter the scene or viewing controls', async () => {
  const app = setup()
  await tick()
  app.viewer.playing.value = true
  app.viewer.cutaway.value = true
  app.viewer.orientation.value = 0
  await vue.nextTick(); await tick()
  const before = app.calls.length
  const state = () => [app.viewer.playing.value,app.viewer.cutaway.value,app.viewer.subshellLabel.value,app.viewer.orientation.value]
  const initial = state()
  for(let i=0;i<5;i++) {
    app.viewer.startGuide(i)
    await vue.nextTick(); await tick()
    assert.equal(app.viewer.guideStep.value,i)
    assert.equal(app.viewer.activeLesson.value.id,lessons.atomLessons[i].id)
    assert.ok(app.viewer.guideDescription.value.length > 20)
    assert.deepEqual(state(),initial)
    assert.equal(app.calls.length,before)
  }
  app.viewer.startGuide(3)
  app.viewer.massNumber.value = 54
  await vue.nextTick(); await tick()
  assert.ok(app.viewer.guideDescription.value.includes('28 նեյտրոն'))
  app.props.elementNumber = 1
  await vue.nextTick(); await tick()
  app.viewer.startGuide(1)
  assert.ok(app.viewer.guideDescription.value.includes('նեյտրոն չկա'))
  app.dispose()
})
test('what-is particle buttons scroll to the matching text and focus its heading without changing the 3D scene', async () => {
  const app=setup()
  await tick()
  const scrolled=[],focused=[]
  app.viewer.lessonPanel.value={scrollIntoView:options=>scrolled.push(options)}
  app.viewer.lessonHeading.value={focus:options=>focused.push(options)}
  const before=app.calls.length
  for(let i=0;i<3;i++){
    await app.viewer.openLesson(i)
    assert.equal(app.viewer.activeLesson.value.id,lessons.atomLessons[i].id)
    assert.equal(scrolled.at(-1).behavior,'smooth')
    assert.equal(focused.at(-1).preventScroll,true)
    assert.equal(app.calls.length,before)
  }
  app.dispose()
  const reduced=setup({reduced:true});await tick()
  reduced.viewer.lessonPanel.value={scrollIntoView:options=>assert.equal(options.behavior,'instant')}
  await reduced.viewer.openLesson(0)
  reduced.dispose()
})
