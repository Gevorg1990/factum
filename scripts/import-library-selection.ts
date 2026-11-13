import {readFile} from 'node:fs/promises'
import {randomBytes,createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {PrismaClient} from '@prisma/client'
import {parseContent} from '../shared/cms'
const db=new PrismaClient(),base='http://localhost:3000',token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex')
const records=JSON.parse(await readFile(new URL('./library-import/selection.json',import.meta.url),'utf8'))
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(process.env.DATABASE_URL||'http://unconfigured').hostname))throw new Error('This importer is restricted to the local preview database.')
async function request(path:string,method='GET',body?:unknown){const response=await fetch(base+path,{method,headers:{cookie:'factum-session='+token,...(body?{'content-type':'application/json',origin:base}:{})},body:body?JSON.stringify(body):undefined});const value=await response.json();if(!response.ok)throw new Error(`${response.status}: ${JSON.stringify(value)}`);return value}
try{
 const admin=await db.user.findFirstOrThrow({where:{role:'ADMIN',disabled:false},select:{id:true}})
 await db.session.create({data:{userId:admin.id,tokenHash:hash,expiresAt:new Date(Date.now()+300000)}})
 for(const record of records){
  const input=parseContent(record),existing=await db.content.findUnique({where:{kind_key:{kind:'BOOK',key:input.key}},select:{id:true,version:true,data:true,status:true}})
  if(existing){assert.deepEqual(existing.data,input.data,`Existing book ${input.key} differs; inspect it in CMS before changing.`);assert.equal(existing.status,'PUBLISHED')}
  else await request('/api/admin/content','POST',input)
  console.log(`CMS published: ${input.title}`)
 }
 const catalog=await request('/api/library')
 for(const record of records){
  const book=catalog.items.find((book:any)=>book.id===record.key);assert.ok(book);assert.equal(book.text,undefined);assert.equal(book.language,'Հայերեն')
  const text=await fetch(base+book.file,{headers:{cookie:'factum-session='+token}});assert.equal(text.status,200);assert.equal(await text.text(),record.data.text)
  const cover=await fetch(base+book.cover);assert.equal(cover.status,200);assert.match(cover.headers.get('content-type')||'',/image\/webp/)
 }
 console.log(`Verified ${records.length} CMS books, Armenian reader texts and WebP covers; library total ${catalog.total}.`)
}finally{await db.session.deleteMany({where:{tokenHash:hash}});await db.$disconnect()}
