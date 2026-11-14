import type {BiographyVoice} from '../../../../utils/biographySpeech'
import {synthesizeArmenianSpeech} from '../../../utils/armenianSpeech'
import {librarySpeechChunks} from '../../../utils/librarySpeech'

export default defineEventHandler(async event=>{
 const id=getRouterParam(event,'id')||''
 if(!id||id.length>160)throw createError({statusCode:400,statusMessage:'Գրքի սխալ հասցե'})
 const body=await readBody<{part?:number;voice?:string}>(event)
 if(!Number.isSafeInteger(body?.part)||body.part!<0||!['male','female'].includes(body?.voice||''))throw createError({statusCode:400,statusMessage:'Ձայնի սխալ հարցում'})
 const chunks=await librarySpeechChunks(id)
 if(!chunks||body.part!>=chunks.length)throw createError({statusCode:404,statusMessage:'Գրքի հատվածը հասանելի չէ'})
 const audio=await synthesizeArmenianSpeech(chunks[body.part!]!,body.voice as BiographyVoice,useRuntimeConfig(event),fetch)
 setHeader(event,'Content-Type','audio/wav')
 setHeader(event,'Cache-Control','private, no-store')
 return audio
})
