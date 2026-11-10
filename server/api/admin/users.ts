import { z } from 'zod'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event=>{
  const actor = await requireUser(event,['ADMIN'])
  if(event.method === 'GET') {
    const page=Math.max(1,Number(getQuery(event).page)||1)
    return {items:await db.user.findMany({take:25,skip:(page-1)*25,orderBy:{createdAt:'desc'},select:{id:true,name:true,email:true,role:true,disabled:true}})}
  }
  if(event.method !== 'PUT') throw createError({statusCode:405})
  const input=await readValidatedBody(event,z.object({id:z.string(),role:z.enum(['ADMIN','EDITOR','USER']),disabled:z.boolean()}).parse)
  if(input.id===actor.id) throw createError({statusCode:400,statusMessage:'Սեփական իրավունքները փոխել չի թույլատրվում'})
  await db.$transaction([db.user.update({where:{id:input.id},data:{role:input.role,disabled:input.disabled}}),db.session.deleteMany({where:{userId:input.id}}),db.auditLog.create({data:{userId:actor.id,action:'user-update',target:input.id}})])
  return {ok:true}
})
