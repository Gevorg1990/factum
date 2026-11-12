import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {db,databaseEnabled} from '../../utils/db'
import {geographyAreaSchema,type GeographyEntry,type GeographyCategory,type GeographyItem} from '../../../shared/geographyCms'
const input=z.object({area:geographyAreaSchema,page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(6),category:z.string().max(200).default(''),q:z.string().trim().max(160).default(''),id:z.string().max(200).default(''),globeSearch:z.enum(['true','false']).default('false')})
export default defineEventHandler(async event=>{
 const parsed=input.safeParse(getQuery(event));if(!parsed.success)throw createError({statusCode:400,statusMessage:'Սխալ աշխարհագրական բաժին կամ էջավորում'})
 const {area,page,limit,category,q,id,globeSearch}=parsed.data,areas=area==='facts'?['facts','records','places']:[area]
 setHeader(event,'Cache-Control','private, no-store')
 let categories:GeographyCategory[],items:GeographyEntry[],total:number
 if(!databaseEnabled()){
  const {geographyLegacyRows}=await import('../../utils/geographyLegacy'),rows=geographyLegacyRows()
  categories=rows.filter(row=>row.kind==='GEO_CATEGORY'&&areas.includes(row.data.area)).map(row=>row.data as GeographyCategory)
  const allowed=new Set(categories.map(item=>item.id)),term=q.toLocaleLowerCase('hy-AM')
  const all=rows.filter(row=>row.kind==='GEO_ENTRY'&&areas.includes(row.data.area)&&allowed.has(row.data.category)&&(!id||row.data.id===id)&&(globeSearch!=='true'||row.data.globeSearch===true)&&(!category||row.data.category===category)&&(area!=='facts'||row.data.area==='facts'||row.data.includeInFacts)&&(!term||(row.title+' '+row.data.detail).toLocaleLowerCase('hy-AM').includes(term))).map(row=>row.data as GeographyEntry).sort((a,b)=>a.sortOrder-b.sortOrder||a.id.localeCompare(b.id))
  total=all.length;items=all.slice((page-1)*limit,page*limit)
 }else{
  const rows=await db.content.findMany({where:{kind:'GEO_CATEGORY',publishedData:{not:Prisma.DbNull},OR:areas.map(value=>({publishedData:{path:['area'],equals:value}}))},take:500,select:{publishedData:true}})
  categories=rows.map(row=>row.publishedData as unknown as GeographyCategory)
  const allowed=categories.map(item=>item.id).filter(id=>!category||id===category)
  if(!allowed.length){items=[];total=0}else{
   const term='%'+q.replace(/[\\%_]/g,'\\$&')+'%'
   const where=Prisma.sql`kind='GEO_ENTRY' AND "publishedData" IS NOT NULL AND "publishedData" <> 'null'::jsonb AND "publishedData"->>'area' IN (${Prisma.join(areas)}) AND "publishedData"->>'category' IN (${Prisma.join(allowed)}) ${area==='facts'?Prisma.sql`AND ("publishedData"->>'area'='facts' OR "publishedData"->>'includeInFacts'='true')`:Prisma.empty} ${globeSearch==='true'?Prisma.sql`AND "publishedData"->>'globeSearch'='true'`:Prisma.empty} ${id?Prisma.sql`AND "publishedData"->>'id'=${id}`:Prisma.empty} ${q?Prisma.sql`AND (title ILIKE ${term} OR "publishedData"->>'detail' ILIKE ${term})`:Prisma.empty}`
   const [found,count]=await Promise.all([db.$queryRaw<{data:GeographyEntry}[]>(Prisma.sql`SELECT "publishedData" AS data FROM "Content" WHERE ${where} ORDER BY COALESCE(("publishedData"->>'sortOrder')::int,0),key LIMIT ${limit} OFFSET ${(page-1)*limit}`),db.$queryRaw<{total:bigint}[]>(Prisma.sql`SELECT count(*) AS total FROM "Content" WHERE ${where}`)])
   items=found.map(row=>row.data);total=Number(count[0]?.total||0)
  }
 }
 categories.sort((a,b)=>a.sortOrder-b.sortOrder||a.id.localeCompare(b.id))
 const names=new Map(categories.map(item=>[item.id,item.title]))
 const publicItems:GeographyItem[]=items.map(item=>({...item,question:item.title,kind:item.category,categoryName:names.get(item.category)||'',...(item.longitude!=null&&item.latitude!=null?{coordinates:[item.longitude,item.latitude] as [number,number]}:{})}))
 return {items:publicItems,categories:area==='facts'?categories.map(item=>({...item,title:(item.area==='records'?'Ռեկորդներ · ':item.area==='places'?'Վայրեր · ':'')+item.title})):categories,total,page,limit,hasMore:page*limit<total}
})
