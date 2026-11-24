<script setup lang="ts">
import * as THREE from 'three'
import {Maximize2,Minimize2} from 'lucide-vue-next'
import {galleryRooms,type GalleryArtwork} from '~/data/art/gallery'
import {galleryCenter,galleryRoomAt,galleryRoute,galleryWalkable,type GalleryPoint} from '~/utils/art/galleryNavigation'
import {galleryPlacement,galleryRoomForSlot,gallerySizeWidth} from '~/utils/art/galleryLayout'
import {EYE_HEIGHT,smoothJourneyProgress} from '~/utils/library/navigation'

const emit = defineEmits<{select:[id:string]; room:[index:number]; ready:[]; error:[]; fullscreen:[element:HTMLElement|null]}>()
const props=defineProps<{coreArtworks?:GalleryArtwork[];cmsArtworks?:GalleryArtwork[]}>()
const extraRooms=computed(()=>Math.max(0,...(props.cmsArtworks||[]).map((item,index)=>galleryRoomForSlot(item.gallerySlot??index)-5)))
const allArtworks=computed(()=>[...(props.coreArtworks||[]),...(props.cmsArtworks||[])])
const host = ref<HTMLElement>()
const canvasHost = ref<HTMLElement>()
const loading = ref(true)
const failed = ref(false)
const activeRoom = ref(0)
const mobile = ref(false)
const fullscreen = ref(false)
const fullscreenFallback = ref(false)
const joystick = ref({x:0,y:0})
let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let observer: ResizeObserver | undefined
let intersection: IntersectionObserver | undefined
let visible = true
let disposed = false
let lastTime = 0
let yaw = 0
let pitch = 0
let drag: {x:number;y:number;moved:boolean} | undefined
let journey: {points:THREE.Vector3[];lengths:number[];total:number;started:number;duration:number} | undefined
let pendingSelection: string | undefined
const walkVelocity = new THREE.Vector2()
const movementTarget = new THREE.Vector2()
let touchId: number | undefined
let lastTap:{time:number;x:number;y:number}|undefined
const keys = new Set<string>()
const selectable: THREE.Object3D[] = []
const walkGround: THREE.Object3D[] = []
const pendingArtworks: {room:number;load:()=>void}[] = []
const artworkViews = new Map<string,{room:number;x:number;z:number;rotation:number;width:number;height:number;centerY:number;stand?:GalleryPoint}>()
const loadedRooms = new Set<number>()
const sculptureLoading = new Set<string>()
const textures: THREE.Texture[] = []
const geometries: THREE.BufferGeometry[] = []
const materials: THREE.Material[] = []
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const cleanup: (()=>void)[] = []

