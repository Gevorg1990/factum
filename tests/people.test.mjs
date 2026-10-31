import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { contentUrl, moduleUrl } from './helpers/catalog.mjs'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')
const { people, armenianPeople } = await import(contentUrl)
const { armenianPortraits } = await import(moduleUrl(new URL('../data/personPortraits.ts', import.meta.url)))
const { additionalArmenianPeople } = await import(moduleUrl(new URL('../data/armenianPeople.ts', import.meta.url)))
const { biographies: archivedBiographies } = await import(moduleUrl(new URL('../data/biographies/index.ts', import.meta.url)))
const { workDetails } = await import(moduleUrl(new URL('../data/peopleWorks.ts', import.meta.url)))
const vueUrl = new URL('file://' + require.resolve('vue')).href
const encodeModule = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')

test('Armenian biographies have distinct identities and substantive work pages', () => {
  assert.equal(armenianPeople.length, 13)
  assert.equal(new Set(people.map(person => person.id)).size, people.length)
  assert.equal(new Set(armenianPeople.map(person => person.name)).size, armenianPeople.length)
  assert.ok(new Set(armenianPeople.map(person => person.category)).size >= 4)
  assert.ok(!armenianPeople.some(person => person.id === 'einstein'))
  for (const id of ['tumanyan', 'komitas', 'mashtots', 'hambardzumyan', 'einstein']) assert.ok(people.some(person => person.id === id), id)
  for (const person of armenianPeople) {
    assert.ok(person.bio.length > 120 && person.years && person.role && person.category, person.id)
    assert.ok(person.works.length, person.id)
    for (const work of person.works) {
      const info = workDetails[person.id]?.[work]
      assert.ok(info?.description.length > 50 && info?.significance.length > 30, `${person.id}/${work}`)
      assert.notEqual(info.description, info.significance)
    }
    if (person.source) assert.equal(new URL(person.source.url).protocol, 'https:')
  }
})

test('people search covers the full catalog, combines with categories, and resets pagination', async () => {
  const { effectScope } = await import(vueUrl)
  const { descriptor } = parse(readFileSync(new URL('../pages/people/index.vue', import.meta.url), 'utf8'))
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'people.vue', id: 'people-test' }).errors, [])
  let code = compileScript(descriptor, { id: 'people-test' }).content
    .replaceAll("from 'vue'", `from '${vueUrl}'`)
    .replaceAll("from 'lucide-vue-next'", `from '${new URL('file://' + require.resolve('lucide-vue-next')).href}'`)
    .replace("from '~/data/content'", `from '${contentUrl}'`)
  code = `import {ref,computed,watch} from '${vueUrl}';const useHead=()=>{};` + code
  const component = (await import(encodeModule(code))).default
  const scope = effectScope()
  try {
    const page = scope.run(() => component.setup({}, { expose() {} }))
    assert.equal(page.filtered.value.length, armenianPeople.length)
    assert.equal(page.visible.value.length, Math.min(20, armenianPeople.length))
    page.limit.value += page.pageSize
    assert.equal(page.visible.value.length, Math.min(40, armenianPeople.length))
    page.search.value = '  ԲԱԿՈՒՆՑ  '
    assert.equal(page.limit.value, 20)
    assert.deepEqual(page.visible.value.map(person => person.id), ['bakunts'])
    page.category.value = 'Գիտություն և տեխնոլոգիա'
    assert.equal(page.visible.value.length, 0)
    page.resetFilters()
    page.category.value = 'Գիտություն և տեխնոլոգիա'
    assert.equal(page.filtered.value.length, 2)
    page.search.value = 'աստղաֆիզիկոս'
    assert.deepEqual(page.visible.value.map(person => person.id), ['hambardzumyan'])
    page.resetFilters()
    page.search.value = 'ՄԽԻԹԱՐՅԱՆ'
    assert.equal(page.visible.value.length, 0)
    page.resetFilters()
    page.category.value = 'Գրականություն'
    page.search.value = 'Մթնաձոր'
    assert.deepEqual(page.visible.value.map(person => person.id), ['bakunts'])
    page.search.value = 'չգտնվողանուն123'
    assert.equal(page.visible.value.length, 0)
  } finally { scope.stop() }
})

