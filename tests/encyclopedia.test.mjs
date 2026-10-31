import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { contentUrl } from './helpers/catalog.mjs'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')
const { questions, subjects, collectionSubjects } = await import(contentUrl)
const vueUrl = new URL('file://' + require.resolve('vue')).href
const { ref, effectScope } = await import(vueUrl)
const normalize = value => value.normalize('NFC').replace(/[։՞?]/g, '').trim()

test('every encyclopedia subject and collection has 100 distinct answered questions', () => {
  assert.equal(new Set(questions.map(question => question.id)).size, questions.length)
  for (const subject of [...subjects, ...collectionSubjects]) {
    const items = questions.filter(question => question.subject === subject.slug)
    assert.ok(items.length >= 100, `${subject.slug}: ${items.length}`)
    assert.equal(new Set(items.map(question => normalize(question.title))).size, items.length, subject.slug)
    for (const question of items) {
      assert.ok(question.title.trim() && question.answer.trim() && question.detail.trim(), question.id)
      assert.doesNotMatch(`${question.answer} ${question.detail}`, /undefined|TODO|լրացնել/i)
      if (question.source) assert.equal(new URL(question.source.url).protocol, 'https:', question.id)
    }
  }
  // Existing saved-reading destinations remain intact.
  for (const id of ['c1', 'c2', 'p1', 's1', 'people-tumanyan', 'bible-genesis', 'chemistry-catalysts']) {
    assert.ok(questions.some(question => question.id === id), id)
  }
})

test('subject pagination, full-catalog search, reading and saved filters work together', () => {
  const { descriptor, errors } = parse(readFileSync(new URL('../pages/subjects/[slug].vue', import.meta.url), 'utf8'))
  assert.deepEqual(errors, [])
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'subject.vue', id: 'subject-test' }).errors, [])
  let code = compileScript(descriptor, { id: 'subject-test' }).content
    .replaceAll("from 'vue'", `from '${vueUrl}'`)
    .replace("from '~/data/content'", `from '${contentUrl}'`)
  const progress = { read: ref([]), saved: ref([]), markRead(id) { if (!this.read.value.includes(id)) this.read.value.push(id) }, toggleSaved() {} }
  globalThis.__subjectTest = { progress: { ...progress, markRead: id => progress.markRead(id) } }
  code = `import {ref,computed,watch} from '${vueUrl}';const useRoute=()=>({params:{slug:'chemistry'}});const useProgress=()=>globalThis.__subjectTest.progress;` + code
  const url = 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')
  return import(url).then(({ default: component }) => {
    const scope = effectScope()
    try {
      const page = scope.run(() => component.setup({}, { expose() {} }))
      assert.equal(page.displayed.value.length, 20)
      page.limit.value += page.pageSize
      assert.equal(page.displayed.value.length, 40)
      const target = page.items.at(-1)
      assert.ok(!page.displayed.value.some(question => question.id === target.id))
      page.searchQuery.value = target.title
      assert.equal(page.limit.value, 20)
      assert.ok(page.displayed.value.some(question => question.id === target.id))
      page.toggleQuestion(target.id)
      assert.ok(progress.read.value.includes(target.id))
      assert.ok(page.opened.value.includes(target.id))
      page.toggleQuestion(target.id)
      assert.ok(!page.opened.value.includes(target.id))
      page.searchQuery.value = ''
      progress.saved.value = [target.id]
      page.filter.value = 'saved'
      assert.deepEqual(page.displayed.value.map(question => question.id), [target.id])
      page.filter.value = 'read'
      assert.deepEqual(page.displayed.value.map(question => question.id), [target.id])
      page.filter.value = 'unread'
      assert.ok(!page.visible.value.some(question => question.id === target.id))
      page.searchQuery.value = 'չգտնվողբառ999'
      assert.equal(page.displayed.value.length, 0)
    } finally {
      scope.stop()
      delete globalThis.__subjectTest
    }
  })
})
