import {galleryBranch,galleryBranchName} from './galleryBranches'
import {firstCmsGalleryRoom,galleryAvailableSlots,galleryFirstFrontRoom,galleryPlacement,galleryRoomForSlot,gallerySlotLabel} from './galleryLayout'

export type GalleryEditorWallSide=ReturnType<typeof galleryPlacement>['wall']
export type GalleryEditorWall={room:number;side:GalleryEditorWallSide;label:string;slot:number;available:number}
export type GalleryEditorRoom={id:number;name:string;planned:boolean;moving:number;parent:number|null;entrance:GalleryEditorWallSide}
export type GalleryEditorSlot={key:string;slot:number}

export function galleryEditorRoomName(room:number){
  return galleryBranchName(room)??(room===galleryFirstFrontRoom?'Արևելյան սրահ':`Նոր սրահ ${room-firstCmsGalleryRoom+1}`)
}

export function galleryEditorLayout(occupied:readonly GalleryEditorSlot[],key:string,current:number|undefined,thinkerPublished:boolean){
  const taken=new Set(occupied.filter(item=>item.key!==key).map(item=>item.slot))
  const openBranches=new Set<number>()
  let lastRoom=galleryFirstFrontRoom
  for(const {slot} of occupied){
    const room=galleryRoomForSlot(slot)
    const branch=galleryBranch(room)
    if(branch)openBranches.add(room)
    lastRoom=Math.max(lastRoom,branch?.parent??room)
  }

  const nextRoom=lastRoom===galleryFirstFrontRoom?firstCmsGalleryRoom:lastRoom+1
  const slots=galleryAvailableSlots(nextRoom,lastRoom)
  if(current!==undefined&&!slots.includes(current))slots.push(current)
  const walls=new Map<string,GalleryEditorWall>()
  for(const slot of slots){
    const {room,wall:side}=galleryPlacement(slot,lastRoom,openBranches)
    const wallKey=`${room}:${side}`
    const free=!taken.has(slot)
    const existing=walls.get(wallKey)
    if(existing){
      if(slot===current||(free&&existing.available===0&&existing.slot!==current))existing.slot=slot
      if(free)existing.available++
    }else{
      walls.set(wallKey,{room,side,slot,available:free?1:0,label:gallerySlotLabel(slot,openBranches)})
    }
  }

  const occupancy=new Map<string,number>()
  for(const slot of taken){
    const {room,wall}=galleryPlacement(slot,lastRoom,openBranches)
    const wallKey=`${room}:${wall}`
    occupancy.set(wallKey,(occupancy.get(wallKey)??0)+1)
  }
  const rooms=new Map<number,GalleryEditorRoom>()
  for(const {room} of walls.values()){
    if(rooms.has(room))continue
    const branch=galleryBranch(room)
    const planned=branch?!openBranches.has(room):room>lastRoom
    const parent=branch?.parent??(room===galleryFirstFrontRoom?null:room===firstCmsGalleryRoom?galleryFirstFrontRoom:room-1)
    let moving=0
    if(planned){
      const opening=branch?.direction??'east'
      moving=occupancy.get(`${parent}:${opening}`)??0
      if(thinkerPublished&&branch?.parent===galleryFirstFrontRoom&&branch.direction==='north')moving++
    }
    rooms.set(room,{id:room,name:galleryEditorRoomName(room),planned,moving,parent,entrance:branch?(branch.direction==='north'?'south':'north'):'west'})
  }
  return {walls:[...walls.values()],rooms:[...rooms.values()]}
}
