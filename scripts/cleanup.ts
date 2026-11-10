import {PrismaClient} from '@prisma/client'
const db=new PrismaClient()
try{const now=new Date();const result=await db.$transaction([db.session.deleteMany({where:{expiresAt:{lt:now}}}),db.rateLimit.deleteMany({where:{expiresAt:{lt:now}}})]);console.log(result.map(x=>x.count))}finally{await db.$disconnect()}
