import {PrismaClient,Prisma} from '@prisma/client'
import {geographyLegacyRows} from '../server/utils/geographyLegacy'
const db=new PrismaClient()
try{
 const rows=geographyLegacyRows(),deleted=await db.deletedContentKey.findMany({where:{kind:{in:['GEO_ENTRY','GEO_CATEGORY']}},select:{kind:true,key:true}}),excluded=new Set(deleted.map(row=>row.kind+':'+row.key))
 let inserted=0
 for(let offset=0;offset<rows.length;offset+=100){const batch=rows.slice(offset,offset+100).filter(row=>!excluded.has(row.kind+':'+row.key));const result=await db.content.createMany({skipDuplicates:true,data:batch.map(row=>({...row,data:row.data as Prisma.InputJsonValue,publishedData:row.data as Prisma.InputJsonValue,status:'PUBLISHED',publishedAt:new Date()}))});inserted+=result.count}
 for(const row of rows.filter(row=>row.kind==='GEO_ENTRY'&&row.data.area==='places')){const current=await db.content.findUnique({where:{kind_key:{kind:row.kind,key:row.key}},select:{id:true,version:true,status:true,data:true,publishedData:true}});if(current?.version===1&&current.status==='PUBLISHED'&&(current.data as any).globeSearch===undefined)await db.content.update({where:{id:current.id},data:{data:{...(current.data as any),globeSearch:row.data.globeSearch},publishedData:{...(current.publishedData as any),globeSearch:row.data.globeSearch}}})}
 console.log(`Geography CMS: ${inserted} new records; ${rows.length} reviewed entries/categories available. Existing edits, drafts, archives and deletion tombstones preserved.`)
}finally{await db.$disconnect()}
