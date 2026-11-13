import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createBookPullout} from '../utils/library/bookPullout'

test('clicking one instanced copy pulls it out and leaves its shelf neighbours untouched',()=>{
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial(),3)
 const originals=[0,1,2].map(i=>new THREE.Matrix4().compose(new THREE.Vector3(i*.3,2,-17),new THREE.Quaternion(),new THREE.Vector3(.21,.7,.48)))
 originals.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix))
 const animation=createBookPullout(mesh,1)
 for(let i=0;i<10;i++)animation.update(.1)
 const selected=new THREE.Matrix4(),neighbour=new THREE.Matrix4();mesh.getMatrixAt(1,selected);mesh.getMatrixAt(0,neighbour)
 assert.ok(selected.elements[14]!>-16.1)
 const restRotation=new THREE.Quaternion(),openRotation=new THREE.Quaternion()
 originals[1]!.decompose(new THREE.Vector3(),restRotation,new THREE.Vector3())
 selected.decompose(new THREE.Vector3(),openRotation,new THREE.Vector3())
 assert.ok(openRotation.angleTo(restRotation)>1,'a picked book turns toward the reader while pulled out')
 assert.deepEqual(neighbour.elements,Array.from(Float32Array.from(originals[0]!.elements)))
 mesh.getMatrixAt(2,neighbour);assert.deepEqual(neighbour.elements,Array.from(Float32Array.from(originals[2]!.elements)))
 animation.setOpen(false);let active=true;for(let i=0;i<10;i++)active=animation.update(.1)
 assert.equal(active,false);mesh.getMatrixAt(1,selected)
 assert.deepEqual(selected.elements,Array.from(Float32Array.from(originals[1]!.elements)))
 mesh.geometry.dispose();(mesh.material as THREE.Material).dispose()
})

test('featured books can return during a partially completed pullout',()=>{
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial())
 mesh.position.set(-17,2,0);mesh.rotation.y=Math.PI/2;mesh.updateMatrix()
 const rest=mesh.position.clone(),rotation=mesh.quaternion.clone(),animation=createBookPullout(mesh)
 animation.update(.2);assert.ok(mesh.position.distanceTo(rest)>0)
 animation.setOpen(false);for(let i=0;i<10;i++)animation.update(.1)
 assert.ok(mesh.position.distanceTo(rest)<1e-6);assert.ok(mesh.quaternion.angleTo(rotation)<1e-6)
 mesh.geometry.dispose();(mesh.material as THREE.Material).dispose()
})
