<script setup lang="ts">
import {Volume2,Play,Pause,RotateCcw,SkipBack,SkipForward} from 'lucide-vue-next'
import {audioTime,parseBookAudioPosition} from '~/utils/library/audio'
import type {BiographyVoice} from '~/utils/biographySpeech'

const props=defineProps<{bookId:string}>()
const player=ref<HTMLAudioElement>()
const voice=ref<BiographyVoice>('male'),speed=ref(1)
const state=ref<'idle'|'loading'|'reading'|'paused'|'finished'>('idle')
const available=ref<boolean|null>(null),error=ref(''),storageError=ref(false)
const part=ref(0),seconds=ref(0),elapsed=ref(0),duration=ref(0)
const count=ref(0),estimatedSeconds=ref(0),hasPosition=ref(false)
const displayedTotal=computed(()=>state.value==='finished'?elapsed.value:Math.max(estimatedSeconds.value,Math.ceil(elapsed.value)+1))
const completion=computed(()=>state.value==='finished'?100:Math.min(99,displayedTotal.value?elapsed.value/displayedTotal.value*100:0))
const endpoint=computed(()=>`/api/library/${encodeURIComponent(props.bookId)}/speech`)
const storageKey=computed(()=>`factum-library-audio:${props.bookId}`)
let baseElapsed=0,generation=0,lastSaved=0,audioUrl=''
let request:AbortController|undefined
let prepared:{part:number;controller:AbortController;audio:Promise<Blob|null>}|undefined
let statusRequest:Promise<boolean>|undefined

