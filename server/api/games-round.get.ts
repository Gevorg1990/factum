import { Prisma } from '@prisma/client'
import { db, databaseEnabled } from '../utils/db'
import { getLegacyContent } from '../utils/legacyContent'
import { millionSlots } from '../../shared/millionStages'
export default defineEventHandler(async event=>{
  const mode=String(getQuery(event).mode||'million'),difficulty=String(getQuery(event).difficulty||'easy')
  if(!['million','logic','genius'].includes(mode)||!['easy','medium','hard'].includes(difficulty))throw createError({statusCode:400})
  let rows:any[]
  if(databaseEnabled()){
    async function sample(limit:number){
      const pivot=Math.random()
      // Indexed circular sampling bounds reads as each numbered question bank grows.
      return db.$queryRaw<any[]>(Prisma.sql`WITH sample AS (
        SELECT "publishedData" AS data, "sampleKey" FROM "Content"
        WHERE kind = 'GAME' AND "publishedData" IS NOT NULL
          AND "publishedData"->>'mode' = ${mode} AND "publishedData"->>'difficulty' = ${difficulty}
          AND "sampleKey" >= ${pivot} ORDER BY "sampleKey" LIMIT ${limit}
      ) SELECT data FROM sample UNION ALL (
        SELECT "publishedData" AS data FROM "Content"
        WHERE kind = 'GAME' AND "publishedData" IS NOT NULL
          AND "publishedData"->>'mode' = ${mode} AND "publishedData"->>'difficulty' = ${difficulty}
          AND "sampleKey" < ${pivot} ORDER BY "sampleKey" LIMIT (${limit} - (SELECT count(*) FROM sample))
      )`)
    }
    if(mode==='million'){
      const pivot=Math.random()
      // One indexed query returns just two candidates for each of the 15 banks.
      rows=await db.$queryRaw<any[]>`SELECT picked.data FROM generate_series(0,14) AS bank(slot)
        CROSS JOIN LATERAL (
          WITH first_pick AS (
            SELECT "publishedData" AS data,"sampleKey" FROM "Content"
            WHERE kind='GAME' AND "publishedData" IS NOT NULL
              AND "publishedData"->>'mode'='million' AND "publishedData"->>'difficulty'=${difficulty}
              AND "publishedData"->>'slot'=bank.slot::text AND "sampleKey">=${pivot}
            ORDER BY "sampleKey" LIMIT 2
          ) SELECT data FROM first_pick UNION ALL (
            SELECT "publishedData" AS data FROM "Content"
            WHERE kind='GAME' AND "publishedData" IS NOT NULL
              AND "publishedData"->>'mode'='million' AND "publishedData"->>'difficulty'=${difficulty}
              AND "publishedData"->>'slot'=bank.slot::text AND "sampleKey"<${pivot}
            ORDER BY "sampleKey" LIMIT (2-(SELECT count(*) FROM first_pick))
          )
        ) AS picked ORDER BY bank.slot`
    }else rows=await sample(30)
  }else {
    const pool=getLegacyContent().filter(x=>x.kind==='GAME'&&x.data.mode===mode&&x.data.difficulty===difficulty)
    const shuffle=(items:typeof pool)=>{
      const copy=[...items]
      for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j]!,copy[i]!]}
      return copy
    }
    rows=mode==='million'?millionSlots.flatMap(slot=>shuffle(pool.filter(row=>row.data.slot===slot.value)).slice(0,2)):shuffle(pool).slice(0,30)
  }
  return {items:rows.map(x=>x.data)}
})
