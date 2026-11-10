import {db,databaseEnabled} from '../utils/db'
const counts=defineCachedFunction(async()=>{
 const result:Record<string,number>={}
 if(databaseEnabled()){
  const rows=await db.$queryRaw<{subject:string;count:bigint}[]>`SELECT "publishedData"->>'subject' AS subject,count(*) AS count FROM "Content" WHERE kind='ARTICLE' AND "publishedData" IS NOT NULL AND "publishedData"->>'subject' IS NOT NULL AND ("publishedData"->'listed') IS DISTINCT FROM 'false'::jsonb GROUP BY "publishedData"->>'subject'`
  for(const row of rows)result[row.subject]=Number(row.count)
 }else{const {getLegacyContent}=await import('../utils/legacyContent');for(const row of getLegacyContent())if(row.kind==='ARTICLE'&&row.data.listed!==false){const subject=String(row.data.subject);result[subject]=(result[subject]||0)+1}}
 return result
},{name:'category-counts',maxAge:30,getKey:()=>databaseEnabled()?'database':'files'})
export default defineEventHandler(()=>counts())
