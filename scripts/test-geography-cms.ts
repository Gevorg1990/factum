import {PrismaClient} from '@prisma/client'
import {randomBytes,createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const db=new PrismaClient(),base=process.env.TEST_BASE_URL||'http://localhost:3000',suffix=randomBytes(5).toString('hex'),prefix='geo-test-'+suffix,token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex')
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL||'http://unconfigured').hostname))throw new Error('This test only operates on the local database')
async function request(path:string,method='GET',body?:unknown,ok=true){const r=await fetch(base+path,{method,headers:{cookie:'factum-session='+token,origin:base,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const value=await r.json();if(ok)assert.ok(r.ok,`${method} ${path}: ${r.status} ${JSON.stringify(value).slice(0,400)}`);return{status:r.status,value}}
const seed=(kind:string,key:string,title:string,data:any,action='publish')=>({kind,key,title,data:{id:key,title,...data},action})
try{
 const admin=await db.user.findFirstOrThrow({where:{role:'ADMIN',disabled:false},select:{id:true}});await db.session.create({data:{userId:admin.id,tokenHash:hash,expiresAt:new Date(Date.now()+600000)}})
 const baseline=(await request('/api/geography/editorial?area=records&limit=6')).value;assert.equal(baseline.items.length,6);assert.ok(baseline.total>=31);assert.equal(baseline.hasMore,true)
 const catKey=prefix+'-category',entryKey=prefix+'-entry',title='Փորձնական աշխարհագրական հարց '+suffix
 const category=(await request('/api/admin/content','POST',seed('GEO_CATEGORY',catKey,'Փորձնական թեմա',{area:'world-facts',sortOrder:90000}))).value
 let entry=(await request('/api/admin/content','POST',seed('GEO_ENTRY',entryKey,title,{area:'world-facts',category:catKey,answer:'Կարճ պատասխան',detail:'Հաստատված փորձնական բացատրություն',source:{name:'Փորձնական աղբյուր',url:'https://example.com/source'}},'save'))).value
 assert.equal((await request('/api/geography/editorial?area=world-facts&q='+suffix)).value.total,0,'Draft must not leak')
 entry=(await request('/api/admin/content?id='+entry.id,'PUT',{...seed('GEO_ENTRY',entryKey,title,entry.data),version:entry.version})).value
 let live=(await request('/api/geography/editorial?area=world-facts&q='+suffix)).value;assert.equal(live.total,1);assert.equal(live.items[0].answer,'Կարճ պատասխան')
 const original=entry.data.detail
 entry=(await request('/api/admin/content?id='+entry.id,'PUT',{...seed('GEO_ENTRY',entryKey,title,{...entry.data,detail:'Չհրապարակված նոր տեքստ'},'save'),version:entry.version})).value
 live=(await request('/api/geography/editorial?area=world-facts&q='+suffix)).value;assert.equal(live.items[0].detail,original,'Saving a draft must preserve the public snapshot')
 const invalid=await request('/api/admin/content','POST',seed('GEO_ENTRY',prefix+'-wrong',title,{...entry.data,area:'records',measure:'10 մ',location:'Հայաստան'}),false);assert.equal(invalid.status,400,'Reject a category from a different area')
 const options=(await request('/api/admin/options?kind=GEO_CATEGORY&area=world-facts')).value;assert.ok(options.items.every((item:any)=>!item.key.startsWith('records-')))
 await request('/api/admin/content?id='+category.id,'DELETE');assert.equal((await request('/api/geography/editorial?area=world-facts&q='+suffix)).value.total,0,'Archived category must hide its public entries')
 await request('/api/admin/content?id='+entry.id,'DELETE');assert.equal((await request('/api/geography/editorial?area=world-facts&q='+suffix)).value.total,0)
 console.log('PASS: paginated geography API, CMS create/publish, draft isolation, category filtering, invalid category rejection, archive visibility and public snapshots.')
}finally{
 await db.auditLog.deleteMany({where:{target:{in:(await db.content.findMany({where:{key:{startsWith:prefix}},select:{id:true}})).map(row=>row.id)}}});await db.content.deleteMany({where:{key:{startsWith:prefix}}});await db.session.deleteMany({where:{tokenHash:hash}});await db.$disconnect()
}