function material(color:number, extra:Record<string,unknown>={}) {
  const item = new THREE.MeshStandardMaterial({color,...extra})
  materials.push(item)
  return item
}
function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material) {
  const geometry = new THREE.BoxGeometry(w,h,d)
  geometries.push(geometry)
  const mesh = new THREE.Mesh(geometry,mat)
  mesh.position.set(x,y,z)
  scene.add(mesh)
  return mesh
}
function listen(target:EventTarget,name:string,handler:EventListener) {
  target.addEventListener(name,handler)
  cleanup.push(()=>target.removeEventListener(name,handler))
}
function setRoom(index:number) {
  if(activeRoom.value===index)return
  activeRoom.value=index
  emit('room',index)
}
function moveTo(x:number,z:number) {
  if(galleryWalkable(x,camera.position.z,extraRooms.value))camera.position.x=x
  if(galleryWalkable(camera.position.x,z,extraRooms.value))camera.position.z=z
}
function routeTo(destination:GalleryPoint,room:number):GalleryPoint|undefined {
  pendingSelection=undefined
  const route=galleryRoute({x:camera.position.x,z:camera.position.z},destination,extraRooms.value)
  if(!route)return
  const points=[camera.position.clone(),...route.map(item=>new THREE.Vector3(item.x,EYE_HEIGHT,item.z))]
  const lengths:number[]=[]
  let total=0
  for(let index=1;index<points.length;index++){
    const a=points[index-1]!,b=points[index]!,length=Math.hypot(b.x-a.x,b.z-a.z)
    lengths.push(length);total+=length
  }
  journey={points,lengths,total,started:performance.now(),duration:Math.max(.7,total/4.6)*1000}
  walkVelocity.set(0,0)
  targetYaw=undefined
  targetPitch=undefined
  targetFov=undefined
  keys.clear()
  loadRoom(room)
  host.value?.focus({preventScroll:true})
  return route.at(-1)
}
function loadRoom(index:number) {
  if(loadedRooms.has(index))return
  loadedRooms.add(index)
  pendingArtworks.filter(item=>item.room===index).forEach(item=>item.load())
  for(const sculpture of sculptureModels)if(sculpture.room===index)loadSculptureModel(sculpture)
}
function loadNearbyRooms(){
  for(let index=0;index<6;index++){
    const center=galleryCenter(index)!
    if(Math.hypot(center.x-camera.position.x,center.z-camera.position.z)<22)loadRoom(index)
  }
  const nearest=Math.round((camera.position.x-34)/17)+6
  for(let index=Math.max(6,nearest-2);index<=Math.min(5+extraRooms.value,nearest+2);index++){
    if(loadedRooms.has(index))continue
    const center=galleryCenter(index)!
    if(Math.hypot(center.x-camera.position.x,center.z-camera.position.z)<31)loadRoom(index)
  }
}
function visit(index:number) {
  if(!camera)return
  camera.fov=70;camera.updateProjectionMatrix()
  const destination=galleryCenter(index)
  if(destination)routeTo(destination,index)
}
function reset(){visit(0);pitch=0}
function focusArtwork(id:string) {
  const view=artworkViews.get(id)
  if(!view||!camera)return false
  const fov=mobile.value?88:70
  const vertical=THREE.MathUtils.degToRad(fov)
  const horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect)
  const top=view.centerY+view.height/2-EYE_HEIGHT
  const bottom=view.centerY-view.height/2-EYE_HEIGHT
  let distance=4.8
  while(distance<11.8) {
    const widthAngle=2*Math.atan(view.width/2/distance)
    const heightAngle=Math.atan2(top,distance)-Math.atan2(bottom,distance)
    if(widthAngle<=horizontal*.9&&heightAngle<=vertical*.9)break
    distance+=.2
  }
  distance=Math.min(distance,11.8)
  const endpoint=routeTo(view.stand||{x:view.x+Math.sin(view.rotation)*distance,z:view.z+Math.cos(view.rotation)*distance},view.room)
  if(!endpoint)return false
  const actualDistance=Math.hypot(endpoint.x-view.x,endpoint.z-view.z)
  // Aim midway between the top and bottom of the full framed artwork.
  targetYaw=Math.atan2(endpoint.x-view.x,endpoint.z-view.z)
  targetPitch=(Math.atan2(top,actualDistance)+Math.atan2(bottom,actualDistance))/2
  targetFov=fov
  return true
}
let targetYaw:number|undefined
let targetPitch:number|undefined
let targetFov:number|undefined
defineExpose({visit,reset,focusArtwork})

function syncFullscreen(){fullscreen.value=document.fullscreenElement===host.value||fullscreenFallback.value;emit('fullscreen',fullscreen.value?host.value||null:null)}
async function toggleFullscreen(){
  if(document.fullscreenElement===host.value){await document.exitFullscreen();return}
  if(fullscreenFallback.value){fullscreenFallback.value=false;syncFullscreen();return}
  try {
    if(!host.value?.requestFullscreen)throw new Error('Fullscreen API unavailable')
    await host.value.requestFullscreen()
  } catch {
    fullscreenFallback.value=true
    syncFullscreen()
  }
}

function addArtwork(id:string,x:number,z:number,rotation:number,width:number,height:number,room:number,centerY=4.5) {
  const artwork=allArtworks.value.find(item=>item.id===id)
  if(!artwork)return
  artworkViews.set(id,{room,x,z,rotation,width:width+.2,height:height+.2,centerY})
  pendingArtworks.push({room,load:()=>{
    const loader=new THREE.TextureLoader()
    loader.load(artwork.image,texture=>{
      if(disposed){texture.dispose();return}
      texture.colorSpace=THREE.SRGBColorSpace
      texture.anisotropy=Math.min(4,renderer?.capabilities.getMaxAnisotropy()||1)
      textures.push(texture)
      const frame=box(width+.2,height+.2,.13,x,centerY,z,material(0xa78652,{metalness:.55,roughness:.32}))
      frame.rotation.y=rotation
      const imageMaterial=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})
      materials.push(imageMaterial)
      const geometry=new THREE.PlaneGeometry(width,height)
      geometries.push(geometry)
      const plane=new THREE.Mesh(geometry,imageMaterial)
      plane.position.set(x,centerY,z)
      plane.rotation.y=rotation
      plane.translateZ(.095)
      plane.userData.artworkId=id
      scene.add(plane)
      selectable.push(plane)
    },undefined,()=>{})
  }})
}

