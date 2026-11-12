<script setup lang="ts">
import {BookOpen,Bookmark,Trash2,ArrowLeft,ArrowRight,Clock3} from 'lucide-vue-next'
import type {LibraryBook} from '~/data/library/catalog'
import {latestReadingBookmark,readingPositionLabel,type ReadingBookmark} from '~/utils/library/reading'
const props=defineProps<{ids:readonly string[]}>()
const {library,removeBook}=useProgress()
const {records,removeBookmark}=useLibraryReading()
const page=ref(0),loading=ref(false),error=ref(''),metadata=shallowRef<Record<string,LibraryBook>>({}),expandedMarks=ref<Record<string,number>>({})
const visibleIds=computed(()=>props.ids.slice(page.value*12,(page.value+1)*12))
const reader=ref<LibraryBook|null>(null),readerStart=ref<'beginning'|'bookmark'>('beginning'),readerPosition=ref<{page:number;line:number}>()
watch(()=>props.ids.length,()=>{page.value=Math.min(page.value,Math.max(0,Math.ceil(props.ids.length/12)-1))})
watch(()=>visibleIds.value.join('\0'),async(_,__,onCleanup)=>{
 const keys=visibleIds.value
 if(!import.meta.client)return
 const controller=new AbortController();onCleanup(()=>controller.abort());loading.value=true;error.value=''
 try{const result=await $fetch<{items:LibraryBook[]}>('/api/library/saved',{method:'POST',body:{keys},signal:controller.signal});metadata.value=Object.fromEntries(result.items.map(book=>[book.id,book]))}
 catch{if(!controller.signal.aborted)error.value='Գրքերը չհաջողվեց բեռնել։ Փորձիր կրկին։'}
 finally{if(!controller.signal.aborted)loading.value=false}
},{immediate:true})
function open(id:string,start:'beginning'|'bookmark',mark?:ReadingBookmark){const book=metadata.value[id];if(!book)return;readerStart.value=start;readerPosition.value=mark?{page:mark.page,line:mark.line??0}:undefined;reader.value=book}
function hint(id:string){const mark=latestReadingBookmark(records.value[id]);return mark?readingPositionLabel(metadata.value[id]?.topic||'',mark):''}
</script>
<template>
 <div class="profile-library">
  <p class="library-storage-note">Գրքերի էջանշաններն ու նշումները պահպանվում են այս սարքում։</p>
  <p v-if="error" role="alert">{{error}}</p><p v-else-if="loading" role="status">Գրքերը բեռնվում են…</p>
  <div v-else class="saved-book-grid">
   <article v-for="id in visibleIds" :key="id" class="saved-book">
    <header><img v-if="metadata[id]?.cover" :src="metadata[id]!.cover" :alt="metadata[id]!.title" loading="lazy" decoding="async" width="70" height="100"/><div><h3>{{metadata[id]?.title||'Պահպանված գիրք'}}</h3><p>{{metadata[id]?.author}}</p><span>{{records[id]?.bookmarks.length||0}} էջանշան</span></div></header>
    <div class="saved-book-actions"><button v-if="metadata[id]" type="button" @click="open(id,'beginning')"><BookOpen :size="15"/>Կարդալ</button><button v-if="metadata[id]&&records[id]?.bookmarks.length" type="button" class="resume-book" :title="'Շարունակել կարդալ · '+(latestReadingBookmark(records[id])?.excerpt||hint(id))" :aria-label="'Շարունակել կարդալ · '+hint(id)" @click="open(id,'bookmark')"><Clock3 :size="15"/><span>{{hint(id)}}</span></button><button v-if="library.includes(id)" type="button" :aria-label="`Հեռացնել ${metadata[id]?.title||'գիրքը'} պահպանումներից`" @click="removeBook(id)"><Trash2 :size="14"/>Հեռացնել պահպանումը</button></div>
    <p v-if="!metadata[id]" class="library-storage-note">Գիրքն այժմ հրապարակված չէ։ Քո էջանշանները պահպանված են։</p>
    <ol class="saved-book-marks"><li v-for="mark in (records[id]?.bookmarks||[]).slice(0,expandedMarks[id]||5)" :key="mark.page+':'+(mark.line??0)"><button type="button" :disabled="!metadata[id]" @click="open(id,'bookmark',mark)"><Bookmark :size="14"/><span>{{readingPositionLabel(metadata[id]?.topic||'',mark)}}<small v-if="mark.note">{{mark.note}}</small></span></button><button type="button" class="remove-mark" :aria-label="'Հեռացնել էջանշանը․ '+readingPositionLabel(metadata[id]?.topic||'',mark)" @click="removeBookmark(id,mark.page,mark.line??0)"><Trash2 :size="14"/></button></li></ol>
    <button v-if="(records[id]?.bookmarks.length||0)>(expandedMarks[id]||5)" type="button" class="more-marks" @click="expandedMarks[id]=(expandedMarks[id]||5)+10">Ցույց տալ ևս էջանշաններ</button>
   </article>
  </div>
  <nav v-if="ids.length>12" class="saved-book-pagination" aria-label="Պահպանված գրքերի էջեր"><button :disabled="page===0" @click="page--"><ArrowLeft :size="16"/>Նախորդ</button><span>{{page+1}} / {{Math.ceil(ids.length/12)}}</span><button :disabled="(page+1)*12>=ids.length" @click="page++">Հաջորդ<ArrowRight :size="16"/></button></nav>
  <LazyLibraryBookReader v-if="reader" :key="reader.id+':'+readerStart+':'+readerPosition?.page+':'+readerPosition?.line" :book="reader" :start="readerStart" :position="readerPosition" @close="reader=null"/>
 </div>
