import {galleryArtworkRoute,galleryCenter,galleryRoomAt,galleryRoute,galleryWalkable,type GalleryPoint} from './galleryNavigation'

const firstBranchRoom=200
const spacing=17
export type GalleryBranchDirection='north'|'south'

export function galleryBranchId(parent:number,direction:GalleryBranchDirection){
  return firstBranchRoom+(parent===1?0:parent-5)*2+(direction==='south'?1:0)
}

export function galleryBranch(room:number){
  if(room<firstBranchRoom)return
  const index=room-firstBranchRoom
  const parent=Math.floor(index/2)
  const parentRoom=parent===0?1:parent+5
  const x=parentRoom===1?17:galleryCenter(parentRoom)!.x
  const direction:GalleryBranchDirection=index%2?'south':'north'
  return {room,parent:parentRoom,direction,x,z:direction==='south'?spacing:-spacing}
}

export function galleryBranchName(room:number){
  const branch=galleryBranch(room)
  if(!branch)return
  const parent=branch.parent===1?'Արևելյան սրահ':`Նոր սրահ ${branch.parent-5}`
  return `${parent} · ${branch.direction==='north'?'Ձախ':'Աջ'} սրահ`
}

function nearbyBranch(x:number,z:number,rooms:ReadonlySet<number>,halfWidth=3.7){
  const column=Math.round(x/spacing)
  if(column<1||Math.abs(x-column*spacing)>halfWidth||Math.abs(z)<3.7||Math.abs(z)>20.7)return
  const room=galleryBranchId(column===1?1:column+4,z<0?'north':'south')
  if(rooms.has(room))return galleryBranch(room)
}

export function galleryBranchedWalkable(x:number,z:number,extraRooms:number,rooms:ReadonlySet<number>){
  const branch=nearbyBranch(x,z,rooms)
  if(branch)return Math.abs(Math.abs(z)-8.5)>2.85||Math.abs(x-branch.x)<=2.25
  return galleryWalkable(x,z,extraRooms)
}

export function galleryBranchedRoomAt(x:number,z:number,extraRooms:number,rooms:ReadonlySet<number>){
  return (Math.abs(z)>10?nearbyBranch(x,Math.max(-20.7,Math.min(20.7,z)),rooms,7)?.room:undefined)??galleryRoomAt(x,z,extraRooms)
}

export function galleryBranchedRoute(start:GalleryPoint,end:GalleryPoint,extraRooms:number,rooms:ReadonlySet<number>,artwork:boolean){
  const baseRoute=artwork?galleryArtworkRoute:galleryRoute
  const from=nearbyBranch(start.x,start.z,rooms)
  const targetZ=Math.max(-20.7,Math.min(20.7,end.z))
  const to=nearbyBranch(end.x,targetZ,rooms,7)
  if(!from&&!to)return baseRoute(start,end,extraRooms)
  const startPath=from?[{x:from.x,z:start.z}]:[]
  const halfWidth=Math.abs(Math.abs(targetZ)-8.5)<=2.85?2.25:3.7
  const endPath=to?[{x:to.x,z:targetZ},{x:Math.max(to.x-halfWidth,Math.min(to.x+halfWidth,end.x)),z:targetZ}]:[]
  if(from&&from.room===to?.room)return [...startPath,...endPath]
  const entry=from?{x:from.x,z:0}:start
  const exit=to?{x:to.x,z:0}:end
  const route=baseRoute(entry,exit,extraRooms)
  if(!route)return
  return [...startPath,...(from?[entry]:[]),...route,...endPath]
}
