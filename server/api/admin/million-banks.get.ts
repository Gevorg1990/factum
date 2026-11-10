import { z } from 'zod'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const difficulty=z.enum(['easy','medium','hard']).parse(getQuery(event).difficulty||'easy')
  const [drafts,live]=await db.$transaction([
    db.$queryRaw<{slot:string;total:bigint;drafts:bigint}[]>`SELECT data->>'slot' AS slot,count(*) AS total,count(*) FILTER (WHERE status='DRAFT') AS drafts FROM "Content" WHERE kind='GAME' AND data->>'mode'='million' AND data->>'difficulty'=${difficulty} GROUP BY data->>'slot'`,
    db.$queryRaw<{slot:string;published:bigint}[]>`SELECT "publishedData"->>'slot' AS slot,count(*) AS published FROM "Content" WHERE kind='GAME' AND "publishedData" IS NOT NULL AND "publishedData"->>'mode'='million' AND "publishedData"->>'difficulty'=${difficulty} GROUP BY "publishedData"->>'slot'`,
  ])
  return {items:Array.from({length:15},(_,slot)=>({slot,total:Number(drafts.find(row=>row.slot===String(slot))?.total||0),drafts:Number(drafts.find(row=>row.slot===String(slot))?.drafts||0),published:Number(live.find(row=>row.slot===String(slot))?.published||0)}))}
})
