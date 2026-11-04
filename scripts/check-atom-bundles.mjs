import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
const manifest = (await import('../.nuxt-build/dist/server/client.manifest.mjs')).default
const rendererKey = 'utils/chemistry/atomScene.client.ts'
const viewerKey = Object.keys(manifest).find(key => key === 'components/chemistry/AtomExplorer.client.vue' || manifest[key].name === 'AtomExplorer.client')
const samplerKey = 'utils/chemistry/orbitalSampler.client.ts'
const tableKey = Object.keys(manifest).find(key => key === 'pages/periodic-table.vue' || manifest[key].name === 'periodic-table')
assert.ok(viewerKey && tableKey && manifest[rendererKey] && manifest[viewerKey] && manifest[tableKey], 'Build the atom viewer before running this check')
function staticGraph(key, result = new Set()) {
  if (result.has(key)) return result
  result.add(key)
  for (const dependency of manifest[key]?.imports || []) staticGraph(dependency, result)
  return result
}
for (const entry of ['pages/index.vue', tableKey]) {
  const initial = staticGraph(entry)
  assert.ok(!initial.has(viewerKey), `${entry} eagerly imports the atom interface`)
  assert.ok(!initial.has(samplerKey), `${entry} eagerly imports the orbital sampler`)
  assert.ok(!initial.has(rendererKey), `${entry} eagerly imports Three.js`)
  for (const key of initial) {
    const file = manifest[key]?.file
    if (!file?.endsWith('.js')) continue
    const source = readFileSync(new URL('../.output/public/_nuxt/' + file, import.meta.url), 'utf8')
    assert.ok(!source.includes('THREE.WebGLRenderer'), `${entry} contains the WebGL renderer in a shared chunk`)
  }
}
assert.ok(manifest[tableKey].dynamicImports.includes(viewerKey))
assert.ok(manifest[viewerKey].dynamicImports.includes(rendererKey))
assert.ok(manifest[viewerKey].dynamicImports.includes(samplerKey))
const workerFiles = readdirSync(new URL('../.output/public/_nuxt/', import.meta.url)).filter(file => /^orbitalWorker-.*\.js$/.test(file))
assert.equal(workerFiles.length, 1, 'One isolated orbital worker must be emitted')
const home = readFileSync(new URL('../.output/public/index.html', import.meta.url), 'utf8')
for (const file of workerFiles) assert.ok(!home.includes(file), 'Homepage loads the orbital worker')
for (const key of [rendererKey, viewerKey, samplerKey]) assert.ok(!home.includes(manifest[key].file), 'Homepage preloads an atom chunk')
for (const key of [viewerKey, rendererKey, samplerKey]) {
  const file = manifest[key].file
  const source = readFileSync(new URL('../.output/public/_nuxt/' + file, import.meta.url))
  console.log(`${key}: ${(source.length / 1024).toFixed(1)} KiB, ${(gzipSync(source).length / 1024).toFixed(1)} KiB gzip; loaded on demand`)
}
for (const file of workerFiles) console.log(`${file}: ${(readFileSync(new URL('../.output/public/_nuxt/' + file, import.meta.url)).length / 1024).toFixed(1)} KiB; worker on demand`)
console.log('Home and periodic-table initial import graphs exclude the atom viewer and Three.js.')
