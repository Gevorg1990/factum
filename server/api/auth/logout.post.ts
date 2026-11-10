import { tokenHash } from '../../utils/auth'
import { db } from '../../utils/db'
export default defineEventHandler(async event => {
  const token = getCookie(event, 'factum-session')
  if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } })
  deleteCookie(event, 'factum-session', { path: '/' })
  return { ok: true }
})
