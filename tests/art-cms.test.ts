import assert from 'node:assert/strict'
import test from 'node:test'
import {parseContent} from '../shared/cms'
import {newContent,prepareContent} from '../shared/cmsEditor'
import {firstGalleryFrontSlot,galleryAutomaticSlot,galleryAvailableSlots,galleryCorePlacement,galleryIsBranchSlot,galleryIsFrontSlot,galleryIsSculpture,galleryPlacement,galleryRoomForSlot,gallerySlotLabel,galleryWallFrames,galleryWallHeight,galleryWallPercent,galleryWallWidth,maxGallerySlot} from '../utils/art/galleryLayout'
import {galleryBranchId} from '../utils/art/galleryBranches'
import {galleryEditorLayout} from '../utils/art/galleryEditorLayout'
import {galleryArtworks,visibleGalleryArtworks} from '../data/art/gallery'

const artwork={...newContent('ARTWORK'),title:'Փորձնական նկար'}
artwork.data={...artwork.data,
  creator:'Փորձնական հեղինակ',creatorInfo:'Հեղինակի մասին ստուգված տեղեկություն',
  creatorPortrait:'/images/uploads/portrait.webp',creatorPortraitCredit:'Աղբյուր',creatorPortraitSource:'https://example.org/portrait',
  date:'1900',medium:'Յուղաներկ, կտավ',description:'Նկարի մասին բացատրություն',
  image:'/images/uploads/art.webp',source:'https://example.org/artwork',imageCredit:'Լուսանկարի հեղինակ',imageSource:'https://example.org/image',
}

test('the public gallery hides the unavailable models and retains the Thinker photograph',()=>{
  const visibleIds=visibleGalleryArtworks.map(item=>item.id)
  for(const id of ['venus-de-milo','greek-slave','girl-skating']){
    assert.ok(galleryArtworks.some(item=>item.id===id))
    assert.ok(!visibleIds.includes(id))
  }
  assert.ok(visibleIds.includes('thinker'))
})

test('the CMS accepts a complete gallery work and keeps its stable ID',()=>{
  const payload=parseContent(prepareContent(artwork))
  assert.equal(payload.kind,'ARTWORK')
  assert.equal(payload.data.id,payload.key)
  assert.equal(payload.data.title,payload.title)
  assert.equal(payload.data.creator,'Փորձնական հեղինակ')
})

test('the CMS requires the artwork image, biography and text',()=>{
  const missingImage=structuredClone(artwork)
  missingImage.data.image=''
  assert.throws(()=>parseContent(prepareContent(missingImage)))
  const missingBiography=structuredClone(artwork)
  missingBiography.data.creatorInfo=''
  assert.throws(()=>parseContent(prepareContent(missingBiography)))
  const missingDescription=structuredClone(artwork)
  missingDescription.data.description=''
  assert.throws(()=>parseContent(prepareContent(missingDescription)))
})

test('museum and image credit links can be left blank',()=>{
  const withoutLinks=structuredClone(artwork)
  Object.assign(withoutLinks.data,{source:'',imageCredit:'',imageSource:'',imageLicense:'',creatorPortrait:'',creatorPortraitSource:''})
  const payload=parseContent(prepareContent(withoutLinks))
  assert.equal(payload.data.source,'')
  assert.equal(payload.data.imageSource,'')
})

test('CMS saves a wall percentage for both new and existing gallery paintings',()=>{
  const artworkWithSize=structuredClone(artwork)
  artworkWithSize.data.gallerySlot=624
  artworkWithSize.data.wallPercent=35
  const payload=parseContent(prepareContent(artworkWithSize))
  assert.equal(payload.data.gallerySlot,624)
  assert.equal(payload.data.wallPercent,35)
  assert.equal(galleryWallPercent({id:'existing',wallPercent:35,displaySize:'large'}),35)
  assert.ok(galleryWallPercent({id:'existing',displaySize:'medium'})>galleryWallPercent({id:'existing',displaySize:'regular'}))
  artworkWithSize.data.room=4
  assert.equal(parseContent(prepareContent(artworkWithSize)).data.wallPercent,35)
  for(const invalid of [0,101,12.5]){
    artworkWithSize.data.wallPercent=invalid
    assert.throws(()=>parseContent(prepareContent(artworkWithSize)))
  }
  artworkWithSize.data.wallPercent=''
  assert.equal(parseContent(prepareContent(artworkWithSize)).data.wallPercent,undefined)
  artworkWithSize.data.gallerySlot=maxGallerySlot+1
  assert.throws(()=>parseContent(prepareContent(artworkWithSize)))
})

