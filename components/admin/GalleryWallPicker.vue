<script setup lang="ts">
import {computed,nextTick,ref,watch} from 'vue'
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Check,DoorOpen,Image,Plus} from 'lucide-vue-next'
import {galleryBranch,galleryBranchId} from '~/utils/art/galleryBranches'
import {firstCmsGalleryRoom,galleryFirstFrontRoom} from '~/utils/art/galleryLayout'
import {galleryOverviewLayout,type GalleryEditorRoom,type GalleryEditorWall,type GalleryEditorWallSide} from '~/utils/art/galleryEditorLayout'
import {galleryRooms} from '~/data/art/galleryRooms'
import GalleryRoomModel from './GalleryRoomModel.vue'

const props=defineProps<{rooms:GalleryEditorRoom[];walls:GalleryEditorWall[];modelValue?:number;image?:string;wallPercent:number}>()
const emit=defineEmits<{ 'update:modelValue':[slot:number] }>()
const currentRoom=ref(galleryFirstFrontRoom)
const view=ref<'overview'|'room'>('overview')
const overviewFocus=ref(galleryFirstFrontRoom)
const modelReady=ref(false)
const overview=ref<HTMLElement>()
const roomsById=computed(()=>new Map(props.rooms.map(item=>[item.id,item])))
const room=computed(()=>roomsById.value.get(currentRoom.value))
const selectedWall=computed(()=>props.walls.find(wall=>wall.slot===props.modelValue))
watch(selectedWall,wall=>{if(wall)currentRoom.value=wall.room},{immediate:true})
watch(()=>props.rooms,rooms=>{
  if(!rooms.some(item=>item.id===currentRoom.value))currentRoom.value=rooms[0]?.id??galleryFirstFrontRoom
})

const mapRooms=computed(()=>{
  const branch=galleryBranch(currentRoom.value)
  const mainRoom=branch?.parent??currentRoom.value
  const activeParent=roomsById.value.get(mainRoom)?.parent
  const expansionParent=activeParent!==null&&activeParent!==undefined&&roomsById.value.get(mainRoom)?.planned?activeParent:mainRoom
  return props.rooms.filter(item=>!item.planned||item.id===currentRoom.value||item.parent===expansionParent).map(item=>{
    const branch=galleryBranch(item.id)
    const main=branch?.parent??item.id
    const column=main===galleryFirstFrontRoom?2:main-firstCmsGalleryRoom+3
    const track=branch?.direction??'main'
    const row=track==='north'?1:track==='south'?3:2
    const name=branch?(branch.direction==='north'?'Ձախ սրահ':'Աջ սրահ'):item.name
    return {item,column,row,track,name}
  })
})
const wholeModel=computed(()=>{
  const layout=galleryOverviewLayout(mapRooms.value.map(entry=>entry.item))
  return {...layout,selected:overviewFocus.value,rooms:layout.rooms.map(item=>({
    ...item,name:roomsById.value.get(item.id)?.name??galleryRooms[item.id]?.name??'Պատկերասրահ',
  }))}
})
const overviewName=computed(()=>wholeModel.value.rooms.find(item=>item.id===overviewFocus.value)?.name)
function openOverview(){overviewFocus.value=currentRoom.value;view.value='overview'}
function inspectRoom(id:number){
  if(roomsById.value.has(id)){
    currentRoom.value=id
    view.value='room'
  }else overviewFocus.value=id
}
watch([currentRoom,overview],async()=>{
  await nextTick()
  const board=overview.value
  const active=board?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if(!board||!active)return
  const bounds=board.getBoundingClientRect(),tile=active.getBoundingClientRect()
  if(tile.left<bounds.left||tile.right>bounds.right)board.scrollLeft+=tile.left-bounds.left-(board.clientWidth-tile.width)/2
},{flush:'post'})

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
    const neighbor=roomsById.value.get(nextRooms.value[index]??-1)
    return {position,wall,neighbor,label:wallLabels[position]}
  })
})
const shownWall=computed(()=>roomPlan.value.find(edge=>edge.wall?.slot===selectedWall.value?.slot&&edge.wall))
const previewWidth=computed(()=>Math.min(100,Math.max(1,props.wallPercent||45)))
const modelEdges=computed(()=>roomPlan.value.map(edge=>({
  position:edge.position,
  selectable:Boolean(edge.wall?.available),
  selected:edge.wall!==undefined&&edge.wall.slot===props.modelValue,
  passage:Boolean(edge.neighbor&&!edge.neighbor.planned),
})))