test('portrait lookup uses each person’s actual reference title and language', async () => {
  const fetched = []
  globalThis.__portraitTest = {
    defineCachedEventHandler: handler => handler,
    getRouterParam: event => event.id,
    createError: options => Object.assign(new Error(options.statusMessage), options),
    $fetch: async url => { fetched.push(new URL(url)); return { query: { pages: { 1: { thumbnail: { source: 'https://upload.wikimedia.org/example.jpg' } } } } } },
  }
  let code = readFileSync(new URL('../server/api/portrait/[id].get.ts', import.meta.url), 'utf8').replace("from '~/data/content'", `from '${contentUrl}'`)
  code = 'const {defineCachedEventHandler,getRouterParam,createError,$fetch}=globalThis.__portraitTest;' + code
  try {
    const handler = (await import(encodeModule(code))).default
    const result = await handler({ id: 'abraham-alikhanov' })
    assert.equal(result.url, 'https://upload.wikimedia.org/example.jpg')
    assert.equal(fetched[0].hostname, 'en.wikipedia.org')
    assert.equal(fetched[0].searchParams.get('titles'), people.find(person => person.id === 'abraham-alikhanov').portraitTitle || 'Աբրահամ Ալիխանով')
    await handler({ id: 'tumanyan' })
    assert.equal(fetched[1].hostname, 'hy.wikipedia.org')
    assert.equal(fetched[1].searchParams.get('titles'), 'Հովհաննես Թումանյան')
    await assert.rejects(handler({ id: 'not-a-person' }), error => error.statusCode === 404)
    await assert.rejects(handler({ id: 'mkhitaryan' }), error => error.statusCode === 404)
    assert.equal(fetched.length, 2)
  } finally { delete globalThis.__portraitTest }
})


test('unpublished Vazgen Sargsyan source retains the supplied document', () => {
  const source = additionalArmenianPeople.find(person => person.id === 'vazgen-sargsyan')
  const person = { ...source, ...archivedBiographies[source.id] }
  assert.ok(!people.some(item => item.id === person.id))
  assert.equal(person.name, 'Վազգեն Սարգսյան')
  assert.equal(person.years, '1959–1999')
  assert.equal(person.biographySections.length, 6)
  assert.ok(person.biographySections.some(section => section.title === 'Հոկտեմբերի 27-ի ողբերգությունը'))
  assert.ok(person.timeline.some(event => event.date === '1995' && event.text.includes('պաշտպանության նախարար')))
  assert.ok(person.timeline.some(event => event.date === '1999, հունիսի 11'))
  assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)))
  assert.equal(workDetails[person.id]['Հացի փորձություն'].type, 'Գրական ստեղծագործություն')
})

test('unpublished Babajanyan source retains the uploaded biography and original work order', () => {
  const source = additionalArmenianPeople.find(person => person.id === 'babajanyan')
  const person = { ...source, ...archivedBiographies[source.id] }
  assert.ok(!people.some(item => item.id === person.id))
  assert.ok(person.biographyDocument.url.endsWith('Arno_Babajanyan_Biography.docx'))
  assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)))
  assert.ok(person.biographySections.some(section => section.title === 'Պարգևներ և ճանաչում'))
  const memory = person.biographySections.find(section => section.title === 'Մահը և հիշատակը').text
  assert.ok(memory.includes('քաղաքային պանթեոնում'))
  assert.ok(!memory.includes('Կոմիտասի'))
  assert.equal(person.works[0], 'Հերոսական բալլադ')
  assert.equal(person.works.length, 7)
  assert.ok(person.works.includes('Դաշնամուրային տրիո'))
})

test('Tumanyan includes the uploaded biography and keeps existing work destinations', () => {
  const person = armenianPeople.find(person => person.id === 'tumanyan')
  assert.ok(person.biographyDocument.url.endsWith('Hovhannes_Tumanyan_Biography.docx'))
  assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)))
  assert.equal(person.biographySections.length, 5)
  assert.ok(person.biographySections.some(section => section.title === '«Վերնատուն» գրական խմբակը'))
  assert.ok(person.biographySections.some(section => section.text.includes('Խոջիվանքի')))
  assert.deepEqual(person.works.slice(0, 3), ['Անուշ', 'Գիքորը', 'Թմկաբերդի առումը'])
  assert.equal(person.works.length, 9)
  for (const work of person.works) assert.ok(workDetails.tumanyan[work]?.description && workDetails.tumanyan[work]?.significance)
})

