import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import{createRequire}from'node:module'
import{runInNewContext}from'node:vm'
import * as THREE from 'three'
import{moduleUrl}from'./helpers/catalog.mjs'
const require=createRequire(import.meta.url),ts=require('typescript')
const data=await import(moduleUrl(new URL('../data/earth/interior.ts',import.meta.url)))
const earth=await import(moduleUrl(new URL('../utils/earth/interior.ts',import.meta.url)))
// Use real Three.js geometries, mocked WebGL transport and native observer boundaries.
const compile=file=>ts.transpileModule(readFileSync(new URL('../utils/earth/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const materialExports={};runInNewContext(compile('materials.ts'),{exports:materialExports,require:()=>THREE})
const surfaceExports={};runInNewContext(compile('surface.client.ts'),{exports:surfaceExports,document:{},require:()=>THREE})
const geometryExports={};runInNewContext(compile('geometry.ts'),{exports:geometryExports,require:()=>THREE})
function setup(reduced=true){
  const frames=new Map(),events=new Map(),canvasEvents=new Map(),observers=[],selected=[]
  let next=0,renderedScene,camera,renders=0,disposals=0,errors=0
  const canvas={style:{},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:640,height:400}),addEventListener:(name,fn)=>canvasEvents.set(name,fn),removeEventListener:name=>canvasEvents.delete(name),remove(){}}
  const host={appendChild(){},getBoundingClientRect:()=>({width:640,height:400})}
  const document={hidden:false,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)}
  class Renderer{domElement=canvas;setPixelRatio(){}setSize(){}render(s,c){renderedScene=s;camera=c;s.updateMatrixWorld();c.updateMatrixWorld();renders++}dispose(){disposals++}forceContextLoss(){}}
  class Controls{target=new THREE.Vector3();events=new Map();constructor(c){this.camera=c}update(){this.camera.lookAt(this.target);this.camera.updateMatrixWorld();this.events.get('change')?.()}addEventListener(n,f){this.events.set(n,f)}removeEventListener(n){this.events.delete(n)}dispose(){}}
  class Observer{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}}
  const exports={}
  runInNewContext(compile('scene.client.ts'),{exports,document,window:{devicePixelRatio:1},ResizeObserver:Observer,IntersectionObserver:Observer,requestAnimationFrame:fn=>{const id=++next;frames.set(id,time=>{frames.delete(id);fn(time)});return id},cancelAnimationFrame:id=>frames.delete(id),require:name=>name==='three'?{...THREE,WebGLRenderer:Renderer}:name.includes('OrbitControls')?{OrbitControls:Controls}:name.includes('data/earth')?data:name==='./interior'?earth:name==='./geometry'?geometryExports:name==='./materials'?materialExports:name==='./surface.client'?surfaceExports:(()=>{throw Error(name)})()})
  const scene=exports.createEarthScene(host,id=>selected.push(id),()=>errors++,reduced)
  return{scene,frames,document,events,canvasEvents,observers,selected,errors:()=>errors,renders:()=>renders,disposals:()=>disposals,objects:()=>{const found=[];renderedScene.traverse(o=>found.push(o));return found},camera:()=>camera}
}
test('cutaway geometry has physical shell radii, real section faces and selectable Three.js meshes',()=>{
  const app=setup()
  const meshes=app.objects().filter(o=>o instanceof THREE.Mesh&&o.userData.layer)
  assert.equal(meshes.length,12)
  for(const layer of data.earthLayers){
    const parts=meshes.filter(m=>m.userData.layer===layer.id)
    const surface=parts.find(m=>m.geometry instanceof THREE.SphereGeometry)
    assert.equal(surface.geometry.parameters.radius,2*(6371-layer.top)/6371)
    assert.equal(surface.geometry.parameters.phiStart,Math.PI/3)
    assert.ok(parts.every(p=>p.visible))
  }
  app.scene.setLayer('inner-core')
  assert.ok(meshes.find(m=>m.userData.layer==='inner-core').material.emissiveIntensity>0)
  app.scene.setDepth(6371)
  const marker=app.objects().find(o=>o instanceof THREE.Mesh&&!o.userData.layer)
  assert.equal(marker.position.length(),0)
  const point=new THREE.Vector3(-.2,0,0).project(app.camera())
  const event={pointerId:1,isPrimary:true,button:0,clientX:(point.x+1)*320,clientY:(1-point.y)*200}
  app.canvasEvents.get('pointerdown')(event);app.canvasEvents.get('pointerup')(event)
  assert.equal(app.selected.at(-1),'inner-core')
  const count=app.selected.length
  app.canvasEvents.get('pointerdown')(event);app.canvasEvents.get('pointerup')({...event,clientX:event.clientX+20})
  assert.equal(app.selected.length,count)
  app.scene.dispose()
})
test('opening animates, pauses offscreen, resumes, honors reduced motion and disposes replaced buffers',()=>{
  const app=setup(false)
  assert.equal(app.frames.size,1)
  const old=app.objects().find(o=>o.geometry instanceof THREE.SphereGeometry).geometry
  let released=false;old.addEventListener('dispose',()=>released=true)
  app.frames.values().next().value(33)
  assert.equal(released,true)
  app.observers[1].fn([{isIntersecting:false}]);assert.equal(app.frames.size,0)
  app.observers[1].fn([{isIntersecting:true}]);assert.equal(app.frames.size,1)
  app.scene.setReducedMotion(true);assert.equal(app.frames.size,0)
  app.scene.setOpening(0)
  assert.ok(app.objects().filter(o=>o.userData.layer&&!(o.geometry instanceof THREE.SphereGeometry)).every(o=>!o.visible))
  app.scene.dispose();app.scene.dispose()
  assert.equal(app.disposals(),1);assert.equal(app.events.size,0);assert.equal(app.canvasEvents.size,0);assert.ok(app.observers.every(o=>o.disconnected))
})
test('lost WebGL context surfaces an error and touch pinch cannot accidentally select a layer',()=>{
  const app=setup()
  const event={pointerId:1,isPrimary:true,button:0,clientX:320,clientY:200}
  app.canvasEvents.get('pointerdown')(event)
  app.canvasEvents.get('pointerdown')({...event,pointerId:2,isPrimary:false})
  app.canvasEvents.get('pointerup')(event)
  assert.equal(app.selected.length,0)
  app.canvasEvents.get('webglcontextlost')({preventDefault(){}})
  assert.equal(app.errors(),1)
  app.scene.dispose()
})
test('country outlines reuse supplied globe polygons, follow the cutaway and dispose old buffers',()=>{
  const app=setup()
  const feature={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[179,0],[-179,0],[-179,10],[179,0]]]}}
  app.scene.setSurface([feature])
  const outline=app.objects().find(o=>o.name==='earth-country-outlines')
  assert.ok(outline)
  const positions=outline.geometry.getAttribute('position')
  assert.ok(positions.count>6&&positions.count<100)
  for(let i=0;i<positions.count;i++)assert.ok(Math.abs(Math.hypot(positions.getX(i),positions.getY(i),positions.getZ(i))-2.003)<1e-6)
  app.scene.setOpening(.5)
  assert.equal(outline.material.uniforms.opening.value,Math.PI/6)
  let disposed=false;outline.geometry.addEventListener('dispose',()=>disposed=true)
  app.scene.setSurface([])
  assert.equal(disposed,true)
  assert.equal(app.objects().filter(o=>o.name==='earth-country-outlines').length,0)
  app.scene.dispose()
})

test('small cut retains five sixths of the globe and preserves global texture longitude',()=>{
  const geometry=geometryExports.shellSurface(2,Math.PI/3)
  const uv=geometry.getAttribute('uv')
  for(let i=0;i<uv.count;i++)assert.ok(uv.getX(i)>=.16&&uv.getX(i)<=1)
  const middleRow=20*65
  assert.ok(Math.abs(uv.getX(middleRow)-1/6)<1e-6)
  assert.ok(Math.abs(uv.getX(middleRow+64)-1)<1e-6)
  geometry.dispose()
})

test('layer boundary arcs follow the cut opening and release replaced geometry',()=>{
  const app=setup()
  const boundaries=app.objects().find(o=>o.name==='earth-layer-boundaries')
  assert.ok(boundaries.geometry.getAttribute('position').count>0)
  const old=boundaries.geometry
  let released=false;old.addEventListener('dispose',()=>released=true)
  app.scene.setOpening(0)
  assert.equal(released,true)
  assert.equal(boundaries.geometry.getAttribute('position').count,0)
  app.scene.setOpening(1)
  assert.ok(boundaries.geometry.getAttribute('position').count>0)
  app.scene.dispose()
})
