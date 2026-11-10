import { db, databaseEnabled } from '../utils/db'
import { getLegacyContent } from '../utils/legacyContent'
export default defineEventHandler(async event=>{
  const mode=String(getQuery(event).mode||'million'),difficulty=String(getQuery(event).difficulty||'easy')
  if(!['million','logic','genius'].includes(mode)||!['easy','medium','hard'].includes(difficulty))throw createError({statusCode:400})
  let rows:any[]
  if(databaseEnabled()){
    // Indexed circular sampling reads at most 30 matching rows, even as the bank grows.
    const pivot=Math.random()
    rows=await db.$queryRaw<any[]>`WITH sample AS (
      SELECT "publishedData" AS data, "sampleKey" FROM "Content"
      WHERE kind = 'GAME' AND "publishedData" IS NOT NULL
        AND "publishedData"->>'mode' = ${mode} AND "publishedData"->>'difficulty' = ${difficulty}
        AND "sampleKey" >= ${pivot} ORDER BY "sampleKey" LIMIT 30
    ) SELECT data FROM sample UNION ALL (
      SELECT "publishedData" AS data FROM "Content"
      WHERE kind = 'GAME' AND "publishedData" IS NOT NULL
        AND "publishedData"->>'mode' = ${mode} AND "publishedData"->>'difficulty' = ${difficulty}
        AND "sampleKey" < ${pivot} ORDER BY "sampleKey" LIMIT (30 - (SELECT count(*) FROM sample))
    )`
  }else rows=getLegacyContent().filter(x=>x.kind==='GAME'&&x.data.mode===mode&&x.data.difficulty===difficulty).sort(()=>Math.random()-.5).slice(0,30)
  return {items:rows.map(x=>x.data)}
})
