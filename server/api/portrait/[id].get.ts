import {people} from '~/data/content'
export default defineCachedEventHandler(async event=>{
 const id=getRouterParam(event,'id')
 const p=people.find(person=>person.id===id)
 if(!p)throw createError({statusCode:404,statusMessage:'Person not found'})
 try{
  const language=p.portraitLanguage === 'en' ? 'en' : 'hy'
  const u=new URL(`https://${language}.wikipedia.org/w/api.php`)
  u.search=new URLSearchParams({action:'query',titles:p.portraitTitle || p.name,prop:'pageimages',pithumbsize:'440',format:'json',origin:'*'}).toString()
  const result = await $fetch<{ query?: { pages?: Record<string, { thumbnail?: { source: string } }> } }>(u.toString(), { timeout: 4500 })
  const src=Object.values(result.query?.pages||{})[0]?.thumbnail?.source
  return {url:src||null,source:src?'Wikimedia / Wikipedia':null}
 }catch{return {url:null,source:null}}
}, { maxAge: 86400, name: 'person-portraits' })
