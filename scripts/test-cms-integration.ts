import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../shared/password'
const db=new PrismaClient(),base=process.env.CMS_TEST_URL||'http://localhost:3011'
const suffix=Date.now().toString(),key='integration-'+suffix
const users:string[]=[]
let contentId='',mediaId='',authenticatedCookie:string|undefined
async function request(path:string,method='GET',body?:unknown,cookie?:string|null,origin=base){const effectiveCookie=cookie===null?undefined:cookie||authenticatedCookie;const res=await fetch(base+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(effectiveCookie?{cookie:effectiveCookie}:{}),...(method!=='GET'?{origin}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}}
try{
 for(const path of ['/','/facts','/people','/profile','/admin']){const res=await fetch(base+path,{redirect:'manual'});assert.equal(res.status,302,path);assert.ok(res.headers.get('location')?.startsWith('/login'),path);assert.match(res.headers.get('cache-control')||'',/private/)}
 for(const path of ['/api/content?kind=ARTICLE','/api/search?q=test','/api/games-round?mode=million'])assert.equal((await request(path)).status,401,path)
 assert.equal((await fetch(base+'/login')).status,200)
 const email=`cms-${suffix}@example.test`,password='integration-password-123'
 const registered=await request('/api/auth/register','POST',{name:'Փորձարկում',email,password,role:'ADMIN'})
 assert.equal(registered.status,200);assert.equal(registered.data.user.role,'USER');assert.ok(registered.cookie);users.push(registered.data.user.id)
 assert.equal((await request('/api/admin/content?kind=ARTICLE','GET',undefined,registered.cookie)).status,403)
 assert.equal((await request('/api/admin/content?kind=ARTICLE')).status,401)
 authenticatedCookie=registered.cookie
 assert.equal((await request('/api/account/bookmarks','POST',{key:'test'},registered.cookie,'https://evil.example')).status,403)
 assert.equal((await request('/api/account/bookmarks','POST',{key:25},registered.cookie)).status,400)
 assert.equal((await request('/api/content?kind=ARTICLE&page=-1')).status,400)
 assert.equal((await request('/api/account/progress','PUT',{key:'untrusted-storage-key',value:'x'},registered.cookie)).status,400)
 assert.equal((await request('/api/account/progress','PUT',{key:'factum-read',value:'["c1"]'},registered.cookie)).status,200)
 assert.equal((await request('/api/account/progress','GET',undefined,registered.cookie)).data.items[0].value,'["c1"]')
 assert.equal((await request('/api/account/bookmarks','POST',{key:'c1'},registered.cookie)).status,200)
 assert.deepEqual((await request('/api/account/bookmarks','GET',undefined,registered.cookie)).data.items,['c1'])
 const other=await request('/api/auth/register','POST',{name:'Երկրորդ',email:`other-${suffix}@example.test`,password});users.push(other.data.user.id)
 assert.deepEqual((await request('/api/account/bookmarks','GET',undefined,other.cookie)).data.items,[])
 await db.user.update({where:{id:registered.data.user.id},data:{role:'ADMIN'}})
 assert.equal((await request('/api/admin/overview')).status,200)
 const options=await request('/api/admin/options?kind=CATEGORY');assert.equal(options.status,200);assert.ok(options.data.items.length<=25);assert.ok(options.data.items.some((x:any)=>x.key==='physics'))
 assert.equal((await request('/api/admin/options?kind=FACT_CATEGORY')).data.items.length,20)
 assert.equal((await request('/api/admin/options?kind=CATEGORY','GET',undefined,other.cookie)).status,403)
 const media=await request('/api/admin/media','POST',{url:'/images/test.webp',alt:'Փորձնական նկար',credit:'test'},registered.cookie);assert.equal(media.status,200);mediaId=media.data.id
 assert.equal((await request('/api/admin/media?id='+mediaId,'PUT',{url:'/images/test.webp',alt:'Նոր նկարագրություն'},registered.cookie)).data.alt,'Նոր նկարագրություն')
 assert.equal((await request('/api/admin/media?id='+mediaId,'DELETE',undefined,other.cookie)).status,403)
 assert.equal((await request('/api/admin/media?id='+mediaId,'DELETE',undefined,registered.cookie)).status,200);mediaId=''
 const input={kind:'ARTICLE',key,title:'Փորձնական հոդված',data:{id:key,title:'Փորձնական հոդված',subject:'physics',answer:'a',detail:'d'},action:'save'}
 const created=await request('/api/admin/content','POST',input,registered.cookie);assert.equal(created.status,200);contentId=created.data.id
 assert.equal((await request(`/api/content?kind=ARTICLE&key=${key}`)).data.items.length,0)
 const draftList=await request('/api/admin/content?kind=ARTICLE&status=DRAFT&q='+encodeURIComponent(input.title));assert.ok(draftList.data.items.some((x:any)=>x.id===contentId));assert.ok(draftList.data.items.every((x:any)=>x.status==='DRAFT'))
 const invalid=await request('/api/admin/content','POST',{...input,key:key+'-bad',data:{...input.data,subject:42}});assert.equal(invalid.status,400);assert.ok(invalid.data.data.fields.some((x:any)=>x.path==='subject'))
 const published=await request(`/api/admin/content?id=${contentId}`,'PUT',{...input,version:created.data.version,action:'publish'},registered.cookie);assert.equal(published.status,200)
 assert.equal((await request(`/api/content?kind=ARTICLE&key=${key}`)).data.items[0].title,input.title)
 assert.ok((await request('/api/content?kind=ARTICLE&subject=physics')).data.items.some((x:any)=>x.id===key))
 assert.equal((await request(`/api/admin/content?id=${contentId}`,'PUT',{...input,version:created.data.version},registered.cookie)).status,409)
 await request(`/api/admin/content?id=${contentId}`,'PUT',{...input,title:'Նոր սևագիր',version:published.data.version},registered.cookie)
 assert.equal((await request(`/api/content?kind=ARTICLE&key=${key}`)).data.items[0].title,input.title)
 await request(`/api/admin/content?id=${contentId}`,'DELETE',undefined,registered.cookie)
 assert.equal((await request(`/api/content?kind=ARTICLE&key=${key}`)).data.items.length,0)
 const archived=await db.content.findUniqueOrThrow({where:{id:contentId}})
 const permanentPath=`/api/admin/content?id=${contentId}&permanent=true`
 assert.equal((await request(permanentPath,'DELETE',{title:archived.title,version:archived.version},other.cookie)).status,403)
 await db.user.update({where:{id:other.data.user.id},data:{role:'EDITOR'}})
 assert.equal((await request(permanentPath,'DELETE',{title:archived.title,version:archived.version},other.cookie)).status,403)
 await db.user.update({where:{id:other.data.user.id},data:{role:'USER'}})
 assert.equal((await request(permanentPath,'DELETE',{title:'wrong title',version:archived.version},registered.cookie)).status,400)
 assert.equal((await request(permanentPath,'DELETE',{title:archived.title,version:archived.version-1},registered.cookie)).status,409)
 assert.equal((await request(permanentPath,'DELETE',{title:archived.title,version:archived.version},registered.cookie,'https://evil.example')).status,403)
 assert.equal((await request(permanentPath,'DELETE',{title:archived.title,version:archived.version},registered.cookie)).status,200)
 assert.equal(await db.content.findUnique({where:{id:contentId}}),null)
 assert.ok(await db.deletedContentKey.findUnique({where:{kind_key:{kind:'ARTICLE',key}}}))
 assert.equal((await request(permanentPath,'DELETE',{title:archived.title,version:archived.version},registered.cookie)).status,404)
 assert.equal((await request(`/api/content?kind=ARTICLE&key=${key}`)).data.items.length,0)
 for(const path of ['/','/admin','/login','/profile','/people','/facts','/history','/subjects/physics','/articles/c1','/api/games-round?mode=million&difficulty=easy','/api/search?q='+encodeURIComponent('ատոմ')]){const response:Response=await fetch(base+path,{headers:{cookie:registered.cookie!}});assert.equal(response.status,200,path);assert.match(response.headers.get('cache-control')||'',/private/)}
 for(const mode of ['million','genius','logic']){const round=await request(`/api/games-round?mode=${mode}&difficulty=easy`);assert.equal(round.status,200);assert.ok(round.data.items.length>=10&&round.data.items.length<=30);assert.equal(new Set(round.data.items.map((x:any)=>x.question||x.statement)).size,round.data.items.length);if(mode==='million')for(const stage of ['first','middle','final'])assert.equal(round.data.items.filter((x:any)=>x.stage===stage).length,10)}
 const freshLogin=await request('/api/auth/login','POST',{email,password});assert.equal(freshLogin.status,200);assert.deepEqual((await request('/api/account/bookmarks','GET',undefined,freshLogin.cookie)).data.items,['c1']);authenticatedCookie=freshLogin.cookie
 assert.equal((await request('/api/auth/logout','POST',{},freshLogin.cookie)).status,200)
 assert.equal((await request('/api/account/bookmarks','GET',undefined,freshLogin.cookie)).status,401)
 console.log('PASS: mandatory login, private responses, roles, CSRF, database bookmarks across sessions, guided editor payloads, filters, options, media, publication, permanent deletion and games')
}finally{
 if(mediaId)await db.media.deleteMany({where:{id:mediaId}})
 if(contentId)await db.content.deleteMany({where:{id:contentId}})
 await db.deletedContentKey.deleteMany({where:{kind:'ARTICLE',key}})
 await db.auditLog.deleteMany({where:{userId:{in:users}}})
 await db.user.deleteMany({where:{id:{in:users}}})
 await db.$disconnect()
}
