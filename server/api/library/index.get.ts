import {z} from 'zod'
import {Prisma} from '@prisma/client'
import {libraryBooks,libraryTopics,type LibraryBook} from '../../../data/library/catalog'
import {db,databaseEnabled} from '../../utils/db'
const knownCoverAccents:Record<string,string>={cinderella:'#9b8a72','hansel-gretel':'#c95778','little-match-girl':'#8e8175'}
export default defineEventHandler(async event=>{
 const query=getQuery(event)
 const parsed=z.coerce.number().int().min(1).max(100000).safeParse(query.page??1)
 if(!parsed.success)throw createError({statusCode:400,statusMessage:'Էջավորման սխալ տվյալներ'})
 const selectedId=query.book===undefined?undefined:z.string().min(1).max(160).safeParse(query.book)
 if(selectedId&&!selectedId.success)throw createError({statusCode:400,statusMessage:'Գրքի սխալ հասցե'})
 const page=parsed.data,limit=48
 setHeader(event,'Cache-Control','private, no-store')
 if(!databaseEnabled()){const items=selectedId?libraryBooks.filter(book=>book.id===selectedId.data):libraryBooks.slice((page-1)*limit,page*limit);return {items,total:selectedId?items.length:libraryBooks.length,page,hasMore:false}}
 // Select metadata in SQL: never transfer full book text into catalogue responses.
 const rows=await db.$queryRaw<{key:string;metadata:Record<string,unknown>}[]>(selectedId?Prisma.sql`SELECT key, "publishedData" - 'text' AS metadata FROM "Content" WHERE kind = 'BOOK' AND key = ${selectedId.data} AND "publishedData" IS NOT NULL AND "publishedData" <> 'null'::jsonb LIMIT 1`:Prisma.sql`SELECT key, "publishedData" - 'text' AS metadata FROM "Content" WHERE kind = 'BOOK' AND "publishedData" IS NOT NULL AND "publishedData" <> 'null'::jsonb ORDER BY key LIMIT ${limit} OFFSET ${(page-1)*limit}`)
 const total=selectedId?rows.length:await db.content.count({where:{kind:'BOOK',publishedData:{not:Prisma.DbNull}}})
 const custom=rows.map(({key,metadata:d})=>({...d,id:key,language:'Հայերեն',originalTitle:d.title,shelf:libraryTopics.find(topic=>topic.id===d.topic)?.shelf??0,color:typeof d.color==='string'&&/^#[0-9a-f]{6}$/i.test(d.color)?d.color:knownCoverAccents[key]||libraryBooks.find(book=>book.id===key)?.color||libraryTopics.find(topic=>topic.id===d.topic)?.color||'#426078',file:`/api/library/${encodeURIComponent(key)}/text`}) as LibraryBook)
 // With a configured database, CMS is authoritative, including archived/deleted books.
 return {items:custom,total,page,hasMore:page*limit<total}
})
