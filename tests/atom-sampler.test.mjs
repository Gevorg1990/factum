import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { moduleUrl } from './helpers/catalog.mjs'
const ts=createRequire(import.meta.url)('typescript')
const orbitals=await import(moduleUrl(new URL('../utils/chemistry/orbitals.ts',import.meta.url)))
const compile=file=>ts.transpileModule(readFileSync(new URL('../utils/chemistry/'+file,import.meta.url),'utf8').replaceAll('import.meta.url',"'https://factum.test/sampler.js'"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const code=compile('orbitalSampler.client.ts')
function setup(fallback=false) {
  const workers=[]
  class Worker {
    constructor() { workers.push(this) }
    postMessage(data) { this.request=data }
    terminate() { this.terminated=true }
    finish() { this.onmessage({data:{id:this.request.id,cloud:orbitals.sampleOrbital(this.request.orbital,128)}}) }
  }
  const exports={}
  runInNewContext(code,{exports,require:()=>orbitals,URL,setTimeout,Worker:fallback?undefined:Worker})
  return {sampler:exports.createOrbitalSampler(),workers}
}
test('worker jobs cancel stale selections, reuse bounded cached clouds and terminate on disposal',async()=>{
  const {sampler,workers}=setup()
  const first=sampler.sample({n:1,l:0,m:0})
  const cancelled=assert.rejects(first,/Cancelled/)
  const second=sampler.sample({n:2,l:1,m:0})
  await cancelled
  assert.equal(workers[0].terminated,true)
  workers[1].finish()
  const cloud=await second
  assert.equal(workers[1].terminated,true)
  assert.equal(await sampler.sample({n:2,l:1,m:0}),cloud)
  assert.equal(workers.length,2)
  const pending=sampler.sample({n:3,l:2,m:1})
  const disposed=assert.rejects(pending,/Cancelled/)
  sampler.dispose()
  await disposed
  assert.equal(workers[2].terminated,true)
  await assert.rejects(sampler.sample({n:1,l:0,m:0}),/Disposed/)
})
test('worker failure is reported and workerless fallback computes the same real distribution',async()=>{
  const {sampler,workers}=setup()
  const pending=sampler.sample({n:1,l:0,m:0})
  const rejected=assert.rejects(pending,/worker failed/)
  workers[0].onerror()
  await rejected
  assert.equal(workers[0].terminated,true)
  sampler.dispose()
  const fallback=setup(true).sampler
  const cloud=await fallback.sample({n:1,l:0,m:0})
  assert.equal(cloud.positions.length,36000)
  assert.ok(Math.abs(cloud.integratedProbability-1)<1e-6)
  fallback.dispose()
})
test('worker protocol transfers actual typed arrays and returns an honest error for invalid orbitals',()=>{
  const self={postMessage(data,transfer){this.response=data;this.transfer=transfer}}
  runInNewContext(compile('orbitalWorker.ts'),{exports:{},self,require:()=>orbitals})
  self.onmessage({data:{id:1,orbital:{n:2,l:1,m:-1}}})
  assert.equal(self.response.id,1)
  assert.equal(self.response.cloud.positions.length,36000)
  assert.equal(self.transfer[0],self.response.cloud.positions.buffer)
  self.onmessage({data:{id:2,orbital:{n:1,l:2,m:0}}})
  assert.equal(self.response.error,true)
})
