import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { kindSchema } from '../../../shared/cms'
import { db, databaseEnabled } from '../../utils/db'
export default defineEventHandler(async event=>{
  const query=getQuery(event)
  const parsed=kindSchema.safeParse(query.kind)
  if(!parsed.success) throw createError({statusCode:400,statusMessage:'Սխալ բաժին'})
  const kind=parsed.data
  const key=typeof query.key==='string'?query.key:undefined
  const subject=typeof query.subject==='string'?query.subject:undefined
  const armenian=kind==='PERSON'&&query.armenian==='true'
  const field=kind==='ARTICLE'?'subject':kind==='MONUMENT'||kind==='WORK'?'personId':kind==='GAME'?'mode':kind==='FACT'?'category':undefined
  const q=String(query.q||'').slice(0,160)
  const pagination=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(100).default(25)}).safeParse(query)
  if(!pagination.success)throw createError({statusCode:400,statusMessage:'Էջավորման սխալ տվյալներ'})
  const {page,limit}=pagination.data
  setHeader(event,'cache-control','private, no-store')
  if(!databaseEnabled()) {
    const {getLegacyContent}=await import('../../utils/legacyContent')
    const rows=getLegacyContent().filter(x=>x.kind===kind&&(!armenian||x.data.isArmenian===true)&&(!key||x.key===key)&&(!(kind==='ARTICLE'&&subject)||x.data.listed!==false)&&(!subject||!field||x.data[field]===subject)&&(!q||x.title.toLowerCase().includes(q.toLowerCase())))
    return {items:rows.slice((page-1)*limit,page*limit).map(x=>x.data),total:rows.length,page,limit,source:'files'}
  }
  // Once configured, the database is authoritative; an outage must not silently restore deleted content.
  const where:Prisma.ContentWhereInput={...(kind==='ARTICLE'&&subject?{NOT:{publishedData:{path:['listed'],equals:false}}}:{}),...(armenian?{AND:[{publishedData:{path:['isArmenian'],equals:true}}]}:{}),kind,publishedData:{not:Prisma.DbNull},...(key?{key}:{}),...(subject&&field?{AND:[{publishedData:{path:[field],equals:subject}}]}:{}),...(q?{publishedData:{path:[kind==='PERSON'?'name':'title'],string_contains:q}}:{})}
  const [rows,total]=await db.$transaction([db.content.findMany({where,orderBy:{key:'asc'},take:limit,skip:(page-1)*limit,select:{publishedData:true}}),db.content.count({where})])
  return {items:rows.map(x=>x.publishedData),total,page,limit,source:'database'}
})
