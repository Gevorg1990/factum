import {Prisma} from '@prisma/client'
import {db,databaseEnabled} from '../../../utils/db'
export default defineEventHandler(async event=>{
 if(!databaseEnabled())throw createError({statusCode:404})
 const record=await db.content.findFirst({where:{kind:'BOOK',key:getRouterParam(event,'id'),publishedData:{not:Prisma.DbNull}},select:{publishedData:true}})
 const data=record?.publishedData as {text?:string}|undefined
 if(!data?.text)throw createError({statusCode:404,statusMessage:'Գիրքը հասանելի չէ'})
 setHeader(event,'Content-Type','text/plain; charset=utf-8');setHeader(event,'Cache-Control','private, no-store');setHeader(event,'X-Content-Type-Options','nosniff')
 return data.text
})
