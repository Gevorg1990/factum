import { z } from 'zod'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if(event.method === 'GET') return {items:(await db.bookmark.findMany({where:{userId:user.id},orderBy:{createdAt:'asc'}})).map(x=>x.key)}
  const input = await readValidatedBody(event,z.object({ key:z.string().min(1).max(250) }).parse)
  if(event.method === 'POST') await db.bookmark.upsert({where:{userId_key:{userId:user.id,key:input.key}},create:{userId:user.id,key:input.key},update:{}})
  else if(event.method === 'DELETE') await db.bookmark.deleteMany({where:{userId:user.id,key:input.key}})
  else throw createError({statusCode:405})
  return {ok:true}
})
