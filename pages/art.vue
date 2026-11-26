<script setup lang="ts">
import {ArrowLeft, ExternalLink, Images, Move3D, Search, X} from 'lucide-vue-next'
import {visibleGalleryArtworks,galleryRooms,type GalleryArtwork} from '~/data/art/gallery'
import {artistPortraits} from '~/data/art/artistPortraits'
import {galleryFirstFrontRoom,galleryRoomForSlot} from '~/utils/art/galleryLayout'
import {galleryBranch,galleryBranchName} from '~/utils/art/galleryBranches'

const requestFetch=useRequestFetch()
const route=useRoute()
const linkedArtist=computed(()=>typeof route.query.artist==='string'?route.query.artist:'')
const linkedArtwork=computed(()=>typeof route.query.artwork==='string'?route.query.artwork:'')
const {data:cmsPage}=await useAsyncData('art-gallery-cms',async()=>{
  try{return await requestFetch<{core:GalleryArtwork[];items:GalleryArtwork[];total:number;branches:number[]}>('/api/art/gallery',{query:{offset:0,limit:24}})}
  catch{return {core:visibleGalleryArtworks,items:[],total:0,branches:[]}}
})
const coreArtworks=ref<GalleryArtwork[]>(cmsPage.value?.core||[])
const cmsArtworks=ref<GalleryArtwork[]>(cmsPage.value?.items||[])
const cmsTotal=ref(cmsPage.value?.total||0)
const branchRooms=ref(cmsPage.value?.branches??[])
const loadingMore=ref(false)
const allArtworks=computed(()=>[...coreArtworks.value,...cmsArtworks.value])
const searchQuery=ref('')
const searchResults=ref<GalleryArtwork[]>([])
const searchGroups=computed(()=>Array.from(searchResults.value.reduce((groups,item)=>{
  const works=groups.get(item.creator)||[]
  works.push(item)
  groups.set(item.creator,works)
  return groups
},new Map<string,GalleryArtwork[]>())).sort((a,b)=>b[1].length-a[1].length))
const searchLoading=ref(false)
const searchError=ref(false)
const searchHasMore=ref(false)
const linkedArtworkError=ref(false)
let searchTimer:ReturnType<typeof setTimeout>|undefined
let searchVersion=0
let artworkLinkVersion=0
const lastRoom=computed(()=>Math.max(galleryFirstFrontRoom,...coreArtworks.value.map(item=>item.room>=6?(galleryBranch(item.room)?.parent??item.room):galleryFirstFrontRoom),...branchRooms.value.map(room=>galleryBranch(room)!.parent),...cmsArtworks.value.map((item,index)=>{
  const room=item.room??galleryRoomForSlot(item.gallerySlot??index)
  return galleryBranch(room)?.parent??room
})))

