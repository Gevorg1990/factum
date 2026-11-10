import { PrismaClient, Prisma } from '@prisma/client'
import { legacyContent } from '../server/utils/legacyContent'
const db=new PrismaClient()
try {
  const records=legacyContent()
  // Batch inserts avoid thousands of network round trips. Existing CMS edits and
  // archived records are preserved by the unique (kind, key) constraint.
  const existing=await db.content.findMany({select:{id:true,kind:true,key:true,version:true,status:true,data:true}})
  const byKey=new Map(existing.map(row=>[`${row.kind}:${row.key}`,row]))
  for(let offset=0;offset<records.length;offset+=100){
    await db.content.createMany({skipDuplicates:true,data:records.slice(offset,offset+100).map(row=>({...row,data:JSON.parse(JSON.stringify(row.data)) as Prisma.InputJsonValue,publishedData:JSON.parse(JSON.stringify(row.data)) as Prisma.InputJsonValue,status:'PUBLISHED' as const,publishedAt:new Date()}))})
    console.log(`Ներմուծում՝ ${Math.min(offset+100,records.length)} / ${records.length}`)
  }
  for(const row of records) {
    const current=byKey.get(`${row.kind}:${row.key}`)
    if(row.kind==='ARTICLE'){
      if(current?.version===1 && current.status==='PUBLISHED' && (current.data as any).listed===undefined) await db.content.update({where:{id:current.id},data:{data:JSON.parse(JSON.stringify(row.data)),publishedData:JSON.parse(JSON.stringify(row.data))}})
    }
    if(row.kind==='EVENT' && row.data.details){
      if(current?.version===1 && current.status==='PUBLISHED' && !(current.data as any).details) await db.content.update({where:{id:current.id},data:{data:JSON.parse(JSON.stringify(row.data)),publishedData:JSON.parse(JSON.stringify(row.data))}})
    }
  }
  const categories=await db.content.findMany({where:{kind:'CATEGORY'},select:{id:true,key:true}})
  for(const category of categories) await db.content.updateMany({where:{kind:'ARTICLE',categoryId:null,data:{path:['subject'],equals:category.key}},data:{categoryId:category.id}})
  console.log(`Ստուգված / ներմուծված գրառումներ՝ ${records.length}`)
} finally {await db.$disconnect()}
