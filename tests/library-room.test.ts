import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {libraryBooks,libraryTopics} from '../data/library/catalog'
import {libraryShelfEntries} from '../utils/library/shelfCatalog'
import {createLibraryRoom} from '../utils/library/createRoom'
import {constrainPosition,shelfPoint,ROOM_RADIUS,MAX_WALK_RADIUS,isWalkablePoint,EYE_HEIGHT,findWalkPath,clearWalkSegment,smoothJourneyProgress} from '../utils/library/navigation'

test('walking stays in the hall and outside the central reading desk',()=>{
 for(const [x,z] of [[40,0],[-35,25],[0,-40],[0,0],[1,.5],[-1,-.6]]){
  const position=constrainPosition(x!,z!)
  assert.ok(Math.hypot(position.x,position.z)<=MAX_WALK_RADIUS+.0001)
  assert.ok(Math.abs(position.x)>=2.5||Math.abs(position.z)>=1.7)
 }
 for(let i=0;i<4;i++){
  const shelf=shelfPoint(i,13.8),safe=constrainPosition(shelf.x,shelf.z)
  assert.ok(Math.abs(safe.x-shelf.x)<.001&&Math.abs(safe.z-shelf.z)<.001)
 }
})

test('the hall builds finite real geometry with exactly one physical copy per real book',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document')
 const context=new Proxy({measureText:(text:string)=>({width:text.length*22}),createRadialGradient:()=>({addColorStop:()=>{}}),createLinearGradient:()=>({addColorStop:()=>{}})},{get:(target,key)=>key in target?target[key as keyof typeof target]:()=>undefined})
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:0,height:0,getContext:()=>context})}})
 try{
  for(const mobile of [false,true]){
   const scene=new THREE.Scene(),room=createLibraryRoom(scene,mobile)
   const meshes:THREE.Mesh[]=[]
   scene.traverse(object=>{if(object instanceof THREE.Mesh)meshes.push(object)})
   assert.ok(meshes.length<60,'static geometry should remain batched')
   assert.equal(room.stackMeshes.reduce((count,mesh)=>count+mesh.count,0),libraryBooks.length)
   assert.equal(room.stackMeshes.length,libraryBooks.length)
   for(const mesh of room.stackMeshes){
    assert.ok(libraryBooks.some(book=>book.id===mesh.userData.bookId&&book.topic===mesh.userData.topic),'every shelf copy must resolve to a real catalogued book')
   }
   for(const mesh of meshes){
    const positions=mesh.geometry.getAttribute('position')
    for(let i=0;i<positions.array.length;i++)assert.ok(Number.isFinite(positions.array[i]))
    mesh.geometry.computeBoundingSphere();assert.ok(Number.isFinite(mesh.geometry.boundingSphere!.radius))
   }
   assert.equal(room.selectable.length,0)
   assert.equal(room.colliders.length,24)
   const materials=new Set<THREE.Material>()
   for(const mesh of meshes){mesh.geometry.dispose();for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(mat)}
   materials.forEach(mat=>mat.dispose());room.textures.forEach(texture=>texture.dispose())
  }
 }finally{if(previous)Object.defineProperty(globalThis,'document',previous);else Reflect.deleteProperty(globalThis,'document')}
})


test('click destinations reject furniture, the outside of the room and invalid coordinates',()=>{
 assert.equal(EYE_HEIGHT,2.4)
 const obstacles=[{x:8,z:0,r:1.5}]
 assert.equal(isWalkablePoint(0,12,obstacles),true)
 assert.equal(isWalkablePoint(0,0,obstacles),false)
 assert.equal(isWalkablePoint(8,0,obstacles),false)
 assert.equal(isWalkablePoint(9.7,0,obstacles),false)
 assert.equal(isWalkablePoint(10,0,obstacles),true)
 assert.equal(isWalkablePoint(19,0,obstacles),false)
 assert.equal(isWalkablePoint(NaN,0,obstacles),false)
})


test('a click journey routes around furniture and eases both ends',()=>{
 const start={x:0,z:12},goal={x:0,z:-12},obstacles=[{x:4,z:5,r:1.5},{x:-4,z:-5,r:1.5}]
 const route=findWalkPath(start,goal,obstacles)
 assert.ok(route.length>1)
 assert.deepEqual(route.at(-1),goal)
 let previous=start
 for(const point of route){assert.equal(clearWalkSegment(previous,point,obstacles),true);previous=point}
 assert.deepEqual(findWalkPath(start,{x:0,z:0},obstacles),[])
 assert.equal(smoothJourneyProgress(0),0);assert.equal(smoothJourneyProgress(1),1)
 assert.ok(smoothJourneyProgress(.01)<.001)
 assert.ok(1-smoothJourneyProgress(.99)<.001)
 let last=0;for(let p=0;p<=1;p+=.01){const next=smoothJourneyProgress(p);assert.ok(next>=last);last=next}
})


test('shelf records are unique, match their subjects, and all have Armenian full texts',()=>{
 const entries=libraryShelfEntries()
 assert.equal(entries.length,libraryBooks.length)
 assert.equal(new Set(entries.map(entry=>entry.book.id)).size,libraryBooks.length)
 for(const entry of entries){assert.equal(entry.book.topic,libraryTopics[Math.floor(entry.bay/2)]!.id);assert.equal(entry.book.language,'Հայերեն');assert.ok(entry.book.file.endsWith('-hy.txt'))}
})

test('CMS detective and novel books occupy separate slots on their shared bay',()=>{
 const sample=libraryBooks[0]!
 const entries=libraryShelfEntries([{...sample,id:'detective-test',topic:'detective',shelf:8},{...sample,id:'novel-test',topic:'novels',shelf:3}])
 assert.equal(entries.length,2);assert.equal(entries[0]!.bay,entries[1]!.bay);assert.notEqual(entries[0]!.lateral,entries[1]!.lateral)
})
