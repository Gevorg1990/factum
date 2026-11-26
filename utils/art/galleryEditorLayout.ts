import {galleryBranch,galleryBranchName} from './galleryBranches'
import {firstCmsGalleryRoom,galleryAvailableSlots,galleryFirstFrontRoom,galleryPlacement,galleryRoomForSlot,gallerySlotLabel} from './galleryLayout'
import {galleryCenter,galleryCenters} from './galleryNavigation'
import {galleryRooms} from '../../data/art/galleryRooms'

export type GalleryEditorWallSide=ReturnType<typeof galleryPlacement>['wall']
export type GalleryEditorWall={room:number;side:GalleryEditorWallSide;label:string;slot:number;available:number;artworks:GalleryEditorSlot[]}
export type GalleryEditorRoom={id:number;name:string;planned:boolean;moving:number;parent:number|null;entrance:GalleryEditorWallSide}
export type GalleryEditorSlot={key:string;slot:number}
export type GalleryEditorArtwork={key:string;title:string;image:string;percent:number}
export type GalleryOverviewRoom={id:number;x:number;z:number;planned:boolean}

export function galleryOverviewLayout(editorRooms:readonly GalleryEditorRoom[]){
  const rooms=new Map<number,GalleryOverviewRoom>(galleryCenters.map((center,id)=>[
    id,{...center,x:id===galleryFirstFrontRoom?17:center.x,id,planned:false},
  ]))
  for(const room of editorRooms){
    if(rooms.has(room.id))continue
    const center=galleryBranch(room.id)??galleryCenter(room.id)
    if(center)rooms.set(room.id,{id:room.id,x:center.x,z:center.z,planned:room.planned})
  }

  const links:[number,number][]=[[0,1],[0,2],[0,3],[0,4],[2,5]]
  for(const room of editorRooms){
    if(room.id>=firstCmsGalleryRoom&&room.parent!==null&&rooms.has(room.parent)&&rooms.has(room.id))links.push([room.parent,room.id])
  }
  return {rooms:[...rooms.values()],links}
}

export function galleryEditorRoomName(room:number){
  return galleryBranchName(room)??galleryRooms[room]?.name??`Նոր սրահ ${room-firstCmsGalleryRoom+1}`
}

export function galleryEditorLayout(occupied:readonly GalleryEditorSlot[],key:string,current:number|undefined){
  const others=occupied.filter(item=>item.key!==key)
  const taken=new Set(others.map(item=>item.slot))
  const openBranches=new Set<number>()
  let lastRoom=galleryFirstFrontRoom
  for(const {slot} of occupied){
    const room=galleryRoomForSlot(slot)
    const branch=galleryBranch(room)
    if(branch)openBranches.add(room)
    if(room>=firstCmsGalleryRoom)lastRoom=Math.max(lastRoom,branch?.parent??room)
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
      walls.set(wallKey,{room,side,slot,available:free?1:0,label:gallerySlotLabel(slot,openBranches),artworks:[]})
    }
  }

  for(const item of others){
    const {room,wall}=galleryPlacement(item.slot,lastRoom,openBranches)
    walls.get(`${room}:${wall}`)?.artworks.push(item)
  }
  const rooms=new Map<number,GalleryEditorRoom>()
  for(const {room} of walls.values()){
    if(rooms.has(room))continue
    const branch=galleryBranch(room)
    const planned=branch?!openBranches.has(room):room>=firstCmsGalleryRoom&&room>lastRoom
    const coreEntrance=({2:'east',3:'south',4:'north',5:'east'} as const)[room as 2|3|4|5]
    const parent=branch?.parent??(room===1?null:room===5?2:room<firstCmsGalleryRoom?0:room===firstCmsGalleryRoom?galleryFirstFrontRoom:room-1)
    let moving=0
    if(planned){
      const opening=branch?.direction??'east'
      moving=walls.get(`${parent}:${opening}`)?.artworks.length??0
    }
    rooms.set(room,{id:room,name:galleryEditorRoomName(room),planned,moving,parent,entrance:branch?(branch.direction==='north'?'south':'north'):coreEntrance??'west'})
  }
  return {walls:[...walls.values()],rooms:[...rooms.values()]}
}
