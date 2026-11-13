import {z} from 'zod'
import {Prisma} from '@prisma/client'
import {libraryBooks,libraryTopics,type LibraryBook} from '../../../data/library/catalog'
import {db,databaseEnabled} from '../../utils/db'
export default defineEventHandler(async event=>{
 const parsed=z.object({keys:z.array(z.string().min(1).max(200)).max(24)}).safeParse(await readBody(event))
 if(!parsed.success)throw createError({statusCode:400,statusMessage:'Գրքերի ընտրությունը սխալ է'})
 const {keys}=parsed.data
 setHeader(event,'Cache-Control','private, no-store')
 if(!keys.length)return {items:[]}
 if(!databaseEnabled())return {items:libraryBooks.filter(book=>keys.includes(book.id))}
 const rows=await db.$queryRaw<{key:string;metadata:Record<string,unknown>}[]>(Prisma.sql`SELECT key, "publishedData" - 'text' AS metadata FROM "Content" WHERE kind = 'BOOK' AND key IN (${Prisma.join(keys)}) AND "publishedData" IS NOT NULL AND "publishedData" <> 'null'::jsonb`)
 return {items:rows.map(({key,metadata:d})=>({...d,id:key,language:'Հայերեն',originalTitle:d.title,shelf:libraryTopics.find(topic=>topic.id===d.topic)?.shelf??0,color:'#426078',file:`/api/library/${encodeURIComponent(key)}/text`}) as LibraryBook)}
})
