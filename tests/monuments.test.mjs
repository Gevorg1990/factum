import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { contentUrl, moduleUrl } from './helpers/catalog.mjs'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const { renderToString } = require('@vue/server-renderer')
const vueUrl = new URL('file://' + require.resolve('vue')).href
const { createSSRApp } = await import(vueUrl)
const { people } = await import(contentUrl)
const monumentsUrl = moduleUrl(new URL('../data/personMonuments.ts', import.meta.url))
const { personMonuments, monumentMapUrl, kirkKerkorianMonuments } = await import(monumentsUrl)

const { descriptor } = parse(readFileSync(new URL('../components/PersonMonuments.vue', import.meta.url), 'utf8'))
let code = compileScript(descriptor, { id: 'monuments-test', inlineTemplate: true }).content
  .replaceAll("from 'vue'", `from '${vueUrl}'`)
  .replaceAll('from "vue"', `from '${vueUrl}'`)
  .replaceAll("from 'lucide-vue-next'", `from '${new URL('file://' + require.resolve('lucide-vue-next')).href}'`)
  .replace("from '~/data/personMonuments'", `from '${monumentsUrl}'`)
code = `const usePublishedContent=async(_kind,fallback)=>fallback;import {ref,computed,watch} from '${vueUrl}';` + code
const component = (await import('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64'))).default

test('each monument identifies a real profile, site, opening year and credited photograph', () => {
  assert.ok(personMonuments.length >= 7)
  assert.equal(new Set(personMonuments.map(monument => monument.id)).size, personMonuments.length)
  for (const monument of personMonuments) {
    assert.ok(people.some(person => person.id === monument.personId), monument.id)
    assert.ok(monument.location && monument.city && monument.name, monument.id)
    const year = monument.openedYear ?? monument.installedYear
    if (year !== undefined) assert.ok(Number.isInteger(year) && year <= 2026, monument.id)
    assert.equal(new URL(monument.source.url).protocol, 'https:')
    if (monument.image) {
      assert.ok(monument.image.credit && monument.image.alt && monument.image.license)
      for (const url of [monument.image.src, monument.image.sourceUrl, monument.image.licenseUrl]) assert.equal(new URL(url).protocol, 'https:')
    }
    const map = new URL(monumentMapUrl(monument))
    assert.equal(map.searchParams.get('api'), '1')
    assert.ok(map.searchParams.get('query').includes(monument.location))
  }
})

test('Teryan monument distinguishes installation from opening and renders its own photograph', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'teryan', name: 'Վահան Տերյան' }))
  for (const text of ['Հուշարձաններ', 'Օղակաձև զբոսայգի', 'Տեղադրում', '1999', 'Բացում', '2000 թ. փետրվարի 9', 'Դիտել քարտեզի վրա', 'Violmsyan']) assert.ok(html.includes(text), text)
  assert.ok(html.includes('Statue_of_Armenian_writer_Vahan_Teryan_01.jpg'))
  assert.ok(!html.includes('Komitas'))
})

test('a profile without a verified monument does not show an empty monument section', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'no-monument', name: 'Գործիչ' }))
  assert.ok(!html.includes('Հուշարձաններ'))
  assert.ok(!html.includes('<img'))
})


test('Raffi profile renders its monument without inventing an opening date', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'raffi', name: 'Րաֆֆի' }))
  for (const text of ['Րաֆֆու կիսանդրի', 'Կոմիտասի պողոտա 37', '1987', 'Տեղադրում', 'Արշամ Շահինյան', 'Raffi_monument_Yerevan.jpg', 'CC BY-SA 3.0']) assert.ok(html.includes(text), text)
  assert.ok(!html.includes('Բացում'))
})

test('Komitas profile renders both distinct Yerevan monuments', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'komitas', name: 'Կոմիտաս' }))
  assert.equal(personMonuments.filter(item => item.personId === 'komitas').length, 2)
  for (const text of ['1955', '1988', 'պանթեոն', 'կոնսերվատորիայի', 'GeoO', 'Գրիգոր Աղաբաբյան']) assert.ok(html.includes(text), text)
})

test('Hambardzumyan renders the statue and memorial with distinct dates and images', async () => {
  const monuments = personMonuments.filter(item => item.personId === 'hambardzumyan')
  assert.equal(monuments.length, 2)
  assert.notEqual(monuments[0].image.src, monuments[1].image.src)
  const html = await renderToString(createSSRApp(component, { personId: 'hambardzumyan', name: 'Վիկտոր Համբարձումյան' }))
  for (const text of ['հուշարձան', 'հուշակոթող', 'Ուսանողական պուրակ', 'Բաղրամյան պողոտա', '2009 թ. դեկտեմբերի 15', '1996', 'Տարիել Հակոբյան', 'Հայկ Ասատրյան', 'Armineaghayan', 'Textfabrikant']) assert.ok(html.includes(text), text)
})

test('Bakunts profile shows the Goris bust and its credited photograph', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'bakunts', name: 'Ակսել Բակունց' }))
  for (const text of ['Ակսել Բակունցի կիսանդրի', 'Գորիս', 'Ակսել Բակունցի անվան հրապարակ', '1964', 'Արարատ Թրվանց']) assert.ok(html.includes(text), text)
})

