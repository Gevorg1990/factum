import {test} from 'node:test'
import assert from 'node:assert/strict'
import {geographyEntrySchema} from '../shared/geographyCms'
import {newContent,prepareContent,editorRecord} from '../shared/cmsEditor'
import {parseContent} from '../shared/cms'
import {geographyLegacyRows} from '../server/utils/geographyLegacy'
const entry={id:'example',title:'Հարց',area:'world-facts',category:'world-facts-nature',answer:'Պատասխան',detail:'Աղբյուրավորված բացատրություն',source:{name:'NASA',url:'https://science.nasa.gov/earth/'}}
test('geography validates record measurements, source URLs and complete representative coordinates',()=>{
 assert.ok(geographyEntrySchema.safeParse(entry).success)
 for(const patch of [{answer:''},{longitude:44},{longitude:181,latitude:40},{longitude:44,latitude:91},{source:{name:'',url:'https://example.com'}},{source:{name:'Աղբյուր',url:'javascript:alert(1)'}},{area:'records'},{dataYear:-1}])assert.equal(geographyEntrySchema.safeParse({...entry,...patch}).success,false)
 assert.ok(geographyEntrySchema.safeParse({...entry,area:'records',measure:'100 մ',location:'Հայաստան',longitude:44.5,latitude:40.2}).success)
})
test('CMS creates geographic categories and preserves existing public IDs when entries are edited',()=>{
 const category=newContent('GEO_CATEGORY');category.title='Նոր թեմա';assert.equal(parseContent(prepareContent(category)).data.title,'Նոր թեմա')
 const record={kind:'GEO_ENTRY',key:'world-facts:example',title:'Նոր հարց',data:entry};assert.equal(parseContent(prepareContent(record)).data.id,'example')
 const form=editorRecord(record);assert.equal(form.data.latitude,null);assert.equal(form.data.dataYear,null)
 const created=newContent('GEO_ENTRY');created.title='Նոր հարց';Object.assign(created.data,{category:'world-facts-nature',answer:'Պատասխան',detail:'Մանրամասն',source:entry.source});assert.equal(parseContent(prepareContent(created)).data.id,created.key)
})
test('all reviewed geographic entries have a matching category and unique identities without duplicate fact copies',()=>{
 const rows=geographyLegacyRows(),categories=new Map(rows.filter(row=>row.kind==='GEO_CATEGORY').map(row=>[row.key,row.data])),entries=rows.filter(row=>row.kind==='GEO_ENTRY')
 assert.equal(new Set(rows.map(row=>row.kind+':'+row.key)).size,rows.length);assert.ok(entries.length>=100);assert.equal(entries.filter(row=>row.data.area==='records').length,31)
 for(const row of entries){assert.equal(categories.get(row.data.category)?.area,row.data.area);assert.ok(geographyEntrySchema.safeParse(row.data).success)}
 const everest=entries.filter(row=>row.data.id==='record-everest');assert.equal(everest.length,1);assert.equal(everest[0]?.data.includeInFacts,true)
})
