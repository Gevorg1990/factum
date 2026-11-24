import {z} from 'zod'
import {db} from '../../utils/db'
import {requireUser} from '../../utils/auth'

type ArtistRow={creator:string;creatorInfo:string;creatorPortrait:string;creatorPortraitCredit:string;creatorPortraitSource:string}

export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const {q}=z.object({q:z.string().trim().max(100).default('')}).parse(getQuery(event))
  if(q.length<2)return {items:[]}
  const pattern=`%${q.replace(/[\\%_]/g,'\\$&')}%`
  const items=await db.$queryRaw<ArtistRow[]>`
    SELECT DISTINCT ON (lower(data->>'creator'))
      data->>'creator' AS creator,
      data->>'creatorInfo' AS "creatorInfo",
      COALESCE(data->>'creatorPortrait','') AS "creatorPortrait",
      COALESCE(data->>'creatorPortraitCredit','') AS "creatorPortraitCredit",
      COALESCE(data->>'creatorPortraitSource','') AS "creatorPortraitSource"
    FROM "Content"
    WHERE kind = 'ARTWORK' AND status <> 'ARCHIVED' AND data->>'creator' ILIKE ${pattern} ESCAPE chr(92)
    ORDER BY lower(data->>'creator'), (data->>'creatorPortrait' <> '') DESC, (status = 'PUBLISHED') DESC, "updatedAt" DESC
    LIMIT 12
  `
  return {items}
})
