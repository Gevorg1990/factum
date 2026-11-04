import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'
import{gzipSync}from'node:zlib'
const manifest=(await import('../.nuxt-build/dist/server/client.manifest.mjs')).default
const viewer=Object.keys(manifest).find(key=>manifest[key].name==='InteriorExplorer.client')
const scene='utils/earth/scene.client.ts'
const globe=Object.keys(manifest).find(key=>key==='pages/globe.vue'||manifest[key].name==='globe')
assert.ok(globe)
assert.ok(viewer&&manifest[scene])
function graph(key,result=new Set()){if(result.has(key))return result;result.add(key);for(const dep of manifest[key]?.imports||[])graph(dep,result);return result}
const file=key=>new URL('../.output/public/_nuxt/'+manifest[key].file,import.meta.url)
for(const page of ['pages/index.vue',globe]){
  const initial=graph(page)
  assert.ok(!initial.has(viewer)&&!initial.has(scene),`${page} must not eagerly load the depth viewer`)
  for(const key of initial)if(manifest[key]?.file?.endsWith('.js'))assert.ok(!readFileSync(file(key),'utf8').includes('THREE.WebGLRenderer'),`${page} eagerly loads WebGL`)
}
assert.ok(manifest[globe].dynamicImports.includes(viewer))
assert.ok(manifest[viewer].dynamicImports.includes(scene))
const initial=graph(globe),optional=graph(viewer)
for(const key of graph(scene))optional.add(key)
let raw=0,gzip=0
for(const key of optional)if(!initial.has(key)&&manifest[key]?.file?.endsWith('.js')){const source=readFileSync(file(key));raw+=source.length;gzip+=gzipSync(source).length}
const home=readFileSync(new URL('../.output/public/index.html',import.meta.url),'utf8')
for(const key of [viewer,scene])assert.ok(!home.includes(manifest[key].file),'Home must not preload depth mode')
console.log(`Earth interior optional JS including shared Three.js: ${(raw/1024).toFixed(1)} KiB, ${(gzip/1024).toFixed(1)} KiB gzip.`)
console.log('Homepage and globe initial import graphs exclude the depth mode and Three.js.')
