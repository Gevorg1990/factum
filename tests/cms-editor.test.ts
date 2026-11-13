import {test} from 'node:test'
import assert from 'node:assert/strict'
import {newContent,prepareContent,editorRecord,contentUrl} from '../shared/cmsEditor'
import {parseContent} from '../shared/cms'
test('a new article can be created without manually entering IDs or duplicated titles',()=>{
 const form=newContent('ARTICLE')
 form.title='Ինչպե՞ս են առաջանում ամպերը'
 Object.assign(form.data,{subject:'physics',answer:'Կարճ պատասխան',detail:'Բացատրություն'})
 const prepared=prepareContent(form),validated=parseContent(prepared)
 assert.match(validated.key,/^article-/)
 assert.equal(validated.data.id,validated.key)
 assert.equal(validated.data.title,form.title)
 assert.equal(form.data.id,'') // Preparing a preview must not dirty the form.
 assert.equal(contentUrl({...prepared,id:'saved'}),'/articles/'+prepared.key)
})
test('editing an imported logic question preserves its full question and additional data',()=>{
 const stored={kind:'GAME',key:'logic-12',id:'existing',title:'Հին կարճ վերնագիր',version:4,data:{mode:'logic',difficulty:'medium',title:'Հին կարճ վերնագիր',question:'Սա հարցի ամբողջական, երկար տեքստն է։',answers:['Ա','Բ'],correct:1,explanation:'Բացատրություն',customMetadata:{source:'preserve'}}}
 const editor=editorRecord(stored),prepared=prepareContent(editor)
 assert.equal(editor.title,stored.data.question)
 assert.equal(prepared.data.question,stored.data.question)
 assert.equal(prepared.data.title,stored.data.title)
 assert.deepEqual(prepared.data.customMetadata,stored.data.customMetadata)
 assert.equal(prepared.version,4)
 assert.equal(parseContent(prepared).data.correct,1)
})
test('new categories/authors and meaningful event/work addresses stay consistent',()=>{
 for(const kind of ['CATEGORY','AUTHOR'] as const){const form=newContent(kind);form.title='Նոր անվանում';const prepared=prepareContent(form);assert.equal(parseContent(prepared).data.name,form.title)}
 const event=newContent('EVENT');event.title='Իրադարձություն';event.data.year='մ.թ.ա. 859';event.data.era='Հնագույն շրջան'
 assert.equal(parseContent(prepareContent(event)).key,'մ.թ.ա. 859')
 const existing={...event,id:'saved',key:'մ.թ.ա. 859',data:{...event.data,year:'փոխված'}}
 assert.equal(prepareContent(existing).data.year,'մ.թ.ա. 859')
 const work=newContent('WORK');work.title='Գործ';work.data.personId='tumanyan';work.data.index=2
 assert.equal(prepareContent(work).key,'tumanyan:2')
 assert.equal(contentUrl(prepareContent(work)),'/works/tumanyan/2')
})
test('optional blank sources do not prevent a draft but partly filled sources are validated',()=>{
 const form=newContent('ARTICLE');form.title='Նյութ';Object.assign(form.data,{subject:'physics',answer:'a',detail:'b',source:{name:'',url:''}})
 assert.equal('source' in parseContent(prepareContent(form)).data,false)
 form.data.source={name:'Աղբյուր',url:''}
 assert.throws(()=>parseContent(prepareContent(form)))
})

import {safeReturnPath} from '../shared/authNavigation'
test('login returns to a requested internal page without allowing external redirects',()=>{
 assert.equal(safeReturnPath('/articles/c1?from=profile#saved-article'),'/articles/c1?from=profile#saved-article')
 for(const invalid of ['https://evil.test','//evil.test','/\\evil.test','/login?next=/','/api/auth/me','/foo\nbar',null])assert.equal(safeReturnPath(invalid),null)
})

test('Millionaire editor preserves all fifteen positions and independently selects difficulty and bank',()=>{
 for(let slot=0;slot<15;slot++){
  const record={kind:'GAME',key:'million-'+slot,title:'Հարց',data:{mode:'million',difficulty:'hard',slot,question:'Հարց',answers:['ա','բ'],correct:0,explanation:'Բացատրություն'}}
  const editor=editorRecord(record)
  assert.equal(editor.data.slot,slot)
  const parsed=parseContent(prepareContent(editor))
  assert.equal(parsed.data.slot,slot);assert.equal(parsed.data.difficulty,'hard')
 }
 const created=newContent('GAME');created.title='Հարց';Object.assign(created.data,{slot:14,answers:['ա','բ'],explanation:'Պատասխան'})
 assert.equal(parseContent(prepareContent(created)).data.slot,14)
 assert.throws(()=>parseContent({...prepareContent(created),data:{...created.data,slot:15}}))
 assert.throws(()=>parseContent({...prepareContent(created),data:{...created.data,slot:-1}}))
})


test('article section images survive editing, validation and publishing without captions',()=>{
 const form=newContent('ARTICLE');form.title='Նկարներով նյութ';
 form.data.sections=[{title:'Առաջին մաս',text:'',image:'/images/physics-art.jpg'},{title:'',text:'Երկրորդ մաս',image:'https://example.com/image.webp'}];
 const saved=parseContent({...prepareContent(form),action:'publish'});
 assert.deepEqual(saved.data.sections,form.data.sections);
 const imported=editorRecord({...form,data:{...form.data,sections:[{title:'Հին մաս',text:'Տեքստ'}]}});
 assert.equal(imported.data.sections[0].image,'');
 imported.data.sections[0].image='javascript:alert(1)';
 assert.throws(()=>parseContent(prepareContent(imported)));
})

test('Armenian library books save without publication metadata and still validate content',()=>{
 const form=newContent('BOOK');form.title='Փորձնական գիրք'
 assert.equal(form.data.topic,'')
 Object.assign(form.data,{topic:'prose',author:'Փորձնական հեղինակ',description:'Հայերեն պատմություն',cover:'/images/library/gikor-hy.webp',text:'Հայերեն ամբողջական տեքստ։ '.repeat(20)})
 const result=parseContent(prepareContent(form));assert.equal(result.data.id,form.key);assert.equal(result.data.title,form.title);for(const key of ['source','textLicense','coverCredit','coverSource','coverLicense','edition','rightsConfirmed'])assert.equal(Object.hasOwn(form.data,key),false);assert.equal(result.data.text,form.data.text.trim())
 for(const topic of ['psychology','science-fiction','fantasy','philosophy'])assert.equal(parseContent(prepareContent({...form,data:{...form.data,topic}})).data.topic,topic)
 for(const patch of [{topic:'missing'},{text:'English only '.repeat(20)},{cover:'javascript:alert(1)'}])assert.throws(()=>parseContent(prepareContent({...form,data:{...form.data,...patch}})))
})
