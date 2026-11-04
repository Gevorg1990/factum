import test from 'node:test'
import assert from 'node:assert/strict'
import { moduleUrl } from './helpers/catalog.mjs'
const earth=await import(moduleUrl(new URL('../utils/earth/interior.ts',import.meta.url)))
const { earthLayers,temperatureAnchors }=await import(moduleUrl(new URL('../data/earth/interior.ts',import.meta.url)))
test('PREM layers exactly cover surface through centre with correct one-sided boundaries',()=>{
  assert.equal(earthLayers[0].top,0);assert.equal(earthLayers.at(-1).bottom,6371)
  for(let i=1;i<4;i++)assert.equal(earthLayers[i].top,earthLayers[i-1].bottom)
  assert.equal(earth.layerAtDepth(24.399).id,'crust');assert.equal(earth.layerAtDepth(24.4).id,'mantle')
  assert.equal(earth.layerAtDepth(2891).id,'outer-core');assert.equal(earth.layerAtDepth(5149.5).id,'inner-core')
  assert.equal(earth.layerAtDepth(99999).id,'inner-core');assert.equal(earth.clampDepth(NaN),0)
})
test('hydrostatic pressure from PREM density reproduces reference mass and pressure to educational tolerance',()=>{
  const profile=earth.pressureProfile()
  assert.equal(profile,earth.pressureProfile())
  assert.ok(Math.abs(profile.mass/5.9722e24-1)<.001)
  assert.equal(earth.pressureAtDepth(0),0)
  assert.ok(Math.abs(earth.pressureAtDepth(6371)-363.85)<.4)
  assert.ok(Math.abs(earth.pressureAtDepth(2891)-135.75)<.2)
  assert.ok(Math.abs(earth.pressureAtDepth(5149.5)-328.85)<.4)
  let previous=0
  for(let d=0;d<=6371;d+=10){const p=earth.pressureAtDepth(d);assert.ok(Number.isFinite(p)&&p>=previous);previous=p}
  assert.equal(earth.premDensity(6370),1020)
  assert.ok(earth.premDensity(3479)>earth.premDensity(3481))
})
test('temperature interpolates documented anchors and does not invent an extra centre estimate',()=>{
  for(const p of temperatureAnchors)assert.deepEqual(earth.temperatureAtDepth(p.depth),{low:p.low,high:p.high})
  const between=earth.temperatureAtDepth((410+660)/2)
  assert.equal(between.low,(1547+1622)/2)
  assert.deepEqual(earth.temperatureAtDepth(6371),earth.temperatureAtDepth(5149.5))
})
test('journey advances only forward, clamps elapsed time and stops exactly at centre',()=>{
  assert.equal(earth.advanceJourney(0,.1),16)
  assert.equal(earth.advanceJourney(0,100),16)
  assert.equal(earth.advanceJourney(6370,.1),6371)
  assert.equal(earth.advanceJourney(42,-1),42)
})