function addCmsArtwork(artwork:GalleryArtwork,x:number,z:number,rotation:number,room:number,maxWidth:number,maxHeight:number) {
  const centerY=4.5
  artworkViews.set(artwork.id,{room,x,z,rotation,width:maxWidth,height:maxHeight,centerY})
  pendingArtworks.push({room,load:()=>{
    new THREE.TextureLoader().load(artwork.image,texture=>{
      if(disposed){texture.dispose();return}
      texture.colorSpace=THREE.SRGBColorSpace
      texture.anisotropy=Math.min(4,renderer?.capabilities.getMaxAnisotropy()||1)
      textures.push(texture)
      const source=texture.image as HTMLImageElement
      const ratio=source.width/source.height||1
      const width=Math.min(maxWidth,maxHeight*ratio)
      const height=width/ratio
      artworkViews.set(artwork.id,{room,x,z,rotation,width:width+.2,height:height+.2,centerY})
      const frame=box(width+.2,height+.2,.13,x,centerY,z,material(0xa78652,{metalness:.55,roughness:.32}))
      frame.rotation.y=rotation
      const imageMaterial=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})
      materials.push(imageMaterial)
      const geometry=new THREE.PlaneGeometry(width,height)
      geometries.push(geometry)
      const plane=new THREE.Mesh(geometry,imageMaterial)
      plane.position.set(x,centerY,z);plane.rotation.y=rotation;plane.translateZ(.095)
      plane.userData.artworkId=artwork.id
      scene.add(plane);selectable.push(plane)
    },undefined,()=>{})
  }})
}

const sculptureModels=[
  {id:'venus-de-milo',room:1,x:17,z:0,height:2.75,baseY:1.03,stand:{x:20,z:3.1},url:'/models/art/venus-smk.glb',draco:false},
  {id:'greek-slave',room:0,x:-4,z:-4,height:3.05,baseY:.94,stand:{x:-2.5,z:-2.5},url:'/models/art/greek-slave-smithsonian.glb',draco:true},
  {id:'girl-skating',room:5,x:-34,z:-3.9,height:2.75,baseY:.94,stand:{x:-34,z:-2.5},url:'/models/art/girl-skating-smithsonian.glb',draco:true},
] as const

async function loadSculptureModel(spec:typeof sculptureModels[number]){
  if(sculptureLoading.has(spec.id))return
  sculptureLoading.add(spec.id)
  try{
    const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js')
    const loader=new GLTFLoader()
    if(spec.draco){
      const {DRACOLoader}=await import('three/addons/loaders/DRACOLoader.js')
      loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/models/art/draco/'))
    }
    const gltf=await loader.loadAsync(spec.url)
    loader.dracoLoader?.dispose()
    if(disposed)return
    const model=gltf.scene
    const bounds=new THREE.Box3().setFromObject(model)
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3())
    const scale=spec.height/Math.max(size.y,.001)
    model.scale.setScalar(scale)
    model.position.set(spec.x-center.x*scale,spec.baseY-bounds.min.y*scale,spec.z-center.z*scale)
    model.traverse(object=>{
      if(object instanceof THREE.Mesh){
        object.castShadow=false
        geometries.push(object.geometry)
        const source=Array.isArray(object.material)?object.material:[object.material]
        source.forEach(item=>{materials.push(item);if(item instanceof THREE.MeshStandardMaterial&&item.map)textures.push(item.map)})
        object.userData.artworkId=spec.id
        selectable.push(object)
      }
    })
    scene.add(model)
  }catch(error){console.warn('Sculpture model unavailable',spec.id,error)}
}

