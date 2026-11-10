import { randomInt } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { db, databaseEnabled } from '../utils/db'
import { getLegacyContent } from '../utils/legacyContent'
import { millionSlots, distinctQuestionIndices } from '../../shared/millionStages'
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
      rows=await db.$transaction(async tx=>{
        // Count indexed bank entries, then fetch only two uniformly selected
        // positions per bank. The snapshot keeps counts and offsets consistent
        // if an editor publishes or deletes a question during this request.
        const counts=await tx.$queryRaw<{slot:string;count:bigint}[]>`SELECT "publishedData"->>'slot' AS slot,count(*) AS count
          FROM "Content" WHERE kind='GAME' AND "publishedData" IS NOT NULL
            AND "publishedData"->>'mode'='million' AND "publishedData"->>'difficulty'=${difficulty}
          GROUP BY "publishedData"->>'slot'`
        const selections=counts.flatMap(bank=>{
          const slot=Number(bank.slot)
          if(!Number.isInteger(slot)||slot<0||slot>14)return []
          return distinctQuestionIndices(Number(bank.count),randomInt).map((offset,choice)=>Prisma.sql`(
            SELECT "publishedData" AS data,${slot} AS slot,${choice} AS choice FROM "Content"
            WHERE kind='GAME' AND "publishedData" IS NOT NULL AND "publishedData"->>'mode'='million'
              AND "publishedData"->>'difficulty'=${difficulty} AND "publishedData"->>'slot'=${String(slot)}
            ORDER BY "sampleKey",id OFFSET ${offset} LIMIT 1
          )`)
        })
        if(!selections.length)return []
        return tx.$queryRaw<any[]>(Prisma.sql`${Prisma.join(selections,' UNION ALL ')} ORDER BY slot,choice`)
      },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead})
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
