import assert from 'node:assert/strict'
import test from 'node:test'
import {galleryArtworkRoute,galleryCenter,galleryCenters,galleryRoute,galleryWalkable,type GalleryPoint} from '../utils/art/galleryNavigation'

function routeIsOpen(points:readonly {x:number;z:number}[],extraRooms=0) {
  for(let index=0;index<points.length-1;index++) {
    const a=points[index]!,b=points[index+1]!
    const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1)
    for(let step=0;step<=steps;step++) {
      const t=steps?step/steps:0
      assert.equal(galleryWalkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,extraRooms),true)
    }
  }
}

test('every exhibition room has a walkable path through open passages',()=>{
  for(const start of galleryCenters)for(const destination of galleryCenters) {
    const route=galleryRoute(start,destination)
    assert.ok(route,`No route from ${JSON.stringify(start)} to ${JSON.stringify(destination)}`)
    routeIsOpen([start,...route])
    assert.deepEqual(route.at(-1),destination)
  }
})

test('the former sculpture sites are clear for walking',()=>{
  for(const point of [{x:17,z:0},{x:-2.2,z:-2.2},{x:-34,z:-2.2}]){
    assert.ok(galleryWalkable(point.x,point.z))
  }
  const start={x:20,z:0},destination=galleryCenters[1]!
  assert.deepEqual(galleryRoute(start,destination),[destination])
  assert.deepEqual(galleryArtworkRoute(start,destination),[destination])
})

test('artwork navigation uses a straight segment when the floor is clear',()=>{
  const start={x:.15,z:2.25},destination={x:-1.15,z:1.35}
  assert.deepEqual(galleryArtworkRoute(start,destination),[destination])
})

test('artwork navigation follows the shortest open passage around a wall',()=>{
  const start={x:0,z:16},destination={x:-17,z:0}
  const route=galleryArtworkRoute(start,destination)
  assert.ok(route)
  routeIsOpen([start,...route])
  assert.deepEqual(route.at(-1),destination)
  assert.ok(route.some(({x,z})=>Math.abs(x+3.7)<.01&&Math.abs(z-3.7)<.01))
  const floorRoute=galleryRoute(start,destination)!
  const length=(route:GalleryPoint[])=>route.reduce((sum,end,i)=>{
    const from=route[i-1]??start
    return sum+Math.hypot(end.x-from.x,end.z-from.z)
  },0)
  assert.ok(length(route)<length(floorRoute))
})

test('both navigation modes leave space beside the passage panels',()=>{
  for(const sign of [-1,1]){
    assert.equal(galleryWalkable(8.5,sign*2.5),false)
    assert.equal(galleryWalkable(sign*2.5,-8.5),false)
    assert.equal(galleryWalkable(25.5,sign*2.5,2),false)
    assert.equal(galleryWalkable(5.75,sign*2.5),false)
    assert.equal(galleryWalkable(8.5,sign*2.2),true)
    assert.equal(galleryWalkable(0,sign*3.5),true)
  }
  for(const navigate of [galleryRoute,galleryArtworkRoute]){
    const start={x:22,z:3.5}
    const end={x:29,z:3.5}
    const route=navigate(start,end,2)
    assert.ok(route)
    assert.ok(route.length>1)
    assert.deepEqual(route.at(-1),end)
    routeIsOpen([start,...route],2)
    const stop=navigate({x:0,z:0},{x:8.5,z:3.7})?.at(-1)
    assert.ok(stop&&Math.abs(stop.z)<=2.25)
  }
})

test('a floor click on a wall edge stops at the nearest open floor',()=>{
  const start={x:0,z:0},clickedWall={x:7,z:6.5}
  assert.equal(galleryWalkable(clickedWall.x,clickedWall.z),false)
  const route=galleryRoute(start,clickedWall)
  assert.ok(route)
  routeIsOpen([start,...route])
  assert.equal(galleryWalkable(route.at(-1)!.x,route.at(-1)!.z),true)
})

test('the camera stays at least three metres from gallery walls',()=>{
  assert.equal(galleryWalkable(20.7,0),true)
  assert.equal(galleryWalkable(20.8,0),false)
  assert.equal(galleryWalkable(0,20.7),true)
  assert.equal(galleryWalkable(0,20.8),false)
  assert.equal(galleryWalkable(-20.7,0),true)
  assert.equal(galleryWalkable(-20.8,0),true) // This point is the open bridge to the next room.
  assert.equal(galleryWalkable(-17,4),false)
})

test('new rooms extend the open gallery without blocking the route',()=>{
  const destination=galleryCenter(9)!
  assert.deepEqual(destination,{x:85,z:0})
  assert.ok(galleryWalkable(81.3,0,4))
  const route=galleryRoute(galleryCenters[0]!,destination,4)
  assert.ok(route)
  for(let i=0;i<route.length-1;i++){
    const a:GalleryPoint=route[i]!
    const b:GalleryPoint=route[i+1]!
    for(let step=0;step<=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1);step++){
      const t=step/Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1))
      assert.equal(galleryWalkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,4),true)
    }
  }
  assert.deepEqual(route.at(-1),destination)
})
