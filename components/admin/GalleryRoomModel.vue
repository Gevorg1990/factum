<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue'
import {RotateCcw} from 'lucide-vue-next'
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {galleryFrameSize} from '~/utils/art/galleryLayout'
import type {GalleryOverviewRoom} from '~/utils/art/galleryEditorLayout'

type Position='left'|'front'|'right'
type Edge={position:Position;selectable:boolean;selected:boolean;passage:boolean}
type Overview={rooms:(GalleryOverviewRoom&{name:string})[];links:[number,number][];selected:number}
const props=defineProps<{edges:Edge[];image?:string;wallPercent:number;planned:boolean;overview?:Overview}>()
const emit=defineEmits<{ 'pick':[position:Position]; 'room':[id:number]; 'ready':[] }>()
const host=ref<HTMLElement>()
const unavailable=ref(false)
const hoveredRoom=ref<number>()
const scene=new THREE.Scene()
const camera=new THREE.PerspectiveCamera(38,1,.1,90)
const room=new THREE.Group()
const hitTargets:THREE.Mesh[]=[]
const raycaster=new THREE.Raycaster()
const pointer=new THREE.Vector2()
const stone=0xc0ad8c
const wallHeight=7.4
const orientations={left:[-7,0,Math.PI/2],front:[0,-7,0],right:[7,0,-Math.PI/2]} as const
let renderer:THREE.WebGLRenderer|undefined
let controls:OrbitControls|undefined
let resizeObserver:ResizeObserver|undefined
let texture:THREE.Texture|undefined
let textureUrl=''
let textureRequest=0
let disposed=false
let down:{x:number;y:number}|undefined

function render(){renderer?.render(scene,camera)}

function reset(){
  if(!controls)return
  controls.enableZoom=Boolean(props.overview)
  if(props.overview){
    const bounds=new THREE.Box3().setFromObject(room)
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3())
    const angle=Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.min(camera.aspect,1))
    const distance=Math.max(38,Math.hypot(size.x,size.z)*.44/Math.sin(angle))
    controls.target.set(center.x,0,center.z)
    camera.position.copy(controls.target).add(new THREE.Vector3(.1,.86,.48).multiplyScalar(distance))
    controls.minDistance=21
    controls.maxDistance=distance*1.5
    camera.far=distance*4+100
  }else{
    camera.position.set(8.5,18,22)
    controls.target.set(0,1.6,0)
    controls.minDistance=0
    controls.maxDistance=Infinity
    camera.far=90
  }
  camera.updateProjectionMatrix()
  controls.update()
  render()
}

function clearRoom(){
  room.traverse(item=>{
    if(item instanceof THREE.Mesh){
      item.geometry.dispose()
      item.material.dispose()
    }
  })
  room.clear()
  hitTargets.length=0
}

function box(parent:THREE.Group,width:number,height:number,depth:number,x:number,y:number,z:number,color:number){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshStandardMaterial({color,roughness:.85}))
  mesh.position.set(x,y,z)
  parent.add(mesh)
  return mesh
}

function wall(position:readonly [number,number,number],color:number,passage:boolean,action?:Position,height=wallHeight){
  const group=new THREE.Group()
  const [x,z,angle]=position
  group.position.set(x,0,z)
  group.rotation.y=angle
  room.add(group)
  if(passage){
    for(const side of [-1,1])hitTargets.push(box(group,3.3,height,.3,side*5.35,height/2,0,stone))
    const threshold=box(group,7.4,.1,2.6,0,.03,-.9,0x7894a1)
    if(action){threshold.userData.position=action;hitTargets.push(threshold)}
  }else{
    const surface=box(group,14,height,.3,0,height/2,0,color)
    box(group,14,.22,.12,0,.2,.18,0x79664d)
    surface.userData.position=action
    hitTargets.push(surface)
  }
  return group
}