test('Raffi includes the uploaded biography and preserves Samvel destination', () => {
  const person = armenianPeople.find(person => person.id === 'raffi')
  assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)))
  assert.equal(person.biographySections.length, 6)
  assert.ok(person.biographySections.some(section => section.text.includes('Աննա Հորմուզ')))
  assert.equal(person.works[0], 'Սամվել')
  assert.equal(person.works.length, 7)
  for (const work of person.works) assert.ok(workDetails.raffi[work]?.description && workDetails.raffi[work]?.significance)
})

test('Komitas includes the uploaded biography and preserves existing works', () => {
  const person = armenianPeople.find(person => person.id === 'komitas')
  assert.equal(person.biographyDocument.url, '/biography/Komitas_Biography.docx')
  assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)))
  assert.equal(person.biographySections.length, 7)
  assert.ok(person.biographySections.some(section => section.text.includes('Սողոմոն')))
  assert.ok(person.biographySections.some(section => section.title === '1915 թվականը և կյանքի վերջին շրջանը'))
  assert.ok(person.timeline.some(event => event.date === '1936'))
  assert.deepEqual(person.works, ['Պատարագ', 'Հայ ժողովրդական երգերի մշակումներ'])
})

test('Hambardzumyan uses the uploaded biography and keeps his existing work', () => {
  const person = armenianPeople.find(person => person.id === 'hambardzumyan')
  assert.equal(person.biographyDocument.url, '/biography/Viktor_Hambartsumyan_Biography.docx')
  assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)))
  assert.equal(person.biographySections.length, 10)
  assert.ok(person.biographySections.some(section => section.title === 'Բյուրականի աստղադիտարանը'))
  assert.ok(person.timeline.some(event => event.date === '1947'))
  assert.equal(person.works[0], 'Աստղասփյուռների հայտնագործությունը')
  assert.equal(person.works.length, 16)
})

test('every profile has a separate named biography, chronology and downloadable document', async () => {
  const { readdirSync } = await import('node:fs')
  const { biographies } = await import(moduleUrl(new URL('../data/biographies/index.ts', import.meta.url)))
  const files = readdirSync(new URL('../data/biographies/', import.meta.url)).filter(file => file.endsWith('.ts') && file !== 'index.ts')
  assert.equal(files.length, Object.keys(biographies).length)
  assert.ok(Object.keys(biographies).length >= people.length)
  for (const file of files) assert.match(file, /^(?:[A-Z][a-z0-9]*_)+Biography\.ts$/)
  const documents = new Set()
  for (const person of people) {
    assert.ok(biographies[person.id], person.id)
    assert.ok(person.biographySections.length >= 2, person.id)
    assert.ok(person.biographySections.every(section => section.title && section.text.length > 60), person.id)
    assert.ok(person.timeline.length >= 2, person.id)
    assert.ok(person.timeline.every(event => event.date && event.text), person.id)
    assert.ok(person.biographyDocument.url.endsWith('.docx'), person.id)
    assert.ok(existsSync(new URL('../public' + person.biographyDocument.url, import.meta.url)), person.id)
    documents.add(person.biographyDocument.url)
  }
  assert.equal(documents.size, people.length)
})

test('Bakunts uses the uploaded biography including family and supplied works', () => {
  const person = people.find(person => person.id === 'bakunts')
  assert.equal(person.biographySections.length, 6)
  for (const text of ['Վարվառա Չիվիջյան', 'Սևադա', 'Միրհավ', 'Կյորես']) assert.ok(person.biographySections.some(section => section.text.includes(text)), text)
  assert.ok(person.timeline.some(event => event.date === '1936'))
  assert.ok(person.timeline.some(event => event.text.includes('հունիսի 25')))
  assert.equal(person.biographyDocument.url, '/biography/Aksel_Bakunts_Biography.docx')
  assert.equal(person.works[0], 'Ալպիական մանուշակ')
})


test('Bakunts work list includes all seven uploaded titles with complete work pages', () => {
  const person = people.find(person => person.id === 'bakunts')
  assert.deepEqual(person.works, ['Ալպիական մանուշակ', 'Միրհավ', 'Սպիտակ ձին', 'Խոնարհ աղջիկը', 'Ծիրանի փողը', 'Կյորես', 'Մթնաձոր'])
  for (const work of person.works) {
    const info = workDetails.bakunts[work]
    assert.ok(info.description.length > 60 && info.significance.length > 60, work)
    assert.notEqual(info.description, info.significance)
  }
  assert.equal(workDetails.bakunts['Մթնաձոր'].type, 'Պատմվածքների ժողովածու')
})

