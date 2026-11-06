import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {moduleUrl} from './helpers/catalog.mjs'
const require=createRequire(import.meta.url),ts=require('typescript')
const parser=await import(moduleUrl(new URL('../utils/geography/placeSearch.ts',import.meta.url)))
const feature=(id=1,coordinates=[13.4,52.5])=>({geometry:{type:'Point',coordinates},properties:{name:`Example island ${id}`,country:'Germany',osm_key:'place',osm_value:'island',osm_type:'N',osm_id:id}})
test('geocoding accepts only named valid coordinates, deduplicates and bounds results',()=>{
 const items=parser.parsePlaceResults({features:[feature(),feature(),feature(2,[999,52]),{...feature(3),geometry:{type:'Polygon',coordinates:[]}},...Array.from({length:20},(_,i)=>feature(i+10))]})
 assert.equal(items.length,6);assert.equal(items[0].url,'https://www.openstreetmap.org/node/1')
 assert.deepEqual(items[0].coordinates,[13.4,52.5]);assert.equal(items[0].context,'Germany')
 assert.deepEqual(parser.parsePlaceResults(null),[])
})
function endpoint(fetcher){
 let now=10000
 const scope={exports:{},require:()=>parser,defineEventHandler:fn=>fn,getQuery:event=>event,useRuntimeConfig:()=>({geographySearchUrl:'https://example.test'}),createError:props=>Object.assign(new Error(props.statusMessage),props),$fetch:fetcher,Date:{now:()=>now},Map,Promise}
 const source=readFileSync(new URL('../server/api/geography/search.get.ts',import.meta.url),'utf8')
 runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope)
 return {search:scope.exports.default,advance:()=>now+=1100}
}
test('world search validates input, coalesces concurrent lookups and caches repeated searches',async()=>{
 let calls=0,resolve
 const e=endpoint(async()=>{calls++;return await new Promise(r=>resolve=r)})
 await assert.rejects(e.search({q:'x'}),{statusCode:400})
 const first=e.search({q:'Berlin'}),second=e.search({q:'BERLIN'})
 assert.equal(calls,1);resolve({features:[feature()]})
 const results=await Promise.all([first,second]);assert.equal(results[0].items.length,1)
 assert.equal((await e.search({q:'Berlin'})).items.length,1);assert.equal(calls,1)
 await assert.rejects(e.search({q:'Paris'}),{statusCode:429})
})
test('world provider failures remain retryable and are not cached as missing places',async()=>{
 let calls=0
 const e=endpoint(async()=>{if(++calls===1)throw Error('offline');return {features:[feature()]}})
 await assert.rejects(e.search({q:'Berlin'}),{statusCode:502});e.advance()
 assert.equal((await e.search({q:'Berlin'})).items.length,1);assert.equal(calls,2)
})

test('only countries and island landforms pass the remote search filter',()=>{
 const rows=['school','city','village','house','island','islet','country','archipelago'].map((value,i)=>({...feature(i),properties:{...feature(i).properties,osm_value:value}}))
 rows.push({...feature(20),properties:{...feature(20).properties,osm_key:'amenity',osm_value:'school'}})
 assert.equal(parser.parsePlaceResults({features:rows}).length,4)
})

test('different OSM objects for the same nearby island produce one result',()=>{
 const a=feature(1),b=feature(2,[13.401,52.5]),c=feature(3,[20,52.5])
 b.properties.name=a.properties.name;c.properties.name=a.properties.name
 assert.equal(parser.parsePlaceResults({features:[a,b,c]}).length,2)
})
