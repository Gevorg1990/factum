import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../shared/password'
import { parseContent } from '../shared/cms'
test('password hashes use unique salts and reject wrong passwords',async()=>{
 const a=await hashPassword('correct password 123'),b=await hashPassword('correct password 123')
 assert.notEqual(a,b);assert.equal(await verifyPassword('correct password 123',a),true);assert.equal(await verifyPassword('wrong',a),false)
})
test('content validation rejects malformed game answers and preserves rich article fields',()=>{
 const base={kind:'GAME',key:'q',title:'Հարց',data:{mode:'million',difficulty:'easy',question:'?',answers:['a','b'],correct:9,explanation:'test'}}
 assert.throws(()=>parseContent(base))
 const article=parseContent({kind:'ARTICLE',key:'old-id',title:'Նոր վերնագիր',data:{id:'old-id',subject:'physics',title:'հին',answer:'a',detail:'d',example:'e',sections:[{title:'s',text:'t'}]}})
 assert.equal(article.data.title,'Նոր վերնագիր');assert.equal(article.data.example,'e')
})
