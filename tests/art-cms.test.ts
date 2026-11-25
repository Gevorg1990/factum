import assert from 'node:assert/strict'
import test from 'node:test'
import {parseContent} from '../shared/cms'
import {newContent,prepareContent} from '../shared/cmsEditor'
import {galleryAutomaticSlot,galleryAvailableSlots,galleryPlacement,galleryRoomForSlot,gallerySizeHeight,gallerySizeWidth} from '../utils/art/galleryLayout'

const artwork={...newContent('ARTWORK'),title:'Փորձնական նկար'}
artwork.data={...artwork.data,
  creator:'Փորձնական հեղինակ',creatorInfo:'Հեղինակի մասին ստուգված տեղեկություն',
  creatorPortrait:'/images/uploads/portrait.webp',creatorPortraitCredit:'Աղբյուր',creatorPortraitSource:'https://example.org/portrait',
  date:'1900',medium:'Յուղաներկ, կտավ',description:'Նկարի մասին բացատրություն',
  image:'/images/uploads/art.webp',source:'https://example.org/artwork',imageCredit:'Լուսանկարի հեղինակ',imageSource:'https://example.org/image',
}

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

test('gallery artworks keep an explicit lower or upper wall position and display size',()=>{
  const placed=structuredClone(artwork)
  placed.data.gallerySlot=624
  placed.data.displaySize='large'
  const payload=parseContent(prepareContent(placed))
  assert.equal(payload.data.gallerySlot,624)
  assert.equal(payload.data.displaySize,'large')
  assert.equal(galleryRoomForSlot(624),12)
  assert.equal(galleryPlacement(624).upper,true)
  assert.equal(galleryPlacement(624).z,-6.75)
  assert.equal(galleryPlacement(1).room,6)
  assert.equal(galleryPlacement(1).upper,false)
  assert.ok(galleryAvailableSlots(6).includes(600))
  assert.ok(galleryAvailableSlots(6).includes(0))
  placed.data.gallerySlot=1024
  assert.throws(()=>parseContent(prepareContent(placed)))
})

test('even large framed works have clear space on shared flat walls',()=>{
  const slots=galleryAvailableSlots(6)
  assert.equal(slots.length,10)
  for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
    const a=galleryPlacement(slots[i]!),b=galleryPlacement(slots[j]!)
    assert.equal(a.room,6)
    if(a.z!==b.z)continue
    const dx=Math.abs(a.x-b.x),dy=Math.abs(a.centerY-b.centerY)
    const width=gallerySizeWidth.large+.2,height=gallerySizeHeight.large+.2
    assert.ok(dx>width+.1||dy>height+.1,`Frames overlap: ${slots[i]} and ${slots[j]}`)
  }
  assert.equal(galleryAutomaticSlot(new Set([0,1,2,3,4,5])),600)
  assert.equal(galleryAutomaticSlot(new Set([1,2])),0)
})
