import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { maxVideoSourceBytes } from '../../utils/previewVideo'
export default defineEventHandler(async event=>{
  const user=await requireUser(event,['ADMIN','EDITOR'])
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw createError({statusCode:503,statusMessage:'Վիդեոների պահոցը միացված չէ'})
  const body=await readBody<HandleUploadBody>(event)
  if(body?.type!=='blob.generate-client-token')throw createError({statusCode:400,statusMessage:'Սխալ վերբեռնման հարցում'})
  return handleUpload({body,request:event.node.req,onBeforeGenerateToken:async pathname=>{
    const prefix=`factum/video-source/${user.id}/`
    if(!pathname.startsWith(prefix)||!z.string().regex(/^[a-f0-9-]+\.(mp4|webm)$/).safeParse(pathname.slice(prefix.length)).success)throw createError({statusCode:400,statusMessage:'Վիդեոյի անվանումը սխալ է'})
    return {allowedContentTypes:['video/mp4','video/webm'],maximumSizeInBytes:maxVideoSourceBytes,validUntil:Date.now()+300000,addRandomSuffix:true,allowOverwrite:false,ttlDays:1}
  }})
})
