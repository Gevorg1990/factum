import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {artCmsSchema} from '../../../shared/artCms'
import {db,databaseEnabled} from '../../utils/db'

export default defineEventHandler(async event=>{
  const query=z.object({offset:z.coerce.number().int().min(0).max(100000).default(0),limit:z.coerce.number().int().min(1).max(24).default(24)}).parse(getQuery(event))
  setHeader(event,'cache-control','private, max-age=30')
  if(!databaseEnabled())return {items:[],total:0,offset:query.offset}
  const where:Prisma.ContentWhereInput={kind:'ARTWORK',status:'PUBLISHED',publishedData:{not:Prisma.DbNull}}
  const [rows,total]=await db.$transaction([
    db.content.findMany({where,orderBy:[{createdAt:'asc'},{key:'asc'}],skip:query.offset,take:query.limit,select:{publishedData:true}}),
    db.content.count({where}),
  ])
  return {items:rows.map((row,index)=>({...artCmsSchema.parse(row.publishedData),room:6+Math.floor((query.offset+index)/6)})),total,offset:query.offset}
})
