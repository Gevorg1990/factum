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
 const config=useRuntimeConfig(event)
 let cms:typeof records=[]
 if(config.public.directusUrl){
  try{
   const base=String(config.public.directusUrl).replace(/\/$/,'')
   const res=await $fetch<{data:{id:string|number;title:string;summary?:string}[]}>(base+'/items/articles',{query:{fields:'id,title,summary',filter:{status:{_eq:'published'}},limit:100},headers:config.directusToken?{Authorization:'Bearer '+config.directusToken}:{} ,timeout:3500})
   cms=res.data.map(x=>({title:x.title,description:x.summary||'',url:'/search?q='+encodeURIComponent(x.title),kind:'CMS նյութ'}))
  }catch{ /* Local results remain available when CMS is offline. */ }
 }
 return {query,items:[...local,...searchRecords(cms,terms,25)].slice(0,25)}
})
