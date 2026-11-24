import assert from 'node:assert/strict'
import test from 'node:test'
import {galleryCenter,galleryCenters,galleryRoute,galleryWalkable,type GalleryPoint} from '../utils/art/galleryNavigation'

function routeIsOpen(points:readonly {x:number;z:number}[]) {
  for(let index=0;index<points.length-1;index++) {
    const a=points[index]!,b=points[index+1]!
    const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1)
    for(let step=0;step<=steps;step++) {
      const t=steps?step/steps:0
      assert.equal(galleryWalkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t),true)
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

test('walking to the sculpture entrance goes around its pedestal',()=>{
  const start={x:20,z:0},destination=galleryCenters[1]!
  const route=galleryRoute(start,destination)
  assert.ok(route)
  assert.ok(route.length>1)
  routeIsOpen([start,...route])
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
