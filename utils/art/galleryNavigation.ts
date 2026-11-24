export interface GalleryPoint { x:number; z:number }

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
  if(Math.abs(x-17)<2.1 && Math.abs(z)<2.1)return false
  const insideRoom=(cx:number,cz:number)=>Math.abs(x-cx)<=3.7 && Math.abs(z-cz)<=3.7
  if(insideRoom(0,0)||insideRoom(17,0)||insideRoom(-17,0)||insideRoom(0,-17)||insideRoom(0,17)||insideRoom(-34,0))return true
  const annex=Math.round((x-34)/17)
  if(annex>=0&&annex<extraRooms&&insideRoom(34+annex*17,0))return true
  if(extraRooms&&Math.abs(z)<=3.7&&x>20.7&&x<34+(extraRooms-1)*17-3.7)return true
  // Broad, continuous bridges connect the halls like a museum nave.
  return (Math.abs(z)<=3.7 && x>-30.4 && x<13.4)
    || (Math.abs(x)<=3.7 && Math.abs(z)<13.4)
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