function buildScene() {
  scene=new THREE.Scene()
  scene.background=new THREE.Color(0x152130)
  scene.fog=new THREE.Fog(0x152130,30,75)
  scene.add(new THREE.HemisphereLight(0xe9f3ff,0x74644d,2.1))
  const stone=material(0xd9d0bf,{roughness:.86})
  const floor=material(0xddd0b9,{roughness:.72})
  const dark=material(0x35434c,{roughness:.68})
  const gold=material(0xa98850,{metalness:.54,roughness:.34})
  const ceiling=material(0xefe5d3,{roughness:.85})
  const glass=material(0x8baaba,{emissive:0x5b7e94,emissiveIntensity:.28,metalness:.18,roughness:.2})
  const coords=[[0,0],[17,0],[-17,0],[0,-17],[0,17],[-34,0]]
  for(let index=0;index<extraRooms.value;index++)coords.push([34+index*17,0])
  for(const [index,[cx,cz]] of coords.entries()) {
    walkGround.push(box(14,.25,14,cx,-.15,cz,floor))
    box(14,.28,14,cx,9.28,cz,ceiling)
    box(13.2,.05,13.2,cx,9.09,cz,gold)
    box(11.7,.06,11.7,cx,9.04,cz,glass)
    box(10.6,.05,10.6,cx,9.01,cz,ceiling)
    box(8.9,.04,8.9,cx,8.97,cz,glass)
    const mainLight=new THREE.PointLight(0xffe8c5,85,23,2)
    mainLight.position.set(cx,7.8,cz)
    scene.add(mainLight)
    for(const dx of [-6.35,6.35])for(const dz of [-6.35,6.35]) {
      box(.52,8.8,.52,cx+dx,4.4,cz+dz,stone)
      box(.82,.35,.82,cx+dx,8.6,cz+dz,gold)
      box(.8,.38,.8,cx+dx,.28,cz+dz,dark)
    }
    const entrance=index===0?'all':index===1?'west':index===2?'east':index===3?'south':index===4?'north':index===5?'east':'west'
    for(const side of ['north','south','east','west']) {
      const open=entrance==='all'||entrance===side||(index===2&&side==='west')||(index===1&&side==='east'&&extraRooms.value>0)||(index>=6&&side==='east'&&index<5+extraRooms.value)
      const wallX=side==='east'||side==='west'
      const sign=side==='east'||side==='south'?1:-1
      const wx=cx+(wallX?sign*7:0),wz=cz+(wallX?0:sign*7)
      // Connected halls share their full-width side; no door frames or corridor partitions.
      if(!open){
        if(wallX)box(.3,9,14,wx,4.5,cz,stone)
        else box(14,9,.3,cx,4.5,wz,stone)
      }else if(wallX){
        for(const offset of [-5.35,5.35])box(.3,9,3.3,wx,4.5,cz+offset,stone)
      }else{
        for(const offset of [-5.35,5.35])box(3.3,9,.3,cx+offset,4.5,wz,stone)
      }
      if(wallX) {
        if(!open){box(.1,.15,14,wx-sign*.19,.38,cz,gold);box(.1,.16,14,wx-sign*.19,8.05,cz,gold)}
      } else if(!open) {
        box(14,.15,.1,cx,.38,wz-sign*.19,gold)
        box(14,.16,.1,cx,8.05,wz-sign*.19,gold)
      }
    }
  }
  for(const sign of [-1,1]) {
    walkGround.push(box(3.9,.18,14,sign*8.5,-.08,0,floor))
    walkGround.push(box(14,.18,3.9,0,-.08,sign*8.5,floor))
    box(3.9,.3,14,sign*8.5,9.27,0,ceiling)
    box(14,.3,3.9,0,9.27,sign*8.5,ceiling)
    for(const edge of [-3.85,3.85]){
      box(3.9,9,.3,sign*8.5,4.5,edge,stone)
      box(.3,9,3.9,edge,4.5,sign*8.5,stone)
    }
  }
  walkGround.push(box(3.9,.18,14,-25.5,-.08,0,floor))
  box(3.9,.3,14,-25.5,9.27,0,ceiling)
  for(const edge of [-3.85,3.85])box(3.9,9,.3,-25.5,4.5,edge,stone)
  for(let index=0;index<extraRooms.value;index++){
    const x=25.5+index*17
    walkGround.push(box(3.9,.18,14,x,-.08,0,floor))
    box(3.9,.3,14,x,9.27,0,ceiling)
    for(const edge of [-3.85,3.85])box(3.9,9,.3,x,4.5,edge,stone)
  }
  // A circular marble inlay anchors the crossroads without blocking walking.
  const discGeo=new THREE.CylinderGeometry(2.55,2.55,.025,48)
  geometries.push(discGeo)
  const disc=new THREE.Mesh(discGeo,dark)
  disc.position.set(0,.035,0);scene.add(disc)
  const ringGeo=new THREE.RingGeometry(2.1,2.28,48)
  geometries.push(ringGeo)
  const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xc8aa6d,side:THREE.DoubleSide}))
  materials.push(ring.material);ring.rotation.x=-Math.PI/2;ring.position.y=.053;scene.add(ring)
  // The central plinth leaves a broad walking loop around the sculpture.
  box(3.15,.72,3.15,17,.36,0,dark)
  box(3.35,.14,3.35,17,.79,0,gold)
  box(2.7,.18,2.7,17,.94,0,stone)
  for(const spec of sculptureModels){
    if(spec.id!=='venus-de-milo'){
      box(2.25,.68,2.25,spec.x,.4,spec.z,dark)
      box(2.4,.14,2.4,spec.x,.82,spec.z,gold)
    }
    artworkViews.set(spec.id,{room:spec.room,x:spec.x,z:spec.z,rotation:Math.atan2(spec.stand.x-spec.x,spec.stand.z-spec.z),width:2.5,height:spec.height,centerY:spec.baseY+spec.height/2,stand:spec.stand})
  }
  addArtwork('grande-jatte',-17,-6.75,0,7.8,5.25,2,4.55)
  addArtwork('bedroom',-17,6.75,Math.PI,5.2,4.15,2,4.55)
  addArtwork('paris-rain',-21.3,6.75,Math.PI,2.8,2.17,2,4.55)
  addArtwork('water-lilies',-12.7,6.75,Math.PI,2.8,2.69,2,4.55)
  addArtwork('starry-night',0,-23.75,0,7.5,6,3,4.55)
  addArtwork('sunflowers',-6.75,-20.5,Math.PI/2,3.2,4.07,3,4.55)
  addArtwork('irises',-6.75,-13.5,Math.PI/2,3.7,2.86,3,4.55)
  addArtwork('moulin',6.75,-20.5,-Math.PI/2,3.7,2.76,3,4.55)
  addArtwork('poppies',6.75,-13.5,-Math.PI/2,3.7,2.82,3,4.55)
  addArtwork('impression-sunrise',-6.75,-17,Math.PI/2,2.7,2.1,3,4.4)
  addArtwork('bathers',6.75,-17,-Math.PI/2,2.7,1.8,3,4.4)
  addArtwork('mona-lisa',-6.75,17,Math.PI/2,4.05,6.12,4,4.45)
  addArtwork('lady-ermine',6.75,13.5,-Math.PI/2,3.2,4.3,4,4.45)
  addArtwork('virgin-rocks',6.75,20.5,-Math.PI/2,3.2,5.23,4,4.45)
  addArtwork('last-supper',0,23.75,Math.PI,10.8,5.7,4,4.45)
  addArtwork('blue-armchair',-6.75,13.5,Math.PI/2,2.7,1.8,4,4.4)
  addArtwork('floor-scrapers',-6.75,20.5,Math.PI/2,2.7,1.8,4,4.4)
  addArtwork('self-portrait',-37.5,-6.75,0,3.6,5.0,5,4.5)
  addArtwork('poets-garden',-30.5,-6.75,0,4.8,3.8,5,4.5)
  addArtwork('stack-wheat',-37.5,6.75,Math.PI,4.8,3.75,5,4.5)
  addArtwork('two-sisters',-30.5,6.75,Math.PI,3.6,5.1,5,4.5)
  addArtwork('childs-bath',-40.75,-3.5,Math.PI/2,3.55,5.25,5,4.5)
  addArtwork('woman-bathing',-40.75,3.5,Math.PI/2,3.55,5.25,5,4.5)
  props.cmsArtworks?.forEach((artwork,index)=>{
    const {room,x,z,rotation,column}=galleryPlacement(artwork.gallerySlot??index)
    const size=artwork.displaySize||'regular'
    addCmsArtwork(artwork,x,z,rotation,room,column?(size==='large'?2.4:size==='medium'?2:1.6):gallerySizeWidth[size],column?(size==='large'?4.2:size==='medium'?3.6:3):size==='large'?6.4:size==='medium'?5.8:5.2)
  })
}

