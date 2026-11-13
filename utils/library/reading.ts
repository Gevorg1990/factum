import {splitReadingPages,splitBookPages} from './navigation'
export type ReadingBookmark={page:number;line?:number;note:string;updatedAt:number;bookmarkedAt?:number;excerpt?:string}
export type BookReadingState={page:number;line?:number;pagination?:'poems-v1';bookmarks:ReadingBookmark[];updatedAt:number}
export function parseReadingState(raw:unknown):BookReadingState{
 const value=raw&&typeof raw==='object'?raw as Record<string,unknown>:{}
 const page=typeof value.page==='number'&&Number.isInteger(value.page)&&value.page>=0?value.page:0
 const bookmarks:ReadingBookmark[]=[]
 if(Array.isArray(value.bookmarks))for(const item of value.bookmarks.slice(0,100)){
  if(!item||typeof item!=='object'||!Number.isInteger(item.page)||item.page<0||bookmarks.some(mark=>mark.page===item.page&&(mark.line??0)===(item.line??0)))continue
  bookmarks.push({page:item.page,...(typeof item.excerpt==='string'&&item.excerpt.trim()?{excerpt:item.excerpt.trim().slice(0,240)}:{}),...(typeof item.bookmarkedAt==='number'&&Number.isFinite(item.bookmarkedAt)&&item.bookmarkedAt>=0?{bookmarkedAt:item.bookmarkedAt}:{}),...(Number.isInteger(item.line)&&item.line>=0?{line:item.line}:{}),note:typeof item.note==='string'?item.note.slice(0,1000):'',updatedAt:typeof item.updatedAt==='number'&&Number.isFinite(item.updatedAt)?item.updatedAt:0})
 }
 return {page,...(value.pagination==='poems-v1'?{pagination:'poems-v1' as const}:{}),...(Number.isInteger(value.line)&&Number(value.line)>=0?{line:Number(value.line)}:{}),bookmarks:bookmarks.sort((a,b)=>a.page-b.page||(a.line??0)-(b.line??0)),updatedAt:typeof value.updatedAt==='number'&&Number.isFinite(value.updatedAt)?value.updatedAt:0}
}

// Preserve existing page bookmarks when a collection changes to one poem per page.
export function migrateVerseReading(state:BookReadingState,text:string,topic='verse'):BookReadingState{
 if(state.pagination==='poems-v1')return state
 const previous=splitReadingPages(text.trim(),4400),next=splitBookPages(text,topic)
 function locate(page:number,line=0){
  const oldLines=(previous[page]||'').split('\n')
  const anchor=oldLines.slice(line).join('\n').trim().slice(0,120)
  if(anchor)for(let index=0;index<next.length;index++){
   const offset=next[index]!.indexOf(anchor)
   if(offset>=0)return {page:index,line:next[index]!.slice(0,offset).split('\n').length-1}
  }
  return {page:Math.min(page,next.length-1),line:0}
 }
 return {...state,...locate(state.page,state.line),pagination:'poems-v1',bookmarks:state.bookmarks.map(mark=>({...mark,...locate(mark.page,mark.line)}))}
}

export type ReadingLine={index:number;text:string}
export function readingLineChunks(text:string,blockSize=24):ReadingLine[][]{
 const lines=text.split('\n'),chunks:ReadingLine[][]=[]
 const size=Math.max(1,Math.min(100,Math.floor(blockSize)||24))
 for(let start=0;start<lines.length;start+=size)chunks.push(lines.slice(start,start+size).map((text,offset)=>({index:start+offset,text})))
 return chunks
}

export function latestReadingBookmark(state:BookReadingState|undefined):ReadingBookmark|undefined{
 return state?.bookmarks.reduce<ReadingBookmark|undefined>((latest,mark)=>!latest||(mark.bookmarkedAt??mark.updatedAt)>=(latest.bookmarkedAt??latest.updatedAt)?mark:latest,undefined)
}


export function readingPositionLabel(topic:string,position:{page:number;line?:number;excerpt?:string}){
 const excerpt=position.excerpt?.replace(/\s+/g,' ').trim()
 if(excerpt)return `«${excerpt.length>64?excerpt.slice(0,64)+'…':excerpt}»`
 return topic==='poetry'?'Վերջին էջանշանից':`${topic==='verse'?'Բանաստեղծություն':'Էջ'} ${position.page+1} · էջանշված հատված`
}

export function bookmarkText(pages:readonly string[],page:number,line=0){return pages[page]?.split('\n')[line]?.trim().slice(0,240)||''}
export function addBookmarkExcerpts(state:BookReadingState,pages:readonly string[]):BookReadingState{
 let changed=false
 const bookmarks=state.bookmarks.map(mark=>{
  const excerpt=bookmarkText(pages,mark.page,mark.line??0)
  if(!excerpt||excerpt===mark.excerpt)return mark
  changed=true;return {...mark,excerpt}
 })
 return changed?{...state,bookmarks}:state
}