function buildOverview(model:Overview){
  const rooms=new Map(model.rooms.map(item=>[item.id,item]))
  const exits=new Map<number,Set<string>>(model.rooms.map(item=>[item.id,new Set<string>()]))
  for(const [from,to] of model.links){
    const a=rooms.get(from),b=rooms.get(to)
    if(!a||!b)continue
    const alongX=a.x!==b.x
    const positive=alongX?b.x>a.x:b.z>a.z
    exits.get(from)?.add(alongX?(positive?'east':'west'):(positive?'south':'north'))
    exits.get(to)?.add(alongX?(positive?'west':'east'):(positive?'north':'south'))
    box(room,alongX?3.3:7.4,.24,alongX?7.4:3.3,(a.x+b.x)/2,-.1,(a.z+b.z)/2,b.planned?0x554f43:0x8b9fa9)
  }
  for(const item of model.rooms){
    const active=item.id===model.selected
    const platform=box(room,14,.35,14,item.x,-.18,item.z,active?0xd3aa62:item.planned?0x677786:item.id===0?0xbfc5b5:0xb9a487)
    platform.userData.room=item.id
    hitTargets.push(platform)
    const color=active?0xecc37e:item.planned?0x8492a0:0xdac9aa
    const boundaries=[['north',0,-7,0],['south',0,7,Math.PI],['west',-7,0,Math.PI/2],['east',7,0,-Math.PI/2]] as const
    for(const [side,x,z,rotation] of boundaries){
      const boundary=new THREE.Group()
      boundary.position.set(item.x+x,0,item.z+z)
      boundary.rotation.y=rotation
      room.add(boundary)
      const height=item.planned ? .7 : 2.6
      const walls=exits.get(item.id)?.has(side)
        ? [-5.35,5.35].map(offset=>box(boundary,3.3,height,.38,offset,height/2,0,color))
        : [box(boundary,14,height,.38,0,height/2,0,color)]
      for(const section of walls){section.userData.room=item.id;hitTargets.push(section)}
    }
  }
}

function rebuild(){
  if(!renderer)return
  clearRoom()
  if(props.overview){buildOverview(props.overview);render();return}
  box(room,14.7,.32,14.7,0,-.23,0,props.planned?0xc4a578:0x877763)
  box(room,14,.12,14,0,-.05,0,0xd0bfa2)
  for(const x of [-4.2,0,4.2]){
    box(room,.035,.015,13.8,x,.018,0,0xb5a384)
    box(room,13.8,.015,.035,0,.018,x,0xb5a384)
  }
  wall([0,7,Math.PI],stone,true,undefined,1.1)
  for(const edge of props.edges){
    const color=edge.selected?0xd2af61:edge.selectable?0xa6bcc8:stone
    const group=wall(orientations[edge.position],color,edge.passage,edge.selectable||edge.passage?edge.position:undefined)
    if(!edge.selected)continue
    const image=texture?.image as HTMLImageElement|undefined
    const aspect=image?.width&&image.height?image.width/image.height:1.35
    const {width,height,border}=galleryFrameSize(props.wallPercent,aspect)
    const centerY=Math.min(4.5,wallHeight-(height+border)/2-.18)
    box(group,width+border,height+border,.13,0,centerY,.24,0x554335)
    const picture=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture??null,color:texture?0xffffff:0xf8e2af}))
    picture.position.set(0,centerY,.32)
    group.add(picture)
  }
  render()
}

function syncTexture(){
  if(!renderer)return
  const url=!props.overview&&props.edges.some(edge=>edge.selected)?props.image??'':''
  if(url===textureUrl)return
  textureUrl=url
  const request=++textureRequest
  texture?.dispose()
  texture=undefined
  if(!url)return
  new THREE.TextureLoader().load(url,loaded=>{
    if(disposed||textureRequest!==request){loaded.dispose();return}
    loaded.colorSpace=THREE.SRGBColorSpace
    texture=loaded
    rebuild()
  },undefined,()=>{})
}

function target(event:PointerEvent){
  if(!renderer)return
  const rect=renderer.domElement.getBoundingClientRect()
  pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)
  raycaster.setFromCamera(pointer,camera)
  return raycaster.intersectObjects(hitTargets,false)[0]?.object.userData as {position?:Position;room?:number}|undefined
}