function pick(clientX:number,clientY:number) {
  if(!renderer||!camera)return
  const rect=renderer.domElement.getBoundingClientRect()
  pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1)
  raycaster.setFromCamera(pointer,camera)
  const hit=raycaster.intersectObjects(selectable,true)[0]
  const id=hit?.object.userData.artworkId
  if(typeof id==='string'&&focusArtwork(id))pendingSelection=id
}
function walkAt(clientX:number,clientY:number) {
  if(!renderer||!camera)return
  const rect=renderer.domElement.getBoundingClientRect()
  pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1)
  raycaster.setFromCamera(pointer,camera)
  const floorHit=raycaster.intersectObjects(walkGround)[0]
  if(!floorHit)return
  const firstHit=raycaster.intersectObjects(scene.children,true)[0]
  // A painting, wall, or sculpture in front of the floor is not a walking target.
  if(firstHit&&firstHit.distance<floorHit.distance-.03&&firstHit.point.y>.25)return
  const destination={x:floorHit.point.x,z:floorHit.point.z}
  routeTo(destination,galleryRoomAt(destination.x,destination.z))
}
function keyDown(event:KeyboardEvent) {
  if(event.key==='Escape'&&fullscreenFallback.value){fullscreenFallback.value=false;syncFullscreen()}
  if(!host.value?.contains(document.activeElement)||document.activeElement instanceof Element&&document.activeElement.closest('[role="dialog"]'))return
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) {
    event.preventDefault();keys.add(event.code);journey=undefined;pendingSelection=undefined;targetYaw=undefined;targetPitch=undefined;targetFov=undefined
  }
}
function keyUp(event:KeyboardEvent){keys.delete(event.code)}
function down(event:PointerEvent){if(event.button!==0)return;host.value?.focus({preventScroll:true});drag={x:event.clientX,y:event.clientY,moved:false};renderer?.domElement.setPointerCapture(event.pointerId)}
function move(event:PointerEvent){
  if(!drag){
    if(renderer&&camera){
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
      raycaster.setFromCamera(pointer,camera)
      renderer.domElement.style.cursor=raycaster.intersectObjects(selectable,true).some(hit=>typeof hit.object.userData.artworkId==='string')?'pointer':'grab'
    }
    return
  }
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y
  drag.x=event.clientX;drag.y=event.clientY
  if(Math.abs(dx)+Math.abs(dy)>1){drag.moved=true;journey=undefined;pendingSelection=undefined;targetYaw=undefined;targetPitch=undefined;targetFov=undefined}
  yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-.75,.75)
}
function up(event:PointerEvent){
  if(drag&&!drag.moved){
    if(event.pointerType==='touch'){
      const now=performance.now()
      if(lastTap&&now-lastTap.time<360&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<28){walkAt(event.clientX,event.clientY);lastTap=undefined}
      else {pick(event.clientX,event.clientY);lastTap={time:now,x:event.clientX,y:event.clientY}}
    } else pick(event.clientX,event.clientY)
  }
  drag=undefined
}
function doubleClick(event:MouseEvent){event.preventDefault();walkAt(event.clientX,event.clientY)}
function touchStart(event:PointerEvent){event.preventDefault();touchId=event.pointerId;host.value?.focus({preventScroll:true});(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);touchMove(event)}
function touchMove(event:PointerEvent){if(event.pointerId!==touchId)return;const rect=(event.currentTarget as HTMLElement).getBoundingClientRect();joystick.value={x:THREE.MathUtils.clamp((event.clientX-rect.left-rect.width/2)/38,-1,1),y:THREE.MathUtils.clamp((event.clientY-rect.top-rect.height/2)/38,-1,1)};journey=undefined;pendingSelection=undefined;targetYaw=undefined;targetPitch=undefined;targetFov=undefined}
function touchEnd(event:PointerEvent){if(event.pointerId===touchId){joystick.value={x:0,y:0};touchId=undefined}}

