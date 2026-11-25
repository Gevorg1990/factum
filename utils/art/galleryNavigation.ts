export interface GalleryPoint { x:number; z:number }

const passageHalfWidth=3.7
const sculptureClearances=[
  {x:17,z:0,radius:2.1},
  {x:-2.2,z:-2.2,radius:1.5},
  {x:-34,z:-2.2,radius:1.5},
]

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
  // Treat the visitor as a person with shoulder width and keep space from walls and columns.
  if(sculptureClearances.some(item=>Math.abs(x-item.x)<item.radius&&Math.abs(z-item.z)<item.radius))return false
  const insideRoom=(cx:number,cz:number)=>Math.abs(x-cx)<=passageHalfWidth && Math.abs(z-cz)<=passageHalfWidth
  if(insideRoom(0,0)||insideRoom(17,0)||insideRoom(-17,0)||insideRoom(0,-17)||insideRoom(0,17)||insideRoom(-34,0))return true
  const annex=Math.round((x-34)/17)
  if(annex>=0&&annex<extraRooms&&insideRoom(34+annex*17,0))return true
  if(extraRooms&&Math.abs(z)<=passageHalfWidth&&x>20.7&&x<34+(extraRooms-1)*17-passageHalfWidth)return true
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
const artworkWaypoints: GalleryPoint[]=[]
for(const xSign of [-1,1])for(const zSign of [-1,1]){
  artworkWaypoints.push({x:xSign*(passageHalfWidth-clearance),z:zSign*(passageHalfWidth-clearance)})
  for(const {x,z,radius} of sculptureClearances){
    artworkWaypoints.push({x:x+xSign*(radius+clearance),z:z+zSign*(radius+clearance)})
  }
}
const xBoundaries=[-passageHalfWidth,passageHalfWidth,...sculptureClearances.flatMap(({x,radius})=>[x-radius,x+radius])]
const zBoundaries=[-passageHalfWidth,passageHalfWidth,...sculptureClearances.flatMap(({z,radius})=>[z-radius,z+radius])]

function artworkSegmentClear(start:GalleryPoint,end:GalleryPoint,extraRooms:number) {
  // Between passage and pedestal edges the segment stays in the same floor region.
  const dx=end.x-start.x,dz=end.z-start.z
  const crossings=[0,1]
  for(const x of xBoundaries){const t=(x-start.x)/dx;if(t>0&&t<1)crossings.push(t)}
  for(const z of zBoundaries){const t=(z-start.z)/dz;if(t>0&&t<1)crossings.push(t)}
  crossings.sort((a,b)=>a-b)
  for(let i=1;i<crossings.length;i++){
    const t=(crossings[i-1]!+crossings[i]!)/2
    if(!galleryWalkable(start.x+dx*t,start.z+dz*t,extraRooms))return false
  }
  return true
}

export function gallerySculptureStand(start:GalleryPoint,center:GalleryPoint,viewingDistance:number,extraRooms=0):GalleryPoint {
  const currentDistance=distance(start,center)
  if(currentDistance<=viewingDistance)return start

  const positionAt=(t:number):GalleryPoint=>({
    x:start.x+(center.x-start.x)*t,
    z:start.z+(center.z-start.z)*t
  })
  let limit=1-viewingDistance/currentDistance
  const canApproach=(t:number)=>{
    const end=positionAt(t)
    return galleryWalkable(end.x,end.z,extraRooms)&&artworkSegmentClear(start,end,extraRooms)
  }
  if(canApproach(limit))return positionAt(limit)

  // Stop on the approach line if a wall or pedestal blocks the preferred distance.
  let reachable=0
  while((limit-reachable)*currentDistance>.01){
    const mid=(reachable+limit)/2
    if(canApproach(mid))reachable=mid
    else limit=mid
  }
  return positionAt(reachable)
}

export function galleryArtworkRoute(start:GalleryPoint,destination:GalleryPoint,extraRooms=0):GalleryPoint[]|undefined {
  if(!galleryWalkable(start.x,start.z,extraRooms))return galleryRoute(start,destination,extraRooms)
  let end=destination
  if(!galleryWalkable(end.x,end.z,extraRooms)){
    const cell=nearestCell(end,extraRooms)
    if(!cell)return
    end=point(cell.i,cell.j)
  }
  if(artworkSegmentClear(start,end,extraRooms))return [end]

  // The shortest clear route bends only at passage or obstacle corners.
  const nodes=[start,end,...artworkWaypoints.filter(({x,z})=>galleryWalkable(x,z,extraRooms))]
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
      if(cost>=costs[next]!||!artworkSegmentClear(from,to,extraRooms))continue
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