</template>
<style scoped>
.library-storage-note{font-size:12px;color:#9fb2c5;line-height:1.8;margin-bottom:16px}.saved-book-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.saved-book{padding:20px;border:1px solid #bba16b40;border-radius:14px;background:#0b1a2d}.saved-book header{display:flex;gap:16px;align-items:center}.saved-book header img{width:70px;height:100px;object-fit:cover;border-radius:5px}.saved-book h3{font-size:17px;color:#ecdbb8}.saved-book header p{font-size:12px;color:#aebed0;margin-top:8px}.saved-book header span{font-size:11px;color:#c7ad7c}.saved-book-actions{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:18px}.saved-book-actions>button{display:flex;align-items:center;gap:7px;padding:9px 11px;border:1px solid #bba16b60;border-radius:8px;font-size:11px;color:#e5cfa7}.saved-book-actions>.resume-book{background:#1a4945;border-color:#71b8a7;color:#d3f6eb}.resume-book span{display:grid;gap:5px;text-align:left}.resume-book small{font-size:10px;color:#a6d6c9}.saved-book-marks{list-style:none;padding:0;margin-top:16px;display:grid;gap:9px}.saved-book-marks li{display:flex;gap:10px;border-top:1px solid #8295ae30;padding-top:12px}.saved-book-marks li>button:first-child{display:flex;align-items:flex-start;gap:9px;text-align:left;flex:1;min-width:0;font-size:12px;color:#d4bc88}.saved-book-marks span{min-width:0}.saved-book-marks small{display:block;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:8px;color:#c3cedc;font-size:12px;line-height:1.8}.remove-mark{align-self:flex-start;padding:8px;color:#91a5b8}.more-marks{font-size:12px;color:#d6bd8b;margin-top:14px}.saved-book-pagination{display:flex;justify-content:center;gap:20px;margin-top:24px;font-size:12px}.saved-book-pagination button{display:flex;align-items:center;gap:8px}button:disabled{opacity:.4}button:focus-visible{outline:2px solid #d9bd87;outline-offset:-2px}@media(max-width:750px){.saved-book-grid{grid-template-columns:minmax(0,1fr)}.saved-book{padding:16px}}
.saved-book-actions>.resume-book{padding:6px 8px;gap:5px;font-size:10px;border-radius:6px}.resume-book span{gap:2px;line-height:1.35}.resume-book small{font-size:9px}.resume-book>svg{width:12px;height:12px}
.saved-book-actions>button{height:36px;min-height:36px;box-sizing:border-box;padding:5px 10px}.saved-book-actions>.resume-book{height:36px;min-height:36px;padding:4px 8px}
.saved-book-actions>.resume-book{white-space:nowrap}.resume-book span{display:inline;font-size:10px;line-height:1.35}
.resume-book span{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.saved-book-actions{flex-wrap:nowrap;min-width:0}.saved-book-actions>button{flex:0 0 auto;min-width:0;white-space:nowrap}.saved-book-actions>.resume-book{flex:0 1 auto;overflow:hidden}.resume-book>svg{flex:0 0 12px}.resume-book span{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.saved-book-actions>button:last-child:not(.resume-book){margin-left:auto;font-size:0;padding:8px}.saved-book-actions>button:last-child:not(.resume-book)>svg{width:15px;height:15px}
.saved-book-marks li{border:1px solid #8295ae30;border-radius:8px;padding:10px;transition:border-color .16s ease,background-color .16s ease}@media(hover:hover) and (pointer:fine){.saved-book-marks li:hover{border-color:#d9bd87;background:#bc9c6112}}@media(prefers-reduced-motion:reduce){.saved-book-marks li{transition:none}}
@media(hover:hover) and (pointer:fine){.saved-book-marks li>button:first-child:hover{color:#d4bc88;filter:none;outline:none}}
</style>