onMounted(()=>{
  try {
    mobile.value=window.matchMedia('(pointer: coarse)').matches
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=1.25
    canvasHost.value?.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-label','Եռաչափ արվեստի սրահներ')
    camera=new THREE.PerspectiveCamera(70,1,.1,85)
    camera.position.set(0,EYE_HEIGHT,3.7)
    camera.rotation.order='YXZ'
    buildScene()
    loadNearbyRooms()
    const resize=()=>{if(!canvasHost.value||!renderer)return;const {width,height}=canvasHost.value.getBoundingClientRect();if(!width||!height)return;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile.value?1.5:2,Math.sqrt(2_400_000/(width*height))));renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}
    observer=new ResizeObserver(resize);observer.observe(canvasHost.value!);resize()
    intersection=new IntersectionObserver(entries=>{visible=Boolean(entries[0]?.isIntersecting)},{threshold:.01});intersection.observe(host.value!)
    listen(window,'keydown',keyDown as EventListener);listen(window,'keyup',keyUp as EventListener);listen(window,'blur',(()=>keys.clear()) as EventListener)
    listen(document,'fullscreenchange',syncFullscreen as EventListener)
    listen(renderer.domElement,'pointerdown',down as EventListener);listen(renderer.domElement,'pointermove',move as EventListener);listen(renderer.domElement,'pointerup',up as EventListener);listen(renderer.domElement,'pointercancel',(()=>{drag=undefined}) as EventListener)
    listen(renderer.domElement,'dblclick',doubleClick as EventListener)
    listen(renderer.domElement,'webglcontextlost',((event:Event)=>{event.preventDefault();failed.value=true;emit('error')}) as EventListener)
    let previous=performance.now()
    renderer.setAnimationLoop(time=>{
      if(disposed||!visible||document.hidden||!renderer)return
      const dt=Math.min(.05,(time-previous)/1000);previous=time
      const moving=keys.size>0||Math.abs(joystick.value.x)+Math.abs(joystick.value.y)>.05||Boolean(journey)||targetYaw!==undefined
      if(time-lastTime<(moving?16:80))return
      lastTime=time
      if(journey){
        const progress=Math.min(1,(time-journey.started)/journey.duration)
        const distance=smoothJourneyProgress(progress)*journey.total
        let travelled=0,index=0
        while(index<journey.lengths.length-1&&travelled+journey.lengths[index]!<distance){travelled+=journey.lengths[index]!;index++}
        const segment=journey.lengths[index]||1
        const t=Math.min(1,(distance-travelled)/segment)
        const from=journey.points[index]!,to=journey.points[index+1]!
        camera.position.lerpVectors(from,to,t)
        const dx=to.x-from.x,dz=to.z-from.z
        if(Math.hypot(dx,dz)>.001){
          const travelYaw=Math.atan2(-dx,-dz)
          yaw+=Math.atan2(Math.sin(travelYaw-yaw),Math.cos(travelYaw-yaw))*(1-Math.exp(-dt*6))
        }
        if(progress>=1){
          journey=undefined
        }
      }else {
        const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joystick.value.y
        const strafe=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joystick.value.x
        const length=Math.max(1,Math.hypot(forward,strafe))
        movementTarget.set(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe,-Math.cos(yaw)*forward-Math.sin(yaw)*strafe).multiplyScalar(4.8/length)
        walkVelocity.lerp(movementTarget,1-Math.exp(-dt*((forward||strafe)?2.6:8)))
        if(walkVelocity.lengthSq()>.0001)moveTo(camera.position.x+walkVelocity.x*dt,camera.position.z+walkVelocity.y*dt)
      }
      if(!journey&&targetYaw!==undefined&&targetPitch!==undefined&&targetFov!==undefined){
        const ease=1-Math.exp(-dt*2.4)
        yaw+=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw))*ease
        pitch=THREE.MathUtils.lerp(pitch,targetPitch,ease)
        if(Math.abs(camera.fov-targetFov)>.02){camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,ease);camera.updateProjectionMatrix()}
        if(!journey&&Math.abs(Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw)))<.003&&Math.abs(targetPitch-pitch)<.003&&Math.abs(targetFov-camera.fov)<.04){
          targetYaw=undefined;targetPitch=undefined;targetFov=undefined
        }
      }
      if(pendingSelection&&!journey&&targetYaw===undefined){const id=pendingSelection;pendingSelection=undefined;emit('select',id)}
      camera.rotation.set(pitch,yaw,0,'YXZ')
      loadNearbyRooms()
      const nextRoom=galleryRoomAt(camera.position.x,camera.position.z,extraRooms.value)
      if(nextRoom!==activeRoom.value){setRoom(nextRoom);loadRoom(nextRoom)}
      renderer.render(scene,camera)
    })
    loading.value=false;emit('ready')
  } catch(error) {console.error('Art gallery WebGL initialization failed',error);failed.value=true;loading.value=false;emit('error')}
})
onUnmounted(()=>{
  disposed=true
  emit('fullscreen',null)
  cleanup.forEach(fn=>fn())
  observer?.disconnect();intersection?.disconnect()
  renderer?.setAnimationLoop(null)
  geometries.forEach(item=>item.dispose())
  materials.forEach(item=>item.dispose())
  textures.forEach(item=>item.dispose())
  renderer?.dispose();renderer?.domElement.remove()
})
</script>

