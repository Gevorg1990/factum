import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {artCmsSchema} from '../../../shared/artCms'
import {galleryArtworks} from '../../../data/art/gallery'
import {db,databaseEnabled} from '../../utils/db'
import {galleryRoomForSlot} from '../../../utils/art/galleryLayout'

type SearchRow = {publishedData: unknown;slot:number|null}

export default defineEventHandler(async event=>{
  const {q,offset}=z.object({
    q:z.string().trim().max(100).default(''),
    offset:z.coerce.number().int().min(0).max(100000).default(0),
  }).parse(getQuery(event))
  setHeader(event,'cache-control','private, max-age=30')
  if(!q)return {items:[],hasMore:false}
  if(!databaseEnabled()){
    const term=q.toLocaleLowerCase()
    const matches=galleryArtworks.filter(item=>[item.title,item.originalTitle,item.creator].some(value=>value.toLocaleLowerCase().includes(term)))
    return {items:matches.slice(offset,offset+24),hasMore:matches.length>offset+24}
  }
  const pattern=`%${q.replace(/[\\%_]/g,'\\$&')}%`
  const rows=await db.$queryRaw<SearchRow[]>(Prisma.sql`
    SELECT "publishedData", ("publishedData"->>'gallerySlot')::integer AS slot
    FROM "Content"
    WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
      AND (
        "publishedData"->>'title' ILIKE ${pattern} ESCAPE chr(92)
        OR "publishedData"->>'originalTitle' ILIKE ${pattern} ESCAPE chr(92)
        OR "publishedData"->>'creator' ILIKE ${pattern} ESCAPE chr(92)
      )
    ORDER BY "createdAt", "key"
    LIMIT 25 OFFSET ${offset}
  `)
  return {items:rows.slice(0,24).map(row=>{const item=artCmsSchema.parse(row.publishedData);return row.slot===null?item:{...item,gallerySlot:row.slot,room:galleryRoomForSlot(row.slot)}}),hasMore:rows.length>24}
})
