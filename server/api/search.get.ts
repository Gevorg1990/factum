import { getSearchTerms } from '~/utils/searchTerms'
import { getSearchSubject } from '~/utils/searchSubjects'
import { searchRecords, type SearchRecord } from '~/utils/searchRecords'
import { atomSections, atomParticles, atomFacts } from '~/data/atomArticle'
import {questions,people,timeline,facts,books,subjects} from '~/data/content'

// The local catalog is static; build its searchable records once per server worker.
 const atomContent = [...atomSections.flatMap(section => [section.title,...section.paragraphs]),...atomParticles.flatMap(particle => [particle.name,particle.charge,particle.location,particle.detail]),...atomFacts].join(' ')
 const records:SearchRecord[]=[
 ...questions.map(x=>({title:x.title,description:x.answer,content:[x.detail, ...(x.sections || []).flatMap(section => [section.title, section.text]), x.example || '', x.takeaway || '', x.id === 'c1' ? atomContent : ''].join(' '),url:'/articles/'+x.id,kind:'Հոդված'})),
 ...people.map(x=>({title:x.name,description:x.role+' · '+x.bio,content:(x.biographySections || []).map(section => section.title+' '+section.text).join(' '),url:'/people/'+x.id,kind:'Կենսագրություն'})),
 ...timeline.map(x=>({title:x.title,description:x.year+' · '+x.era,url:'/history?event='+encodeURIComponent(x.year),kind:'Պատմություն'})),
 ...facts.map(x=>({title:x.title,description:x.text,url:'/facts?fact='+encodeURIComponent(x.id),kind:'Փաստ'})),
 ...books.map(x=>({title:x.title,description:x.author,url:'/library',kind:'Գիրք'})),
 ...subjects.map(x=>({title:x.name,description:'Հանրագիտարանի բաժին',url:'/subjects/'+x.slug,kind:'Բաժին'}))].map(record=>({...record,subject:getSearchSubject(record.url)}))

export default defineEventHandler(async event=>{
 const query=String(getQuery(event).q||'').trim().slice(0,160)
 if(!query)return {items:[],query}
 const terms=getSearchTerms(query)

 const local=searchRecords(records,terms)
 const {databaseEnabled,db}=await import('../utils/db')
 if(databaseEnabled()) {
  const rows=await db.$queryRaw<any[]>`SELECT kind, key, "publishedData" AS data FROM "Content" WHERE "publishedData" IS NOT NULL AND kind IN ('ARTICLE','PERSON','FACT','EVENT','CATEGORY','PAGE','VIDEO') AND to_tsvector('simple', "publishedData"::text) @@ plainto_tsquery('simple', ${query}) LIMIT 25`
  const urls:Record<string,string>={ARTICLE:'/articles/',PERSON:'/people/',FACT:'/facts?fact=',EVENT:'/history?event=',CATEGORY:'/subjects/',PAGE:'/content/',VIDEO:'/videos?video='}
  return {query,items:rows.map(row=>({title:row.data.title||row.data.name,description:row.data.answer||row.data.bio||row.data.text||'',url:urls[row.kind]+encodeURIComponent(row.key),kind:'COGNITIO'}))}
 }
 let cms:typeof records=[]
 return {query,items:[...local,...searchRecords(cms,terms,25)].slice(0,25)}
})
