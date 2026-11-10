import { z } from 'zod'
import { list, put, del } from '@vercel/blob'
import { requireUser } from '../../utils/auth'
import { db } from '../../utils/db'
import { maxVideoSourceBytes,optimizePreviewVideo } from '../../utils/previewVideo'
let processing=false
export default defineEventHandler(async event=>{
  const user=await requireUser(event,['ADMIN','EDITOR'])
  const {url}=await readValidatedBody(event,z.object({url:z.string().url().max(2000)}).parse)
  const parsed=new URL(url),prefix=`factum/video-source/${user.id}/`
  const pathname=decodeURIComponent(parsed.pathname.slice(1))
  if(parsed.protocol!=='https:'||!pathname.startsWith(prefix)||!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(parsed.origin))throw createError({statusCode:400,statusMessage:'Ընտրիր վիդեոն վերբեռնման դաշտից'})
  const store=await list({prefix:pathname,limit:1})
  const source=store.blobs.find(blob=>blob.url===url&&blob.pathname===pathname)
  if(!source||source.size>maxVideoSourceBytes)throw createError({statusCode:400,statusMessage:'Վիդեոն չի գտնվել կամ գերազանցում է 25 ՄԲ-ը'})
  if(processing)throw createError({statusCode:429,statusMessage:'Մեկ այլ վիդեո մշակվում է։ Քիչ անց փորձիր կրկին։'})
  processing=true
  let optimizedUrl:string|undefined
  try{
    const response=await fetch(source.url,{signal:AbortSignal.timeout(15000),redirect:'error'})
    if(!response.ok)throw new Error('Source unavailable')
    const input=Buffer.from(await response.arrayBuffer())
    const output=await optimizePreviewVideo(input)
    const optimized=await put(`factum/previews/${crypto.randomUUID()}.mp4`,output,{access:'public',contentType:'video/mp4',cacheControlMaxAge:31536000})
    optimizedUrl=optimized.url
    const asset=await db.videoPreview.create({data:{url:optimized.url,bytes:output.length,sourceBytes:input.length}})
    return {url:asset.url,bytes:asset.bytes,sourceBytes:asset.sourceBytes}
  }catch{
    if(optimizedUrl)await del(optimizedUrl).catch(()=>{})
    throw createError({statusCode:422,statusMessage:'Վիդեոն չմշակվեց։ Ընտրիր աշխատող MP4 կամ WebM ֆայլ և փորձիր կրկին։'})
  }finally{processing=false;await del(source.url).catch(()=>{})}
})
