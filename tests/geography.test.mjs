import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,statSync} from 'node:fs'
import {moduleUrl} from './helpers/catalog.mjs'
const read=p=>JSON.parse(readFileSync(new URL('../public/data/geography/'+p,import.meta.url),'utf8'))
const countries=read('countries-v1.json'),statistics=read('statistics-2024-v1.json'),facts=read('facts-v1.json'),records=read('records-v1.json')
const core=await import(moduleUrl(new URL('../utils/geography/core.ts',import.meta.url)))
const engine=await import(moduleUrl(new URL('../utils/geography/games.ts',import.meta.url)))
const labels=await import(moduleUrl(new URL('../data/geography/labels.ts',import.meta.url)))
test('100+ facts and 30+ records have unique IDs, source links, Armenian content and valid representative markers',()=>{
 assert.ok(facts.length>=100);assert.ok(records.length>=30)
 for(const collection of [facts,records]){assert.equal(new Set(collection.map(f=>f.id)).size,collection.length);for(const f of collection){assert.match(f.title,/[Ա-ֆ]/);assert.match(f.detail,/[Ա-ֆ]/);assert.ok(new URL(f.source.url).protocol==='https:');if(f.coordinates)assert.ok(core.validCoordinates(f.coordinates))}}
 assert.ok(new Set(facts.map(f=>f.category)).size>=6)
})
test('same-year comparison snapshot keeps missing values absent and density uses the sourced land-area indicator',()=>{
 assert.equal(statistics.year,2024)
 const arm=countries.find(c=>c.cca3==='ARM'),s=statistics.countries.ARM
 assert.ok(s.population>2e6&&s.population<4e6);assert.ok(s.gdp>1e10)
 assert.equal(core.density(s,arm.area),s.density)
 assert.equal(core.density(undefined,arm.area),undefined);assert.equal(core.density(s,0),s.density)
 assert.equal(core.density({density:0},1),0)
 for(const s of Object.values(statistics.countries))for(const v of Object.values(s))assert.ok(Number.isFinite(v)&&v>=0)
})
test('Armenian search normalizes Unicode, ligatures and case without merging different letters',()=>{
 assert.equal(core.normalizeGeoSearch('  ԵՐԵՎԱՆ  '),core.normalizeGeoSearch('երեւան'))
 assert.equal(core.normalizeGeoSearch('Սև ծով'),core.normalizeGeoSearch('սեւ ծով'))
 assert.notEqual(core.normalizeGeoSearch('լիճ'),core.normalizeGeoSearch('ղիճ'))
 assert.equal(core.validCoordinates([181,0]),false)
})
test('all three games create complete sessions without duplicate questions or invalid answers',()=>{
 for(const mode of ['guess','map','larger']){
  const questions=engine.makeGeographyQuestions(mode,countries,statistics)
  assert.equal(questions.length,mode==='guess'?15:8,mode)
  assert.equal(new Set(questions.map(q=>q.id)).size,questions.length)
  if(mode==='guess')for(const q of questions){assert.match(q.flag,/^[A-Z]{2}$/);assert.equal(q.prompt,'Ո՞ր երկրի դրոշն է սա։')}
  for(const q of questions){assert.ok(countries.some(c=>c.cca3===q.answer));if(mode!=='map'){assert.equal(q.options.filter(c=>c===q.answer).length,1);assert.equal(new Set(q.options).size,q.options.length)}assert.match(q.explanation,/[Ա-ֆ]/)}
 }
 const withoutStats=engine.makeGeographyQuestions('larger',countries,null)
 assert.ok(withoutStats.every(q=>q.id.startsWith('area-')))
})
test('reference capitals agree with the preserved source data and translated labels',async()=>{
 const {capitalPairs}=await import(moduleUrl(new URL('../data/capitalQuiz.ts',import.meta.url)))
 for(const p of capitalPairs){const c=countries.find(c=>c.cca3===p.countryCode);assert.ok(c.capital.some(n=>p.capitalAliases.includes(n)),p.countryCode);assert.equal(labels.capitalName(c.cca3,c.capital),p.capital)}
})
test('assets have bounded sizes, valid geometries and a source/license manifest',()=>{
 const world=read('world-v1.json'),zones=read('timezones-v1.json');assert.equal(world.features.length,177);assert.ok(zones.features.length>20)
 for(const f of [...world.features,...zones.features])assert.ok(['Polygon','MultiPolygon'].includes(f.geometry.type))
 for(const path of ['world-v1.json','timezones-v1.json'])assert.ok(statSync(new URL('../public/data/geography/'+path,import.meta.url)).size<750000)
 for(const path of ['earth-surface-v1.jpg','earth-night-v1.jpg'])assert.ok(statSync(new URL('../public/images/geography/'+path,import.meta.url)).size<150000)
 const sources=read('sources.json');assert.match(sources.historical.license,/NC/);assert.match(sources.boundaries.license,/Public domain/)
})

test('larger-country game uses current same-year populations and omits mismatched years',()=>{
 const pair=countries.filter(c=>['ARM','JPN'].includes(c.cca3)),source={name:'Համաշխարհային բանկ',url:'https://data.worldbank.org/indicator/SP.POP.TOTL'}
 const latest={ARM:{value:150000000,year:2025,source},JPN:{value:120000000,year:2025,source}}
 const questions=engine.makeGeographyQuestions('larger',pair,statistics,Math.random,latest)
 const population=questions.find(q=>q.id.startsWith('population-'))
 assert.ok(population);assert.equal(population.answer,'ARM');assert.match(population.prompt,/2025/);assert.match(population.explanation,/2025/);assert.doesNotMatch(population.explanation,/2024/)
 const mixed=engine.makeGeographyQuestions('larger',pair,statistics,Math.random,{...latest,JPN:{...latest.JPN,year:2024}})
 assert.ok(mixed.every(q=>q.id.startsWith('area-')))
})
