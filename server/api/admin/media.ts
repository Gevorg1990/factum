import { z } from 'zod'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
const url=z.string().max(2000).refine(v=>/^\/(?!\/)[^\\]*$/.test(v)||/^https:\/\//.test(v))
export default defineEventHandler(async event=>{
  const actor=await requireUser(event,['ADMIN','EDITOR'])
  if(event.method==='GET'){const query=getQuery(event);const q=String(query.q||'').slice(0,160);const where=q?{OR:[{alt:{contains:q,mode:'insensitive' as const}},{credit:{contains:q,mode:'insensitive' as const}}]}:{};const page=Math.max(1,Math.min(100000,Number(query.page)||1));const [items,total]=await Promise.all([db.media.findMany({where,take:25,skip:(page-1)*25,orderBy:[{createdAt:'desc'},{id:'asc'}]}),db.media.count({where})]);return {items,total}}
  const id=String(getQuery(event).id||'')
  if(event.method==='DELETE'){if(actor.role!=='ADMIN')throw createError({statusCode:403});await db.media.delete({where:{id}});return {ok:true}}
  if(!['POST','PUT'].includes(event.method)) throw createError({statusCode:405})
  const data=await readValidatedBody(event,z.object({url,alt:z.string().trim().max(500).default(''),credit:z.string().max(500).default(''),license:z.string().max(500).default(''),sourceUrl:z.string().max(2000).default('')}).parse)
  return event.method==='PUT'?db.media.update({where:{id},data}):db.media.create({data})
})
