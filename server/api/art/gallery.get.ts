import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {artCmsSchema} from '../../../shared/artCms'
import {galleryArtworks} from '../../../data/art/gallery'
import {db,databaseEnabled} from '../../utils/db'

const coreIds=galleryArtworks.map(item=>item.id)
const coreOrder=new Map(coreIds.map((id,index)=>[id,index]))

export default defineEventHandler(async event=>{
  const query=z.object({offset:z.coerce.number().int().min(0).max(100000).default(0),limit:z.coerce.number().int().min(1).max(24).default(24)}).parse(getQuery(event))
  setHeader(event,'cache-control','private, max-age=30')
  if(!databaseEnabled())return {core:[],items:[],total:0,offset:query.offset}
  const published:Prisma.ContentWhereInput={kind:'ARTWORK',status:'PUBLISHED',publishedData:{not:Prisma.DbNull}}
  const [coreRows,rows,total]=await db.$transaction([
    db.content.findMany({where:{...published,key:{in:coreIds}},select:{key:true,publishedData:true}}),
    db.content.findMany({where:{...published,key:{notIn:coreIds}},orderBy:[{createdAt:'asc'},{key:'asc'}],skip:query.offset,take:query.limit,select:{publishedData:true}}),
    db.content.count({where:{...published,key:{notIn:coreIds}}}),
  ])
  const core=coreRows.sort((a,b)=>(coreOrder.get(a.key)??0)-(coreOrder.get(b.key)??0)).map(row=>artCmsSchema.parse(row.publishedData))
  return {core,items:rows.map((row,index)=>({...artCmsSchema.parse(row.publishedData),room:6+Math.floor((query.offset+index)/6)})),total,offset:query.offset}
})
