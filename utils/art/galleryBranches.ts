import {galleryArtworkRoute,galleryCenter,galleryRoomAt,galleryRoute,galleryShortestArtworkRoute,galleryWalkable,type GalleryPoint} from './galleryNavigation'

const firstBranchRoom=200
const spacing=17
const branchHalfWidth=3.7
const panelHalfWidth=2.25
const nearPanelEdge=5.65
const farPanelEdge=11.35
const branchEnd=spacing+branchHalfWidth
const cornerInset=.001
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

function nearbyBranch(x:number,z:number,rooms:ReadonlySet<number>,halfWidth=branchHalfWidth){
  const column=Math.round(x/spacing)
  const center=column*spacing
  if(column<1||x<center-halfWidth||x>center+halfWidth||Math.abs(z)<branchHalfWidth||Math.abs(z)>branchEnd)return
  const room=galleryBranchId(column===1?1:column+4,z<0?'north':'south')
  if(rooms.has(room))return galleryBranch(room)
}

function besidePanel(z:number){return Math.abs(z)>=nearPanelEdge&&Math.abs(z)<=farPanelEdge}

export function galleryBranchedWalkable(x:number,z:number,extraRooms:number,rooms:ReadonlySet<number>){
  const branch=nearbyBranch(x,z,rooms)
  if(branch)return !besidePanel(z)||Math.abs(x-branch.x)<=panelHalfWidth
  return galleryWalkable(x,z,extraRooms)
}

export function galleryBranchedRoomAt(x:number,z:number,extraRooms:number,rooms:ReadonlySet<number>){
  return (Math.abs(z)>10?nearbyBranch(x,Math.max(-branchEnd,Math.min(branchEnd,z)),rooms,7)?.room:undefined)??galleryRoomAt(x,z,extraRooms)
}

function shortestBranchRoute(start:GalleryPoint,end:GalleryPoint,extraRooms:number,rooms:ReadonlySet<number>){
  const corners:GalleryPoint[]=[],xEdges:number[]=[],zEdges:number[]=[]
  for(const room of rooms){
    const branch=galleryBranch(room)!
    const sign=Math.sign(branch.z)
    zEdges.push(...[branchHalfWidth,nearPanelEdge,farPanelEdge,branchEnd].map(edge=>sign*edge))
    for(const side of [-1,1]){
      xEdges.push(branch.x+side*branchHalfWidth,branch.x+side*panelHalfWidth)
      corners.push({x:branch.x+side*(branchHalfWidth-cornerInset),z:sign*(branchHalfWidth-cornerInset)})
      for(const edge of [nearPanelEdge,farPanelEdge]){
        corners.push({x:branch.x+side*(panelHalfWidth-cornerInset),z:sign*edge})
      }
    }
  }
  return galleryShortestArtworkRoute(start,end,extraRooms,{
    corners,xEdges,zEdges,walkable:(x,z)=>galleryBranchedWalkable(x,z,extraRooms,rooms),
  })
}

export function galleryBranchedRoute(start:GalleryPoint,end:GalleryPoint,extraRooms:number,rooms:ReadonlySet<number>,artwork:boolean){
  const baseRoute=artwork?galleryArtworkRoute:galleryRoute
  const from=nearbyBranch(start.x,start.z,rooms)
  const targetZ=Math.max(-branchEnd,Math.min(branchEnd,end.z))
  const to=nearbyBranch(end.x,targetZ,rooms,7)
  if(!from&&!to)return baseRoute(start,end,extraRooms)
  const startPath=from?[{x:from.x,z:start.z}]:[]
  const halfWidth=besidePanel(targetZ)?panelHalfWidth:branchHalfWidth
  const endPath=to?[{x:to.x,z:targetZ},{x:Math.max(to.x-halfWidth,Math.min(to.x+halfWidth,end.x)),z:targetZ}]:[]
  if(artwork){
    // Other branches are dead ends and cannot shorten a path between these two points.
    const connectedRooms=new Set<number>()
    if(from)connectedRooms.add(from.room)
    if(to)connectedRooms.add(to.room)
    const shortest=shortestBranchRoute(start,endPath.at(-1)??end,extraRooms,connectedRooms)
    if(shortest)return shortest
  }
  if(from&&from.room===to?.room)return [...startPath,...endPath]
  const entry=from?{x:from.x,z:0}:start
  const exit=to?{x:to.x,z:0}:end
  const route=baseRoute(entry,exit,extraRooms)
  if(!route)return
  return [...startPath,...(from?[entry]:[]),...route,...endPath]
}
