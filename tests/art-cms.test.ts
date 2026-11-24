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

test('the CMS rejects a gallery work without its image or portrait',()=>{
  const missingImage=structuredClone(artwork)
  missingImage.data.image=''
  assert.throws(()=>parseContent(prepareContent(missingImage)))
  const missingPortrait=structuredClone(artwork)
  missingPortrait.data.creatorPortrait=''
  assert.throws(()=>parseContent(prepareContent(missingPortrait)))
})