test('Momik profile renders the verified Ijevan sculpture with installation year', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'momik', name: 'Մոմիկ' }))
  for (const text of ['«Մոմիկ» քանդակ', 'Իջևան', 'Քանդակների զբոսայգի', '1987', 'Յուրի Սամվելյան', 'AKB7']) assert.ok(html.includes(text), text)
  assert.ok(!html.includes('Բացում'))
})

test('Nalbandyan profile renders its Circular Park monument and opening date', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'nalbandian', name: 'Միքայել Նալբանդյան' }))
  for (const text of ['Միքայել Նալբանդյանի հուշարձան', 'Օղակաձև զբոսայգի', '1965 թ. նոյեմբերի 29', 'Նիկողայոս Նիկողոսյան', 'Ջիմ Թորոսյան']) assert.ok(html.includes(text), text)
})

test('Abovyan profile shows the 1950 square monument with its own image', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'abovyan', name: 'Խաչատուր Աբովյան' }))
  for (const text of ['Խաչատուր Աբովյանի հրապարակ', '1950', 'Սուրեն Ստեփանյան', 'Գևորգ Թամանյան', 'Khachatur_Abovyan_statue.jpg', 'Armenian World']) assert.ok(html.includes(text), text)
})

test('Aghayan profile shows both verified sites with their separate photographs', async () => {
  const records = personMonuments.filter(item => item.personId === 'aghayan')
  assert.equal(records.length, 2)
  assert.notEqual(records[0].image.src, records[1].image.src)
  const html = await renderToString(createSSRApp(component, { personId: 'aghayan', name: 'Ղազարոս Աղայան' }))
  for (const text of ['Կիևյան փողոց 9', 'Դիլիջան', '1955', '1976', 'Երեմ Վարդանյան', 'Armineaghayan', 'Beko']) assert.ok(html.includes(text), text)
})


test('Aghayan bust links to its article and uses the larger photo presentation', () => {
  const bust = personMonuments.find(item => item.id === 'aghayan-yerevan-school-63')
  assert.equal(new URL(bust.source.url).hostname, 'hy.wikipedia.org')
  assert.equal(bust.image.fit, 'cover')
  assert.ok(bust.image.sourceUrl.includes(encodeURIComponent('ՂԱԶԱՐՈՍ_ԱՂԱՅԱՆ_(1).JPG')))
  assert.equal(bust.image.credit, 'Armineaghayan / Wikimedia Commons')
  assert.equal(bust.image.license, 'CC BY-SA 3.0')
})

test('Aznavour shows separate Gyumri and Yerevan monuments with correct image licenses', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'aznavour', name: 'Շառլ Ազնավուր' }))
  const records = personMonuments.filter(item => item.personId === 'aznavour')
  assert.equal(records.length, 2)
  for (const text of ['Գյումրի', 'Երևան', '2001', '2025 թ. հուլիսի 18', 'Սամվել Պետրոսյան', 'Դավիթ Մինասյան']) assert.ok(html.includes(text), text)
  assert.equal(records[0].image.licenseUrl, 'https://creativecommons.org/licenses/by/2.0/')
  assert.equal(records[1].image.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/')
  assert.notEqual(records[0].image.src, records[1].image.src)
})

test('Alikhanov plaque renders its verified location without an invented date or photo', async () => {
  const html = await renderToString(createSSRApp(component, { personId: 'abraham-alikhanov', name: 'Աբրահամ Ալիխանով' }))
  assert.ok(html.includes('Աբրահամ Ալիխանովի հուշատախտակ'))
  assert.ok(html.includes('Չերյոմուշկինսկայա փողոց 25'))
  assert.ok(!html.includes('<img'))
  assert.ok(!html.includes('Տեղադրում'))
  assert.ok(!html.includes('Բացում'))
  assert.ok(html.includes('Դիտել քարտեզի վրա'))
})

test('CMS Kerkorian monuments retain separate sites and verified opening dates', async () => {
  const { biography } = await import(moduleUrl(new URL('../data/biographies/Kirk_Kerkorian_Biography.ts', import.meta.url)))
  assert.equal(biography.id, 'kirk-kerkorian')
  assert.equal(kirkKerkorianMonuments.length, 2)
  assert.deepEqual(kirkKerkorianMonuments.map(item => item.city), ['Գյումրի', 'Սպիտակ'])
  assert.deepEqual(kirkKerkorianMonuments.map(item => item.openedYear), [2018, 2019])
  for (const item of kirkKerkorianMonuments) {
    assert.equal(item.personId, biography.id)
    assert.ok(item.openedDate && item.location && item.sculptor && item.source.url)
    assert.equal(item.installedYear, undefined)
  }
  assert.match(kirkKerkorianMonuments[0].image.sourceUrl, /Monument_of_Kirk_Kerkorian_in_Gyumri/)
  assert.equal(kirkKerkorianMonuments[1].image, undefined)
})
