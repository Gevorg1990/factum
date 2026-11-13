import {parseReadingState,migrateVerseReading,addBookmarkExcerpts,type BookReadingState} from '~/utils/library/reading'
export function useLibraryReading(){
 const records=useState<Record<string,BookReadingState>>('library-reading-records',()=>({}))
 const storageNotice=useState('library-reading-storage-notice',()=>false)
 function load(id:string){
  if(!import.meta.client||records.value[id])return
  try{const raw=localStorage.getItem('factum-reading:'+id);if(raw)records.value[id]=parseReadingState(JSON.parse(raw));else{const legacy=localStorage.getItem('factum-reader:'+id);if(legacy!==null)records.value[id]=parseReadingState({page:Number(legacy)})}}catch{storageNotice.value=true}
 }
 function persist(id:string,value:BookReadingState){records.value[id]=value;try{localStorage.setItem('factum-reading:'+id,JSON.stringify(value));storageNotice.value=false}catch{storageNotice.value=true}}
 function savePage(id:string,page:number,line=0){load(id);const current=records.value[id]||parseReadingState(null);persist(id,{...current,line:Math.max(0,Math.floor(line)),page:Math.max(0,Math.floor(page)),updatedAt:Date.now()})}
 function saveBookmark(id:string,page:number,note:string,line=0,excerpt?:string){
  load(id)
  const current=records.value[id]||parseReadingState(null),existing=current.bookmarks.find(item=>item.page===page&&(item.line??0)===line),now=Date.now()
  const text=(excerpt??existing?.excerpt)?.trim().slice(0,240)
  const mark={page,line,...(text?{excerpt:text}:{}),note:note.trim().slice(0,1000),updatedAt:now,bookmarkedAt:existing?.bookmarkedAt??existing?.updatedAt??now}
  persist(id,{...current,bookmarks:[...current.bookmarks.filter(item=>item.page!==page||(item.line??0)!==line),mark].sort((a,b)=>a.page-b.page||(a.line??0)-(b.line??0)),updatedAt:now})
 }
 function removeBookmark(id:string,page:number,line=0){load(id);const current=records.value[id]||parseReadingState(null);persist(id,{...current,bookmarks:current.bookmarks.filter(item=>item.page!==page||(item.line??0)!==line)})}
 function migrateVerse(id:string,text:string,topic='verse'){load(id);const current=records.value[id];if(current){const migrated=migrateVerseReading(current,text,topic);if(JSON.stringify(current)!==JSON.stringify(migrated))persist(id,migrated)}}
 function loadSaved(){
  if(!import.meta.client)return
  try{for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith('factum-reading:'))load(key.slice('factum-reading:'.length))}}catch{storageNotice.value=true}
 }
 function hydrateExcerpts(id:string,pages:readonly string[]){const state=records.value[id];if(state){const hydrated=addBookmarkExcerpts(state,pages);if(hydrated!==state)persist(id,hydrated)}}
 return {hydrateExcerpts,loadSaved,migrateVerse,records,storageNotice,load,savePage,saveBookmark,removeBookmark}
}
