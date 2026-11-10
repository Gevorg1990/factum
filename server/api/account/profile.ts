import { z } from 'zod'
import { db } from '../../utils/db'
import { publicUser, requireUser } from '../../utils/auth'
import { hashPassword, verifyPassword } from '../../../shared/password'
export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if(event.method === 'GET') return {user:publicUser(user)}
  if(event.method !== 'PUT') throw createError({statusCode:405})
  const input = await readValidatedBody(event,z.object({name:z.string().trim().min(2).max(100),currentPassword:z.string().max(128).optional(),password:z.string().min(12).max(128).optional()}).parse)
  if(input.password && (!input.currentPassword || !await verifyPassword(input.currentPassword,user.passwordHash))) throw createError({statusCode:400,statusMessage:'Ընթացիկ գաղտնաբառը սխալ է'})
  return db.$transaction(async tx=>{
    const updated = await tx.user.update({where:{id:user.id},data:{name:input.name,...(input.password?{passwordHash:await hashPassword(input.password)}:{})}})
    if(input.password) await tx.session.deleteMany({where:{userId:user.id}})
    return {user:publicUser(updated),reauthenticate:Boolean(input.password)}
  })
})
