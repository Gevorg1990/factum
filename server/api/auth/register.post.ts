import { z } from 'zod'
import { hashPassword } from '../../../shared/password'
import { db } from '../../utils/db'
import { limitAuth, publicUser, startSession } from '../../utils/auth'
export default defineEventHandler(async event => {
  const input = z.object({ email: z.string().email().max(254).transform(v => v.toLowerCase()), name: z.string().trim().min(2).max(100), password: z.string().min(12).max(128) }).safeParse(await readBody(event))
  if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Ստուգեք անունը, էլ․ հասցեն և գաղտնաբառը (առնվազն 12 նիշ)' })
  await limitAuth(event, input.data.email)
  const { password, ...data } = input.data
  try {
    const user = await db.user.create({ data: { ...data, passwordHash: await hashPassword(password) } })
    await startSession(event, user.id)
    return { user: publicUser(user) }
  } catch (error: any) {
    if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Այս էլ․ հասցեն արդեն գրանցված է' })
    throw error
  }
})