const gallery=ref<{focusArtwork:(id:string)=>boolean}>()
const modalTarget=shallowRef<HTMLElement|'body'>('body')
const frame=ref<HTMLElement>()
const selected=ref<GalleryArtwork|null>(null)
const closeButton=ref<HTMLButtonElement>()
let previousFocus:HTMLElement|null=null
let previousRootOverflow=''
let previousBodyOverflow=''
const room=ref(0)
const ready=ref(false)
const artistGroups=computed(()=>Array.from(allArtworks.value.reduce((groups,item)=>{
  const works=groups.get(item.creator)||[]
  works.push(item)
  groups.set(item.creator,works)
  return groups
},new Map<string,GalleryArtwork[]>())).sort((a,b)=>b[1].length-a[1].length))
function roomName(index?:number){return index===undefined?'Պատկերասրահ':galleryRooms[index]?.name||galleryBranchName(index)||`Պատկերասրահի նոր սրահ ${index-5}`}
function portraitFor(creator:string,works:GalleryArtwork[]){return artistPortraits[creator]?.image||works.find(item=>item.creatorPortrait)?.creatorPortrait}
function loadedArtwork(id:string){return allArtworks.value.find(item=>item.id===id)}
async function searchWorks(version:number,reset:boolean){
  const q=searchQuery.value.trim()
  if(!q||searchLoading.value&&!reset)return
  searchLoading.value=true
  searchError.value=false
  try{
    const match=q===linkedArtist.value?{artist:q}:{q}
    const page=await $fetch<{items:GalleryArtwork[];hasMore:boolean}>('/api/art/search',{query:{...match,offset:reset?0:searchResults.value.length}})
    if(version!==searchVersion)return
    searchResults.value=reset?page.items:[...searchResults.value,...page.items]
    searchHasMore.value=page.hasMore
  }catch{
    if(version===searchVersion)searchError.value=true
  }finally{
    if(version===searchVersion)searchLoading.value=false
  }
}
watch(searchQuery,()=>{
  clearTimeout(searchTimer)
  const version=++searchVersion
  searchResults.value=[]
  searchHasMore.value=false
  searchError.value=false
  searchLoading.value=Boolean(searchQuery.value.trim())
  if(searchQuery.value.trim())searchTimer=setTimeout(()=>searchWorks(version,true),250)
})
async function loadMore(){
  if(loadingMore.value||cmsArtworks.value.length>=cmsTotal.value)return
  loadingMore.value=true
  try{
    const page=await $fetch<{items:GalleryArtwork[];total:number;branches:number[]}>('/api/art/gallery',{query:{offset:cmsArtworks.value.length,limit:24}})
    cmsTotal.value=page.total
    branchRooms.value=page.branches
    ready.value=false
    cmsArtworks.value=[...cmsArtworks.value,...page.items]
  }finally{loadingMore.value=false}
}
function jumpToArtwork(item:GalleryArtwork){if(gallery.value?.focusArtwork(item.id))frame.value?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});else open(item)}
function open(item:GalleryArtwork){previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;selected.value=item;nextTick(()=>closeButton.value?.focus())}
function openSearchResult(item:GalleryArtwork){open(loadedArtwork(item.id)||item)}
function visitSearchResult(item:GalleryArtwork){const loaded=loadedArtwork(item.id);if(loaded&&ready.value)jumpToArtwork(loaded);else openSearchResult(item)}
function select(id:string){const item=allArtworks.value.find(item=>item.id===id);if(item)open(item)}
async function openLinkedArtwork(id:string){
  const version=++artworkLinkVersion
  linkedArtworkError.value=false
  if(!id)return
  try{
    const item=loadedArtwork(id)??(await $fetch<{items:GalleryArtwork[]}>('/api/art/search',{query:{artwork:id}})).items[0]
    if(version!==artworkLinkVersion)return
    if(item)open(item)
    else linkedArtworkError.value=true
  }catch{
    if(version===artworkLinkVersion)linkedArtworkError.value=true
  }
}
function close(){
  selected.value=null
  nextTick(()=>previousFocus?.focus({preventScroll:true}))
  if(linkedArtwork.value){
    void navigateTo({path:route.path,query:{...route.query,artwork:undefined},hash:route.hash},{replace:true})
  }
}
watch(selected,(item,previous)=>{
  if(item&&!previous){
    previousRootOverflow=document.documentElement.style.overflow
    previousBodyOverflow=document.body.style.overflow
    document.documentElement.style.overflow='hidden'
    document.body.style.overflow='hidden'
  }else if(!item&&previous){
    document.documentElement.style.overflow=previousRootOverflow
    document.body.style.overflow=previousBodyOverflow
  }
},{flush:'sync'})
onMounted(()=>{
  searchQuery.value=linkedArtist.value
  void openLinkedArtwork(linkedArtwork.value)
  window.addEventListener('keydown',escape)
})
watch(linkedArtist,artist=>{searchQuery.value=artist})
watch(linkedArtwork,(id,previous)=>{
  if(!id&&selected.value?.id===previous)close()
  void openLinkedArtwork(id)
})
onUnmounted(()=>{clearTimeout(searchTimer);searchVersion++;artworkLinkVersion++;window.removeEventListener('keydown',escape);if(selected.value){document.documentElement.style.overflow=previousRootOverflow;document.body.style.overflow=previousBodyOverflow}})
function escape(event:KeyboardEvent){if(event.key==='Escape')close()}
useHead({title:'Արվեստի վիրտուալ պատկերասրահ — COGNITIO',meta:[{name:'description',content:'Շրջիր COGNITIO-ի եռաչափ արվեստի սրահներում և բացահայտիր նշանավոր գեղանկարներ ու փորագրություններ։'}]})
</script>

