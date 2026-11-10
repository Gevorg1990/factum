import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../shared/password'
import { z } from 'zod'
const email=z.string().email().parse(process.env.ADMIN_EMAIL).toLowerCase()
const password=z.string().min(12).max(128).parse(process.env.ADMIN_PASSWORD)
const db=new PrismaClient()
try {
  const existing=await db.user.findUnique({where:{email}})
  if(existing) throw new Error('Օգտատերն արդեն գոյություն ունի․ այս հրամանը չի փոխում գործող հաշիվները։')
  await db.user.create({data:{email,name:process.env.ADMIN_NAME||'Ադմինիստրատոր',role:'ADMIN',passwordHash:await hashPassword(password)}})
  console.log('Ադմինիստրատորը ստեղծված է։')
} finally {await db.$disconnect()}