test('Momik uses the uploaded biography, qualified dates and all supplied works', () => {
  const person = people.find(person => person.id === 'momik')
  assert.equal(person.biographySections.length, 6)
  assert.ok(person.bio.includes('1333 և 1339'))
  assert.ok(person.biographySections.some(section => section.title === 'Ավանդություն և պատմություն'))
  assert.ok(person.timeline.some(event => event.date === '1339' && event.text.includes('Բուրթելաշեն')))
  assert.equal(person.works[0], 'Նորավանքի Սուրբ Աստվածածին եկեղեցի')
  assert.equal(person.works.length, 6)
  assert.equal(person.biographyDocument.url, '/biography/Momik_Biography.docx')
  for (const work of person.works) assert.ok(workDetails.momik[work]?.description && workDetails.momik[work]?.significance)
})

test('Nalbandyan includes the uploaded biography and four complete work pages', () => {
  const person = people.find(person => person.id === 'nalbandian')
  assert.equal(person.biographySections.length, 9)
  assert.ok(person.timeline.some(event => event.date === '1865'))
  assert.equal(person.biographyDocument.url, '/biography/Mikayel_Nalbandyan_Biography.docx')
  assert.deepEqual(person.works, ['Ազատություն', 'Իտալացի աղջկա երգը', 'Երկրագործությունը որպես ուղիղ ճանապարհ', 'Մեռելահարցուկ'])
  for (const work of person.works) assert.ok(workDetails.nalbandian[work]?.description && workDetails.nalbandian[work]?.significance)
})

test('Abovyan uses the uploaded biography and distinguishes disappearance from death', () => {
  const person = people.find(person => person.id === 'abovyan')
  assert.equal(person.biographySections.length, 12)
  for (const text of ['Էմիլիա Լոոզե', '1830–1836', '1841']) assert.ok(person.biographySections.some(section => section.text.includes(text)), text)
  assert.ok(person.timeline.some(event => event.date === '1848, ապրիլ' && event.text.includes('Անհետացել')))
  assert.ok(person.timeline.some(event => event.date === '1858' && event.text.includes('անհետացումից հետո')))
  assert.equal(person.biographyDocument.url, '/biography/Khachatur_Abovyan_Biography.docx')
  assert.equal(person.works[0], 'Վերք Հայաստանի')
})


test('Abovyan includes the seven requested works and exact genre labels', () => {
  const person = people.find(person => person.id === 'abovyan')
  const expected = {
    'Վերք Հայաստանի': 'Պատմական վեպ',
    'Պարապ վախտի խաղալիք': 'Առակների և չափածո ստեղծագործությունների ժողովածու',
    'Նախաշավիղ': 'Դասագիրք',
    'Թուրքի աղջիկը': 'Արձակ ստեղծագործություն',
    'Առաջին սեր': 'Գեղարվեստական արձակ',
    'Ֆեոդորա կամ Որդիական սեր': 'Թատերգություն',
    'Աղասու խաղը': 'Բանաստեղծական ստեղծագործություն',
  }
  assert.deepEqual(person.works, Object.keys(expected))
  for (const [title, type] of Object.entries(expected)) {
    assert.equal(workDetails.abovyan[title].type, type)
    assert.ok(workDetails.abovyan[title].description.length > 60)
    assert.ok(workDetails.abovyan[title].significance.length > 60)
  }
})

test('Aghayan uses the uploaded biography and all six supplied works', () => {
  const person = people.find(person => person.id === 'aghayan')
  assert.equal(person.biographySections.length, 8)
  assert.ok(person.biographySections.some(section => section.text.includes('Խոջիվանքի')))
  assert.ok(person.timeline.some(event => event.date === '1840, ապրիլի 4'))
  assert.ok(person.timeline.some(event => event.date === '1911, հունիսի 20'))
  assert.equal(person.biographyDocument.url, '/biography/Ghazaros_Aghayan_Biography.docx')
  assert.deepEqual(person.works, ['Անահիտ', 'Արություն և Մանվել', 'Արեգնազան', 'Երկու քույր', 'Տորք Անգեղ', 'Հիշողություն'])
  for (const work of person.works) assert.ok(workDetails.aghayan[work]?.description && workDetails.aghayan[work]?.significance)
})

