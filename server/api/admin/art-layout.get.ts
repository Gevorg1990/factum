import {db} from '../../utils/db'
import {requireUser} from '../../utils/auth'

type GalleryRow={key:string;slot:number|null}

export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const rows=await db.$queryRaw<GalleryRow[]>`
    SELECT key, ("publishedData"->>'gallerySlot')::integer AS slot
    FROM "Content"
    WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
      AND (key = 'thinker' OR "publishedData" ? 'gallerySlot')
    ORDER BY slot
  `
  const occupied=rows.flatMap(({key,slot})=>slot===null?[]:[{key,slot}])
  return {occupied,thinkerPublished:rows.some(row=>row.key==='thinker')}
})
