import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {artCmsSchema} from '../../../shared/artCms'
import {visibleGalleryArtworks} from '../../../data/art/gallery'
import {db,databaseEnabled} from '../../utils/db'
import {galleryPaintedPlacement,galleryRoomForSlot} from '../../../utils/art/galleryLayout'
import {publishedGalleryLayout} from '../../utils/galleryLayout'
import {escapeGallerySearch,publicArtworks} from '../../utils/gallerySearch'

type SearchRow = {publishedData: unknown;slot:number|null}

export default defineEventHandler(async event=>{
  const {q,artist,artwork,offset}=z.object({
    q:z.string().trim().max(100).default(''),
    artist:z.string().trim().max(5000).default(''),
    artwork:z.string().trim().max(200).default(''),
    offset:z.coerce.number().int().min(0).max(100000).default(0),
  }).parse(getQuery(event))
  setHeader(event,'cache-control','private, max-age=30')
  if(!q&&!artist&&!artwork)return {items:[],hasMore:false}
  const start=artwork?0:offset
  const limit=artwork?1:24
  if(!databaseEnabled()){
    const term=q.toLocaleLowerCase()
    const matches=visibleGalleryArtworks.filter(item=>{
      if(artwork)return item.id===artwork
      if(artist)return item.creator===artist
      return [item.title,item.originalTitle,item.creator].some(value=>value.toLocaleLowerCase().includes(term))
    })
    return {items:matches.slice(start,start+limit),hasMore:matches.length>start+limit}
  }
  const pattern=`%${escapeGallerySearch(q)}%`
  const match=artwork?Prisma.sql`key = ${artwork}`
    :artist?Prisma.sql`"publishedData"->>'creator' = ${artist}`
    :Prisma.sql`(
        "publishedData"->>'title' ILIKE ${pattern} ESCAPE chr(92)
        OR "publishedData"->>'originalTitle' ILIKE ${pattern} ESCAPE chr(92)
        OR "publishedData"->>'creator' ILIKE ${pattern} ESCAPE chr(92)
      )`
  const rows=await db.$queryRaw<SearchRow[]>(Prisma.sql`
    SELECT "publishedData", ("publishedData"->>'gallerySlot')::integer AS slot
    FROM "Content" WHERE ${publicArtworks} AND ${match}
    ORDER BY "createdAt", "key"
    LIMIT ${limit+1} OFFSET ${start}
  `)
  const page=rows.slice(0,limit)
  if(!page.length)return {items:[],hasMore:false}
  const {frontRoom,branches}=await publishedGalleryLayout()
  const openBranches=new Set(branches)
  return {items:page.map(row=>{const item=artCmsSchema.parse(row.publishedData);return row.slot===null?{...item,room:galleryPaintedPlacement(item.id,undefined,frontRoom,openBranches)?.room??item.room}:{...item,gallerySlot:row.slot,room:galleryRoomForSlot(row.slot,frontRoom,openBranches)}}),hasMore:rows.length>limit}
})
