import {galleryCenter} from './galleryNavigation'

export const WORKS_PER_ROOM=6
export const UPPER_SLOT_START=600
const UPPER_WORKS_PER_ROOM=4
const WALL_OFFSETS=[-4.1,0,4.1] as const

export type GalleryDisplaySize='regular'|'medium'|'large'
export const gallerySizeWidth:Record<GalleryDisplaySize,number>={regular:2.4,medium:3.05,large:3.7}
export const gallerySizeHeight:Record<GalleryDisplaySize,number>={regular:2.2,medium:2.8,large:3.4}

export function galleryRoomForSlot(slot:number){
  return slot<UPPER_SLOT_START?6+Math.floor(slot/WORKS_PER_ROOM):6+Math.floor((slot-UPPER_SLOT_START)/UPPER_WORKS_PER_ROOM)
}

export function galleryPlacement(slot:number){
  const room=galleryRoomForSlot(slot)
  const upper=slot>=UPPER_SLOT_START
  const position=upper?(slot-UPPER_SLOT_START)%UPPER_WORKS_PER_ROOM:slot%WORKS_PER_ROOM
  const north=upper?position<2:position<3
  const offset=upper?position%2===0?-4.1:4.1:WALL_OFFSETS[position%3]!
  const center=galleryCenter(room)!
  return {room,x:center.x+offset,z:north?-6.75:6.75,rotation:north?0:Math.PI,centerY:upper?6.15:2.3,upper,wall:north?'հյուսիսային':'հարավային'}
}

export function gallerySlotLabel(slot:number){
  const placement=galleryPlacement(slot)
  const position=slot>=UPPER_SLOT_START?(slot-UPPER_SLOT_START)%2:slot%3
  const horizontal=slot>=UPPER_SLOT_START?(position===0?'ձախ':'աջ'):['ձախ','կենտրոն','աջ'][position]
  return `Նոր սրահ ${placement.room-5} · ${placement.wall} պատ · ${placement.upper?'վերև':'ներքև'} · ${horizontal}`
}

export function galleryAvailableSlots(lastRoom:number){
  const slots:number[]=[]
  for(let room=6;room<=Math.min(111,lastRoom);room++){
    if(room<=105)for(let position=0;position<WORKS_PER_ROOM;position++)slots.push((room-6)*WORKS_PER_ROOM+position)
    for(let position=0;position<UPPER_WORKS_PER_ROOM;position++)slots.push(UPPER_SLOT_START+(room-6)*UPPER_WORKS_PER_ROOM+position)
  }
  return slots
}

export function galleryAutomaticSlot(occupied:ReadonlySet<number>){
  return galleryAvailableSlots(111).find(slot=>!occupied.has(slot))
}
