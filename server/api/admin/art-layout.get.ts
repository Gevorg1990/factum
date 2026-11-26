import {db} from '../../utils/db'
import {requireUser} from '../../utils/auth'
import {Prisma} from '@prisma/client'
import {z} from 'zod'
import {galleryDefaultSlot,galleryIsSculpture,galleryWallPercent} from '../../../utils/art/galleryLayout'

type GalleryRow={key:string;slot:number|null}

export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const query=getQuery(event)
  if(query.keys!==undefined){
    const keys=z.array(z.string().min(1).max(200)).min(1).max(4).parse(Array.isArray(query.keys)?query.keys:[query.keys])
    const rows=await db.$queryRaw<{key:string;title:string;image:string;wallPercent:number|null;displaySize?:'regular'|'medium'|'large'}[]>(Prisma.sql`
      SELECT key, "publishedData"->>'title' AS title, "publishedData"->>'image' AS image,
        ("publishedData"->>'wallPercent')::integer AS "wallPercent", "publishedData"->>'displaySize' AS "displaySize"
      FROM "Content" WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
        AND key IN (${Prisma.join(keys)})
    `)
    return {artworks:rows.map(row=>({key:row.key,title:row.title,image:row.image,percent:galleryWallPercent({id:row.key,wallPercent:row.wallPercent??undefined,displaySize:row.displaySize})}))}
  }
  const rows=await db.$queryRaw<GalleryRow[]>`
    SELECT key, ("publishedData"->>'gallerySlot')::integer AS slot
    FROM "Content"
    WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
    ORDER BY slot
  `
  const occupied=rows.flatMap(({key,slot})=>{
    const resolved=slot??galleryDefaultSlot(key)
    return resolved===undefined||galleryIsSculpture(key)?[]:[{key,slot:resolved}]
  })
  return {occupied}
})
