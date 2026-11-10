import { z } from 'zod'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event=>{
  const user = await requireUser(event)
  if(event.method === 'GET') return {items:await db.progress.findMany({where:{userId:user.id}})}
  if(event.method !== 'PUT') throw createError({statusCode:405})
  const {key,value} = await readValidatedBody(event,z.object({key:z.string().regex(/^factum-/).max(200),value:z.unknown().refine(v=>JSON.stringify(v).length<100000)}).parse)
  await db.progress.upsert({where:{userId_key:{userId:user.id,key}},create:{userId:user.id,key,value:value as any},update:{value:value as any}})
  return {ok:true}
})
