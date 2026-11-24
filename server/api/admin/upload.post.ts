import sharp from 'sharp'
import { put } from '@vercel/blob'
import { requireUser } from '../../utils/auth'
import { db } from '../../utils/db'
import {mkdir,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  if(!process.env.BLOB_READ_WRITE_TOKEN&&process.env.NODE_ENV==='production') throw createError({statusCode:503,statusMessage:'Կարգավորեք Vercel Blob պահոցի BLOB_READ_WRITE_TOKEN-ը'})
  const parts=await readMultipartFormData(event)
  const file=parts?.find(x=>x.name==='file')
  const alt=parts?.find(x=>x.name==='alt')?.data.toString().trim().slice(0,500) || ''
  if(!file||!file.data.length||!alt||file.data.length>8_000_000)throw createError({statusCode:400,statusMessage:'Ընտրեք մինչև 8 ՄԲ նկար և լրացրեք նկարագրությունը'})
  let optimized:Buffer
  try{optimized=await sharp(file.data,{limitInputPixels:25000000}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer()}catch{throw createError({statusCode:400,statusMessage:'Նկարի ձևաչափը սխալ է'})}
  let url:string
  if(process.env.BLOB_READ_WRITE_TOKEN){
    const blob=await put(`factum/${crypto.randomUUID()}.webp`,optimized,{access:'public',contentType:'image/webp'})
    url=blob.url
  }else{
    const name=`${crypto.randomUUID()}.webp`
    const directory=join(process.cwd(),'public','images','uploads')
    await mkdir(directory,{recursive:true})
    await writeFile(join(directory,name),optimized,{flag:'wx'})
    url=`/images/uploads/${name}`
  }
  return db.media.create({data:{url,alt}})
})