<template>
  <main class="art-page">
    <div class="art-breadcrumb"><NuxtLink to="/"><ArrowLeft :size="17"/> Գլխավոր</NuxtLink><span>COGNITIO · ԱՐՎԵՍՏ</span></div>
    <header class="art-hero">
      <div><p class="eyebrow">ՎԻՐՏՈՒԱԼ ՊԱՏԿԵՐԱՍՐԱՀ</p><h1>Արվեստի <em>սրահներ</em></h1><p>Մտիր բարձր առաստաղով կենտրոնական դահլիճ, անցիր չորս ուղղությամբ բաց սրահներ և բացահայտիր մեծածավալ գեղանկարներ ու փորագրություններ։</p></div>
      <div class="hero-mark" aria-hidden="true"><Images :size="43" :stroke-width="1"/><span>COGNITIO</span></div>
    </header>
    <p v-if="linkedArtworkError" class="art-search-status" role="status">Չհաջողվեց բացել պատկերասրահի այս գործը։</p>
    <section ref="frame" class="art-frame" aria-label="Եռաչափ արվեստի պատկերասրահ">
      <ClientOnly><LazyArtVirtualGallery :key="`${coreArtworks.length}-${cmsArtworks.length}`" ref="gallery" :core-artworks="coreArtworks" :cms-artworks="cmsArtworks" :last-room="lastRoom" :branch-rooms="branchRooms" @ready="ready=true" @room="room=$event" @select="select" @fullscreen="modalTarget=$event||'body'"/><template #fallback><div class="art-placeholder">Բացվում են արվեստի սրահները…</div></template></ClientOnly>
    </section>
    <div class="art-frame-caption"><span><Move3D :size="17"/> Կրկնակի սեղմիր հատակին՝ քայլելու համար․ անցումները միշտ բաց են</span><span>Ընթացիկ սրահ՝ {{roomName(room)}}</span></div>
    <button v-if="cmsArtworks.length<cmsTotal" type="button" class="art-load-rooms" :disabled="loadingMore" @click="loadMore">{{loadingMore?'Բեռնվում են…':`Բացել հաջորդ սրահները (${cmsTotal-cmsArtworks.length} գործ)`}}</button>
    <section id="gallery-works" class="artist-section" aria-label="Նկարիչների գործերը">
      <div class="collection-heading"><div><p class="eyebrow">ԳՈՐԾԵՐԻ ՈՐՈՆՈՒՄ</p><h2>Գտիր նկարը կամ հեղինակին</h2></div></div>
      <div class="art-search"><label for="artwork-search">Որոնել բոլոր գործերում</label><div class="art-search-field"><Search :size="19" aria-hidden="true"/><input id="artwork-search" v-model="searchQuery" type="search" maxlength="100" autocomplete="off" placeholder="Գործի անունը կամ հեղինակը"/></div></div>
      <template v-if="searchQuery.trim()">
        <p v-if="searchLoading && !searchResults.length" class="art-search-status" role="status">Որոնվում է…</p>
        <p v-else-if="searchError" class="art-search-status" role="status">Որոնումը չհաջողվեց։ Փորձիր կրկին։</p>
        <p v-else-if="!searchResults.length" class="art-search-status" role="status">Համընկնող գործ չի գտնվել։</p>
        <div v-if="searchResults.length" class="artist-grid" aria-label="Որոնման արդյունքներ"><article v-for="[creator,works] in searchGroups" :key="creator" class="artist-card"><div class="artist-preview"><img v-if="portraitFor(creator,works)" :src="portraitFor(creator,works)" :alt="`${creator}՝ դիմանկար`" width="96" height="90" loading="lazy" decoding="async"/><div><small>{{works.length}} գտնված գործ</small><h3>{{creator}}</h3><p v-if="works.find(work=>work.creatorInfo)?.creatorInfo||artistPortraits[creator]?.bio" class="artist-bio">{{works.find(work=>work.creatorInfo)?.creatorInfo||artistPortraits[creator]?.bio}}</p></div></div><div class="artist-works"><button v-for="work in works" :key="work.id" type="button" @click="visitSearchResult(work)"><span>{{work.title}}</span><small>{{work.date}} ↗</small></button></div></article></div>
        <button v-if="searchHasMore" type="button" class="art-show-more" :disabled="searchLoading" @click="searchWorks(searchVersion,false)">{{searchLoading?'Բեռնվում է…':'Ցույց տալ ավելին'}}</button>
      </template>
      <div v-else class="artist-grid"><article v-for="[creator,works] in artistGroups" :key="creator" class="artist-card"><div class="artist-preview"><img v-if="portraitFor(creator,works)" :src="portraitFor(creator,works)" :alt="`${creator}՝ դիմանկար`" width="96" height="90" loading="lazy" decoding="async"/><div><small>{{works.length}} գործ</small><h3>{{creator}}</h3><p v-if="works.find(work=>work.creatorInfo)?.creatorInfo||artistPortraits[creator]?.bio" class="artist-bio">{{works.find(work=>work.creatorInfo)?.creatorInfo||artistPortraits[creator]?.bio}}</p></div></div><div class="artist-works"><button v-for="work in works" :key="work.id" type="button" :disabled="!ready" @click="jumpToArtwork(work)"><span>{{work.title}}</span><small>{{work.date}} ↗</small></button></div></article></div>
    </section>
    <Teleport :to="modalTarget"><div v-if="selected" class="art-modal-backdrop" @click.self="close"><section class="art-detail" role="dialog" aria-modal="true" :aria-label="selected.title"><button ref="closeButton" type="button" class="art-detail-close" aria-label="Փակել" @click="close"><div aria-hidden="true"><X :size="20"/></div></button><div class="art-detail-image"><img :src="selected.image" :alt="selected.originalTitle" width="600" height="500"/><p v-if="selected.imageCredit">{{selected.imageCredit}}</p></div><div class="art-detail-copy"><p class="eyebrow">{{roomName(selected.room)}} · {{selected.medium}}</p><h2>{{selected.title}}</h2><p class="original-title">{{selected.originalTitle}}</p><dl><div><dt>Հեղինակ</dt><dd>{{selected.creator}}</dd></div><div><dt>Թվագրում</dt><dd>{{selected.date}}</dd></div><div v-if="selected.location"><dt>Գտնվելու վայր</dt><dd>{{selected.location}}</dd></div><div v-if="selected.dimensions"><dt>Չափեր</dt><dd>{{selected.dimensions}}</dd></div></dl><h3>Գործի մասին</h3><p class="art-description">{{selected.description}}</p><p v-if="selected.context" class="art-description">{{selected.context}}</p><div v-if="selected.lookFor" class="art-look"><strong>Ինչ նկատել սրահում</strong><p>{{selected.lookFor}}</p></div><a v-if="selected.source" :href="selected.source" target="_blank" rel="noopener noreferrer"><ExternalLink :size="16"/> Թանգարանի կամ արխիվի գրառումը</a><p v-if="selected.imageSource||selected.imageLicense" class="image-credit">Պատկեր՝ <a v-if="selected.imageSource" :href="selected.imageSource" target="_blank" rel="noopener noreferrer">աղբյուր</a><template v-if="selected.imageLicense"><span v-if="selected.imageSource"> · </span><a :href="selected.imageLicense" target="_blank" rel="noopener noreferrer">արտոնագիր</a></template></p><p v-if="selected.modelSource" class="image-credit">3D մոդել՝ {{selected.modelCredit}} · <a :href="selected.modelSource" target="_blank" rel="noopener noreferrer">աղբյուր</a></p></div></section></div></Teleport>
  </main>
