import test from 'node:test'
import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'
import{createRequire}from'node:module'
import{runInNewContext}from'node:vm'
import * as THREE from 'three'
const ts=createRequire(import.meta.url)('typescript')
const code=ts.transpileModule(readFileSync(new URL('../utils/earth/surface.client.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function setup(){
  const paths=[],fills=[];let current=[]
  const context={createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){current=[];paths.push(current)},moveTo(x,y){current.push([x,y])},lineTo(x,y){current.push([x,y])},closePath(){},fill(rule){fills.push(rule)}}
  const canvas={width:0,height:0,getContext:()=>context},exports={}
  runInNewContext(code,{exports,document:{createElement:()=>canvas},require:()=>THREE})
  return{create:exports.createEarthSurfaceTexture,canvas,paths,fills}
}
test('surface albedo reuses supplied polygons with bounded dimensions and correct antimeridian wrapping',()=>{
  const app=setup()
  const feature={geometry:{type:'Polygon',coordinates:[[[179,0],[-179,0],[-179,10],[179,0]]]}}
  const texture=app.create([feature])
  assert.ok(texture instanceof THREE.CanvasTexture)
  assert.equal(app.canvas.width,1024);assert.equal(app.canvas.height,512)
  assert.equal(texture.colorSpace,THREE.SRGBColorSpace)
  assert.ok(app.fills.every(rule=>rule==='evenodd'))
  for(const path of app.paths)for(let i=1;i<path.length;i++)assert.ok(Math.abs(path[i][0]-path[i-1][0])<10,'Dateline polygons must not stretch across the whole texture')
  texture.dispose()
})
test('empty surface data is optional and invalid coordinates never enter the drawing loop',()=>{
  const app=setup()
  assert.equal(app.create([]),null)
  const texture=app.create([{geometry:{type:'Polygon',coordinates:[[[Infinity,0],[0,0],[NaN,10]]]}}])
  assert.ok(app.paths.every(path=>path.length===0))
  texture.dispose()
})
