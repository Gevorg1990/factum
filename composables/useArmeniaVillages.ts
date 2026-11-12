export type ArmeniaVillage={id:string;name:string;coordinates:[number,number];point:[number,number];kind:'village'|'hamlet';municipality:string;source:string}
export type ArmeniaVillageCollection={region:string;updated:string;source:string;license:string;items:ArmeniaVillage[]}
export function useArmeniaVillages(region:Ref<string>,enabled:Ref<boolean>){
 const query=ref(''),items=shallowRef<ArmeniaVillage[]>([]),loading=ref(false),error=ref(''),limit=ref(20),updated=ref('')
 const cache=new Map<string,ArmeniaVillageCollection>()
 let controller:AbortController|undefined
 const filtered=computed(()=>{const term=query.value.normalize('NFC').toLocaleLowerCase('hy-AM').trim();return term?items.value.filter(item=>item.name.normalize('NFC').toLocaleLowerCase('hy-AM').includes(term)):items.value})
 const visibleVillages=computed(()=>filtered.value.slice(0,limit.value))
 watch(query,()=>{limit.value=20})
 watch([region,enabled],async([id,show],previous)=>{
  controller?.abort();controller=new AbortController();const signal=controller.signal
  if(!show||id!==previous?.[0])query.value=''
  items.value=[];limit.value=20;error.value='';loading.value=false
  if(!show)return
  loading.value=true
  try{
   const data=cache.get(id)||await $fetch<ArmeniaVillageCollection>(`/data/armenia/villages/${id}.json`,{signal})
   if(signal.aborted)return
   cache.set(id,data);items.value=data.items;updated.value=data.updated
  }catch(e){if(!signal.aborted)error.value='Գյուղերի ցանկը չհաջողվեց բեռնել։ Փակիր և կրկին բացիր ցանկը։'}finally{if(!signal.aborted)loading.value=false}
 })
 onBeforeUnmount(()=>controller?.abort())
 return{query,items,filtered,visibleVillages,loading,error,limit,updated}
}