test('all published slot IDs map to centered wall rows with up to four pictures per wall',()=>{
  const slots=galleryAvailableSlots(6).filter(slot=>slot<firstGalleryFrontSlot)
  assert.deepEqual(slots,[0,1,2,3,4,5,600,601])
  assert.equal(galleryAutomaticSlot(new Set(slots)),602)
  for(const slot of slots){
    const placement=galleryPlacement(slot)
    assert.equal(placement.x,34)
    assert.equal(placement.centerY,4.5)
    assert.equal(galleryRoomForSlot(slot),6)
  }
  assert.equal(gallerySlotLabel(0),gallerySlotLabel(3))
  assert.notEqual(gallerySlotLabel(3),gallerySlotLabel(4))
  assert.equal(gallerySlotLabel(4),gallerySlotLabel(601))
  const allSlots=galleryAvailableSlots(1000)
  assert.equal(new Set(allSlots).size,maxGallerySlot+1)
  const paintingsPerWall=new Map<string,number>()
  for(const artwork of galleryArtworks){
    const placement=galleryCorePlacement(artwork.id)
    if(galleryIsSculpture(artwork.id)){
      assert.equal(placement,undefined)
      continue
    }
    assert.ok(placement,artwork.id)
    assert.equal(placement.room,artwork.room)
    assert.equal(placement.centerY,4.5)
    const key=`${placement.room}:${placement.wall}`
    const count=(paintingsPerWall.get(key)??0)+1
    assert.ok(count<=4)
    paintingsPerWall.set(key,count)
  }
})

test('the front wall follows the last room and the empty east-hall side wall stays in place',()=>{
  const extraSlots=galleryAvailableSlots(1)
  const front=extraSlots.filter(galleryIsFrontSlot)
  const side=extraSlots.filter(slot=>!galleryIsFrontSlot(slot)&&!galleryIsBranchSlot(slot)&&galleryPlacement(slot).wall==='south')
  assert.equal(front.length,4)
  assert.equal(side.length,4)
  assert.equal(new Set(front.map(slot=>gallerySlotLabel(slot))).size,1)
  assert.equal(new Set(side.map(slot=>gallerySlotLabel(slot))).size,1)
  assert.equal(galleryPlacement(front[0]!).room,1)
  assert.equal(galleryPlacement(front[0]!).wall,'east')
  assert.equal(galleryPlacement(front[0]!,7).room,7)
  assert.equal(galleryPlacement(front[0]!,7).wall,'east')
  assert.equal(galleryPlacement(side[0]!,7).room,1)
  assert.equal(galleryPlacement(side[0]!,7).wall,'south')
  assert.equal(galleryPlacement(0,7).room,6)
  assert.equal(galleryAutomaticSlot(new Set(extraSlots)),0)

  for(const slot of extraSlots){
    const record=structuredClone(artwork)
    record.data.gallerySlot=slot
    assert.equal(parseContent(prepareContent(record)).data.gallerySlot,slot)
  }
})