function pickWall(position:typeof directions[number]){
  const edge=roomPlan.value.find(item=>item.position===position)
  if(edge?.wall?.available)emit('update:modelValue',edge.wall.slot)
  else if(edge?.neighbor&&!edge.neighbor.planned)currentRoom.value=edge.neighbor.id
}
</script>

<template>
  <section v-if="room" class="gallery-picker" aria-label="Պատկերասրահի քարտեզ">
    <div class="step-heading"><b>1</b><div><strong>Ընտրիր սրահը</strong><small>Պատկերասրահի արևելյան թևը</small></div></div>
    <div ref="overview" class="overview" aria-label="Սրահների հատակագիծ" tabindex="0">
      <div class="overview-grid">
        <div class="map-origin"><DoorOpen :size="17" aria-hidden="true"/><span>Կենտրոնական դահլիճ</span></div>
        <button v-for="entry in mapRooms" :key="entry.item.id" type="button" class="map-room" :class="[entry.track,{planned:entry.item.planned}]" :style="{gridColumn:entry.column,gridRow:entry.row}" :aria-label="entry.item.planned?`Նախադիտել ${entry.item.name}`:entry.item.name" :aria-pressed="entry.item.id===currentRoom" @click="inspectRoom(entry.item.id)">
          <Plus v-if="entry.item.planned" :size="13" aria-hidden="true"/>
          <Check v-else-if="entry.item.id===currentRoom" :size="13" aria-hidden="true"/>
          <span>{{entry.name}}</span>
        </button>
      </div>
    </div>

    <div class="model-switch" role="group" aria-label="Պատկերասրահի 3D տեսքեր">
      <button type="button" :aria-pressed="view==='overview'" @click="openOverview">Ամբողջ պատկերասրահը</button>
      <button type="button" :aria-pressed="view==='room'" @click="inspectRoom(currentRoom)">Ընտրված սրահը</button>
    </div>
    <div v-if="view==='overview'&&overviewName" class="overview-status">
      <p class="overview-name" aria-live="polite">{{overviewName}}</p>
      <div class="overview-legend"><span>Բաց սրահ</span><span>Հնարավոր նոր սրահ</span></div>
    </div>
    <div v-else class="step-heading"><b>2</b><div><strong>Ընտրիր պատը</strong><small>{{room.name}}<template v-if="room.planned"> · նոր սրահի նախադիտում</template></small></div></div>
    <GalleryRoomModel :edges="modelEdges" :image="image" :wall-percent="previewWidth" :planned="room.planned" :overview="view==='overview'?wholeModel:undefined" @room="inspectRoom" @pick="pickWall" @ready="modelReady=true"/>
    <template v-if="view==='room'">
    <div class="room-plan" :class="{'planned-room':room.planned,'model-controls':modelReady}">
      <div v-if="!modelReady" class="floor"><ArrowUp :size="21" aria-hidden="true"/><small>Մուտքից նայելով</small></div>
      <div v-for="edge in roomPlan" :key="edge.position" class="room-edge" :class="edge.position">
        <button v-if="edge.wall" class="wall-button" type="button" :disabled="!edge.wall.available" :aria-pressed="edge.wall.slot===modelValue" @click="emit('update:modelValue',edge.wall.slot)">
          <img v-if="edge.wall.slot===modelValue&&image" :src="image" alt="" loading="lazy" width="46" height="40">
          <Check v-else-if="edge.wall.slot===modelValue" :size="16" aria-hidden="true"/>
          <span>{{edge.label}}</span>
          <small>{{edge.wall.available?`${edge.wall.available} ազատ տեղ`:'Ազատ տեղ չկա'}}</small>
        </button>
        <button v-else-if="edge.neighbor&&!edge.neighbor.planned" type="button" class="passage" :aria-label="`Անցում դեպի ${edge.neighbor.name}`" @click="currentRoom=edge.neighbor.id">
          <component :is="directionIcons[edge.position]" :size="16" aria-hidden="true"/> {{edge.neighbor.name}}
        </button>
        <span v-else-if="room.planned&&edge.position==='front'&&room.moving" class="moving-wall">{{room.moving}} նկար կտեղափոխվի այստեղ</span>
        <span v-else class="fixed-wall" aria-label="Պատ"/>
        <button v-if="!room.planned&&edge.neighbor?.planned" type="button" class="expand" :aria-label="`Նոր սրահ՝ ${directionLabels[edge.position].toLocaleLowerCase()}`" @click="currentRoom=edge.neighbor.id">
          <Plus :size="13" aria-hidden="true"/> Նոր սրահ · {{directionLabels[edge.position].toLocaleLowerCase()}}
        </button>
      </div>
      <button v-if="room.parent!==null" class="entry passage" type="button" @click="currentRoom=room.parent??galleryFirstFrontRoom">
        <DoorOpen :size="16" aria-hidden="true"/> Մուտք՝ {{roomsById.get(room.parent)?.name??'նախորդ սրահից'}} <ArrowDown :size="14" aria-hidden="true"/>
      </button>
      <span v-else class="entry"><ArrowUp :size="16" aria-hidden="true"/> Մուտք՝ կենտրոնական դահլիճից</span>
    </div>

    <p v-if="room.planned" class="plan-note">Նոր սրահը կբացվի այստեղ առաջին նկարը հրապարակելիս։</p>
    <div v-if="shownWall" class="wall-preview" aria-live="polite">
      <div class="preview-heading"><Check :size="17" aria-hidden="true"/><div><strong>{{shownWall.label}}</strong><small>{{room.name}}</small></div></div>
      <div v-if="!modelReady" class="wall-elevation">
        <img v-if="image" :src="image" alt="Ընտրված նկարը պատի վրա" :style="{width:`${previewWidth}%`}" loading="lazy">
        <div v-else class="empty-frame" :style="{width:`${previewWidth}%`}"><Image :size="18" aria-hidden="true"/></div>
      </div>
      <small v-if="!image" class="preview-hint">Նկար ընտրելուց հետո այն կերևա այստեղ։</small>
    </div>
    <div v-else-if="selectedWall" class="preview-heading previous-selection">
      <small>Ընտրված պատը՝ {{selectedWall.label}}</small>
      <button type="button" class="entry" @click="currentRoom=selectedWall.room">Ցույց տալ ընտրված պատը</button>
    </div>
    </template>
  </section>
