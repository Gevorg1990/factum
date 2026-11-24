import assert from 'node:assert/strict'
import test from 'node:test'
import {parseContent} from '../shared/cms'
import {newContent,prepareContent} from '../shared/cmsEditor'

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
