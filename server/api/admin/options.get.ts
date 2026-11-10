import { z } from 'zod'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const input=z.object({kind:z.enum(['CATEGORY','AUTHOR','PERSON','FACT_CATEGORY']),q:z.string().max(160).default(''),page:z.coerce.number().int().min(1).max(100000).default(1),selected:z.string().max(250).default('')}).safeParse(getQuery(event))
  if(!input.success)throw createError({statusCode:400,statusMessage:'Սխալ ընտրացանկ'})
  const {kind,q,page,selected}=input.data
  if(kind==='FACT_CATEGORY'){const {factCategories}=await import('../../../data/facts');const all=factCategories.map(x=>({id:x.id,key:x.id,title:x.name}));const filtered=all.filter(x=>!q||x.title.includes(q));return {items:filtered.slice((page-1)*25,page*25),total:filtered.length,current:all.find(x=>x.key===selected)||null}}
  const where={kind,...(q?{title:{contains:q,mode:'insensitive' as const}}:{})}
  const [items,total,current]=await Promise.all([db.content.findMany({where,take:25,skip:(page-1)*25,orderBy:[{title:'asc'},{id:'asc'}],select:{id:true,key:true,title:true}}),db.content.count({where}),selected?db.content.findFirst({where:{kind,OR:[{id:selected},{key:selected}]},select:{id:true,key:true,title:true}}):null])
  return {items,total,current}
})
