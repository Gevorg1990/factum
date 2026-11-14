import {armenianSpeechAvailable} from '../../../utils/armenianSpeech'
import {librarySpeechChunks} from '../../../utils/librarySpeech'
import {estimatedBookAudioSeconds} from '../../../../utils/library/audio'

export default defineEventHandler(async event=>{
 const id=getRouterParam(event,'id')||''
 if(!id||id.length>160)throw createError({statusCode:400,statusMessage:'Գրքի սխալ հասցե'})
 const chunks=await librarySpeechChunks(id)
 if(!chunks)throw createError({statusCode:404,statusMessage:'Գիրքը հասանելի չէ'})
 setHeader(event,'Cache-Control','private, no-store')
 return {available:armenianSpeechAvailable(useRuntimeConfig(event)),chunks:chunks.length,estimatedSeconds:estimatedBookAudioSeconds(chunks)}
})
