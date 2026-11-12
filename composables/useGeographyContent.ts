import type {GeographyArea,GeographyCategory,GeographyItem,GeographyPage} from '~/shared/geographyCms'
export function useGeographyContent(area:GeographyArea,options:{limit?:number;query?:Ref<string>;category?:Ref<string>;id?:Ref<string>;globeSearch?:boolean}={}){
 const items=shallowRef<GeographyItem[]>([]),categories=shallowRef<GeographyCategory[]>([]),total=ref(0),page=ref(0),pending=ref(false),error=ref(''),hasMore=ref(false)
 const query=options.query||ref(''),category=options.category||ref('')
 let controller:AbortController|undefined,timer:ReturnType<typeof setTimeout>|undefined,mounted=false
 async function load(append=false){
  controller?.abort();const request=new AbortController();controller=request;pending.value=true;error.value=''
  try{const next=append?page.value+1:1,response=await $fetch<GeographyPage>('/api/geography/editorial',{query:{area,page:next,limit:options.limit||6,q:query.value,category:category.value==='all'?'':category.value,id:options.id?.value||'',globeSearch:options.globeSearch?'true':'false'},signal:request.signal});if(request.signal.aborted)return;items.value=append?[...items.value,...response.items]:response.items;categories.value=response.categories;total.value=response.total;page.value=response.page;hasMore.value=response.hasMore}catch{if(!request.signal.aborted)error.value='Տվյալները չհաջողվեց բեռնել։ Փորձիր կրկին։'}finally{if(!request.signal.aborted)pending.value=false}
 }
 watch([query,category,()=>options.id?.value],()=>{controller?.abort();clearTimeout(timer);items.value=[];hasMore.value=false;if(mounted)timer=setTimeout(()=>void load(),query.value?250:0)})
 onMounted(()=>{mounted=true;void load()});onBeforeUnmount(()=>{mounted=false;controller?.abort();clearTimeout(timer)})
 return{items,categories,total,pending,error,hasMore,load,query,category}
}
