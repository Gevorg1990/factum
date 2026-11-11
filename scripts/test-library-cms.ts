import assert from 'node:assert/strict'
import {PrismaClient} from '@prisma/client'
import {randomBytes,createHash} from 'node:crypto'
import {newContent,prepareContent} from '../shared/cmsEditor'
const db=new PrismaClient(),base=process.env.CMS_TEST_URL||'http://localhost:3000',token=randomBytes(32).toString('hex'),key='book-integration-'+Date.now()
let userId='',contentId=''
async function request(path:string,method='GET',body?:unknown){const response=await fetch(base+path,{method,headers:{cookie:'factum-session='+token,...(body?{'content-type':'application/json',origin:base}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data}
try{
 const user=await db.user.create({data:{email:key+'@example.test',name:'Library test',passwordHash:'disabled-test-login',role:'ADMIN'}});userId=user.id
 await db.session.create({data:{userId,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+60000)}})
 const form=newContent('BOOK');form.key=key;form.title='Փորձնական հայերեն գիրք'
 Object.assign(form.data,{author:'Փորձարկում',description:'Փորձնական նկարագրություն',cover:'/images/library/gikor-hy.webp',text:'Հայերեն ամբողջական տեքստ։ '.repeat(30),source:'https://example.com/text',textLicense:'Փորձնական սեփական տեքստ',coverCredit:'Փորձարկում',coverSource:'https://example.com/cover',coverLicense:'Փորձարկում',edition:'Հայերեն',rightsConfirmed:true})
 const initial=await request('/api/library');assert.equal(new Set(initial.items.map((book:any)=>book.id)).size,initial.items.length)
 const draft=await request('/api/admin/content','POST',prepareContent(form));contentId=draft.id
 assert.ok(!(await request('/api/library')).items.some((book:any)=>book.id===key))
 const published=await request('/api/admin/content?id='+contentId,'PUT',{...prepareContent(form),version:draft.version,action:'publish'})
 const catalogue=await request('/api/library');assert.equal(catalogue.total,initial.total+1);const book=catalogue.items.find((book:any)=>book.id===key);assert.ok(book);assert.equal(book.text,undefined);assert.equal(book.language,'Հայերեն');assert.equal(book.shelf,8)
 const response=await fetch(base+book.file,{headers:{cookie:'factum-session='+token}});assert.equal(response.status,200);assert.equal(await response.text(),form.data.text.trim());assert.match(response.headers.get('cache-control')||'',/private/)
 await request('/api/admin/content?id='+contentId,'PUT',{...prepareContent(form),version:published.version,action:'archive'})
 assert.ok(!(await request('/api/library')).items.some((book:any)=>book.id===key))
 assert.equal((await fetch(base+book.file,{headers:{cookie:'factum-session='+token}})).status,404)
 console.log('PASS: draft → publish → metadata without full text → Armenian reader text → archive')
}finally{
 if(contentId){await db.auditLog.deleteMany({where:{target:contentId}});await db.content.deleteMany({where:{id:contentId}})}
 if(userId)await db.user.delete({where:{id:userId}})
 await db.$disconnect()
}