</template>

<style scoped>
.gallery-picker{display:grid;gap:14px;color:#e4eefb;min-width:0}
.step-heading,.preview-heading{display:flex;align-items:center;gap:9px;font-size:13px;min-width:0}
.step-heading b{display:grid;place-items:center;flex:0 0 24px;height:24px;border-radius:50%;background:#294361;color:#e7f1ff;font-size:12px}
.step-heading small,.preview-heading small,.preview-hint{display:block;margin-top:2px;color:#aebfd5;font-size:11px}
.overview{overflow-x:auto;border:1px solid #435975;border-radius:10px;background:#101e30;padding:8px;scrollbar-color:#6885a5 #101e30}
.overview-grid{display:grid;grid-auto-columns:74px;grid-template-rows:repeat(3,minmax(36px,auto));gap:6px;width:max-content;min-width:100%;align-items:stretch}
.map-origin,.map-room{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:3px;text-align:center;line-height:1.2;font-size:10px;overflow-wrap:anywhere}
.map-origin{grid-area:2/1;color:#bdcde0}
.map-room{border:1px solid #6c86a5;border-radius:6px;background:#233b55;color:#e6effd;font-family:inherit;cursor:pointer}
.map-room:hover{background:#345572}.map-room.planned{border-style:dashed;color:#cfdcf0;background:#17283e}
.map-room[aria-pressed='true']{border-color:#f0c77f;background:#513e27;color:#fff0ca}
.map-room::before{content:'';position:absolute;background:#71839a}
.map-room.main::before{width:6px;height:2px;top:50%;left:-7px}
.map-room.north::before,.map-room.south::before{width:2px;height:6px;left:50%}
.map-room.north::before{bottom:-7px}.map-room.south::before{top:-7px}
.map-room.planned.main::before{background:repeating-linear-gradient(90deg,#71839a 0 2px,transparent 2px 4px)}
.map-room.planned.north::before,.map-room.planned.south::before{background:repeating-linear-gradient(#71839a 0 2px,transparent 2px 4px)}
.model-switch{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px;border:1px solid #435975;border-radius:10px;background:#101e30}
.model-switch button{min-height:35px;border:1px solid transparent;border-radius:7px;padding:5px;background:transparent;color:#cbdbef;font:inherit;font-size:12px;cursor:pointer}
.model-switch button[aria-pressed='true']{border-color:#7c684a;background:#413622;color:#ffe9c0}
.overview-name{margin:0;color:#e5d2aa;font-size:13px}
.overview-status,.overview-legend{display:flex;flex-wrap:wrap;align-items:center;gap:7px 12px}
.overview-status{justify-content:space-between}
.overview-legend{color:#c3d3e7;font-size:10px}
.overview-legend span{display:flex;gap:4px;align-items:center}
.overview-legend span::before{content:'';width:8px;height:8px;border:1px solid #dec79c;border-radius:2px;background:#b9a487}
.overview-legend span:last-child::before{border-color:#8492a0;background:#677786}
.room-plan{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr) minmax(0,1fr);grid-template-areas:'. front .' 'left floor right' 'entry entry entry';padding:10px;gap:8px;min-height:180px;border:1px solid #526884;border-radius:12px;background-color:#101f33;background-image:linear-gradient(#26374d65 1px,transparent 1px),linear-gradient(90deg,#26374d65 1px,transparent 1px);background-size:16px 16px}
.planned-room{border-style:dashed;border-color:#be9b5e}
.room-plan.model-controls{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-areas:'left front right' 'entry entry entry';min-height:0;border:0;padding:0;background:none}
.floor{grid-area:floor;display:grid;align-content:center;justify-items:center;text-align:center;gap:6px;font-weight:700;font-size:13px;overflow-wrap:anywhere}
.floor small{font-weight:400;color:#aabbcf;font-size:11px}
.room-edge{display:grid;align-items:stretch;gap:5px;min-width:0}
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
.room-edge .expand{flex-direction:row;flex-wrap:wrap;gap:3px;min-height:34px;border-style:dashed;background:#15273e;color:#dce9fc;font-weight:600}
button.entry:hover{background:#29415d}
.gallery-picker button:focus-visible,.overview:focus-visible{outline:2px solid #f5d28c;outline-offset:2px}
.gallery-picker .plan-note{margin:0;font-size:12px;line-height:1.5}
.gallery-picker .plan-note{color:#f1d6a4}
.wall-preview{display:grid;gap:9px;min-width:0;padding:10px;border:1px solid #6d5b43;border-radius:10px;background:#162438}
.preview-heading>svg{flex-shrink:0;color:#f2cd83}
.wall-elevation{display:flex;align-items:center;justify-content:center;background:#cec3ac;border-bottom:6px solid #887459;border-radius:5px;height:112px;min-width:0;overflow:hidden}
.wall-elevation img,.empty-frame{display:block;max-height:84px;max-width:100%;object-fit:contain}
.empty-frame{display:grid;place-items:center;min-width:22px;min-height:40px;border:1px dashed #574936;color:#493b2e}
.previous-selection{flex-wrap:wrap}
@media(max-width:420px){.room-plan{padding:7px;gap:5px}.room-edge button,.moving-wall{padding:4px}.floor{font-size:12px}}
</style>
