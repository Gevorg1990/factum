import {Prisma} from '@prisma/client'
import {bookAudioChunks} from '../../utils/library/audio'
import {db,databaseEnabled} from './db'

const cache=new Map<string,{chunks:string[];publishedAt:number}>()
export async function librarySpeechChunks(id:string){
 if(!databaseEnabled())return null
 const current=await db.content.findFirst({where:{kind:'BOOK',key:id,publishedData:{not:Prisma.DbNull}},select:{publishedAt:true}})
 if(!current){cache.delete(id);return null}
 const saved=cache.get(id)
 const publishedAt=current.publishedAt?.getTime()??0
 if(saved?.publishedAt===publishedAt)return saved.chunks
 const record=await db.content.findFirst({where:{kind:'BOOK',key:id,publishedData:{not:Prisma.DbNull}},select:{publishedData:true,publishedAt:true}})
 const text=(record?.publishedData as {text?:unknown}|null)?.text
 if(typeof text!=='string'||!text.trim()){cache.delete(id);return null}
 const chunks=bookAudioChunks(text)
 if(!chunks.length)return null
 if(cache.size>=2)cache.delete(cache.keys().next().value!)
 cache.set(id,{chunks,publishedAt:record?.publishedAt?.getTime()??0})
 return chunks
}
