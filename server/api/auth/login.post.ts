import { z } from 'zod'
import { hashPassword, verifyPassword } from '../../../shared/password'
import { db } from '../../utils/db'
import { limitAuth, publicUser, startSession } from '../../utils/auth'
let dummy: Promise<string> | undefined
export default defineEventHandler(async event => {
  const input = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) }).safeParse(await readBody(event))
  if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Ստուգեք մուտքագրված տվյալները' })
  await limitAuth(event, input.data.email)
  const user = await db.user.findUnique({ where: { email: input.data.email } })
  dummy ??= hashPassword('factum-dummy-password')
  const valid = await verifyPassword(input.data.password, user?.passwordHash || await dummy)
  if (!valid || !user || user.disabled) throw createError({ statusCode: 401, statusMessage: 'Սխալ էլ․ հասցե կամ գաղտնաբառ' })
  const previous = getCookie(event, 'factum-session')
  if (previous) { const { tokenHash } = await import('../../utils/auth'); await db.session.deleteMany({ where: { tokenHash: tokenHash(previous) } }) }
  await startSession(event, user.id)
  return { user: publicUser(user) }
})