test('the chosen branch moves only the pictures on the new passage wall',()=>{
  const north=galleryBranchId(6,'north')
  const eastHallSouth=galleryBranchId(1,'south')
  const open=new Set([north,eastHallSouth])
  const chosenSlot=galleryAvailableSlots(7,6).find(slot=>galleryRoomForSlot(slot)===north)!
  const record=structuredClone(artwork)
  record.data.gallerySlot=chosenSlot
  assert.equal(parseContent(prepareContent(record)).data.gallerySlot,chosenSlot)
  assert.equal(galleryPlacement(chosenSlot,6,open).wall,'east')
  assert.equal(galleryPlacement(0,6,open).room,north)
  assert.equal(galleryPlacement(4,6,open).room,6)
  assert.equal(galleryPlacement(firstGalleryFrontSlot,6,open).room,6)
  assert.equal(galleryCorePlacement('thinker',open)?.room,1)
  assert.equal(galleryCorePlacement('thinker',new Set([galleryBranchId(1,'north')]))?.room,galleryBranchId(1,'north'))
  const eastHallSouthSlot=galleryAvailableSlots(1).find(slot=>galleryPlacement(slot).wall==='south')!
  assert.equal(galleryPlacement(eastHallSouthSlot,6,open).room,eastHallSouth)
})

test('the CMS map groups free places by physical wall and keeps the current selection',()=>{
  const occupied=[{key:'editing',slot:1},{key:'existing',slot:0},{key:'third',slot:2},{key:'fourth',slot:3}]
  const layout=galleryEditorLayout(occupied,'editing',1,true)
  const north=layout.walls.find(wall=>wall.room===6&&wall.side==='north')
  assert.deepEqual({slot:north?.slot,available:north?.available},{slot:1,available:1})
  assert.equal(galleryEditorLayout(occupied,'new',undefined,true).walls.find(wall=>wall.room===6&&wall.side==='north')?.available,0)
})

test('the map previews new branch directions and the artwork that would move',()=>{
  const front={key:'front',slot:firstGalleryFrontSlot}
  const north=galleryBranchId(1,'north')
  const preview=galleryEditorLayout([front],'new',undefined,true)
  assert.equal(preview.rooms.find(room=>room.id===6)?.moving,1)
  assert.deepEqual(preview.rooms.find(room=>room.id===north),{
    id:north,name:'Արևելյան սրահ · Ձախ սրահ',parent:1,planned:true,moving:1,entrance:'south',
  })
  const branchSlot=preview.walls.find(wall=>wall.room===north)!.slot
  const opened=galleryEditorLayout([front,{key:'branch',slot:branchSlot}],'new',undefined,true)
  assert.equal(opened.rooms.find(room=>room.id===north)?.planned,false)
  assert.ok(opened.walls.some(wall=>wall.room===north&&wall.side==='north'))
  assert.ok(opened.walls.some(wall=>wall.room===1&&wall.side==='east'&&wall.available===3))
  assert.ok(!opened.walls.some(wall=>wall.room===1&&wall.side==='north'))
  assert.equal(galleryEditorLayout([front],'front',front.slot,false).rooms.find(room=>room.id===6)?.moving,0)
})

test('percentage controls frame width and multiple images stay centered with clear margins',()=>{
  const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9)
  const [single]=galleryWallFrames([{percent:40,aspectRatio:1.4}])
  close(single!.offset,0)
  close(single!.width+single!.border,galleryWallWidth*.4)
  const [full]=galleryWallFrames([{percent:100,aspectRatio:2}])
  close(full!.width+full!.border,galleryWallWidth)
  for(const count of [2,3,4]){
    const ratios=[.45,1.3,1.75,1]
    const frames=galleryWallFrames(ratios.slice(0,count).map(aspectRatio=>({percent:70,aspectRatio})))
    const halfWidth=(index:number)=>(frames[index]!.width+frames[index]!.border)/2
    close(frames[0]!.offset-halfWidth(0),-(frames[count-1]!.offset+halfWidth(count-1)))
    for(const [index,frame] of frames.entries()){
      close(frame.width/frame.height,ratios[index]!)
      assert.ok(frame.height+frame.border<=galleryWallHeight+1e-9)
      assert.ok(Math.abs(frame.offset)+halfWidth(index)<=galleryWallWidth/2+1e-9)
      if(index)close(frame.offset-halfWidth(index)-(frames[index-1]!.offset+halfWidth(index-1)),.3)
    }
  }
})