</template>

<style scoped>
.art-page{max-width:1500px;margin:auto;padding:26px 32px 65px;color:#f0ebe2}.art-breadcrumb{display:flex;justify-content:space-between;gap:15px;align-items:center;font-size:12px;letter-spacing:1.5px;color:#a6aeb5}.art-breadcrumb a{display:flex;align-items:center;gap:8px;letter-spacing:0;color:#d7c6a8}.art-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:40px 0 30px}.eyebrow{color:#d8b97e;font-size:12px;font-weight:700;letter-spacing:2.2px}.art-hero h1{margin-top:10px;font-size:clamp(32px,4vw,58px);font-weight:500;line-height:1.25}.art-hero h1 em{font-style:normal;color:#e3c58e}.art-hero>div>p:last-child{margin-top:14px;color:#b9c4cb;font-size:16px;line-height:1.7;max-width:650px}.hero-mark{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:110px;height:110px;flex-shrink:0;border:1px solid #c5a77866;border-radius:50%;color:#d9bf91}.hero-mark span{font-size:9px;letter-spacing:2px}.art-frame{height:min(71vh,740px);min-height:540px;overflow:hidden;border:1px solid #bba16d8c;border-radius:18px;background:#151d25;box-shadow:0 26px 65px #0006}.art-placeholder{display:grid;place-items:center;height:100%;color:#dec694}.art-frame-caption{display:flex;justify-content:space-between;gap:15px;padding:16px 2px;color:#aebbc3;font-size:13px}.art-frame-caption span:first-child{display:flex;align-items:center;gap:9px}.art-room-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0 44px}.art-room-nav button{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;min-height:80px;padding:15px 19px;border:1px solid #bfa57854;border-radius:10px;background:#122130;color:#dfd2b7;text-align:left;font-size:15px;transition:background .2s,border-color .2s}.art-room-nav button:first-child{flex-direction:row;justify-content:flex-start;align-items:center}.art-room-nav button small{font-size:12px;color:#c3a679}.art-room-nav button:hover,.art-room-nav button.active{background:#253749;border-color:#e4c68d;color:#fff2d7}.art-room-nav button:disabled{opacity:.45}.art-room-nav button:focus-visible,.art-card-main:focus-visible,.art-detail button:focus-visible,.art-detail a:focus-visible{outline:2px solid #efd49f;outline-offset:3px}.collection-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}.collection-heading h2{font-size:clamp(24px,2.5vw,35px);font-weight:500;margin-top:9px}.collection-heading>p{font-size:13px;color:#a7b6bf}.art-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.art-card{overflow:hidden;border:1px solid #b6a07a5c;border-radius:14px;background:#111f2e}.art-card-main{display:block;width:100%;height:100%;text-align:left}.art-card img{display:block;width:100%;height:220px;object-fit:contain;background:#1a2025;padding:12px;transition:transform .3s}.art-card:hover img{transform:scale(1.035)}.art-card-info{display:flex;flex-direction:column;gap:10px;padding:19px}.art-card-info small{font-size:12px;color:#d1ad73}.art-card-info strong{font-size:19px;line-height:1.4;color:#f4ede0}.art-card-info>span{font-size:14px;line-height:1.5;color:#b8c6cc}.art-card-info b{display:flex;align-items:center;gap:8px;margin-top:5px;padding-top:11px;border-top:1px solid #ffffff20;color:#e5ca98;font-size:13px;font-weight:600}.art-modal-backdrop{position:fixed;z-index:10000;inset:0;display:grid;place-items:center;overflow-y:auto;padding:20px;background:#030a12db}.art-detail{position:relative;z-index:1;display:grid;grid-template-columns:minmax(250px,48%) 1fr;max-width:900px;width:100%;max-height:min(88vh,800px);overflow:auto;border:1px solid #c8a76d92;border-radius:15px;background:#122131;box-shadow:0 30px 90px #000b}.art-detail>img{width:100%;height:100%;min-height:420px;max-height:800px;object-fit:contain;background:#1c2228;padding:20px}.art-detail-copy{padding:42px 33px 30px}.art-detail-copy h2{margin:10px 0;font-size:clamp(24px,2.5vw,34px);line-height:1.35}.original-title{color:#aebec8;font-size:14px}.art-detail dl{display:grid;gap:12px;margin:26px 0;padding:18px 0;border-top:1px solid #ffffff26;border-bottom:1px solid #ffffff26}.art-detail dl div{display:grid;grid-template-columns:90px 1fr;gap:10px;font-size:15px}.art-detail dt{color:#bb9d6d}.art-detail dd{color:#f0e5d2}.art-description{font-size:16px;line-height:1.8;color:#d6dee1}.art-detail-copy>a{display:inline-flex;align-items:center;gap:7px;margin-top:22px;color:#edce8e;font-size:14px;text-decoration:underline}.image-credit{margin-top:26px;font-size:12px;line-height:1.6;color:#9dabb4}.image-credit a{text-decoration:underline}.art-detail-close{position:absolute;right:15px;top:15px;display:grid;place-items:center;width:37px;height:37px;border:1px solid #ffffff73;border-radius:50%;background:#0b1728e0;color:white}
.art-frame{height:min(82vh,920px);min-height:620px}.art-room-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.art-detail{max-width:1120px;grid-template-columns:minmax(300px,48%) 1fr;max-height:90vh}.art-detail-image{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:500px;padding:24px;background:#1c2228}.art-detail-image img{display:block;width:100%;max-height:70vh;object-fit:contain}.art-detail-image p{margin-top:15px;color:#aeb9bd;font-size:12px}.art-detail-copy h3{margin:22px 0 7px;color:#e6c68e;font-size:16px}.art-description+.art-description{margin-top:15px}.art-look{margin-top:22px;padding:16px 18px;border-left:3px solid #d2af72;background:#ffffff0b;color:#d6dee1;line-height:1.7}.art-look strong{color:#e5c58f}.art-look p{margin-top:7px}.art-detail dl div{grid-template-columns:115px 1fr}
.artist-section{margin:0 0 52px}.artist-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.artist-card{overflow:hidden;border:1px solid #c9ae785c;border-radius:14px;background:#111f2e}.artist-preview small{color:#c4a773;font-size:12px}.artist-preview h3{margin-top:7px;color:#f5ead5;font-size:18px;line-height:1.4}.artist-credit{display:inline-block;margin-top:7px;color:#b5c2ca;font-size:10px;text-decoration:underline;text-underline-offset:2px}.artist-credit:hover{color:#f1d49c}.artist-credit:focus-visible{outline:2px solid #efd49f;outline-offset:2px}.artist-works{display:flex;flex-direction:column;padding:0 14px 14px}.artist-works button{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 4px;border-top:1px solid #ffffff20;color:#e6d6b9;text-align:left;font-size:13px}.artist-works button{border-left:3px solid transparent;padding-left:10px;transition:background .18s,color .18s,border-color .18s,transform .18s}.artist-works button:hover,.artist-works button:focus-visible{color:#fff5dd;background:#ddba7530;border-left-color:#e4c68d;transform:translateX(3px)}.artist-works button:hover small,.artist-works button:focus-visible small{color:#f4d49a}.artist-works button:disabled{opacity:.5}.artist-works button:focus-visible{outline:2px solid #efd49f;outline-offset:2px}.artist-works small{flex-shrink:0;color:#bb9d6d;font-size:11px}
.art-show-more{display:block;margin:28px auto 0;padding:12px 24px;border:1px solid #c7a877;border-radius:9px;background:#263749;color:#f4dfb8;font-size:14px}.art-show-more:hover{background:#354b60}.art-show-more:focus-visible{outline:2px solid #efd49f;outline-offset:3px}
@media(max-width:1000px){.art-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.art-room-nav{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.art-page{padding:18px 12px 44px}.art-hero{padding:27px 0}.hero-mark{display:none}.art-hero>div>p:last-child{font-size:14px}.art-breadcrumb>span{font-size:10px}.art-frame{height:68svh;min-height:540px;border-radius:11px}.art-frame-caption{flex-direction:column;font-size:12px}.art-room-nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:35px}.art-room-nav button{min-height:74px;padding:10px;font-size:13px}.art-room-nav button small{font-size:10px}.art-grid{grid-template-columns:1fr}.collection-heading{align-items:start;flex-direction:column}.art-detail{grid-template-columns:1fr;max-height:92vh}.art-detail>img{height:260px;min-height:0}.art-detail-copy{padding:25px 20px}.art-detail dl div{grid-template-columns:80px 1fr}}@media(prefers-reduced-motion:reduce){.art-card img,.art-room-nav button{transition:none}.art-card:hover img{transform:none}}
@media(max-width:650px){.art-detail-image{min-height:0;padding:18px}.art-detail-image img{max-height:300px}}
@media(max-width:1000px){.artist-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.artist-grid{grid-template-columns:1fr}}
.art-load-rooms{display:block;margin:-24px auto 38px;padding:12px 20px;border:1px solid #c7a877;border-radius:9px;background:#263749;color:#f4dfb8;font-size:14px}.art-load-rooms:focus-visible{outline:2px solid #efd49f;outline-offset:3px}.art-load-rooms:disabled{opacity:.5}
.artist-bio{margin-top:9px;color:#b6c4ce;font-size:12px;line-height:1.6}
.art-search{max-width:620px;margin:0 0 25px}.art-search label{display:block;margin-bottom:9px;color:#d7c6a8;font-size:13px}.art-search-field{display:flex;align-items:center;gap:10px;padding:0 14px;border:1px solid #c9ae7880;border-radius:10px;background:#111f2e;color:#d9bd83}.art-search-field:focus-within{outline:2px solid #efd49f;outline-offset:2px}.art-search-field input{width:100%;height:48px;border:0;outline:0;background:transparent;color:#f4ede0;font:inherit}.art-search-field input::placeholder{color:#9caab3}.art-search-status{padding:20px 0;color:#b8c6cc}.art-search-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.art-search-result{display:flex;justify-content:space-between;align-items:center;gap:18px;min-width:0;padding:16px;border:1px solid #c9ae785c;border-radius:10px;background:#111f2e}.art-search-result>div:first-child{display:flex;flex-direction:column;gap:5px;min-width:0}.art-search-result strong{color:#f5ead5;font-size:16px}.art-search-result small,.art-search-result span{color:#b6c4ce;font-size:12px}.art-search-actions{display:flex;flex-direction:column;gap:7px;flex-shrink:0}.art-search-actions button{padding:8px 11px;border:1px solid #c9ae7880;border-radius:7px;color:#f4dfb8;font-size:12px}.art-search-actions button:hover{background:#354b60}.art-search-actions button:focus-visible{outline:2px solid #efd49f;outline-offset:2px}.art-search-actions button:disabled{opacity:.5}
@media(max-width:800px){.art-search-results{grid-template-columns:1fr}}@media(max-width:480px){.art-search-result{align-items:flex-start;flex-direction:column}.art-search-actions{flex-direction:row}}
.art-modal-backdrop{overflow:hidden;overscroll-behavior:contain}
.art-detail{grid-template-columns:minmax(0,48%) minmax(0,1fr);height:min(90dvh,800px);max-height:calc(100dvh - 40px);overflow:hidden}
.art-detail-image{min-width:0;min-height:0;overflow:hidden}
.art-detail-image img{min-height:0;max-height:calc(90dvh - 100px)}
.art-detail-copy{min-width:0;min-height:0;overflow-y:auto;overscroll-behavior:contain}
.art-detail-close{z-index:2}
@media(max-width:650px){.art-detail{display:flex;flex-direction:column;height:92dvh;max-height:calc(100dvh - 24px)}.art-detail-image{flex:0 0 auto;max-height:35dvh;padding:12px 18px}.art-detail-image img{max-height:calc(35dvh - 38px)}.art-detail-copy{flex:1;padding:25px 20px}}
.artist-preview {
  display: flow-root;
  padding: 15px 16px;
  overflow-wrap: anywhere;
}
.artist-preview img {
  float: left;
  width: min(30%, 96px);
  height: auto;
  aspect-ratio: 16 / 15;
  margin: 0 14px 8px 0;
  object-fit: cover;
  object-position: center 28%;
  border-radius: 8px;
  background: #26333a;
}
</style>
