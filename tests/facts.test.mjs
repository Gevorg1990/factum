import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')
const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText).toString('base64')
const factsUrl = moduleUrl(read('data/facts.ts'))
const { facts, factCategories } = await import(factsUrl)
const vueUrl = new URL('file://' + require.resolve('vue')).href

test('catalog has 100 unique facts, populated topics, sources and existing images', () => {
  assert.equal(facts.length, 100)
  assert.equal(factCategories.length, 20)
  assert.equal(new Set(facts.map(f => f.id)).size, facts.length)
  assert.equal(new Set(facts.map(f => f.title)).size, facts.length)
  for (const category of factCategories) assert.equal(facts.filter(f => f.category === category.id).length, 5)
  for (const fact of facts) {
    assert.ok(factCategories.some(c => c.id === fact.category))
    assert.ok(fact.text && fact.title && fact.source.name)
    assert.equal(new URL(fact.source.url).protocol, 'https:')
    if (fact.image) assert.ok(existsSync(new URL('public' + fact.image, root)))
  }
  for (const [id, category] of [['f1', 'animals'], ['f2', 'planets'], ['f3', 'planets']]) {
    assert.equal(facts.find(f => f.id === id)?.category, category)
  }
  const order = facts.map(f => factCategories.findIndex(c => c.id === f.category))
  assert.deepEqual(order, [...order].sort((a, b) => a - b))
})

test('search, combined filters, pagination and saved destinations work together', async () => {
  const { ref, reactive, effectScope } = await import(vueUrl)
  const route = reactive({ query: {} })
  let savedNavigation
  let mountedCallback
  let navigation
  globalThis.__factsTest = {
    route,
    mounted: callback => { mountedCallback = callback },
    navigate: (...args) => { navigation = args },
    nuxtApp: { isHydrating: false },
    progress: { saved: ref([]), toggleSaved() {} },
    capture: (...args) => { savedNavigation = args },
  }
  const { descriptor, errors } = parse(read('pages/facts.vue'), { filename: 'facts.vue' })
  assert.deepEqual(errors, [])
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'facts.vue', id: 'facts' }).errors, [])
  let source = compileScript(descriptor, { id: 'facts' }).content
    .replaceAll("from 'vue'", `from '${vueUrl}'`)
    .replaceAll("from '~/data/facts'", `from '${factsUrl}'`)
    .replaceAll("from 'lucide-vue-next'", `from '${new URL('file://' + require.resolve('lucide-vue-next')).href}'`)
  source = `import {ref,computed,watch} from '${vueUrl}';const onMounted=callback=>globalThis.__factsTest.mounted(callback);const navigateTo=(...args)=>globalThis.__factsTest.navigate(...args);const useRoute=()=>globalThis.__factsTest.route;const useNuxtApp=()=>globalThis.__factsTest.nuxtApp;const useProgress=()=>globalThis.__factsTest.progress;const useHead=()=>{};const useSavedScroll=(...args)=>globalThis.__factsTest.capture(...args);\n` + source
  const component = (await import(moduleUrl(source))).default
  const scope = effectScope()
  try {
    const page = scope.run(() => component.setup({}, { expose() {} }))
    assert.equal(page.visibleFacts.value.length, 24)
    assert.equal(new Set(page.visibleFacts.value.slice(0, 20).map(f => f.category)).size, 20)
    page.limit.value = facts.length
    assert.equal(new Set(page.visibleFacts.value.map(f => f.id)).size, facts.length)
    page.limit.value = 24
    page.limit.value += page.pageSize
    assert.equal(page.visibleFacts.value.length, 48)
    page.search.value = '  ԴՆԹ  '
    assert.ok(page.filteredFacts.value.length > 0)
    assert.equal(page.limit.value, 24)
    page.category.value = 'planets'
    assert.equal(page.filteredFacts.value.length, 0)
    page.resetFilters()
    page.category.value = 'genetics'
    assert.equal(page.filteredFacts.value.length, 5)
    page.search.value = 'չգոյությունունեցողբառ'
    assert.equal(page.filteredFacts.value.length, 0)
    route.query.fact = facts.at(-1).id
    assert.equal(savedNavigation[0](), 'fact-' + facts.at(-1).id)
    savedNavigation[1]()
    assert.equal(page.selectedFactId.value, route.query.fact)
    page.clearFactHighlight()
    assert.equal(page.selectedFactId.value, undefined)
    savedNavigation[1]()
    assert.equal(page.selectedFactId.value, undefined)
    globalThis.__factsTest.nuxtApp.isHydrating = true
    route.query.fact = 'f1'
    savedNavigation[1]()
    assert.equal(page.selectedFactId.value, undefined)
    assert.equal(page.category.value, 'all')
    assert.equal(page.search.value, '')
    assert.ok(page.visibleFacts.value.some(f => f.id === route.query.fact))
    route.query.fact = 'missing'
    assert.equal(savedNavigation[0](), undefined)
    assert.equal(page.markRead, undefined)

    // Reloading with a destination query must stay at the default list, even
    // after hydration finishes and page:finish requests another scroll.
    route.query.fact = facts.at(-1).id
    const reloadedPage = scope.run(() => component.setup({}, { expose() {} }))
    assert.equal(savedNavigation[0](), undefined)
    globalThis.__factsTest.nuxtApp.isHydrating = false
    assert.equal(savedNavigation[0](), undefined)
    assert.equal(reloadedPage.selectedFactId.value, undefined)
    assert.equal(reloadedPage.visibleFacts.value.length, 24)

    mountedCallback()
    assert.deepEqual(navigation, [{ path: route.path, query: {}, hash: route.hash }, { replace: true }])

    // Subsequent in-app navigation can still select a destination.
    route.query.fact = 'f1'
    assert.equal(savedNavigation[0](), 'fact-f1')
    savedNavigation[1]()
    assert.equal(reloadedPage.selectedFactId.value, 'f1')
  } finally {
    scope.stop()
    delete globalThis.__factsTest
  }
})

test('homepage selects five facts from the full catalog and avoids the previous selection', async () => {
  const { selectHomeFacts } = await import(moduleUrl(read('utils/homeFacts.ts')))
  const first = selectHomeFacts(facts, [], () => 0.5)
  assert.equal(first.length, 5)
  assert.equal(new Set(first.map(fact => fact.id)).size, 5)
  assert.ok(first.some(fact => !fact.image))
  const next = selectHomeFacts(facts, first.map(fact => fact.id), () => 0.5)
  assert.equal(next.length, 5)
  assert.notDeepEqual(next.map(fact => fact.id), first.map(fact => fact.id))
  const availableNew = facts.filter(fact => !first.some(previous => previous.id === fact.id))
  assert.equal(next.filter(fact => !first.some(previous => previous.id === fact.id)).length, Math.min(5, availableNew.length))
  assert.equal(next.filter(fact => first.some(previous => previous.id === fact.id)).length, 0)
  const textOnly = facts.filter(fact => !fact.image)
  assert.equal(selectHomeFacts(textOnly).length, 5)
  assert.deepEqual(selectHomeFacts([]), [])
})
