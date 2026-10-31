export default defineEventHandler(async (event) => {
  const config=useRuntimeConfig(event)
  if(!config.public.directusUrl) return { source:'demo', items:[] }
  const url=String(config.public.directusUrl).replace(/\/$/,'')+'/items/articles?fields=id,title,slug,summary&filter[status][_eq]=published&limit=50'
  try {const response=await $fetch<{data:unknown[]}>(url,{headers:config.directusToken?{Authorization:'Bearer '+config.directusToken}:{}});return {source:'directus',items:response.data}}
  catch {throw createError({statusCode:502,statusMessage:'CMS unavailable or articles collection not configured'})}
})