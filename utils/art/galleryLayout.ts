import {galleryCenter} from './galleryNavigation'

export const WORKS_PER_ROOM=6
export const COLUMN_SLOT_START=600

export function galleryRoomForSlot(slot:number){
  return slot<COLUMN_SLOT_START?6+Math.floor(slot/WORKS_PER_ROOM):Math.floor((slot-COLUMN_SLOT_START)/4)
}

export function galleryPlacement(slot:number){
  const room=galleryRoomForSlot(slot)
  if(slot>=COLUMN_SLOT_START){
    const position=(slot-COLUMN_SLOT_START)%4
    const sx=position%2===0?-1:1,sz=position<2?-1:1
    const center=galleryCenter(room)!
    return {room,x:center.x+sx*5.9,z:center.z+sz*5.9,rotation:Math.atan2(-sx,-sz),column:true}
  }
  const wallPosition=slot%WORKS_PER_ROOM
  return {
    room,
    x:34+(room-6)*17+[-4.5,0,4.5][wallPosition%3]!,
    z:wallPosition<3?-6.75:6.75,
    rotation:wallPosition<3?0:Math.PI,
    column:false,
  }
}

export function gallerySlotLabel(slot:number){
  if(slot>=COLUMN_SLOT_START){
    const room=galleryRoomForSlot(slot)
    return `${room<6?`Հիմնական սրահ ${room+1}`:`Նոր սրահ ${room-5}`} · սյուն ${(slot-COLUMN_SLOT_START)%4+1}`
  }
  const room=Math.floor(slot/WORKS_PER_ROOM)+1
  const position=slot%WORKS_PER_ROOM
  return `Նոր սրահ ${room} · ${position<3?'հյուսիսային':'հարավային'} պատ · տեղ ${position%3+1}`
}

export const gallerySizeWidth={regular:2.7,medium:3.5,large:4.3} as const

export function galleryAvailableSlots(lastRoom:number){
  const slots:number[]=[]
  for(let room=0;room<=Math.min(105,lastRoom);room++){
    if(room>=6)for(let position=0;position<6;position++)slots.push((room-6)*6+position)
    for(let position=0;position<4;position++)slots.push(COLUMN_SLOT_START+room*4+position)
  }
  return slots
}
