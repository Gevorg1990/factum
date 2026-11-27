export interface GalleryPoint { x:number; z:number }

const passageHalfWidth=3.7
const panelClearHalfWidth=2.25
const panelClearHalfLength=2.85
const passageSpacing=17
const firstHorizontalPassage=-2

function horizontalPassageIndex(x:number){
  return Math.floor(x/passageSpacing)
}

function horizontalPassageCenter(index:number){
  return (index+.5)*passageSpacing
}
export const galleryCenters: readonly GalleryPoint[] = [
  {x:0,z:0}, {x:11.8,z:0}, {x:-17,z:0},
  {x:0,z:-17}, {x:0,z:17}, {x:-34,z:0},
]

export function galleryCenter(index:number):GalleryPoint|undefined {
  return galleryCenters[index]??(index>=6?{x:34+(index-6)*17,z:0}:undefined)
}

export function galleryRoomAt(x:number,z:number,extraRooms=0) {
  if(extraRooms&&x>27)return Math.min(5+extraRooms,6+Math.floor((x-25.5)/17))
  if(x < -27)return 5
  if(x > 10)return 1
  if(x < -10)return 2
  if(z < -10)return 3
  if(z > 10)return 4
  return 0
}

export function galleryWalkable(x:number,z:number,extraRooms=0) {
  // The corridor panels sit closer to the walking area than the exhibition walls.
  const bridge=horizontalPassageIndex(x)
  if(Math.abs(z)>panelClearHalfWidth&&bridge>=firstHorizontalPassage&&bridge<=extraRooms
    &&Math.abs(x-horizontalPassageCenter(bridge))<=panelClearHalfLength)return false
  if(Math.abs(x)>panelClearHalfWidth&&Math.abs(Math.abs(z)-passageSpacing/2)<=panelClearHalfLength)return false
  // Leave space between the visitor and the walls and columns.
  const insideRoom=(cx:number,cz:number)=>Math.abs(x-cx)<=passageHalfWidth && Math.abs(z-cz)<=passageHalfWidth
  if(insideRoom(0,0)||insideRoom(17,0)||insideRoom(-17,0)||insideRoom(0,-17)||insideRoom(0,17)||insideRoom(-34,0))return true
  const annex=Math.round((x-34)/17)
  if(annex>=0&&annex<extraRooms&&insideRoom(34+annex*17,0))return true
  if(extraRooms&&Math.abs(z)<=passageHalfWidth&&x>=20.7&&x<=34+(extraRooms-1)*17-passageHalfWidth)return true
  // Broad, continuous bridges connect the halls like a museum nave.
  return (Math.abs(z)<=passageHalfWidth && x>-30.4 && x<13.4)
    || (Math.abs(x)<=passageHalfWidth && Math.abs(z)<13.4)
}

const grid=.5
const minX=-41, maxX=24, minZ=-24, maxZ=24
const directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]] as const
const key=(i:number,j:number)=>`${i},${j}`
const point=(i:number,j:number):GalleryPoint=>({x:i*grid,z:j*grid})
const distance=(a:GalleryPoint,b:GalleryPoint)=>Math.hypot(a.x-b.x,a.z-b.z)

function lineClear(a:GalleryPoint,b:GalleryPoint,extraRooms:number) {
  const steps=Math.ceil(distance(a,b)/.08)
  for(let step=0;step<=steps;step++) {
    const t=steps?step/steps:0
    if(!galleryWalkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,extraRooms))return false
  }
  return true
}

function nearestCell(position:GalleryPoint,extraRooms:number) {
  const baseI=Math.round(position.x/grid),baseJ=Math.round(position.z/grid)
  let closest:{i:number;j:number;distance:number}|undefined
  for(let radius=0;radius<=24;radius++) {
    for(let di=-radius;di<=radius;di++)for(let dj=-radius;dj<=radius;dj++) {
      if(radius && Math.max(Math.abs(di),Math.abs(dj))!==radius)continue
      const i=baseI+di,j=baseJ+dj,{x,z}=point(i,j)
      if(x<minX||x>Math.max(maxX,34+(extraRooms-1)*17+7)||z<minZ||z>maxZ||!galleryWalkable(x,z,extraRooms))continue
      const d=distance(position,{x,z})
      if(!closest||d<closest.distance)closest={i,j,distance:d}
    }
    if(closest)return closest
  }
}

