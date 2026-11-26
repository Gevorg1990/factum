import {galleryCenter} from './galleryNavigation'
import {galleryBranch,galleryBranchId,galleryBranchName} from './galleryBranches'

export const galleryWallWidth=11.8
export const galleryWallHeight=7
export const galleryFrameBorder=.2
export const defaultGalleryWallPercent=45
const legacyWidths={regular:2.4,medium:3.05,large:3.7}
export const galleryHiddenSculptureIds=['venus-de-milo','greek-slave','girl-skating'] as const
const sculptureIds=new Set<string>(galleryHiddenSculptureIds)
export const galleryIsSculpture=(id:string)=>sculptureIds.has(id)

type Wall='north'|'south'|'east'|'west'
const wallLabels={north:'Հյուսիսային',south:'Հարավային',east:'Արևելյան',west:'Արևմտյան'}
const coreWalls: [id:string,room:number,wall:Wall,width:number][]=[
  ['thinker',1,'north',3.7],
  ['grande-jatte',2,'north',7.8],
  ['paris-rain',2,'south',2.8],
  ['bedroom',2,'south',5.2],
  ['water-lilies',2,'south',2.8],
  ['starry-night',3,'north',7.5],
  ['sunflowers',3,'west',3.2],
  ['impression-sunrise',3,'west',2.7],
  ['irises',3,'west',3.7],
  ['moulin',3,'east',3.7],
  ['bathers',3,'east',2.7],
  ['poppies',3,'east',3.7],
  ['last-supper',4,'south',10.8],
  ['mona-lisa',4,'west',4.05],
  ['blue-armchair',4,'west',2.7],
  ['virgin-rocks',4,'west',3.2],
  ['floor-scrapers',4,'east',2.7],
  ['lady-ermine',4,'east',3.2],
  ['self-portrait',5,'north',3.6],
  ['poets-garden',5,'north',4.8],
  ['stack-wheat',5,'south',4.8],
  ['two-sisters',5,'south',3.6],
  ['childs-bath',5,'west',3.55],
  ['woman-bathing',5,'west',3.55],
]
const coreWallsById=new Map(coreWalls.map(([id,room,wall,width],order)=>[id,{room,wall,width,order}]))
export const firstCmsGalleryRoom=6
const worksPerWall=4
const worksPerRoom=worksPerWall*2
export const firstGalleryFrontSlot=1024
const firstEastHallSouthSlot=firstGalleryFrontSlot+worksPerWall
export const firstGalleryBranchSlot=firstEastHallSouthSlot+worksPerWall
const lastStraightRoom=133
export const lastGalleryBranchSlot=firstGalleryBranchSlot+(lastStraightRoom-4)*worksPerRoom*2-1
export const maxGallerySlot=lastGalleryBranchSlot+worksPerWall-1
export const galleryFirstFrontRoom=1
export const galleryIsFrontSlot=(slot:number)=>slot>=firstGalleryFrontSlot&&slot<firstEastHallSouthSlot
export const galleryIsBranchSlot=(slot:number)=>slot>=firstGalleryBranchSlot&&slot<=lastGalleryBranchSlot
const fixedWallSlots=Array.from({length:worksPerWall},(_,index)=>firstEastHallSouthSlot+index)
const frontWallSlots=Array.from({length:worksPerWall},(_,index)=>firstGalleryFrontSlot+index)
const thinkerWallSlots=Array.from({length:worksPerWall-1},(_,index)=>lastGalleryBranchSlot+1+index)

function wallCenter(room:number,wall:Wall){
  const center=room===1?{x:17,z:0}:galleryBranch(room)??galleryCenter(room)!
  const offset=6.75
  return {
    room,wall,centerY:4.5,
    x:center.x+(wall==='east'?offset:wall==='west'?-offset:0),
    z:center.z+(wall==='south'?offset:wall==='north'?-offset:0),
    rotation:{north:0,south:Math.PI,east:-Math.PI/2,west:Math.PI/2}[wall],
  }
}

function galleryArtworkWall(room:number,wall:Wall,branches?:ReadonlySet<number>){
  if((room===1||room>=firstCmsGalleryRoom&&room<=lastStraightRoom)&&(wall==='north'||wall==='south')){
    const branch=galleryBranchId(room,wall)
    if(branches?.has(branch))return wallCenter(branch,wall)
  }
  return wallCenter(room,wall)
}

export function galleryCorePlacement(id:string,branches?:ReadonlySet<number>){
  const placement=coreWallsById.get(id)
  return placement&&{...galleryArtworkWall(placement.room,placement.wall,branches),order:placement.order}
}

