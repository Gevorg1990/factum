import { PrismaClient } from '@prisma/client'
const globalDb = globalThis as unknown as { factumDb?: PrismaClient }
export const db = globalDb.factumDb ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalDb.factumDb = db
export const databaseEnabled = () => Boolean(process.env.DATABASE_URL)
