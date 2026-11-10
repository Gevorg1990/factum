import { Prisma } from '@prisma/client'
import { db, databaseEnabled } from '../utils/db'
import { getLegacyContent } from '../utils/legacyContent'
import { millionStages, millionStageOf } from '../../shared/millionStages'
export default defineEventHandler(async event=>{
  const mode=String(getQuery(event).mode||'million'),difficulty=String(getQuery(event).difficulty||'easy')
  if(!['million','logic','genius'].includes(mode)||!['easy','medium','hard'].includes(difficulty))throw createError({statusCode:400})
  let rows:any[]
  if(databaseEnabled()){
    async function sample(limit:number,stage?:string){
      const pivot=Math.random()
      const stageFilter=stage?Prisma.sql`AND "publishedData"->>'stage' = ${stage}`:Prisma.empty
      // Indexed circular sampling bounds reads as each phase's question bank grows.
      return db.$queryRaw<any[]>(Prisma.sql`WITH sample AS (
        SELECT "publishedData" AS data, "sampleKey" FROM "Content"
        WHERE kind = 'GAME' AND "publishedData" IS NOT NULL
          AND "publishedData"->>'mode' = ${mode} AND "publishedData"->>'difficulty' = ${difficulty}
          ${stageFilter} AND "sampleKey" >= ${pivot} ORDER BY "sampleKey" LIMIT ${limit}
      ) SELECT data FROM sample UNION ALL (
        SELECT "publishedData" AS data FROM "Content"
        WHERE kind = 'GAME' AND "publishedData" IS NOT NULL
          AND "publishedData"->>'mode' = ${mode} AND "publishedData"->>'difficulty' = ${difficulty}
          ${stageFilter} AND "sampleKey" < ${pivot} ORDER BY "sampleKey" LIMIT (${limit} - (SELECT count(*) FROM sample))
      )`)
    }
    rows=mode==='million'?(await Promise.all(millionStages.map(stage=>sample(10,stage.value)))).flat():await sample(30)
  }else {
    const pool=getLegacyContent().filter(x=>x.kind==='GAME'&&x.data.mode===mode&&x.data.difficulty===difficulty)
    const shuffle=(items:typeof pool)=>{
      const copy=[...items]
      for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j]!,copy[i]!]}
      return copy
    }
    rows=mode==='million'?millionStages.flatMap(stage=>shuffle(pool.filter(row=>millionStageOf(row.data)===stage.value)).slice(0,10)):shuffle(pool).slice(0,30)
  }
  return {items:rows.map(x=>x.data)}
})