const clearance=.001
const passageEdges=[-passageHalfWidth,passageHalfWidth]
const widthEdges=[...passageEdges,-panelClearHalfWidth,panelClearHalfWidth]
const verticalPassageEdges=[...widthEdges,...[-1,1].flatMap(sign=>[
  sign*passageSpacing/2-panelClearHalfLength,sign*passageSpacing/2+panelClearHalfLength,
])]
const artworkWaypoints=passageEdges.flatMap(x=>passageEdges.map(z=>({
  x:x-Math.sign(x)*clearance,z:z-Math.sign(z)*clearance,
})))
const panelWaypoints=[-1,1].flatMap(end=>[-1,1].map(side=>({
  x:end*panelClearHalfLength,z:side*(panelClearHalfWidth-clearance),
})))

function artworkRouteCorners(start:GalleryPoint,end:GalleryPoint,extraRooms:number){
  const horizontal=[-2,-1,0]
  const firstAnnex=Math.max(1,horizontalPassageIndex(Math.min(start.x,end.x)))
  const lastAnnex=Math.min(extraRooms,horizontalPassageIndex(Math.max(start.x,end.x)))
  // The annex bridges share one axis and clearance, so only the first and last can require a bend.
  if(firstAnnex<=lastAnnex){
    horizontal.push(firstAnnex)
    if(lastAnnex!==firstAnnex)horizontal.push(lastAnnex)
  }
  return [
    ...artworkWaypoints,
    ...horizontal.flatMap(bridge=>panelWaypoints.map(({x,z})=>({x:x+horizontalPassageCenter(bridge),z}))),
    ...[-1,1].flatMap(side=>panelWaypoints.map(({x,z})=>({x:z,z:x+side*passageSpacing/2}))),
  ]
}

type ArtworkRouteExtension={
  corners:readonly GalleryPoint[]
  xEdges:readonly number[]
  zEdges:readonly number[]
  walkable:(x:number,z:number)=>boolean
}

function artworkSegmentClear(start:GalleryPoint,end:GalleryPoint,extraRooms:number,extension?:ArtworkRouteExtension) {
  // Between passage edges the segment stays in the same floor region.
  const dx=end.x-start.x,dz=end.z-start.z
  const crossings=[0,1]
  function addCrossing(edge:number,origin:number,delta:number){
    const t=(edge-origin)/delta
    if(t>0&&t<1)crossings.push(t)
  }
  for(const x of widthEdges)addCrossing(x,start.x,dx)
  for(const z of verticalPassageEdges)addCrossing(z,start.z,dz)
  if(extension){
    for(const x of extension.xEdges)addCrossing(x,start.x,dx)
    for(const z of extension.zEdges)addCrossing(z,start.z,dz)
  }
  const first=Math.max(firstHorizontalPassage,horizontalPassageIndex(Math.min(start.x,end.x)))
  const last=Math.min(extraRooms,horizontalPassageIndex(Math.max(start.x,end.x)))
  for(let bridge=first;bridge<=last;bridge++){
    const center=horizontalPassageCenter(bridge)
    addCrossing(center-panelClearHalfLength,start.x,dx)
    addCrossing(center+panelClearHalfLength,start.x,dx)
  }
  crossings.sort((a,b)=>a-b)
  for(let i=1;i<crossings.length;i++){
    const t=(crossings[i-1]!+crossings[i]!)/2
    const x=start.x+dx*t,z=start.z+dz*t
    if(!(extension?extension.walkable(x,z):galleryWalkable(x,z,extraRooms)))return false
  }
  return true
}

export function galleryArtworkRoute(start:GalleryPoint,destination:GalleryPoint,extraRooms=0):GalleryPoint[]|undefined {
  if(!galleryWalkable(start.x,start.z,extraRooms))return galleryRoute(start,destination,extraRooms)
  let end=destination
  if(!galleryWalkable(end.x,end.z,extraRooms)){
    const cell=nearestCell(end,extraRooms)
    if(!cell)return
    end=point(cell.i,cell.j)
  }
  return galleryShortestArtworkRoute(start,end,extraRooms)??galleryRoute(start,end,extraRooms)
}

