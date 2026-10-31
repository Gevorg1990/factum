import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript')
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const url=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')
const populationUrl=url(read('data/countryPopulation.ts'))
const {countryPopulation}=await import(populationUrl)
const {parseLatestPopulation}=await import(url(read('server/utils/population.ts')))
const {worldFacts,withPopulationEstimates}=await import(url(read('data/worldFacts.ts').replace("from './countryPopulation'",`from '${populationUrl}'`)))
const row=(code,date,value)=>({countryiso3code:code,country:{id:code==='IND'?'IN':'AM'},date,value})

test('latest nonempty values preserve real years and reject invalid or partial datasets',()=>{
 const estimates=parseLatestPopulation([{pages:1},[
  row('IND','2025',1463865525),row('IND','2024',1450935791),row('ARM','2024',3033500),
  row('ARM','2025',null),row('XXX','2099',100),row('BAD','2025',NaN),row('NEG','2025',-1),row('','2025',123),null,
 ]])
 assert.deepEqual(Object.keys(estimates).sort(),['ARM','IND'])
 assert.equal(estimates.IND.value,1463865525)
 assert.equal(estimates.IND.year,2025)
 assert.ok(estimates.IND.source.url.endsWith('locations=IN'))
 assert.equal(estimates.ARM.year,2024)
 for(const invalid of [null,{},[{pages:2},[row('IND','2025',1)]],[{pages:1},[]]])assert.throws(()=>parseLatestPopulation(invalid))
})

test('newer estimates replace old map data; older data cannot downgrade a reviewed estimate',()=>{
 const latest=parseLatestPopulation([{pages:1},[row('IND','2026',1476000000),row('ARM','2025',3060000)]])
 assert.equal(countryPopulation('IND',1366417754,2019,latest).year,2026)
 assert.equal(countryPopulation('ARM',2957731,2019,latest).value,3060000)
 assert.equal(countryPopulation('IND',1366417754,2019,{IND:{...latest.IND,year:2024}}).year,2025)
 assert.equal(countryPopulation('UNKNOWN',1000,2019,latest).year,2019)
 const fact=withPopulationEstimates(worldFacts,latest).find(fact=>fact.id==='most-populous-country')
 const map=countryPopulation('IND',1366417754,2019,latest)
 assert.equal(fact.dataYear,map.year)
 assert.deepEqual(fact.source,map.source)
 assert.match(fact.answer,/2026/)
 assert.ok(fact.detail.includes(map.value.toLocaleString('hy-AM')))
})

test('endpoint requests latest available observations and returns controlled failures',async t=>{
 t.mock.method(console,'error',()=>{})
 let fail=false,requests=0
 globalThis.__populationEndpoint={
  defineCachedFunction:(fn,options)=>{assert.equal(options.maxAge,86400);return fn},defineEventHandler:fn=>fn,
  createError:options=>Object.assign(new Error(options.statusMessage),options),
  $fetch:async(endpoint,options)=>{requests++;assert.equal(options.query.mrnev,1);assert.equal(options.query.per_page,400);if(fail)throw new Error('offline');return [{pages:1},[row('IND','2025',1463865525)]]},
 }
 const parserUrl=url(read('server/utils/population.ts'))
 const source='const {defineCachedFunction,defineEventHandler,createError,$fetch}=globalThis.__populationEndpoint;'+read('server/api/population.get.ts').replace("from '../utils/population'",`from '${parserUrl}'`)
 const handler=(await import(url(source))).default
 assert.equal((await handler()).estimates.IND.year,2025)
 fail=true;await assert.rejects(handler(),{statusCode:502});assert.equal(requests,2)
 delete globalThis.__populationEndpoint
})