function save(force=false){
 if(!force&&Date.now()-lastSaved<3000)return
 lastSaved=Date.now()
 try{localStorage.setItem(storageKey.value,JSON.stringify({part:part.value,seconds:seconds.value,elapsed:elapsed.value,voice:voice.value,updatedAt:Date.now()}));hasPosition.value=elapsed.value>0||part.value>0;storageError.value=false}catch{storageError.value=true}
}
function progress(){
 if(!audioUrl||!duration.value||state.value==='loading'||!player.value||!Number.isFinite(player.value.currentTime))return
 seconds.value=player.value.currentTime
 elapsed.value=baseElapsed+seconds.value
 save()
}
function release(){
 const audio=player.value
 const previousUrl=audioUrl;audioUrl=''
 if(audio){audio.pause();audio.onloadedmetadata=null;audio.removeAttribute('src');audio.load()}
 if(previousUrl)URL.revokeObjectURL(previousUrl)
 duration.value=0
}
function stop(){
 progress();save(true);generation++;request?.abort();request=undefined;prepared?.controller.abort();prepared=undefined;release();state.value='idle'
}
function status(){
 if(!statusRequest)statusRequest=$fetch<{available:boolean;chunks:number;estimatedSeconds:number}>(endpoint.value).then(result=>{
  available.value=result.available;count.value=result.chunks;estimatedSeconds.value=result.estimatedSeconds
  return result.available&&result.chunks>0
 }).finally(()=>{statusRequest=undefined})
 return statusRequest
}
async function fetchPart(index:number,signal:AbortSignal){
 const response=await fetch(endpoint.value,{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({part:index,voice:voice.value})})
 if(!response.ok){if(response.status===503)available.value=false;throw new Error('Speech unavailable')}
 return response.blob()
}
function prepareNext(token:number){
 if(token!==generation||part.value+1>=count.value||prepared)return
 const controller=new AbortController(),next=part.value+1
 prepared={part:next,controller,audio:fetchPart(next,controller.signal).catch(()=>null)}
}
async function playPart(token:number){
 if(!player.value||token!==generation)return
 state.value='loading'
 try{
  let blob:Blob|null=null
  if(prepared?.part===part.value){const next=prepared;prepared=undefined;request=next.controller;blob=await next.audio}
  if(token!==generation)return
  if(!blob){request=new AbortController();blob=await fetchPart(part.value,request.signal)}
  if(token!==generation)return
  release();audioUrl=URL.createObjectURL(blob)
  const audio=player.value
  audio.src=audioUrl;audio.playbackRate=speed.value;audio.preservesPitch=true
  audio.onloadedmetadata=()=>{
   duration.value=Number.isFinite(audio.duration)?audio.duration:0
   if(seconds.value>0&&duration.value>0)audio.currentTime=Math.min(seconds.value,Math.max(0,duration.value-.1))
  }
  try{await audio.play();if(token===generation){state.value='reading';prepareNext(token)}}
  catch(failure){if(token!==generation)return;if(failure instanceof DOMException&&failure.name==='NotAllowedError'){state.value='paused';error.value='Ձայնը պատրաստ է։ Սեղմիր «Շարունակել»։'}else throw failure}
 }catch{
  if(token!==generation)return
  stop();error.value=available.value===false?'Ձայնային ծառայությունը դեռ միացված չէ։':'Չհաջողվեց բեռնել գրքի ձայնը։ Փորձիր կրկին։'
 }
}
async function play(){
 error.value=''
 if(available.value===false){error.value='Ձայնային ծառայությունը դեռ միացված չէ։';return}
 if(state.value==='paused'&&audioUrl&&player.value){try{await player.value.play();state.value='reading';prepareNext(generation)}catch{error.value='Չհաջողվեց շարունակել լսումը։'}return}
 const token=++generation
 state.value='loading'
 try{if(available.value===null&&!(await status())){state.value='idle';error.value='Ձայնային ծառայությունը դեռ միացված չէ։';return}if(token!==generation)return;if(part.value>=count.value){part.value=0;seconds.value=0;elapsed.value=0;baseElapsed=0}await playPart(token)}
 catch{if(token===generation){state.value='idle';error.value='Չհաջողվեց սկսել գրքի լսումը։'}}
}
function pause(){progress();player.value?.pause();state.value='paused';save(true)}
function ended(){
 const finishedDuration=Number.isFinite(player.value?.duration)?player.value!.duration:seconds.value
 baseElapsed+=finishedDuration;elapsed.value=baseElapsed;seconds.value=0;part.value++
 save(true)
 if(part.value>=count.value){generation++;prepared?.controller.abort();prepared=undefined;release();state.value='finished';save(true)}
 else void playPart(generation)
}
function skip(amount:number){
 if(!player.value||!duration.value)return
 player.value.currentTime=Math.max(0,Math.min(player.value.currentTime+amount,duration.value))
 progress();save(true)
}
function restart(){
 stop();part.value=0;seconds.value=0;elapsed.value=0;baseElapsed=0;state.value='idle';save(true);void play()
}
watch(speed,value=>{if(player.value){player.value.playbackRate=value;player.value.preservesPitch=true}})
watch(voice,()=>{if(state.value!=='idle'){stop();seconds.value=0;elapsed.value=baseElapsed;save(true)}})
onMounted(()=>{
 try{const raw=localStorage.getItem(storageKey.value);if(raw){const saved=parseBookAudioPosition(JSON.parse(raw));part.value=saved.part;seconds.value=saved.seconds;elapsed.value=saved.elapsed;baseElapsed=saved.elapsed-saved.seconds;voice.value=saved.voice;hasPosition.value=saved.updatedAt>0&&(saved.elapsed>0||saved.part>0)}}catch{storageError.value=true}
 window.addEventListener('pagehide',onPageHide)
 void status().then(ready=>{if(!ready)error.value='Ձայնային ծառայությունը դեռ միացված չէ։'}).catch(()=>{})
})
function onPageHide(){progress();save(true)}
onBeforeUnmount(()=>{window.removeEventListener('pagehide',onPageHide);stop()})
</script>

