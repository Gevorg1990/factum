import { registrationSchema } from '../../../shared/registration'
import { hashPassword } from '../../../shared/password'
import { db } from '../../utils/db'
import { limitAuth, publicUser, startSession } from '../../utils/auth'
export default defineEventHandler(async event => {
  const input = registrationSchema.safeParse(await readBody(event))
  if (!input.success) throw createError({ statusCode: 400, statusMessage: input.error.issues[0]?.message || 'Ստուգեք գրանցման տվյալները' })
  await limitAuth(event, input.data.email)
  const { password, passwordConfirmation: _confirmation, ...data } = input.data
  try {
    const user = await db.user.create({ data: { ...data, passwordHash: await hashPassword(password) } })
    await startSession(event, user.id)
    return { user: publicUser(user) }
  } catch (error: any) {
    if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Այս էլ․ հասցեն արդեն գրանցված է' })
    throw error
  }
})
