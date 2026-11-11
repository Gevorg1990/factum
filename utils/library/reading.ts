export type ReadingBookmark={page:number;note:string;updatedAt:number}
export type BookReadingState={page:number;bookmarks:ReadingBookmark[];updatedAt:number}
export function parseReadingState(raw:unknown):BookReadingState{
 const value=raw&&typeof raw==='object'?raw as Record<string,unknown>:{}
 const page=typeof value.page==='number'&&Number.isInteger(value.page)&&value.page>=0?value.page:0
 const bookmarks:ReadingBookmark[]=[]
 if(Array.isArray(value.bookmarks))for(const item of value.bookmarks.slice(0,100)){
  if(!item||typeof item!=='object'||!Number.isInteger(item.page)||item.page<0||bookmarks.some(mark=>mark.page===item.page))continue
  bookmarks.push({page:item.page,note:typeof item.note==='string'?item.note.slice(0,1000):'',updatedAt:typeof item.updatedAt==='number'&&Number.isFinite(item.updatedAt)?item.updatedAt:0})
 }
 return {page,bookmarks:bookmarks.sort((a,b)=>a.page-b.page),updatedAt:typeof value.updatedAt==='number'&&Number.isFinite(value.updatedAt)?value.updatedAt:0}
}