test('Aznavour uses the uploaded biography, nine songs and three film roles', () => {
  const person = people.find(person => person.id === 'aznavour')
  assert.equal(person.biographySections.length, 11)
  assert.ok(person.biographySections.some(section => section.text.includes('Ուլլա Թորսել')))
  assert.equal(person.biographyDocument.url, '/biography/Charles_Aznavour_Biography.docx')
  assert.equal(person.works[0], 'La Bohème')
  assert.equal(person.works.length, 12)
  assert.ok(person.timeline.some(event => event.date === '2004'))
  for (const work of person.works) assert.ok(workDetails.aznavour[work]?.description && workDetails.aznavour[work]?.significance)
  assert.equal(workDetails.aznavour['Արարատ'].type, 'Ֆիլմ · դերակատարում')
})

test('Abraham Alikhanov uses the uploaded biography with the corrected birthplace', () => {
  const person = people.find(person => person.id === 'abraham-alikhanov')
  assert.equal(person.biographySections.length, 10)
  assert.ok(person.biographySections[0].text.includes('Ելիզավետպոլում'))
  assert.ok(!person.biographySections[0].text.includes('Ծնվել է Թիֆլիսում'))
  assert.ok(person.timeline.some(event => event.date === '1928'))
  assert.equal(person.biographyDocument.url, '/biography/Abraham_Alikhanov_Biography.docx')
})

test('Alikhanov scientific work entries preserve all six requested periods', () => {
  const person = people.find(person => person.id === 'abraham-alikhanov')
  const expected = {
    'Պոզիտրոնների ուսումնասիրություն': '1930-ականներ',
    'Էլեկտրոն-պոզիտրոն զույգերի հետազոտություն': '1930-ականներ',
    'Տիեզերական ճառագայթների հետազոտություններ': '1940-ականներ',
    'Մասնիկների հայտնաբերման մեթոդներ': '1940–1950-ականներ',
    'Պրոտոնային արագացուցիչների ստեղծում': '1950–1960-ականներ',
    'Սերպուխովի 70 ԳէՎ պրոտոնային արագացուցիչ': '1967',
  }
  assert.equal(person.works[0], 'Միջուկային ֆիզիկայի փորձարարական աշխատանքներ')
  assert.equal(person.works.length, 7)
  for (const [title, date] of Object.entries(expected)) {
    assert.ok(person.works.includes(title))
    assert.equal(workDetails[person.id][title].date, date)
    assert.ok(workDetails[person.id][title].description && workDetails[person.id][title].significance)
  }
})

test('published Armenian profiles match every actual local portrait and share one image map', () => {
  const files = readdirSync(new URL('../public/images/armenian-people/', import.meta.url)).filter(name => /\.(?:jpe?g|png|webp|avif)$/i.test(name)).sort()
  assert.deepEqual(Object.values(armenianPortraits).map(path => path.split('/').at(-1)).sort(), files)
  assert.deepEqual(armenianPeople.map(person => person.id).sort(), Object.keys(armenianPortraits).sort())
  for (const person of armenianPeople) assert.ok(existsSync(new URL('../public' + armenianPortraits[person.id], import.meta.url)), person.id)
  assert.ok(!people.some(person => person.isArmenian && !armenianPortraits[person.id]))
  for (const file of ['components/PersonPortrait.vue', 'pages/index.vue']) {
    assert.ok(readFileSync(new URL('../' + file, import.meta.url), 'utf8').includes("from '~/data/personPortraits'"))
  }
})

test('Hambardzumyan has sixteen sourced works in three groups with stable first work URL', () => {
  const person = armenianPeople.find(person => person.id === 'hambardzumyan')
  const groups = {}
  for (const work of person.works) {
    const info = workDetails[person.id][work]
    groups[info.group] = (groups[info.group] || 0) + 1
    assert.ok(info.date && info.type && info.description.length > 80 && info.significance.length > 60, work)
    assert.ok(info.sources.length, work)
    for (const source of info.sources) assert.equal(new URL(source.url).protocol, 'https:')
  }
  assert.deepEqual(groups, { 'Գիտական հայտնագործություններ': 4, 'Գրքեր և աշխատություններ': 8, 'Գիտական հոդվածներ': 4 })
  assert.equal(person.works[0], 'Աստղասփյուռների հայտնագործությունը')
  assert.equal(workDetails.hambardzumyan[person.works[0]].date, '1947')
  assert.ok(workDetails.hambardzumyan['Տեսական աստղաֆիզիկա'].description.includes('1952'))
  assert.ok(workDetails.hambardzumyan['Աստղերի էվոլյուցիան և աստղաֆիզիկան'].date.includes('1948'))
  assert.equal(workDetails.hambardzumyan['Աստղասփյուռներ'].date, '1949')
})
