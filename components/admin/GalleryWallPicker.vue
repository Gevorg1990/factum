<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Check,Plus} from 'lucide-vue-next'
import {galleryBranch,galleryBranchId} from '~/utils/art/galleryBranches'
import {firstCmsGalleryRoom,galleryFirstFrontRoom} from '~/utils/art/galleryLayout'
import type {GalleryEditorRoom,GalleryEditorWall,GalleryEditorWallSide} from '~/utils/art/galleryEditorLayout'

const props=defineProps<{rooms:GalleryEditorRoom[];walls:GalleryEditorWall[];modelValue?:number;image?:string}>()
const emit=defineEmits<{ 'update:modelValue':[slot:number] }>()
const currentRoom=ref(galleryFirstFrontRoom)
const room=computed(()=>props.rooms.find(item=>item.id===currentRoom.value))
const selectedWall=computed(()=>props.walls.find(wall=>wall.slot===props.modelValue))
watch(selectedWall,wall=>{if(wall)currentRoom.value=wall.room},{immediate:true})
watch(()=>props.rooms,rooms=>{
  if(!rooms.some(item=>item.id===currentRoom.value))currentRoom.value=rooms[0]?.id??galleryFirstFrontRoom
})

const directionLabels={left:'Ձախ',front:'Ուղիղ',right:'Աջ'} as const
const wallLabels={left:'Ձախ պատ',front:'Դիմացի պատ',right:'Աջ պատ'} as const
const directionIcons={left:ArrowLeft,front:ArrowUp,right:ArrowRight}
const directions=['left','front','right'] as const
const wallSides:Record<GalleryEditorWallSide,readonly GalleryEditorWallSide[]>={
  west:['north','east','south'],south:['west','north','east'],north:['east','south','west'],east:['south','west','north'],
}
const nextRooms=computed(()=>{
  const id=currentRoom.value
  if(galleryBranch(id))return []
  return [galleryBranchId(id,'north'),id===galleryFirstFrontRoom?firstCmsGalleryRoom:id+1,galleryBranchId(id,'south')]
})
const roomPlan=computed(()=>{
  const walls=props.walls.filter(wall=>wall.room===currentRoom.value)
  const sides=wallSides[room.value?.entrance??'west']
  return directions.map((position,index)=>{
    const wall=walls.find(item=>item.side===sides[index])
    const neighbor=props.rooms.find(item=>item.id===nextRooms.value[index])
    return {position,wall,neighbor,label:wallLabels[position]}
  })
})
</script>

<template>
  <section v-if="room" class="gallery-picker" aria-label="Պատկերասրահի քարտեզ">
    <div class="room-control">
      <label for="gallery-map-room">Սրահը քարտեզի վրա</label>
      <select id="gallery-map-room" v-model.number="currentRoom">
        <option v-for="item in rooms" :key="item.id" :value="item.id">{{item.name}}{{item.planned?' · չբացված':''}}</option>
      </select>
    </div>

    <div class="room-plan" :class="{'planned-room':room.planned}">
      <div class="floor"><span>{{room.name}}</span><small>Վերևից տեսք</small></div>
      <div v-for="edge in roomPlan" :key="edge.position" class="room-edge" :class="edge.position">
        <button v-if="edge.wall" class="wall-button" type="button" :disabled="!edge.wall.available" :aria-pressed="edge.wall.slot===modelValue" @click="emit('update:modelValue',edge.wall.slot)">
          <img v-if="edge.wall.slot===modelValue&&image" :src="image" alt="" loading="lazy" width="46" height="40">
          <Check v-else-if="edge.wall.slot===modelValue" :size="16" aria-hidden="true"/>
          <span>{{edge.label}}</span>
          <small>{{edge.wall.available?`${edge.wall.available} ազատ տեղ`:'Ազատ տեղ չկա'}}</small>
        </button>
        <button v-else-if="edge.neighbor&&!edge.neighbor.planned" type="button" class="passage" :aria-label="`Անցում դեպի ${edge.neighbor.name}`" @click="currentRoom=edge.neighbor.id">
          <component :is="directionIcons[edge.position]" :size="16" aria-hidden="true"/> Անցում
        </button>
        <span v-else-if="room.planned&&edge.position==='front'&&room.moving" class="moving-wall">{{room.moving}} նկար կտեղափոխվի այստեղ</span>
        <span v-else class="fixed-wall" aria-label="Պատ"/>
      </div>
      <button v-if="room.parent!==null" class="entry passage" type="button" @click="currentRoom=room.parent??galleryFirstFrontRoom">
        <ArrowDown :size="16" aria-hidden="true"/> Մուտք՝ նախորդ սրահից
      </button>
      <span v-else class="entry"><ArrowUp :size="16" aria-hidden="true"/> Մուտք՝ կենտրոնական դահլիճից</span>
    </div>

    <div v-if="!room.planned&&roomPlan.some(edge=>edge.neighbor?.planned)" class="room-expansion">
      <span>Ընդլայնել այս սրահը</span>
      <div class="expansion-directions">
        <template v-for="(edge,index) in roomPlan" :key="edge.position">
          <button v-if="edge.neighbor?.planned" type="button" :style="{gridColumn:index+1}" :aria-label="`Նոր սրահ՝ ${directionLabels[edge.position].toLocaleLowerCase()}`" @click="currentRoom=edge.neighbor.id">
            <component :is="directionIcons[edge.position]" :size="16" aria-hidden="true"/>
            {{directionLabels[edge.position]}}<Plus :size="14" aria-hidden="true"/>
          </button>
        </template>
      </div>
    </div>
    <p v-if="room.planned" class="plan-note">Ընտրիր պատը։ Առաջին նկարը հրապարակելիս նոր սրահը կմիանա «{{rooms.find(item=>item.id===room?.parent)?.name}}» սրահին։<template v-if="room.moving"> Բացվող անցման պատից {{room.moving}} նկար կտեղափոխվի նոր սրահի դիմացի պատին։</template></p>
    <p class="selection" aria-live="polite">{{selectedWall?`Ընտրված է՝ ${selectedWall.label}`:'Սեղմիր այն պատին, որտեղ ուզում ես տեղադրել նկարը։'}}</p>
  </section>
