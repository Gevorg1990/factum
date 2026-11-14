import {Prisma} from '@prisma/client'
import {bookAudioChunks} from '../../utils/library/audio'
import {db,databaseEnabled} from './db'

const cache=new Map<string,{chunks:string[];expires:number}>()
export async function librarySpeechChunks(id:string){
 if(!databaseEnabled())return null
 const saved=cache.get(id)
 if(saved&&saved.expires>Date.now())return saved.chunks
 const record=await db.content.findFirst({where:{kind:'BOOK',key:id,publishedData:{not:Prisma.DbNull}},select:{publishedData:true}})
 const text=(record?.publishedData as {text?:unknown}|null)?.text
 if(typeof text!=='string'||!text.trim())return null
 const chunks=bookAudioChunks(text)
 if(!chunks.length)return null
 if(cache.size>=2)cache.delete(cache.keys().next().value!)
 cache.set(id,{chunks,expires:Date.now()+5*60_000})
 return chunks
}
