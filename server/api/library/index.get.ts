import {z} from 'zod'
import {Prisma} from '@prisma/client'
import {libraryBooks,libraryTopics,type LibraryBook} from '../../../data/library/catalog'
import {db,databaseEnabled} from '../../utils/db'
export default defineEventHandler(async event=>{
 const parsed=z.coerce.number().int().min(1).max(100000).safeParse(getQuery(event).page??1)
 if(!parsed.success)throw createError({statusCode:400,statusMessage:'Էջավորման սխալ տվյալներ'})
 const page=parsed.data,limit=48
 setHeader(event,'Cache-Control','private, no-store')
 if(!databaseEnabled())return {items:libraryBooks.slice((page-1)*limit,page*limit),total:libraryBooks.length,page,hasMore:false}
 // Select metadata in SQL: never transfer full book text into catalogue responses.
 const rows=await db.$queryRaw<{key:string;metadata:Record<string,unknown>}[]>(Prisma.sql`SELECT key, "publishedData" - 'text' AS metadata FROM "Content" WHERE kind = 'BOOK' AND "publishedData" IS NOT NULL AND "publishedData" <> 'null'::jsonb ORDER BY key LIMIT ${limit} OFFSET ${(page-1)*limit}`)
 const total=await db.content.count({where:{kind:'BOOK',publishedData:{not:Prisma.DbNull}}})
 const custom=rows.map(({key,metadata:d})=>({...d,id:key,language:'Հայերեն',originalTitle:d.title,shelf:libraryTopics.find(topic=>topic.id===d.topic)?.shelf??0,color:'#426078',file:`/api/library/${encodeURIComponent(key)}/text`}) as LibraryBook)
 // With a configured database, CMS is authoritative, including archived/deleted books.
 return {items:custom,total,page,hasMore:page*limit<total}
})