<template>
  <div ref="host" :class="['virtual-gallery',{expanded:fullscreenFallback}]" tabindex="0" aria-label="Ինտերակտիվ արվեստի պատկերասրահ">
    <div ref="canvasHost" class="gallery-canvas" />
    <div v-if="loading || failed" class="gallery-loading" role="status">{{failed?'3D ցուցադրությունը հասանելի չէ․ գործերը կարող ես դիտել ներքևում։':'Բացվում են արվեստի սրահները…'}}</div>
    <div v-if="!failed" class="gallery-hud">
      <span class="gallery-room-label">{{galleryRooms[activeRoom]?.name||`Պատկերասրահի նոր սրահ ${activeRoom-5}`}}</span>
      <span class="gallery-controls-hint">{{mobile?'Կրկնակի հպումով քայլիր · քաշիր՝ նայելու համար':'Կրկնակի սեղմիր հատակին՝ քայլելու համար · W A S D · քաշիր՝ նայել'}}</span>
    </div>
    <button type="button" class="gallery-fullscreen" :aria-label="fullscreen?'Փակել լիաէկրանը':'Բացել լիաէկրան'" :aria-pressed="fullscreen" :title="fullscreen?'Փակել լիաէկրանը':'Բացել լիաէկրան'" @click="toggleFullscreen"><Minimize2 v-if="fullscreen" :size="19"/><Maximize2 v-else :size="19"/></button>
    <div v-if="mobile && !failed" class="gallery-touch-controls">
      <div class="gallery-joystick" aria-label="Քայլելու կառավարում" @pointerdown="touchStart" @pointermove="touchMove" @pointerup="touchEnd" @pointercancel="touchEnd"><span :style="{transform:`translate(${joystick.x*28}px,${joystick.y*28}px)`}"/></div>
    </div>
  </div>
