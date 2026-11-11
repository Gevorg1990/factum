import {parseReadingState,type BookReadingState} from '~/utils/library/reading'
export function useLibraryReading(){
 const records=useState<Record<string,BookReadingState>>('library-reading-records',()=>({}))
 const storageNotice=useState('library-reading-storage-notice',()=>false)
 function load(id:string){
  if(!import.meta.client||records.value[id])return
  try{const raw=localStorage.getItem('factum-reading:'+id);if(raw)records.value[id]=parseReadingState(JSON.parse(raw));else{const legacy=localStorage.getItem('factum-reader:'+id);if(legacy!==null)records.value[id]=parseReadingState({page:Number(legacy)})}}catch{storageNotice.value=true}
 }
 function persist(id:string,value:BookReadingState){records.value[id]=value;try{localStorage.setItem('factum-reading:'+id,JSON.stringify(value));storageNotice.value=false}catch{storageNotice.value=true}}
 function savePage(id:string,page:number){load(id);const current=records.value[id]||parseReadingState(null);persist(id,{...current,page:Math.max(0,Math.floor(page)),updatedAt:Date.now()})}
 function saveBookmark(id:string,page:number,note:string){load(id);const current=records.value[id]||parseReadingState(null),mark={page,note:note.trim().slice(0,1000),updatedAt:Date.now()};persist(id,{...current,bookmarks:[...current.bookmarks.filter(item=>item.page!==page),mark].sort((a,b)=>a.page-b.page),updatedAt:Date.now()})}
 function removeBookmark(id:string,page:number){load(id);const current=records.value[id]||parseReadingState(null);persist(id,{...current,bookmarks:current.bookmarks.filter(item=>item.page!==page)})}
 return {records,storageNotice,load,savePage,saveBookmark,removeBookmark}
}