// Preserve legacy slot IDs and exhibition order while laying works out in one row.
function galleryWallIndex(slot:number){
  if(slot<600)return 10*Math.floor(slot/6)+slot%6
  const group=Math.floor((slot-600)/4)
  return 4*group+6*Math.min(group+1,100)+(slot-600)%4
}
const slotsByWall=Array.from({length:firstGalleryFrontSlot},(_,slot)=>slot).sort((a,b)=>galleryWallIndex(a)-galleryWallIndex(b))

export function galleryRoomForSlot(slot:number,frontRoom=galleryFirstFrontRoom,branches?:ReadonlySet<number>){
  return galleryPlacement(slot,frontRoom,branches).room
}

export function galleryPlacement(slot:number,frontRoom=galleryFirstFrontRoom,branches?:ReadonlySet<number>){
  if(galleryIsBranchSlot(slot)){
    const index=slot-firstGalleryBranchSlot
    const room=galleryBranchId(1,'north')+Math.floor(index/worksPerRoom)
    return {...wallCenter(room,index%worksPerRoom<worksPerWall?'east':'west'),order:slot}
  }
  if(galleryIsFrontSlot(slot))return {...wallCenter(frontRoom,'east'),order:slot}
  if(slot>lastGalleryBranchSlot)return {...galleryArtworkWall(1,'north',branches),order:slot}
  if(slot>=firstEastHallSouthSlot)return {...galleryArtworkWall(1,'south',branches),order:slot}
  const order=galleryWallIndex(slot)
  const room=firstCmsGalleryRoom+Math.floor(order/worksPerRoom)
  return {...galleryArtworkWall(room,order%worksPerRoom<worksPerWall?'north':'south',branches),order}
}

export function gallerySlotLabel(slot:number,branches?:ReadonlySet<number>){
  if(galleryIsFrontSlot(slot))return 'Դիմացի պատ · վերջին սրահում'
  const placement=galleryPlacement(slot,galleryFirstFrontRoom,branches)
  const branch=galleryBranchName(placement.room)
  const name=branch??(placement.room===1?'Արևելյան սրահ':`Նոր սրահ ${placement.room-5}`)
  const wall=branch&&(placement.wall==='north'||placement.wall==='south')?'Դիմացի':wallLabels[placement.wall]
  return `${name} · ${wall} պատ`
}

export function galleryAvailableSlots(lastRoom:number,lastOpenRoom=lastRoom){
  const branchParents=[1,...Array.from({length:Math.max(0,Math.min(lastOpenRoom,lastStraightRoom)-5)},(_,index)=>index+6)]
  const branchSlots=branchParents.flatMap(parent=>{
    const start=firstGalleryBranchSlot+(galleryBranchId(parent,'north')-galleryBranchId(1,'north'))*worksPerRoom
    return Array.from({length:worksPerRoom*2},(_,index)=>start+index)
  })
  return [...frontWallSlots,...fixedWallSlots,...thinkerWallSlots,...slotsByWall.slice(0,Math.max(0,(lastRoom-firstCmsGalleryRoom+1)*worksPerRoom)),...branchSlots]
}

export function galleryAutomaticSlot(occupied:ReadonlySet<number>){
  return slotsByWall.find(slot=>!occupied.has(slot))
}

export function galleryWallPercent(artwork:{id:string;wallPercent?:number;displaySize?:keyof typeof legacyWidths}){
  if(artwork.wallPercent!==undefined)return artwork.wallPercent
  const core=coreWallsById.get(artwork.id)
  const legacyWidth=core?.width??(artwork.displaySize?legacyWidths[artwork.displaySize]:undefined)
  return legacyWidth===undefined?defaultGalleryWallPercent:Math.round((legacyWidth+galleryFrameBorder)/galleryWallWidth*100)
}

export function galleryFrameSize(percent:number,aspectRatio:number){
  // Allow the frame to shrink along with very small images.
  const border=Math.min(galleryFrameBorder,galleryWallWidth*percent/200)
  const fittedWidth=Math.min(galleryWallWidth*percent/100-border,(galleryWallHeight-border)*aspectRatio)
  return {width:fittedWidth,height:fittedWidth/aspectRatio,border}
}


export function galleryWallFrames(works:readonly {percent:number;aspectRatio:number}[]){
  if(!works.length)return []
  const frames=works.map(work=>galleryFrameSize(work.percent,work.aspectRatio))
  const gap=.3
  const total=frames.reduce((sum,frame)=>sum+frame.width+frame.border,0)
  const gapWidth=(frames.length-1)*gap
  const scale=Math.min(1,(galleryWallWidth-gapWidth)/total)
  let left=-(total*scale+gapWidth)/2
  return frames.map(frame=>{
    const width=frame.width*scale,height=frame.height*scale,border=frame.border*scale
    const outerWidth=width+border
    const offset=left+outerWidth/2
    left+=outerWidth+gap
    return {width,height,border,offset}
  })
}