function pointDown(event:PointerEvent){down={x:event.clientX,y:event.clientY}}
function pointMove(event:PointerEvent){
  if(!renderer)return
  const hit=event.buttons?undefined:target(event)
  hoveredRoom.value=hit?.room
  renderer.domElement.style.cursor=event.buttons?'grabbing':hit?.room!==undefined||hit?.position?'pointer':'grab'
}
function pointUp(event:PointerEvent){
  if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<6){
    const hit=target(event)
    if(hit?.room!==undefined)emit('room',hit.room)
    if(hit?.position)emit('pick',hit.position)
  }
  down=undefined
}

watch(()=>[props.edges,props.image,props.wallPercent,props.planned,props.overview],()=>{syncTexture();rebuild()})
watch(()=>Boolean(props.overview),()=>{hoveredRoom.value=undefined;reset()},{flush:'post'})
onMounted(()=>{
  const node=host.value
  if(!node)return
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}
  catch{unavailable.value=true;return}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5))
  renderer.outputColorSpace=THREE.SRGBColorSpace
  node.appendChild(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden','true')
  renderer.domElement.addEventListener('pointerdown',pointDown)
  renderer.domElement.addEventListener('pointermove',pointMove)
  renderer.domElement.addEventListener('pointerup',pointUp)
  controls=new OrbitControls(camera,renderer.domElement)
  controls.enablePan=false
  controls.enableZoom=false
  controls.minPolarAngle=.26
  controls.maxPolarAngle=Math.PI/2-.25
  controls.addEventListener('change',render)
  scene.add(room,new THREE.HemisphereLight(0xfff8e7,0x697c8c,2))
  const daylight=new THREE.DirectionalLight(0xffefd7,1.4)
  daylight.position.set(0,12,8)
  scene.add(daylight)
  resizeObserver=new ResizeObserver(()=>{
    if(!renderer)return
    const {clientWidth,clientHeight}=node
    if(!clientWidth||!clientHeight)return
    camera.aspect=clientWidth/clientHeight
    camera.fov=camera.aspect<1.2?48:38
    camera.updateProjectionMatrix()
    renderer.setSize(clientWidth,clientHeight)
    if(props.overview)reset()
    else render()
  })
  resizeObserver.observe(node)
  syncTexture()
  rebuild()
  reset()
  emit('ready')
})
onBeforeUnmount(()=>{
  disposed=true
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.domElement.removeEventListener('pointerdown',pointDown)
  renderer?.domElement.removeEventListener('pointermove',pointMove)
  renderer?.domElement.removeEventListener('pointerup',pointUp)
  renderer?.dispose()
  texture?.dispose()
  clearRoom()
})
</script>

<template>
  <figure v-if="!unavailable" class="room-model">
    <div ref="host" class="model-canvas" :class="{'planned-model':planned&&!overview,'overview-canvas':overview}" @pointerleave="hoveredRoom=undefined"/>
    <figcaption>
      <span v-if="overview">{{overview.rooms.find(item=>item.id===hoveredRoom)?.name??'Պտտիր կամ մոտեցրու պատկերասրահը։ Սեղմիր սրահին՝ ընտրելու համար։'}}</span>
      <span v-else>Քաշիր՝ սրահը պտտելու համար։ Սեղմիր պատին՝ ընտրելու համար։</span>
      <button type="button" @click="reset"><RotateCcw :size="14" aria-hidden="true"/> {{overview?'Ամբողջ տեսքը':'Մուտքի տեսք'}}</button>
    </figcaption>
  </figure>
</template>

<style scoped>
.room-model{margin:0;min-width:0}
.model-canvas{height:clamp(240px,55vw,340px);overflow:hidden;border:1px solid #576e89;border-radius:12px;background:radial-gradient(ellipse at 50% 50%,#263d52,#101d2d 75%)}
.model-canvas.planned-model{border-style:dashed;border-color:#caab72}
.model-canvas.overview-canvas{height:clamp(290px,64vw,390px)}
.model-canvas :deep(canvas){display:block;cursor:grab;max-width:100%}
figcaption{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px;color:#bfd0e4;font-size:11px}
figcaption button{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;border:1px solid #566e88;border-radius:6px;padding:5px 7px;background:#182a40;color:inherit;font:inherit;cursor:pointer}
</style>
