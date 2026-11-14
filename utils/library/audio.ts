import type {BiographyVoice} from '../biographySpeech'

export type BookAudioPosition={part:number;seconds:number;elapsed:number;voice:BiographyVoice;updatedAt:number}

export function bookAudioChunks(text:string):string[]{
 const content=text.replace(/\r\n?/g,'\n').replace(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i,'').split(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i)[0]!.trim()
 const chunks:string[]=[]
 let chunk=''
 for(const word of content.split(/\s+/u)){
  if(!word)continue
  const limit=chunks.length?900:300
  if(chunk&&chunk.length+word.length+1>limit){chunks.push(chunk);chunk=''}
  chunk+=(chunk?' ':'')+word
  if(!chunks.length&&chunk.length>=140&&/[։.!?]$/u.test(word)){chunks.push(chunk);chunk=''}
 }
 if(chunk)chunks.push(chunk)
 return chunks
}

export function estimatedBookAudioSeconds(chunks:string[]):number{
 const words=chunks.reduce((total,chunk)=>total+(chunk.match(/\S+/gu)?.length||0),0)
 const pauses=chunks.reduce((total,chunk)=>total+(chunk.match(/[։.!?…]/gu)?.length||0),0)
 return Math.ceil(words/120*60+pauses*0.12)
}

export function parseBookAudioPosition(raw:unknown):BookAudioPosition{
 const value=raw&&typeof raw==='object'?raw as Record<string,unknown>:{}
 const part=Number.isSafeInteger(value.part)&&Number(value.part)>=0?Number(value.part):0
 const seconds=typeof value.seconds==='number'&&Number.isFinite(value.seconds)&&value.seconds>=0?value.seconds:0
 const elapsed=typeof value.elapsed==='number'&&Number.isFinite(value.elapsed)&&value.elapsed>=seconds?value.elapsed:seconds
 const voice=value.voice==='female'?'female':'male'
 const updatedAt=typeof value.updatedAt==='number'&&Number.isFinite(value.updatedAt)?value.updatedAt:0
 return {part,seconds,elapsed,voice,updatedAt}
}

export function audioTime(seconds:number){
 const total=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0))
 const hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),remainder=total%60
 return `${hours}:${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}`
}
