import { getSearchTerms } from '~/utils/searchTerms'
import { getSearchSubject } from '~/utils/searchSubjects'
import { searchRecords, type SearchRecord } from '~/utils/searchRecords'
import { atomSections, atomParticles, atomFacts } from '~/data/atomArticle'
import {allEncyclopediaQuestions,people,timeline,facts,subjects} from '~/data/content'
import {libraryBooks} from '~/data/library/catalog'
import { bibleBooks } from '~/data/bible'
import { personMonuments } from '~/data/personMonuments'
import { geographicPlaces } from '~/data/geography/places'
import { worldRecords } from '~/data/geography/records'
import { armeniaRegions } from '~/data/geography/armeniaRegions'

// The local catalog is static; build its searchable records once per server worker.
 const atomContent = [...atomSections.flatMap(section => [section.title,...section.paragraphs]),...atomParticles.flatMap(particle => [particle.name,particle.charge,particle.location,particle.detail]),...atomFacts].join(' ')
 const records:SearchRecord[]=[
 ...allEncyclopediaQuestions.map(x=>({title:x.title,description:x.answer,content:[x.detail, ...(x.sections || []).flatMap(section => [section.title, section.text]), x.example || '', x.takeaway || '', x.id === 'c1' ? atomContent : ''].join(' '),url:'/articles/'+x.id,kind:'Հոդված'})),
 ...people.map(x=>({title:x.name,description:x.role+' · '+x.bio,content:(x.biographySections || []).map(section => section.title+' '+section.text).join(' '),url:'/people/'+x.id,kind:'Կենսագրություն'})),
 ...timeline.map(x=>({title:x.title,description:x.year+' · '+x.era,url:'/history?event='+encodeURIComponent(x.year),kind:'Պատմություն'})),
 ...facts.map(x=>({title:x.title,description:x.text,url:'/facts?fact='+encodeURIComponent(x.id),kind:'Փաստ'})),
 ...bibleBooks.map(x=>({title:x.name,description:`${x.category} · ${x.chapters} գլուխ`,url:'/bible',kind:'Աստվածաշնչի գիրք'})),
 ...personMonuments.map(x=>({title:x.name,description:[x.city,x.location,x.sculptor].filter(Boolean).join(' · '),url:'/people/'+x.personId,kind:'Հուշարձան'})),
 ...geographicPlaces.map(x=>({title:x.title,description:x.detail,url:'/globe',kind:'Աշխարհագրական վայր'})),
 ...worldRecords.map(x=>({title:x.title,description:x.detail,url:'/globe',kind:'Աշխարհագրական ռեկորդ'})),
 ...armeniaRegions.map(x=>({title:x.name,description:x.description,url:'/globe',kind:'Հայաստանի մարզ'})),
 ...subjects.map(x=>({title:x.name,description:'Հանրագիտարանի բաժին',url:'/subjects/'+x.slug,kind:'Բաժին'}))].map(record=>({...record,subject:getSearchSubject(record.url)}))
const localBookRecords:SearchRecord[]=libraryBooks.map(book=>({title:book.title,description:book.author,url:'/library?book='+encodeURIComponent(book.id),kind:'Գիրք',subject:getSearchSubject('/library')}))

export default defineEventHandler(async event=>{
 const query=String(getQuery(event).q||'').trim().slice(0,160)
 if(!query)return {items:[],query,total:0}
 const terms=getSearchTerms(query)

 const offset=Math.max(0,Math.min(10000,Number.parseInt(String(getQuery(event).offset||'0'),10)||0))
 const limit=Math.max(1,Math.min(50,Number.parseInt(String(getQuery(event).limit||'20'),10)||20))
 const {databaseEnabled,db}=await import('../utils/db')
 const hasDatabase=databaseEnabled()
 const searchable=hasDatabase?records:[...records,...localBookRecords]
 const local=searchRecords(searchable,terms,searchable.length)
 if(hasDatabase) {
  const prefixQuery=terms.map(term=>`'${term.replace(/[^\p{L}\p{N}]/gu,'')}':*`).filter(term=>term!=="'':*").join(' | ')
  const [rows,bookRows]=prefixQuery ? await Promise.all([
   db.$queryRaw<any[]>`SELECT kind, key, "publishedData" AS data FROM "Content" WHERE "publishedData" IS NOT NULL AND kind IN ('ARTICLE','PERSON','FACT','EVENT','CATEGORY','PAGE','VIDEO') AND to_tsvector('simple', "publishedData"::text) @@ to_tsquery('simple', ${prefixQuery}) LIMIT 500`,
   db.$queryRaw<{key:string;title:string;author:string}[]>`SELECT key, "publishedData"->>'title' AS title, "publishedData"->>'author' AS author FROM "Content" WHERE kind = 'BOOK' AND "publishedData" IS NOT NULL AND "publishedData" <> 'null'::jsonb AND to_tsvector('simple', coalesce("publishedData"->>'title','') || ' ' || coalesce("publishedData"->>'author','')) @@ to_tsquery('simple', ${prefixQuery}) LIMIT 500`,
  ]) : [[],[]]
  const urls:Record<string,string>={ARTICLE:'/articles/',PERSON:'/people/',FACT:'/facts?fact=',EVENT:'/history?event=',CATEGORY:'/subjects/',PAGE:'/content/',VIDEO:'/videos?video='}
  const databaseItems=[...rows.map(row=>({title:row.data.title||row.data.name,description:row.data.answer||row.data.bio||row.data.text||'',url:urls[row.kind]+encodeURIComponent(row.key),kind:'COGNITIO',score:1})),...bookRows.map(book=>({title:book.title,description:book.author||'',url:'/library?book='+encodeURIComponent(book.key),kind:'Գիրք',subject:getSearchSubject('/library'),score:1}))]
  const combined=[...local,...databaseItems.filter(row=>!local.some(item=>item.url===row.url))]
  return {query,total:combined.length,items:combined.slice(offset,offset+limit)}
 }
 return {query,total:local.length,items:local.slice(offset,offset+limit)}
})
