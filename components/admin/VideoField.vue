<script setup lang="ts">
import { LoaderCircle, Play, Trash2, Upload } from 'lucide-vue-next'
const props=withDefaults(defineProps<{modelValue?:string;purpose?:'preview'|'article'}>(),{purpose:'preview'})
const emit=defineEmits(['update:modelValue'])
const {user}=useAuth()
const pending=useState('cms-pending-uploads',()=>0)
const busy=ref(false),processing=ref(false),percent=ref(0),error=ref(''),result=ref(''),preview=ref(false)
watch(()=>props.modelValue,()=>{preview.value=false})
async function uploadVideo(event:Event){
 const input=event.target as HTMLInputElement,file=input.files?.[0]
 if(!file||busy.value)return
 if(file.size>25*1024*1024){error.value='Ընտրիր մինչև 25 ՄԲ վիդեո։';input.value='';return}
 if(!/\.(mp4|webm)$/i.test(file.name)||!user.value){error.value='Ընտրիր MP4 կամ WebM ֆայլ։';input.value='';return}
 busy.value=true;pending.value++;error.value='';result.value='';percent.value=0
 try{
  const {upload}=await import('@vercel/blob/client')
  const extension=/\.webm$/i.test(file.name)?'webm':'mp4'
  const source=await upload(`factum/video-source/${user.value.id}/${crypto.randomUUID()}.${extension}`,file,{access:'public',handleUploadUrl:'/api/admin/video-token',contentType:extension==='webm'?'video/webm':'video/mp4',onUploadProgress:progress=>{percent.value=Math.round(progress.percentage)}})
  processing.value=true
  const optimized=await $fetch<{url:string;bytes:number;sourceBytes:number}>('/api/admin/video-optimize',{method:'POST',body:{url:source.url,purpose:props.purpose},timeout:60000,retry:0})
  emit('update:modelValue',optimized.url)
  result.value=props.purpose==='article'?`Պատրաստ է․ ${(optimized.bytes/1024).toFixed(0)} ԿԲ · ամբողջ տևողությունն ու ձայնը պահպանված են։`:`Պատրաստ է․ ${(optimized.bytes/1024).toFixed(0)} ԿԲ · մինչև 8 վրկ · առանց ձայնի։`
 }catch(e:any){error.value=e.data?.statusMessage||'Վիդեոն չվերբեռնվեց կամ չմշակվեց։ Փորձիր կրկին։'}finally{busy.value=false;processing.value=false;pending.value=Math.max(0,pending.value-1);input.value=''}
}
</script>
<template><div class="video-field"><p v-if="purpose==='preview'" class="video-hint">Վերբեռնիր վիդեոն․ համակարգը կստեղծի մինչև 8 վայրկյան տևողությամբ, առավելագույնը 960×540 չափերով, սեղմված և առանց ձայնի MP4 նախադիտում։</p><p v-else class="video-hint">Կցիր YouTube/Vimeo կամ HTTPS MP4/WebM հղում, կամ վերբեռնիր ֆայլ։ Ֆայլը կսեղմվի՝ պահպանելով ամբողջ տևողությունն ու ձայնը։</p><label v-if="purpose==='article'" class="video-link">Վիդեոյի հղում<input type="url" :value="modelValue || ''" :disabled="busy" placeholder="https://www.youtube.com/watch?v=…" @input="emit('update:modelValue',($event.target as HTMLInputElement).value)"></label><div v-if="modelValue" class="video-current"><ArticleVideo v-if="purpose==='article'" :src="modelValue" /><video v-else-if="preview" :src="modelValue" controls autoplay muted playsinline preload="none"/><button v-else-if="purpose==='preview'" type="button" class="preview-button" @click="preview=true"><Play :size="18"/>Դիտել նախադիտումը</button><button type="button" :disabled="busy" class="remove-video" @click="emit('update:modelValue','');result='' "><Trash2 :size="14"/>Հեռացնել վիդեոն</button></div><label class="video-upload"><LoaderCircle v-if="busy" :size="18" class="spinning"/><Upload v-else :size="18"/>{{busy?(processing?'Օպտիմիզացվում է…':`Վերբեռնվում է՝ ${percent}%`):modelValue?'Փոխել և օպտիմիզացնել վիդեոն':'Վերբեռնել և օպտիմիզացնել վիդեոն'}}<input type="file" accept="video/mp4,video/webm" :disabled="busy" @change="uploadVideo"></label><small>MP4 կամ WebM · սկզբնական ֆայլը՝ մինչև 25 ՄԲ։ {{ purpose==='article'?'Հարցի նկարը կօգտագործվի նաև վիդեոյի նախնական ցուցադրման համար։':'Քարտի նախնական նկարը ընտրիր վերևի նկարի դաշտում։' }}</small><p v-if="error" role="alert" class="video-error">{{error}}</p><p v-if="result" role="status" class="video-success">{{result}} Հրապարակիր նյութը՝ փոփոխությունը կայքում տեսնելու համար։</p></div></template>
<style scoped>.video-link{display:grid;gap:8px;font-size:12px;color:#aabbd2}.video-link input{width:100%;padding:12px;border:1px solid #304661;border-radius:10px;background:#071426;color:inherit}.video-field{display:grid;gap:12px}.video-hint{font-size:11px;line-height:1.9;color:#8da2be}.video-upload{display:flex;align-items:center;justify-content:center;gap:9px;border:1px dashed #526989;border-radius:11px;padding:16px;background:#13243a80;color:#ebc78a;font-size:12px;cursor:pointer}.video-upload:has(input:disabled){opacity:.6;cursor:wait}.video-upload input{display:none}.video-current{display:grid;gap:10px;padding:15px;border:1px solid #304661;border-radius:11px;background:#071426}.video-current video{width:100%;max-height:260px;border-radius:8px}.preview-button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:70px;color:#d8bd87;font-size:12px}.remove-video{display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:10px;color:#c89896}.video-field>small{font-size:10px;line-height:1.9;color:#8196b3}.video-error,.video-success{font-size:11px;line-height:1.9;padding:12px;border-radius:9px}.video-error{color:#efb0a6;background:#efb0a60a}.video-success{color:#9ac9b0;background:#9ac9b00a}.spinning{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
</style>