export function galleryShortestArtworkRoute(start:GalleryPoint,end:GalleryPoint,extraRooms:number,extension?:ArtworkRouteExtension):GalleryPoint[]|undefined {
  if(extension&&(!extension.walkable(start.x,start.z)||!extension.walkable(end.x,end.z)))return
  if(artworkSegmentClear(start,end,extraRooms,extension))return [end]

  // The shortest clear route bends only at passage corners.
  const nodes=[start,end,...artworkRouteCorners(start,end,extraRooms),...(extension?.corners??[])]
  const costs=nodes.map(()=>Infinity)
  const previous=nodes.map(()=>-1)
  const remaining=new Set(nodes.keys())
  costs[0]=0
  while(remaining.size){
    let current=-1
    let best=Infinity
    for(const index of remaining){
      if(costs[index]!<best){current=index;best=costs[index]!}
    }
    if(current<0)return
    if(current===1){
      const route:GalleryPoint[]=[]
      for(let index=current;index>0;index=previous[index]!)route.push(nodes[index]!)
      return route.reverse()
    }
    remaining.delete(current)
    for(const next of remaining){
      const from=nodes[current]!,to=nodes[next]!
      const cost=best+distance(from,to)
      if(cost>=costs[next]!||!artworkSegmentClear(from,to,extraRooms,extension))continue
      costs[next]=cost
      previous[next]=current
    }
  }
}

export function galleryRoute(start:GalleryPoint,destination:GalleryPoint,extraRooms=0):GalleryPoint[]|undefined {
  const from=nearestCell(start,extraRooms),to=nearestCell(destination,extraRooms)
  if(!from||!to)return
  const startKey=key(from.i,from.j),endKey=key(to.i,to.j)
  const records=new Map<string,{i:number;j:number;g:number;f:number;previous?:string}>()
  const open=new Set<string>([startKey])
  const closed=new Set<string>()
  records.set(startKey,{i:from.i,j:from.j,g:0,f:distance(point(from.i,from.j),point(to.i,to.j))})
  for(let attempts=0;open.size&&attempts<14000;attempts++) {
    let best:string|undefined
    for(const candidate of open)if(!best||records.get(candidate)!.f<records.get(best)!.f)best=candidate
    if(!best)break
    if(best===endKey) {
      const path:GalleryPoint[]=[]
      let cursor:string|undefined=best
      while(cursor) {
        const entry:{i:number;j:number;g:number;f:number;previous?:string}=records.get(cursor)!
        path.push(point(entry.i,entry.j))
        cursor=entry.previous
      }
      path.reverse()
      const end=galleryWalkable(destination.x,destination.z,extraRooms)?destination:point(to.i,to.j)
      const raw=[start,...path,end]
      const smooth:GalleryPoint[]=[]
      for(let index=0;index<raw.length-1;) {
        let next=raw.length-1
        while(next>index+1&&!lineClear(raw[index]!,raw[next]!,extraRooms))next--
        smooth.push(raw[next]!)
        index=next
      }
      return smooth
    }
    open.delete(best);closed.add(best)
    const current=records.get(best)!
    for(const [di,dj] of directions) {
      const i=current.i+di,j=current.j+dj,{x,z}=point(i,j)
      if(x<minX||x>Math.max(maxX,34+(extraRooms-1)*17+7)||z<minZ||z>maxZ||!galleryWalkable(x,z,extraRooms))continue
      if(di&&dj&&(!galleryWalkable((current.i+di)*grid,current.j*grid,extraRooms)||!galleryWalkable(current.i*grid,(current.j+dj)*grid,extraRooms)))continue
      const nextKey=key(i,j)
      if(closed.has(nextKey))continue
      const g=current.g+(di&&dj?Math.SQRT2:1)*grid
      const prior=records.get(nextKey)
      if(prior&&g>=prior.g)continue
      records.set(nextKey,{i,j,g,f:g+distance({x,z},point(to.i,to.j)),previous:best})
      open.add(nextKey)
    }
  }
}
