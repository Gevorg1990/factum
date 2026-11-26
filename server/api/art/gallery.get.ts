import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {artCmsSchema} from '../../../shared/artCms'
import {galleryArtworks,visibleGalleryArtworks,type GalleryArtwork} from '../../../data/art/gallery'
import {db,databaseEnabled} from '../../utils/db'
import {firstGalleryBranchSlot,firstGalleryFrontSlot,galleryPaintedPlacement,galleryRoomForSlot,lastGalleryBranchSlot} from '../../../utils/art/galleryLayout'
import {publishedGalleryLayout} from '../../utils/galleryLayout'

const coreIds=galleryArtworks.map(item=>item.id)
const coreOrder=new Map(coreIds.map((id,index)=>[id,index]))
const coreRooms=new Map(galleryArtworks.map(item=>[item.id,item.room]))
const visibleCoreIds=visibleGalleryArtworks.map(item=>item.id)
type ArtworkRow={publishedData:unknown;slot:number|null}

export default defineEventHandler(async event=>{
  const query=z.object({offset:z.coerce.number().int().min(0).max(100000).default(0),limit:z.coerce.number().int().min(1).max(24).default(24)}).parse(getQuery(event))
  setHeader(event,'cache-control','private, max-age=30')
  if(!databaseEnabled())return {core:visibleGalleryArtworks,items:[],total:0,offset:query.offset,branches:[],frontRoom:1}
  const published:Prisma.ContentWhereInput={kind:'ARTWORK',status:'PUBLISHED',publishedData:{not:Prisma.DbNull}}
  const [coreRows,rows,total,layout]=await Promise.all([
    db.content.findMany({where:{...published,key:{in:visibleCoreIds}},select:{key:true,publishedData:true}}),
    db.$queryRaw<ArtworkRow[]>(Prisma.sql`
      SELECT "publishedData", ("publishedData"->>'gallerySlot')::integer AS slot
      FROM "Content" WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
        AND key NOT IN (${Prisma.join(coreIds)})
      ORDER BY CASE WHEN ("publishedData"->>'gallerySlot')::integer BETWEEN ${firstGalleryBranchSlot} AND ${lastGalleryBranchSlot} THEN 1000
        WHEN ("publishedData"->>'gallerySlot')::integer >= ${firstGalleryFrontSlot} THEN 0
        WHEN ("publishedData"->>'gallerySlot')::integer >= 600
        THEN 6+(("publishedData"->>'gallerySlot')::integer-600)/4
        ELSE 6+("publishedData"->>'gallerySlot')::integer/6 END NULLS LAST,
        slot NULLS LAST, "createdAt", key LIMIT ${query.limit} OFFSET ${query.offset}
    `),
    db.content.count({where:{...published,key:{notIn:coreIds}}}),
    publishedGalleryLayout(),
  ])
  const {frontRoom,branches}=layout
  const openBranches=new Set(branches)
  const core:GalleryArtwork[]=coreRows.sort((a,b)=>(coreOrder.get(a.key)??0)-(coreOrder.get(b.key)??0)).map(row=>{const item=artCmsSchema.parse(row.publishedData);return {...item,room:galleryPaintedPlacement(row.key,item.gallerySlot,frontRoom,openBranches)?.room??item.room??coreRooms.get(row.key)??0}})
  return {core,items:rows.map((row,index)=>{const slot=row.slot??query.offset+index;return {...artCmsSchema.parse(row.publishedData),gallerySlot:slot,room:galleryRoomForSlot(slot,frontRoom,openBranches)}}),total,offset:query.offset,branches,frontRoom}
})
