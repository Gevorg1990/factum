import {db} from '../../utils/db'
import {requireUser} from '../../utils/auth'

type SlotRow={key:string;title:string;slot:number}

export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const occupied=await db.$queryRaw<SlotRow[]>`
    SELECT key, title, ("publishedData"->>'gallerySlot')::integer AS slot
    FROM "Content"
    WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" ? 'gallerySlot'
    ORDER BY slot
  `
  return {occupied}
})
