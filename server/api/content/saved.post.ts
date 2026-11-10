import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db, databaseEnabled } from '../../utils/db'
export default defineEventHandler(async event=>{
  const {keys}=await readValidatedBody(event,z.object({keys:z.array(z.string().max(250)).max(100)}).parse)
  if(!databaseEnabled())return {items:[]}
  const lookup=keys.flatMap(key=>[key,key.replace(/^person-/,'').replace(/^history-/,'')])
  const rows=await db.content.findMany({where:{key:{in:lookup},publishedData:{not:Prisma.DbNull}},select:{kind:true,key:true,publishedData:true},take:100})
  return {items:rows.map(row=>{const data=row.publishedData as any;return {id:row.kind==='PERSON'?'person-'+row.key:row.kind==='EVENT'?'history-'+row.key:row.key,title:data.title||data.name,to:row.kind==='PERSON'?'/people/'+row.key:row.kind==='FACT'?'/facts?fact='+encodeURIComponent(row.key):row.kind==='EVENT'?'/history?event='+encodeURIComponent(row.key):'/articles/'+row.key,kind:row.kind==='PERSON'?'Նշանավոր մարդ':row.kind==='FACT'?'Հետաքրքիր փաստ':'Հոդված',category:row.kind==='PERSON'?'people':row.kind==='FACT'?'facts':row.kind==='EVENT'?'history':'encyclopedia'}})}
})
