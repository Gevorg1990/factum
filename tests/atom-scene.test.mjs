import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import * as THREE from 'three'
import { moduleUrl } from './helpers/catalog.mjs'
const { createAtomModel } = await import(moduleUrl(new URL('../utils/chemistry/atomModel.ts', import.meta.url)))
const ts = createRequire(import.meta.url)('typescript')
const code = ts.transpileModule(readFileSync(new URL('../utils/chemistry/atomScene.client.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup() {
  const frames = new Map(), listeners = new Map(), elements = []
  const observations = { resize: [], intersection: [] }
  let nextFrame = 0, lastScene, renders = 0, disposed = 0, lost = 0, errors = 0
  const host = { children: [], getBoundingClientRect: () => ({ width: 640, height: 400 }), appendChild(node) { this.children.push(node); node.remove = () => { this.children = this.children.filter(child => child !== node) } } }
  function element() {
    const node = { style: {}, attributes: {}, events: new Map(), setAttribute(key, value) { this.attributes[key] = value }, addEventListener(name, fn) { this.events.set(name, fn) }, removeEventListener(name) { this.events.delete(name) }, remove() {} }
    elements.push(node)
    return node
  }
  const document = { hidden: false, createElement: element, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) }
  class Renderer {
    domElement = element()
    setPixelRatio(value) { assert.equal(value, 1.6) }
    setSize() {}
    render(scene) { lastScene = scene; renders++ }
    dispose() { disposed++ }
    forceContextLoss() { lost++ }
  }
  class Controls {
    target = new THREE.Vector3()
    events = new Map()
    constructor(camera) { this.camera = camera }
    update() { this.events.get('change')?.() }
    addEventListener(name, fn) { this.events.set(name, fn) }
    removeEventListener(name) { this.events.delete(name) }
    dispose() {}
  }
  class Label extends THREE.Object3D { constructor(node) { super(); this.element = node } }
  class LabelRenderer { domElement = element(); setSize() {} render() {} }
  class Resize { constructor(fn) { this.callback = fn; observations.resize.push(this) } observe() {} disconnect() { this.disconnected = true } }
  class Intersection { constructor(fn) { this.callback = fn; observations.intersection.push(this) } observe() {} disconnect() { this.disconnected = true } }
  const exports = {}
  runInNewContext(code, {
    exports, document, window: { devicePixelRatio: 2 }, ResizeObserver: Resize, IntersectionObserver: Intersection,
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id, fn); return id },
    cancelAnimationFrame: id => frames.delete(id),
    require: name => {
      if (name === 'three') return { ...THREE, WebGLRenderer: Renderer }
      if (name.includes('OrbitControls')) return { OrbitControls: Controls }
      if (name.includes('CSS2DRenderer')) return { CSS2DObject: Label, CSS2DRenderer: LabelRenderer }
      throw Error('Unexpected runtime import ' + name)
    },
  })
  const scene = exports.createAtomScene(host, () => { errors++ })
  return {
    scene, frames, observations, document, elements, host,
    objects: () => { const found = []; lastScene.traverse(object => found.push(object)); return found },
    renders: () => renders, disposed: () => disposed, lost: () => lost, errors: () => errors,
    visibility: hidden => { document.hidden = hidden; listeners.get('visibilitychange')?.() },
    listeners,
  }
}
test('real Three.js scene geometry contains exactly the selected isotope particles and electron shells', () => {
  const app = setup()
  app.scene.setAtom(createAtomModel(26, 56))
  const particles = app.objects().filter(object => object instanceof THREE.InstancedMesh)
  assert.equal(particles.find(mesh => mesh.material.color.getHexString() === 'fb7185').count, 26)
  assert.equal(particles.find(mesh => mesh.material.color.getHexString() === 'f5d48f').count, 30)
  assert.deepEqual(particles.filter(mesh => mesh.material.color.getHexString() === '82ddff').map(mesh => mesh.count), [2, 8, 14, 2])
  app.scene.setShell(3)
  const shellGroups = app.objects().filter(object => object.children.some(child => child instanceof THREE.LineLoop))
  assert.equal(shellGroups.filter(group => group.visible).length, 1)
  app.scene.setShell(null)
  assert.equal(shellGroups.filter(group => group.visible).length, 4)
  app.scene.setLabels(true)
  assert.equal(app.objects().filter(object => object.element && object.visible).length, 3)
  app.scene.setAtom(createAtomModel(1, 1))
  assert.equal(app.objects().filter(object => object instanceof THREE.InstancedMesh).reduce((sum, mesh) => sum + mesh.count, 0), 2)
  app.scene.dispose()
})
test('animation stops when paused, offscreen or hidden, and disposing releases the scene', () => {
  const app = setup()
  app.scene.setAtom(createAtomModel(8, 16))
  app.scene.setMotion(true)
  assert.equal(app.frames.size, 1)
  app.observations.intersection[0].callback([{ isIntersecting: false }])
  assert.equal(app.frames.size, 0)
  const renders = app.renders()
  app.scene.rotate(.1, .1)
  assert.equal(app.renders(), renders)
  app.observations.intersection[0].callback([{ isIntersecting: true }])
  assert.equal(app.frames.size, 1)
  app.visibility(true)
  assert.equal(app.frames.size, 0)
  app.visibility(false)
  assert.equal(app.frames.size, 1)
  app.scene.setMotion(false)
  assert.equal(app.frames.size, 0)
  app.scene.dispose()
  app.scene.dispose()
  assert.equal(app.disposed(), 1)
  assert.equal(app.lost(), 1)
  assert.equal(app.host.children.length, 0)
  assert.equal(app.listeners.size, 0)
  assert.ok(app.observations.resize[0].disconnected)
  assert.ok(app.observations.intersection[0].disconnected)
})
test('a lost WebGL context stops rendering and surfaces the real error state', () => {
  const app = setup()
  app.scene.setAtom(createAtomModel(1, 1))
  app.scene.setMotion(true)
  const canvas = app.elements.find(element => element.events.has('webglcontextlost'))
  canvas.events.get('webglcontextlost')({ preventDefault() {} })
  assert.equal(app.frames.size, 0)
  assert.equal(app.errors(), 1)
  app.scene.dispose()
})
test('orbital clouds use probability points and phase attributes, hide schematic rings and release replaced geometry', async () => {
  const { sampleOrbital } = await import(moduleUrl(new URL('../utils/chemistry/orbitals.ts', import.meta.url)))
  const app = setup()
  app.scene.setAtom(createAtomModel(6,12))
  app.scene.setView('cloud')
  app.scene.setOrbitalCloud(sampleOrbital({n:2,l:1,m:0},128))
  assert.equal(app.objects().filter(object=>object instanceof THREE.AxesHelper).length,0)
  const points=app.objects().find(object=>object instanceof THREE.Points)
  assert.equal(points.geometry.getAttribute('position').count,128)
  assert.equal(points.geometry.getAttribute('phase').count,128)
  assert.equal(app.objects().filter(object=>object instanceof THREE.LineLoop && object.parent.visible).length,0)
  app.scene.setCutaway(true)
  app.scene.setDensity(.3)
  assert.equal(points.material.uniforms.cutaway.value,true)
  assert.equal(points.material.uniforms.opacity.value,.3)
  let released=false
  points.geometry.addEventListener('dispose',()=>{released=true})
  app.scene.setOrbitalCloud(sampleOrbital({n:3,l:2,m:0},128))
  assert.equal(released,true)
  app.scene.setView('shells')
  assert.equal(app.objects().find(object=>object instanceof THREE.Points).visible,false)
  assert.equal(app.objects().filter(object=>object instanceof THREE.LineLoop && object.parent.visible).length,2)
  app.scene.dispose()
})
test('particle lessons isolate nucleus or electron shells, dim other particles and restore the full model', () => {
  const app=setup()
  app.scene.setAtom(createAtomModel(6,12))
  app.scene.focusParticle('proton')
  const particles=app.objects().filter(object=>object instanceof THREE.InstancedMesh)
  assert.equal(particles.find(mesh=>mesh.material.color.getHexString()==='fb7185').material.opacity,1)
  assert.equal(particles.find(mesh=>mesh.material.color.getHexString()==='f5d48f').material.opacity,.12)
  const rings=app.objects().filter(object=>object instanceof THREE.LineLoop)
  assert.ok(rings.every(ring=>!ring.parent.visible))
  app.scene.focusParticle('electron')
  assert.ok(rings.every(ring=>ring.parent.visible))
  app.scene.focusParticle(null)
  assert.ok(particles.every(mesh=>mesh.material.opacity===1))
  app.scene.dispose()
})