</template>

<style scoped>
.gallery-picker{display:grid;gap:14px;color:#e4eefb;min-width:0}
.room-control{display:grid;gap:6px}
.room-control label,.room-expansion>span{font-size:12px;font-weight:700;color:#cfdef1}
.room-control select{width:100%;min-width:0;padding:9px;border:1px solid #415977;border-radius:8px;background:#0c192a;color:inherit;font:inherit}
.room-plan{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr) minmax(0,1fr);grid-template-areas:'. front .' 'left floor right' 'entry entry entry';padding:10px;gap:8px;min-height:180px;border:1px solid #526884;border-radius:12px;background-color:#101f33;background-image:linear-gradient(#26374d65 1px,transparent 1px),linear-gradient(90deg,#26374d65 1px,transparent 1px);background-size:16px 16px}
.planned-room{border-style:dashed;border-color:#be9b5e}
.floor{grid-area:floor;display:grid;align-content:center;justify-items:center;text-align:center;gap:6px;font-weight:700;font-size:13px;overflow-wrap:anywhere}
.floor small{font-weight:400;color:#aabbcf;font-size:11px}
.room-edge{display:grid;align-items:stretch;min-width:0}
.left{grid-area:left}.front{grid-area:front}.right{grid-area:right}
.room-edge button,.moving-wall,.entry{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;padding:6px;border-radius:8px;text-align:center;overflow-wrap:anywhere}
.room-edge button{width:100%;min-height:48px;border:1px solid #5c7597;background:#213a55;color:#f0f5fc;font-family:inherit;font-size:11px;font-weight:700;line-height:1.3;cursor:pointer}
.room-edge small{font-size:10px;font-weight:400;color:#cbd9eb}
.room-edge button:hover:not(:disabled){background:#304e70}
.room-edge button[aria-pressed='true']{border-color:#f5d28c;background:#4a3924;color:#fff0c9}
.room-edge button:disabled{cursor:default;background:#1a283b;border-color:#435166;color:#b4c1d3}
.wall-button img{display:block;object-fit:contain;max-width:100%;border-radius:3px}
.room-edge .passage{border-style:dashed;background:#122238;color:#c4defe}
.fixed-wall{align-self:center;justify-self:center;width:4px;height:100%;max-height:72px;border-radius:10px;background:#62758d}
.front .fixed-wall{width:100%;height:4px}
.moving-wall{min-height:48px;border:1px dashed #c5a366;background:#302b27;color:#f1d6a4;font-size:11px}
.entry{grid-area:entry;justify-self:center;flex-direction:row;font-size:11px;color:#c5d7ec;padding:5px 9px}
button.entry{border:1px dashed #6784a4;background:#142338;cursor:pointer;font-family:inherit}
.room-expansion{display:grid;gap:6px}
.expansion-directions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.expansion-directions button{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;min-height:34px;padding:4px;border:1px dashed #91a5c0;border-radius:8px;background:#14243b;color:#e5eefc;font:inherit;font-size:11px;cursor:pointer}
.expansion-directions button:hover,button.entry:hover{background:#29415d}
.gallery-picker button:focus-visible,.gallery-picker select:focus-visible{outline:2px solid #f5d28c;outline-offset:2px}
.gallery-picker .plan-note,.gallery-picker .selection{margin:0;color:#ccdbee;font-size:12px;line-height:1.5}
.gallery-picker .plan-note{color:#f1d6a4}
@media(max-width:420px){.room-plan{padding:7px;gap:5px}.room-edge button,.moving-wall{padding:4px}.floor{font-size:12px}}
</style>