<template>
 <section class="book-audio" aria-label="Գրքի ձայնային ընթերցում">
  <div class="audio-heading"><Volume2 :size="18" aria-hidden="true"/><strong>Լսել գիրքը</strong></div>
  <div class="audio-settings"><VoiceChoice v-model="voice" :name="`book-audio-${bookId}`"/><label>Արագություն <select v-model.number="speed" aria-label="Լսելու արագություն"><option v-for="value in [0.8,1,1.25,1.5,1.75,2]" :key="value" :value="value">{{value}}×</option></select></label></div>
  <audio ref="player" preload="none" @timeupdate="progress" @ended="ended"/>
  <div class="audio-actions"><button type="button" :disabled="state==='loading'||available===false" @click="state==='reading'?pause():play()"><Pause v-if="state==='reading'" :size="16"/><Play v-else :size="16"/>{{state==='loading'?'Պատրաստվում է…':state==='reading'?'Դադար տալ':state==='paused'?'Շարունակել':state==='finished'?'Կրկին լսել':hasPosition?'Շարունակել լսումը':'Սկսել լսել'}}</button><button type="button" :disabled="!duration" aria-label="15 վայրկյան հետ" @click="skip(-15)"><SkipBack :size="16"/>15 վրկ</button><button type="button" :disabled="!duration" aria-label="15 վայրկյան առաջ" @click="skip(15)">15 վրկ<SkipForward :size="16"/></button><button type="button" :disabled="state==='loading'" @click="restart"><RotateCcw :size="15"/>Սկզբից</button></div>
  <div class="audio-clock"><span>Լսված է</span><strong role="timer">{{audioTime(elapsed)}}</strong><span v-if="estimatedSeconds">/ {{state==='finished'?'Ընդհանուր՝ ':'Մոտավոր ամբողջ տևողությունը՝ '}}{{audioTime(displayedTotal)}}</span></div>
  <div v-if="estimatedSeconds" class="audio-progress-meta"><span>Լսման առաջընթաց</span><span>{{Math.floor(completion)}}%</span></div>
  <progress v-if="estimatedSeconds" class="audio-total-progress" :value="completion" max="100" :aria-label="`Լսված է գրքի մոտ ${Math.floor(completion)} տոկոսը`"/>
  <p v-if="estimatedSeconds&&state!=='finished'" class="audio-estimate">Ամբողջ տևողությունը մոտավոր է։</p>
  <p class="audio-position" role="status">{{error|| (state==='finished'?'Գիրքն ավարտված է։':state==='loading'?'Ձայնը պատրաստվում է…':state==='reading'?'Գիրքը հնչում է։':state==='paused'?'Դադար է տրված։ Շարունակիր պահված տեղից։':hasPosition?'Պահված տեղից կարող ես շարունակել լսումը։':'Ընտրիր ձայնը և սկսիր լսել։')}}</p>
  <p v-if="storageError" class="audio-warning" role="alert">Այս բրաուզերը չի թույլատրում պահպանել լսման տեղը։</p>
 </section>
</template>

<style scoped>
.book-audio{margin:0 24px 12px;padding:14px 16px;border:1px solid var(--reader-line);border-radius:12px;background:#bca16c0b;font-size:11px;color:var(--reader-text)}
.audio-heading,.audio-actions,.audio-settings{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.audio-heading{color:#d0ae73}.audio-heading strong{font-size:13px}
.audio-settings{justify-content:space-between;margin:12px 0}.audio-settings label{display:flex;align-items:center;gap:8px}.audio-settings select{padding:6px 8px;border:1px solid var(--reader-line);border-radius:7px;background:var(--reader-bg);color:var(--reader-text)}
.audio-actions button{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:6px 9px;border:1px solid var(--reader-line);border-radius:7px;color:var(--reader-text)}.audio-actions button:first-child{border-color:#c7a568;background:#c7a56820;font-weight:700}.audio-actions button:hover:not(:disabled),.audio-actions button:focus-visible{border-color:#d9bd87}.audio-actions button:disabled{opacity:.45}
.audio-clock{display:flex;align-items:baseline;gap:12px;margin-top:12px;padding:12px 14px;border:1px solid var(--reader-line);border-radius:8px;color:var(--reader-muted)}.audio-clock strong{color:#eacb91;font-size:22px;font-variant-numeric:tabular-nums;letter-spacing:.04em;white-space:nowrap}.audio-clock>span:last-child{margin-left:auto}.audio-progress-meta{display:flex;justify-content:space-between;gap:12px;margin-top:10px;color:var(--reader-muted);font-size:10px}.audio-total-progress{display:block;width:100%;height:8px;margin-top:5px;border:0;border-radius:99px;overflow:hidden;appearance:none;background:#baa16c30}.audio-total-progress::-webkit-progress-bar{background:#baa16c30;border-radius:99px}.audio-total-progress::-webkit-progress-value{background:#d1ad70;border-radius:99px}.audio-total-progress::-moz-progress-bar{background:#d1ad70;border-radius:99px}.audio-estimate{margin-top:7px;color:var(--reader-muted);font-size:10px}.audio-position,.audio-warning{margin-top:9px;color:var(--reader-muted);line-height:1.5}.audio-warning{color:#e5ad8e}
@media(max-width:600px){.book-audio{margin:0 12px 8px;padding:12px}.audio-actions{gap:6px}.audio-actions button{font-size:10px}.audio-clock{align-items:flex-start;flex-direction:column;gap:4px}}
</style>
