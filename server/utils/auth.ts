import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import type { User } from '@prisma/client'
import { db } from './db'
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
export const publicUser = (user: { id: string; email: string; name: string; role: string }) => ({ id: user.id, email: user.email, name: user.name, role: user.role })
export async function currentUser(event: H3Event) {
  if('factumUser' in event.context)return event.context.factumUser as User|null
  const token = getCookie(event, 'factum-session')
  if (!token){event.context.factumUser=null;return null}
  const session = await db.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } })
  const user=!session||session.expiresAt<new Date()||session.user.disabled?null:session.user
  event.context.factumUser=user
  return user
}
export async function requireUser(event: H3Event, roles?: string[]) {
  const user = await currentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Մուտք գործեք համակարգ' })
  if (roles && !roles.includes(user.role)) throw createError({ statusCode: 403, statusMessage: 'Մուտքն արգելված է' })
  return user
}
export async function startSession(event: H3Event, userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
  await db.session.create({ data: { tokenHash: tokenHash(token), userId, expiresAt } })
  setCookie(event, 'factum-session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt })
}
export async function limitAuth(event: H3Event, identity: string) {
  const bucket = Math.floor(Date.now() / 900000)
  // Database-backed counters work across Vercel instances. Never trust a client-supplied user ID.
  for (const subject of [getRequestIP(event, {xForwardedFor:Boolean(process.env.VERCEL)}) || 'unknown', identity]) {
    const key = tokenHash(`${subject}:${bucket}`)
    const counter = await db.rateLimit.upsert({ where: { key }, create: { key, expiresAt: new Date((bucket + 1) * 900000) }, update: { count: { increment: 1 } } })
    if (counter.count > 20) throw createError({ statusCode: 429, statusMessage: 'Չափազանց շատ փորձեր․ փորձեք ավելի ուշ' })
  }
}
