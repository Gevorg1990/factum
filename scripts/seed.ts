import { PrismaClient, Prisma } from '@prisma/client'
import { legacyContent } from '../server/utils/legacyContent'
const db=new PrismaClient()
try {
  const records=legacyContent()
  let inserted=0
  // Empty updates are deliberate: running this again preserves every CMS edit and tombstone.
  for(const row of records) {
    await db.content.upsert({where:{kind_key:{kind:row.kind,key:row.key}},update:{},create:{...row,data:JSON.parse(JSON.stringify(row.data)) as Prisma.InputJsonValue,publishedData:JSON.parse(JSON.stringify(row.data)) as Prisma.InputJsonValue,status:'PUBLISHED',publishedAt:new Date()}})
    if(row.kind==='ARTICLE'){
      const current=await db.content.findUnique({where:{kind_key:{kind:row.kind,key:row.key}}})
      if(current?.version===1 && current.status==='PUBLISHED' && (current.data as any).listed===undefined) await db.content.update({where:{id:current.id},data:{data:JSON.parse(JSON.stringify(row.data)),publishedData:JSON.parse(JSON.stringify(row.data))}})
    }
    if(row.kind==='EVENT' && row.data.details){
      const current=await db.content.findUnique({where:{kind_key:{kind:row.kind,key:row.key}}})
      if(current?.version===1 && current.status==='PUBLISHED' && !(current.data as any).details) await db.content.update({where:{id:current.id},data:{data:JSON.parse(JSON.stringify(row.data)),publishedData:JSON.parse(JSON.stringify(row.data))}})
    }
    inserted++
  }
  const categories=await db.content.findMany({where:{kind:'CATEGORY'},select:{id:true,key:true}})
  for(const category of categories) await db.content.updateMany({where:{kind:'ARTICLE',categoryId:null,data:{path:['subject'],equals:category.key}},data:{categoryId:category.id}})
  console.log(`Ստուգված / ներմուծված գրառումներ՝ ${inserted}`)
} finally {await db.$disconnect()}
