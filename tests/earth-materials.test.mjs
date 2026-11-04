import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import{createRequire}from'node:module'
import{runInNewContext}from'node:vm'
import * as THREE from 'three'
const ts=createRequire(import.meta.url)('typescript'),exports={}
const code=ts.transpileModule(readFileSync(new URL('../utils/earth/materials.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
runInNewContext(code,{exports,require:()=>THREE})
test('rock and metallic core finishes remain distinct and patch the installed Three.js physical shader',()=>{
  const rock=exports.createInteriorMaterial('mantle',true),metal=exports.createInteriorMaterial('outer-core',true)
  assert.ok(rock.roughness>metal.roughness&&rock.metalness<metal.metalness)
  for(const id of ['crust','mantle','outer-core','inner-core']){
    const material=exports.createInteriorMaterial(id,true)
    const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader}
    material.onBeforeCompile(shader)
    assert.ok(shader.vertexShader.includes('vEarthPosition=position'))
    assert.ok(shader.fragmentShader.includes('float earthTexture=earthGrain'))
    assert.ok(shader.fragmentShader.indexOf('float earthTexture=')<shader.fragmentShader.indexOf('roughnessFactor=clamp'))
    assert.ok(Number.isInteger(shader.uniforms.earthKind.value))
    const originalColor=material.color.getHex(),roughness=material.roughness,emission=material.emissiveIntensity
    exports.selectInteriorMaterial(material,true);assert.ok(material.emissiveIntensity>emission)
    exports.selectInteriorMaterial(material,false);assert.equal(material.emissiveIntensity,emission)
    assert.equal(material.color.getHex(),originalColor);assert.equal(material.roughness,roughness)
    material.dispose()
  }
  rock.dispose();metal.dispose()
})
test('reflection environment is bounded procedural data without an image download',()=>{
  const texture=exports.createInteriorEnvironment()
  assert.ok(texture instanceof THREE.DataTexture)
  assert.equal(texture.image.data.byteLength,128*64*4)
  assert.equal(texture.mapping,THREE.EquirectangularReflectionMapping)
  assert.ok(texture.image.data.some(value=>value>0))
  texture.dispose()
})
