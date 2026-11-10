export async function usePublishedContent<T>(kind:string, fallback:T[], options:{key?:string;subject?:string;limit?:number;armenian?:boolean}={}) {
  const {data,error}=await useFetch<{items:T[];source:string;total:number}>('/api/content',{query:{kind,...options,limit:options.limit||100},key:`cms:${kind}:${options.key||''}:${options.subject||''}:${options.limit||100}:${options.armenian||false}`})
  if(error.value) throw createError({statusCode:503,statusMessage:'Բովանդակության ծառայությունն անհասանելի է'})
  return reactive(data.value?.items ?? fallback) as T[]
}