</template>

<style scoped>
.virtual-gallery{position:relative;height:100%;width:100%;min-height:520px;overflow:hidden;background:#111923;outline:none;touch-action:none}.virtual-gallery:focus-visible{box-shadow:inset 0 0 0 3px #d9bd83}.gallery-canvas{position:absolute;inset:0}.gallery-canvas :deep(canvas){display:block;width:100%;height:100%}.gallery-loading{position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;background:radial-gradient(circle,#33404b,#111923);color:#f4dfb4;font-size:17px}.gallery-hud{position:absolute;left:20px;right:20px;top:18px;display:flex;justify-content:space-between;gap:15px;pointer-events:none}.gallery-hud span{padding:9px 13px;border:1px solid #e3c88b66;border-radius:8px;background:#0a1724ce;backdrop-filter:blur(8px);color:#f6e4c4;font-size:13px}.gallery-controls-hint{max-width:55%;text-align:right}.gallery-touch-controls{position:absolute;left:18px;right:18px;bottom:18px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}.gallery-joystick{position:relative;width:108px;height:108px;border:1px solid #dfc18d9c;border-radius:50%;background:#102133ad;pointer-events:auto;touch-action:none}.gallery-joystick span{position:absolute;left:33px;top:33px;width:42px;height:42px;border-radius:50%;background:#e2c38d;box-shadow:0 3px 12px #0008;pointer-events:none}.gallery-turn{display:flex;gap:8px;pointer-events:auto}.gallery-turn button{width:48px;height:48px;border:1px solid #dfc18d9c;border-radius:9px;background:#102133e0;color:#f5dfb6;font-size:28px}.gallery-turn button:focus-visible{outline:2px solid #fff}
@media(max-width:700px){.gallery-hud{left:12px;right:12px;top:12px;flex-direction:column;align-items:flex-start}.gallery-hud span{font-size:11px;padding:7px 9px}.gallery-controls-hint{max-width:85%;text-align:left}.gallery-touch-controls{bottom:14px;left:12px;right:12px}}
.virtual-gallery:fullscreen,.virtual-gallery.expanded{width:100vw;height:100dvh;min-height:0;border-radius:0}
.virtual-gallery.expanded{position:fixed;inset:0;z-index:1000}
.gallery-hud{right:76px}
.gallery-fullscreen{position:absolute;right:20px;top:18px;z-index:2;display:grid;place-items:center;width:39px;height:39px;border:1px solid #e3c88b80;border-radius:8px;background:#0a1724e6;color:#f6e4c4;cursor:pointer}
.gallery-fullscreen:hover{background:#263b4c}.gallery-fullscreen:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(max-width:700px){.gallery-hud{right:63px}.gallery-fullscreen{right:12px;top:12px;width:36px;height:36px}}
</style>
