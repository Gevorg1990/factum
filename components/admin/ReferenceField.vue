<script setup lang="ts">
const props=defineProps<{modelValue?:string|null;kind:'CATEGORY'|'AUTHOR'|'PERSON'|'FACT_CATEGORY'|'GEO_CATEGORY';area?:string;label?:string;valueKey?:'key'|'id';placeholder?:string;required?:boolean;disabled?:boolean}>()
const emit=defineEmits(['update:modelValue'])
const options=ref<{id:string;key:string;title:string}[]>([]),current=ref<{id:string;key:string;title:string}|null>(null),query=ref(''),page=ref(1),total=ref(0),loading=ref(false),error=ref('')
let timer:ReturnType<typeof setTimeout>|undefined,request=0
const valueKey=computed(()=>props.valueKey||'key')
const visibleOptions=computed(()=>current.value&&!options.value.some(x=>x[valueKey.value]===current.value?.[valueKey.value])?[current.value,...options.value]:options.value)
async function load(append=false){const ticket=++request;loading.value=true;error.value='';try{const result=await $fetch<any>('/api/admin/options',{query:{kind:props.kind,q:query.value,page:page.value,selected:props.modelValue||'',...(props.area?{area:props.area}:{})}});if(ticket!==request)return;options.value=append?[...options.value,...result.items]:result.items;current.value=result.current;total.value=result.total}catch{error.value='Ընտրացանկը չբեռնվեց․ փորձիր կրկին։'}finally{if(ticket===request)loading.value=false}}
onMounted(()=>load())
watch(()=>props.area,()=>{page.value=1;void load()})
watch(query,()=>{clearTimeout(timer);timer=setTimeout(()=>{page.value=1;void load()},250)})
watch(()=>props.modelValue,()=>{if(props.modelValue&&!visibleOptions.value.some(x=>x[valueKey.value]===props.modelValue))void load()})
onBeforeUnmount(()=>{request++;clearTimeout(timer)})
</script>
<template><div class="reference-field"><select :aria-label="label||placeholder||'Ընտրիր ցանկից'" :value="modelValue??''" :required="required" :disabled="disabled||loading" @change="emit('update:modelValue',($event.target as HTMLSelectElement).value||null)"><option value="">{{loading?'Բեռնվում է…':placeholder||'Ընտրիր ցանկից'}}</option><option v-for="item in visibleOptions" :key="item.id" :value="item[valueKey]">{{item.title}}</option></select><details v-if="total>25||query||error" class="reference-search"><summary>Չե՞ս գտնում․ որոնիր անունով</summary><div><input v-model="query" type="search" aria-label="Որոնել ընտրացանկում" placeholder="Գրիր անվան մի մասը…"><button v-if="options.length<total" type="button" :disabled="loading" @click="page++;load(true)">Բեռնել հաջորդները</button><p v-if="!loading&&!options.length">Համապատասխան նյութ չի գտնվել։</p></div></details><p v-if="error" role="alert">{{error}} <button type="button" @click="load()">Կրկնել</button></p></div></template>
<style scoped>.reference-field{display:grid;gap:8px}select,input{width:100%;padding:12px 14px;min-height:46px;border:1px solid #304661;border-radius:10px;color:#e8effa;background:#071426;font:inherit;font-size:13px}select:focus,input:focus{outline:2px solid #e8c58166;outline-offset:2px}.reference-search{font-size:11px;color:#9eafc6}.reference-search summary{cursor:pointer}.reference-search>div{display:grid;gap:8px;margin-top:10px}button{color:#efcd8e;font-size:12px;text-align:left}p{font-size:11px;color:#f4b0a9;line-height:1.8}</style>
