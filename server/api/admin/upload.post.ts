import sharp from 'sharp'
import { put } from '@vercel/blob'
import { requireUser } from '../../utils/auth'
import { db } from '../../utils/db'
export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  if(!process.env.BLOB_READ_WRITE_TOKEN) throw createError({statusCode:503,statusMessage:'Կարգավորեք Vercel Blob պահոցի BLOB_READ_WRITE_TOKEN-ը'})
  const parts=await readMultipartFormData(event)
  const file=parts?.find(x=>x.name==='file')
  const alt=parts?.find(x=>x.name==='alt')?.data.toString().slice(0,500)
  if(!file||!alt||file.data.length>800000)throw createError({statusCode:400,statusMessage:'Ընտրեք մինչև 800 ԿԲ նկար և լրացրեք նկարագրությունը'})
  let optimized:Buffer
  try{optimized=await sharp(file.data,{limitInputPixels:25000000}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer()}catch{throw createError({statusCode:400,statusMessage:'Նկարի ձևաչափը սխալ է'})}
  const blob=await put(`factum/${crypto.randomUUID()}.webp`,optimized,{access:'public',contentType:'image/webp'})
  return db.media.create({data:{url:blob.url,alt}})
})
