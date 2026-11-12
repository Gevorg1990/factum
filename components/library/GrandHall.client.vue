<script setup lang="ts">
import * as THREE from 'three'
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js'
import {Expand,Move,Heart,RotateCcw,ArrowUp,ArrowDown,ArrowLeft,ArrowRight,Landmark,X} from 'lucide-vue-next'
import {libraryTopics,type LibraryBook} from '~/data/library/catalog'
import type {BookObject} from '~/utils/library/createRoom'
import {createBookPullout} from '~/utils/library/bookPullout'
import {createLibraryRoom} from '~/utils/library/createRoom'
import {constrainPosition,EYE_HEIGHT,shelfPoint,isWalkablePoint,findWalkPath,smoothJourneyProgress} from '~/utils/library/navigation'
const {library,toggleBook}=useProgress()
const props=defineProps<{paused?:boolean;books:readonly LibraryBook[]}>()
const initialView={x:0,z:5.2,pitch:.08}
const emit=defineEmits<{ready:[];error:[];read:[id:string]}>()
const host=ref<HTMLElement>(),canvasHost=ref<HTMLElement>(),loading=ref(true),failed=ref(false),walking=ref(false),locked=ref(false),touring=ref(false)
const selectedBook=ref<LibraryBook|null>(null)
const pullouts=new Map<string,ReturnType<typeof createBookPullout>>()
let selectedCopy:string|undefined
const hovered=ref<LibraryBook|null>(null),hoverPosition=ref({x:0,y:0})
const joystick=ref({x:0,y:0}),mobile=ref(false),tip=ref('')
let environmentTarget:THREE.WebGLRenderTarget|undefined
let renderFrame:((time:number)=>void)|undefined
let renderer:THREE.WebGLRenderer|undefined,camera:THREE.PerspectiveCamera,scene:THREE.Scene,observer:ResizeObserver,intersection:IntersectionObserver
const raycaster=new THREE.Raycaster(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0)
let clickTimer:ReturnType<typeof setTimeout>|undefined
let destinationMarker:THREE.Mesh|undefined,markerUntil=0
let visible=true,disposed=false,last=0,yaw=0,pitch=initialView.pitch,targetHeight=EYE_HEIGHT,keys=new Set<string>(),lookAt:THREE.Vector3|undefined
let journey:{points:THREE.Vector3[];lengths:number[];total:number;started:number;duration:number;height:number;onArrive?:()=>void}|undefined
const walkVelocity=new THREE.Vector2()
let hoverMesh:THREE.Object3D|undefined
let bookObjects:BookObject[]=[],pickableBooks:THREE.Object3D[]=[],hoverPoint:THREE.Vector2|undefined,lastHover=0
let colliders:{x:number;z:number;r:number}[]=[],down:{x:number;y:number;id:number;travel:number;dragging:boolean}|undefined,joyId:number|undefined,joyOrigin={x:0,y:0},cleanup:(()=>void)[]=[]
function enter(){walking.value=true;targetHeight=EYE_HEIGHT;host.value?.focus({preventScroll:true})}
function reset(){closeBook();keys.clear();journey=undefined;walkVelocity.set(0,0);touring.value=false;walking.value=false;targetHeight=EYE_HEIGHT;camera?.position.set(initialView.x,EYE_HEIGHT,initialView.z);yaw=0;pitch=initialView.pitch;lookAt=undefined;joystick.value={x:0,y:0};document.exitPointerLock?.()}
function dome(){lookAt=undefined;journey=undefined;walkVelocity.set(0,0);touring.value=false;pitch=1.04;host.value?.focus({preventScroll:true})}
function beginJourney(x:number,z:number,onArrive?:()=>void){
 const start=constrainPosition(camera.position.x,camera.position.z)
 camera.position.x=start.x;camera.position.z=start.z
 const route=findWalkPath(start,{x,z},colliders)
 if(!route.length)return false
 keys.clear();walkVelocity.set(0,0);walking.value=true;targetHeight=EYE_HEIGHT;lookAt=undefined
 const points=[camera.position.clone(),...route.map(p=>new THREE.Vector3(p.x,EYE_HEIGHT,p.z))],lengths:number[]=[]
 let total=0;for(let i=1;i<points.length;i++){const a=points[i-1]!,b=points[i]!;const length=Math.hypot(b.x-a.x,b.z-a.z);lengths.push(length);total+=length}
 journey={points,lengths,total,started:performance.now(),duration:Math.max(.7,total/4.6)*1000,height:camera.position.y,onArrive}
 touring.value=true;return true
}
function visit(shelf:number){
 if(!camera)return
 const point=shelfPoint(shelf,11.1)
 if(beginJourney(point.x,point.z))lookAt=new THREE.Vector3(shelfPoint(shelf,17).x,2.5,shelfPoint(shelf,17).z)
 host.value?.focus({preventScroll:true})
}
function keyDown(e:KeyboardEvent){if(props.paused)return;if(e.code==='Escape'&&selectedBook.value){closeBook();return}if(!host.value?.contains(document.activeElement)&&!locked.value)return;const key=e.code;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)){e.preventDefault();if(!walking.value)enter();keys.add(key);journey=undefined;touring.value=false;lookAt=undefined}}
function focusBook(id:string){
 const mesh=pickableBooks.find(mesh=>mesh.userData.bookId===id) as THREE.InstancedMesh|undefined
 if(!mesh)return
 const matrix=new THREE.Matrix4();mesh.getMatrixAt(0,matrix)
 const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(position,rotation,scale)
 const goal=position.clone().addScaledVector(new THREE.Vector3(0,0,1).applyQuaternion(rotation),6.6)
 closeBook();if(beginJourney(goal.x,goal.z,()=>toggleBookCopy({object:mesh,instanceId:0})))lookAt=position
 host.value?.focus({preventScroll:true})
}
watch(()=>props.paused,value=>{if(value){clearInput();renderer?.setAnimationLoop(null)}else if(renderFrame&&!disposed){last=performance.now();renderer?.setAnimationLoop(renderFrame)}})
function keyUp(e:KeyboardEvent){keys.delete(e.code)}
function clearInput(){journey=undefined;touring.value=false;hovered.value=null;hoverPoint=undefined;walkVelocity.set(0,0);keys.clear();joystick.value={x:0,y:0};joyId=undefined;down=undefined}
function pointerDown(e:PointerEvent){if(e.button!==0)return;host.value?.focus({preventScroll:true});down={x:e.clientX,y:e.clientY,id:e.pointerId,travel:0,dragging:false};renderer?.domElement.setPointerCapture(e.pointerId)}
function pointerMove(e:PointerEvent){
 if(renderer){const rect=renderer.domElement.getBoundingClientRect();hoverPoint=locked.value?new THREE.Vector2(0,0):new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);hoverPosition.value={x:Math.max(12,Math.min(e.clientX-rect.left+18,rect.width-285)),y:Math.max(14,Math.min(e.clientY-rect.top+18,rect.height-170))}}
 if(!locked.value&&(!down||down.id!==e.pointerId))return
 const dx=locked.value?e.movementX:e.clientX-down!.x,dy=locked.value?e.movementY:e.clientY-down!.y
 if(down){
  down.travel+=Math.hypot(dx,dy);down.x=e.clientX;down.y=e.clientY
  if(!down.dragging){if(down.travel<6)return;down.dragging=true;journey=undefined;touring.value=false;walkVelocity.set(0,0)}
 }
 yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.15,1.4);lookAt=undefined
}
function pointerUp(event:PointerEvent){
 const click=down&&down.id===event.pointerId&&down.travel<6&&event.button===0
 down=undefined
 if(click){
  clearTimeout(clickTimer)
  const x=event.clientX,y=event.clientY
  if(pickBook(x,y))clickTimer=setTimeout(()=>{const hit=pickBook(x,y);if(hit)toggleBookCopy(hit)},240)
 }
}
function approachPoint(clientX:number,clientY:number){
 if(!renderer||!camera)return
 const rect=renderer.domElement.getBoundingClientRect(),point=locked.value?new THREE.Vector2(0,0):new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1)
 camera.updateMatrixWorld();scene.updateMatrixWorld();raycaster.setFromCamera(point,camera)
 const hit=raycaster.intersectObjects(scene.children,true).find(hit=>hit.object instanceof THREE.Mesh&&hit.object!==destinationMarker)
 if(!hit)return
 const radius=Math.hypot(hit.point.x,hit.point.z),goal=hit.point.clone()
 if(radius>11.1){goal.x*=11.1/radius;goal.z*=11.1/radius}
 if(!isWalkablePoint(goal.x,goal.z,colliders)){
  const toward=camera.position.clone().sub(hit.point);toward.y=0;toward.normalize()
  let found=false
  for(let distance=.5;distance<=4;distance+=.25){const candidate=goal.clone().addScaledVector(toward,distance);if(isWalkablePoint(candidate.x,candidate.z,colliders)){goal.copy(candidate);found=true;break}}
  if(!found){tip.value='Այս հատվածին անցանելի մոտեցում չկա։';return}
 }
 closeBook();if(!beginJourney(goal.x,goal.z)){tip.value='Այստեղ անցանելի ճանապարհ չկա։ Ընտրիր մեկ այլ կետ։';return}
 tip.value=''
}
function closeBook(){
 if(selectedCopy)pullouts.get(selectedCopy)?.setOpen(false)
 selectedCopy=undefined;selectedBook.value=null
}
function pickBook(clientX:number,clientY:number){
 if(!renderer||!camera)return undefined
 const rect=renderer.domElement.getBoundingClientRect(),point=locked.value?new THREE.Vector2(0,0):new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1)
 camera.updateMatrixWorld();scene.updateMatrixWorld();raycaster.setFromCamera(point,camera)
 return raycaster.intersectObjects(pickableBooks,false)[0]
}
function toggleBookCopy(hit:Pick<THREE.Intersection,'object'|'instanceId'>){
 const mesh=hit.object as THREE.Mesh,book=props.books.find(book=>book.id===mesh.userData.bookId)
 if(!book)return
 const key=mesh.uuid+':'+(hit.instanceId??'single')
 if(selectedCopy===key){closeBook();return}
 closeBook();journey=undefined;touring.value=false;keys.clear();walkVelocity.set(0,0)
 // Remove the temporary hover offset before capturing the book's exact resting pose.
 const featured=bookObjects.find(item=>item.mesh===mesh)
 if(featured){mesh.position.copy(featured.rest);mesh.updateMatrix()}
 let animation=pullouts.get(key)
 if(!animation){animation=createBookPullout(mesh,hit.instanceId);pullouts.set(key,animation)}
 animation.setOpen(true);selectedCopy=key;selectedBook.value=book;hovered.value=null;hoverPoint=undefined
 if(document.pointerLockElement===renderer?.domElement)document.exitPointerLock()
}
function teleportAt(clientX:number,clientY:number){
 if(!renderer||!camera)return
 const rect=renderer.domElement.getBoundingClientRect()
 const point=locked.value?new THREE.Vector2(0,0):new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1)
 camera.updateMatrixWorld();raycaster.setFromCamera(point,camera)
 const hit=raycaster.ray.intersectPlane(floorPlane,new THREE.Vector3())
 if(!hit||!isWalkablePoint(hit.x,hit.z,colliders)){
  tip.value='Ընտրիր ազատ կետ սրահի հատակին։';return
 }
 if(!beginJourney(hit.x,hit.z)){tip.value='Այստեղ անցանելի ճանապարհ չկա։ Ընտրիր մեկ այլ կետ։';return}
 tip.value=''
 if(destinationMarker){destinationMarker.position.set(hit.x,.035,hit.z);destinationMarker.visible=true;markerUntil=performance.now()+850}
 host.value?.focus({preventScroll:true})
}
function joystickDown(e:PointerEvent){e.preventDefault();if(joyId!==undefined)return;enter();journey=undefined;walkVelocity.set(0,0);lookAt=undefined;touring.value=false;joyId=e.pointerId;const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();joyOrigin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);joystickMove(e)}
function joystickMove(e:PointerEvent){if(e.pointerId!==joyId)return;let x=(e.clientX-joyOrigin.x)/32,y=(e.clientY-joyOrigin.y)/32;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length}joystick.value={x,y}}
function joystickUp(e:PointerEvent){if(e.pointerId===joyId){joystick.value={x:0,y:0};joyId=undefined}}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await host.value?.requestFullscreen()}catch{tip.value='Ամբողջ էկրանով դիտումը այս սարքում հասանելի չէ։'}}
function safeMove(dx:number,dz:number){
 const old=camera.position.clone(),next=constrainPosition(old.x+dx,old.z+dz)
 for(const obstacle of colliders){const x=next.x-obstacle.x,z=next.z-obstacle.z,len=Math.hypot(x,z),radius=obstacle.r+.3;if(len<radius){next.x=obstacle.x+(x/(len||1))*radius;next.z=obstacle.z+(z/(len||1))*radius}}
 camera.position.x=next.x;camera.position.z=next.z
}
onMounted(async()=>{
 mobile.value=window.matchMedia('(pointer: coarse)').matches
 try{
  // A slow font must not prevent the 3D room from opening.
  await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1500))]);if(disposed||!canvasHost.value)return
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05
  canvasHost.value.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Իրական եռաչափ գրադարանի սրահ')
  scene=new THREE.Scene();scene.background=new THREE.Color('#c8c5ba');scene.fog=new THREE.Fog('#c8c5ba',42,90)
  // A small, locally generated environment adds soft reflections without an HDR download.
  const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer)
  try{environmentTarget=pmrem.fromScene(environment,.06,.1,100,{size:256});scene.environment=environmentTarget.texture;scene.environmentIntensity=.38}finally{environment.dispose();pmrem.dispose()}
  camera=new THREE.PerspectiveCamera(70,1,.12,80);camera.position.set(initialView.x,EYE_HEIGHT,initialView.z);camera.rotation.order='YXZ'
  const room=createLibraryRoom(scene,mobile.value,props.books);for(const texture of room.textures)texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),mobile.value?4:8);colliders=room.colliders;bookObjects=room.selectable;pickableBooks=[...room.selectable.map(book=>book.mesh),...room.stackMeshes]
  destinationMarker=new THREE.Mesh(new THREE.RingGeometry(.28,.4,32),new THREE.MeshBasicMaterial({color:'#ffe0a0',transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}))
  destinationMarker.rotation.x=-Math.PI/2;destinationMarker.visible=false;scene.add(destinationMarker)
  const resize=()=>{if(!canvasHost.value||!renderer)return;const {width,height}=canvasHost.value.getBoundingClientRect();if(!width||!height)return;const ratio=Math.min(devicePixelRatio||1,mobile.value?1.6:2,Math.sqrt((mobile.value?1_250_000:4_000_000)/(width*height)));if(Math.abs(renderer.getPixelRatio()-ratio)>.01)renderer.setPixelRatio(ratio);renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()};observer=new ResizeObserver(resize);observer.observe(canvasHost.value);resize()
  intersection=new IntersectionObserver(([entry])=>{visible=Boolean(entry?.isIntersecting);if(!visible)clearInput()});intersection.observe(canvasHost.value)
  const listen=(target:EventTarget,event:string,handler:EventListener)=>{target.addEventListener(event,handler);cleanup.push(()=>target.removeEventListener(event,handler))}
  listen(window,'keydown',keyDown as EventListener);listen(window,'keyup',keyUp as EventListener);listen(window,'blur',clearInput)
  listen(document,'visibilitychange',()=>{if(document.hidden)clearInput()})
  listen(document,'pointerlockchange',()=>{locked.value=document.pointerLockElement===renderer?.domElement;if(!locked.value)clearInput()})
  listen(renderer.domElement,'pointerdown',pointerDown as EventListener);listen(renderer.domElement,'pointermove',pointerMove as EventListener);listen(renderer.domElement,'pointerup',pointerUp as EventListener);listen(renderer.domElement,'pointercancel',()=>{down=undefined});listen(renderer.domElement,'lostpointercapture',()=>{down=undefined});listen(renderer.domElement,'pointerleave',()=>{hovered.value=null;hoverPoint=undefined})
  listen(renderer.domElement,'dblclick',((event:MouseEvent)=>{event.preventDefault();clearTimeout(clickTimer);approachPoint(event.clientX,event.clientY)}) as EventListener)
  listen(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();failed.value=true;clearInput();emit('error')})
  renderFrame=time=>{
   if(disposed||props.paused||document.hidden||!visible||time-last<(mobile.value?32:16))return
   const dt=Math.min((time-last)/1000,.05);last=time
   if(journey){
    const progress=Math.min(1,(time-journey.started)/journey.duration),distance=smoothJourneyProgress(progress)*journey.total
    let travelled=0,index=0;while(index<journey.lengths.length-1&&travelled+journey.lengths[index]!<distance){travelled+=journey.lengths[index]!;index++}
    const t=Math.min(1,(distance-travelled)/(journey.lengths[index]||1))
    camera.position.lerpVectors(journey.points[index]!,journey.points[index+1]!,t);camera.position.y=THREE.MathUtils.lerp(journey.height,EYE_HEIGHT,smoothJourneyProgress(progress))
    if(progress>=1){const onArrive=journey.onArrive;journey=undefined;touring.value=false;onArrive?.()}
   }
   let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.value.y
   let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.value.x
   const len=Math.max(1,Math.hypot(forward,side));forward/=len;side/=len
   walkVelocity.lerp(new THREE.Vector2(-Math.sin(yaw)*forward+Math.cos(yaw)*side,-Math.cos(yaw)*forward-Math.sin(yaw)*side).multiplyScalar(4.8),1-Math.exp(-dt*((forward||side)?2.6:8)))
   if(!journey&&walkVelocity.lengthSq()>.0001)safeMove(walkVelocity.x*dt,walkVelocity.y*dt)
   if(!journey)camera.position.y=THREE.MathUtils.lerp(camera.position.y,targetHeight,1-Math.exp(-dt*4))
   if(lookAt){const dx=lookAt.x-camera.position.x,dz=lookAt.z-camera.position.z,distance=Math.hypot(dx,dz);if(distance<.35){lookAt=undefined}else{const targetYaw=Math.atan2(-dx,-dz),dy=Math.atan2(lookAt.y-camera.position.y,distance);yaw+=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw))*(1-Math.exp(-dt*3));pitch=THREE.MathUtils.lerp(pitch,dy,1-Math.exp(-dt*3))}}
   if(destinationMarker?.visible){const remaining=(markerUntil-time)/850;destinationMarker.visible=remaining>0;(destinationMarker.material as THREE.MeshBasicMaterial).opacity=Math.max(0,remaining)*.8}
   camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrixWorld()
   if(hoverPoint&&time-lastHover>75&&!down){
    lastHover=time;raycaster.setFromCamera(hoverPoint,camera)
    const hit=raycaster.intersectObjects(pickableBooks,false)[0]
    const book=hit?props.books.find(book=>book.id===hit.object.userData.bookId):undefined
    hoverMesh=hit?.object;hovered.value=book||null;if(renderer)renderer.domElement.style.cursor=book?'pointer':'grab'
   }
   for(const book of bookObjects){if(pullouts.has(book.mesh.uuid+':single'))continue;const active=book.mesh===hoverMesh&&book.id===hovered.value?.id;book.mesh.position.lerp(book.rest.clone().addScaledVector(book.normal,active?.3:0),1-Math.exp(-dt*10))}
   for(const [key,animation] of pullouts){if(!animation.update(dt))pullouts.delete(key)}
   renderer?.render(scene,camera)
  }
  renderer.setAnimationLoop(props.paused?null:renderFrame)
  loading.value=false;emit('ready')
 }catch(error){console.error('Library room initialization failed',error);failed.value=true;loading.value=false;emit('error')}
})
onUnmounted(()=>{
 disposed=true;clearTimeout(clickTimer);pullouts.forEach(animation=>animation.restore());pullouts.clear();clearInput();if(document.pointerLockElement===renderer?.domElement)document.exitPointerLock();cleanup.forEach(fn=>fn());observer?.disconnect();intersection?.disconnect();renderer?.setAnimationLoop(null)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>()
 scene?.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material]){materials.add(material);for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value)}}})
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environmentTarget?.dispose();renderer?.dispose();renderer?.domElement.remove()
})
defineExpose({visit,reset,focusBook})
</script>
<template>
 <div ref="host" class="grand-hall" tabindex="0" aria-label="Վիրտուալ գրադարան․ WASD կամ սլաքներով քայլիր, մկնիկը քաշելով նայիր շուրջդ, մկնիկը կազմի վրա պահելով ճանաչիր գիրքը">
  <div ref="canvasHost" class="hall-canvas"/>
  <div v-if="loading" class="hall-loading"><Landmark :size="42" :stroke-width="1"/><span>Բացում ենք սրահի դռները…</span><i/></div>
  <div v-if="failed" class="hall-loading"><Landmark :size="36"/><strong>3D սրահը չհաջողվեց բացել</strong><span>Փորձիր թարմացնել էջը կամ միացնել բրաուզերի գրաֆիկական արագացումը։</span></div>
  <template v-if="!loading&&!failed">
   <div class="hall-badge"><i/>FACTUM · ԳՐԱԴԱՐԱՆԻ ՄԵԾ ՍՐԱՀ<span>ՍՐԱՀ 01</span></div>
   <div class="hall-top-actions"><button aria-label="Սկզբնական տեսք" title="Սկզբնական տեսք" @click="reset"><RotateCcw :size="17"/></button><button aria-label="Ամբողջ էկրանով" title="Ամբողջ էկրանով" @click="fullscreen"><Expand :size="17"/></button></div>
   <aside v-if="selectedBook" class="selected-book-panel" aria-label="Դարակից ընտրված գիրքը">
    <header class="book-panel-heading"><span>FACTUM · ԳՐԱԴԱՐԱՆ</span><button type="button" class="return-book" aria-label="Փակել և վերադարձնել գիրքը դարակին" @click="closeBook"><X :size="18"/></button></header>
    <div class="book-panel-summary"><div class="book-cover-frame"><img :src="selectedBook.cover" :alt="selectedBook.title"/></div><div class="book-panel-title"><small>{{libraryTopics.find(topic=>topic.id===selectedBook?.topic)?.short}}</small><h2>{{selectedBook.title}}</h2><p>{{selectedBook.author}}</p><span class="book-language">Հայերեն</span></div></div>
    <p class="book-panel-description">{{selectedBook.description}}</p>
    <div class="book-panel-actions"><button v-if="selectedBook.file" type="button" class="book-read-action" @click="emit('read',selectedBook.id)">Կարդալ գիրքը <ArrowRight :size="16"/></button><button type="button" class="book-save-action save-control" :aria-pressed="library.includes(selectedBook.id)" @click="toggleBook(selectedBook.id)"><Heart :size="16" :fill="library.includes(selectedBook.id)?'currentColor':'none'"/>{{library.includes(selectedBook.id)?'Պահպանված է':'Պահպանել'}}</button></div>
    <button type="button" class="book-return-action" @click="closeBook">Վերադարձնել դարակին</button>
   </aside>
   <aside v-if="hovered&&!selectedBook" class="book-hover" :style="{left:`${hoverPosition.x}px`,top:`${hoverPosition.y}px`}"><img :src="hovered.cover" :alt="hovered.title"/><div><small>{{libraryTopics.find(topic=>topic.id===hovered?.topic)?.short}}</small><strong>{{hovered.title}}</strong><span>{{hovered.author}}</span></div></aside>
   <div v-if="locked" class="hall-crosshair" aria-hidden="true"/>
   <div class="hall-bottom"><div class="hall-instructions"><Move :size="15"/><span>{{mobile?'Հպում՝ ընտրել գիրքը · Joystick՝ քայլել · Քաշելով՝ նայել':locked?'Քլիք՝ ընտրել գիրքը · WASD՝ քայլել · Esc՝ ազատել մկնիկը':'Քլիք՝ ընտրել գիրքը · WASD՝ քայլել · Քաշելով՝ նայել'}}</span></div></div>
   <div v-if="mobile" class="touch-joystick" role="group" aria-label="Քայլելու touch joystick" @pointerdown="joystickDown" @pointermove="joystickMove" @pointerup="joystickUp" @pointercancel="joystickUp" @lostpointercapture="joystickUp"><ArrowUp class="joy-up" :size="13"/><ArrowDown class="joy-down" :size="13"/><ArrowLeft class="joy-left" :size="13"/><ArrowRight class="joy-right" :size="13"/><span :style="{transform:`translate(${joystick.x*28}px,${joystick.y*28}px)`}"/></div>
   <span v-if="touring" class="tour-status" role="status">Մոտենում ենք նշված կետին…</span><p v-if="tip" class="hall-tip" role="status">{{tip}}</p>
  </template>
 </div>
</template>
<style scoped>
.selected-book-panel{position:absolute;z-index:5;right:22px;top:76px;width:min(390px,calc(100% - 32px));max-height:calc(100% - 100px);overflow:auto;padding:22px;border:1px solid #bca16b66;background:radial-gradient(ellipse at 100% 0,#b99b5c16,transparent 65%),linear-gradient(145deg,#17283bf5,#091626fa);backdrop-filter:blur(22px);border-radius:20px;box-shadow:0 24px 70px #0008,inset 0 1px #f5ddaa12;color:#eee3cf;font-family:'Noto Sans Armenian',sans-serif;animation:book-panel-enter .25s ease-out}
.book-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:17px;margin-bottom:21px;border-bottom:1px solid #c4a56826}.book-panel-heading>span{font-size:9px;letter-spacing:1.8px;color:#bca576}.return-book{display:grid;place-items:center;width:32px;height:32px;border:1px solid #bca16b30;border-radius:50%;background:#ffffff04;color:#b8c4cd;transition:background .2s,color .2s}.return-book:hover{background:#ffffff0d;color:#f1d7a3}
.book-panel-summary{display:flex;gap:21px;align-items:center}.book-cover-frame{display:grid;place-items:center;flex-shrink:0;width:100px;height:145px;padding:0;overflow:hidden;background:linear-gradient(135deg,#d5b27312,#020b1466);border:1px solid #c8ad7426;border-radius:9px}.book-cover-frame img{width:100%;height:100%;object-fit:cover;filter:drop-shadow(4px 7px 5px #0008)}.book-panel-title{min-width:0}.book-panel-title small{font-size:10px;color:#c5a86f}.book-panel-title h2{font-size:21px;font-weight:500;line-height:1.5;margin:9px 0 8px;color:#f1e5ca}.book-panel-title p{font-size:12px;color:#acbdcc;line-height:1.8}.book-language{display:inline-block;margin-top:12px;padding:4px 9px;border:1px solid #b89c5f30;border-radius:20px;color:#c6b58f;font-size:9px}
.book-panel-description{margin:21px 0 23px;font-size:12px;line-height:1.95;color:#aebdca}.book-panel-actions{display:flex;gap:10px}.book-panel-actions button{display:flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:11px 14px;border-radius:10px;font-size:11px;transition:background .2s,box-shadow .2s}.book-read-action{flex:1;border:1px solid #dec28a;background:linear-gradient(135deg,#e2c58c,#bfa069);color:#142235;font-weight:600;box-shadow:0 4px 15px #b99b5c15}.book-read-action:hover{box-shadow:0 5px 20px #b99b5c40}.book-save-action{border:1px solid #bba16b55;color:#d3bd91;background:#c3a46d08}.book-save-action:hover,.book-save-action[aria-pressed=true]{background:#c3a46d20;color:#f0d49c}.book-return-action{display:block;margin:17px auto 0;padding:8px;color:#91a4b5;font-size:10px}.book-return-action:hover{color:#dfc798}.selected-book-panel button:focus-visible{outline:2px solid #f1d6a0;outline-offset:3px}
@keyframes book-panel-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width:600px){.selected-book-panel{right:10px;top:62px;width:calc(100% - 20px);max-height:calc(100% - 80px);padding:18px;border-radius:16px}.book-cover-frame{width:85px;height:125px}.book-panel-title h2{font-size:19px}.book-panel-summary{gap:16px}}@media(prefers-reduced-motion:reduce){.selected-book-panel{animation:none}}


.book-hover{position:absolute;z-index:4;display:flex;gap:12px;width:270px;padding:13px;border:1px solid #dfc38d88;background:#0d1b29f0;backdrop-filter:blur(15px);border-radius:12px;pointer-events:none;box-shadow:0 12px 35px #0007;color:#eee1c5}.book-hover>img{width:55px;height:82px;object-fit:cover;background:#19212a;border-radius:3px}.book-hover>div{display:flex;flex-direction:column;gap:6px;min-width:0}.book-hover small{font-size:8px;color:#bda26f}.book-hover strong{font-size:12px;line-height:1.6}.book-hover span{font-size:10px;color:#b0c1c8;line-height:1.5}.book-hover em{font-size:8px;font-style:normal;color:#869ba7}

.grand-hall{position:relative;width:100%;height:100%;min-height:580px;background:#1c2023;outline:none;overflow:hidden;isolation:isolate}.grand-hall:focus-visible{box-shadow:inset 0 0 0 2px #d2b77e}.hall-canvas{position:absolute;inset:0;touch-action:none}.hall-canvas :deep(canvas){display:block;width:100%;height:100%}.hall-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:radial-gradient(ellipse at 50% 30%,#384044,#111b26 70%);color:#dfc594;font-size:12px;text-align:center;padding:25px}.hall-loading i{width:90px;height:2px;background:linear-gradient(90deg,transparent,#d7bc87,transparent);animation:loading-pulse 1.8s ease-in-out infinite}.hall-loading strong{font-size:20px}.hall-badge{position:absolute;top:24px;left:25px;display:flex;align-items:center;gap:10px;padding:11px 15px;border:1px solid #fff1c832;background:#0b1924bb;border-radius:24px;backdrop-filter:blur(12px);font-size:9px;letter-spacing:1.5px;color:#ead9b3;pointer-events:none}.hall-badge>i{width:5px;height:5px;border-radius:50%;background:#d8c28f;box-shadow:0 0 9px #d8c28f}.hall-badge>span{border-left:1px solid #ffffff2a;padding-left:12px;font-size:8px;color:#b9c7c6}.hall-top-actions{position:absolute;right:20px;top:22px;display:flex;gap:8px}.hall-top-actions button{display:grid;place-items:center;width:36px;height:36px;border:1px solid #ffffff36;background:#0b1924b8;border-radius:50%;color:#eddfc2;backdrop-filter:blur(8px)}.hall-bottom{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:30px 25px 22px;background:linear-gradient(transparent,#091522e8);pointer-events:none}.hall-instructions{display:flex;align-items:center;gap:10px;font-size:10px;color:#f2e8d0;text-shadow:0 1px 4px #000}.hall-buttons{display:flex;gap:9px;pointer-events:auto}.hall-buttons button{display:flex;align-items:center;gap:8px;padding:12px 17px;background:#0d1c28be;border:1px solid #d5be8a70;border-radius:9px;color:#f1dfb9;font-size:11px;backdrop-filter:blur(8px)}.hall-buttons .enter-button{background:linear-gradient(130deg,#e8d1a5,#c5a36b);color:#152334;border-color:#ebd2a4}.hall-crosshair{position:absolute;left:50%;top:50%;width:5px;height:5px;background:#fff8da;border-radius:50%;box-shadow:0 0 3px #000;pointer-events:none}.tour-status{position:absolute;top:78px;left:27px;padding:9px 13px;color:#fff3d1;background:#0b1924b8;border-radius:8px;font-size:10px;pointer-events:none}.hall-tip{position:absolute;bottom:88px;left:25px;font-size:11px;color:#fff1d0;background:#152333d9;padding:9px;border-radius:8px}.touch-joystick{position:absolute;left:22px;bottom:105px;width:98px;height:98px;border:1px solid #eedab566;border-radius:50%;background:#0b19243d;backdrop-filter:blur(4px);touch-action:none;user-select:none}.touch-joystick>span{position:absolute;left:28px;top:28px;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#ead6ad,#ac8858);border:1px solid #fff3d599;box-shadow:0 4px 14px #0005;pointer-events:none}.touch-joystick>svg{position:absolute;color:#e8d7ad88;pointer-events:none}.joy-up{left:42px;top:6px}.joy-down{left:42px;bottom:6px}.joy-left{top:42px;left:6px}.joy-right{top:42px;right:6px}.grand-hall:fullscreen{height:100vh}.hall-top-actions button:focus-visible,.hall-buttons button:focus-visible{outline:2px solid #f1d6a0;outline-offset:3px}@keyframes loading-pulse{50%{opacity:.25;transform:scaleX(.6)}}@media(max-width:700px){.grand-hall{min-height:580px}.hall-badge{left:13px;top:16px;letter-spacing:.5px;font-size:7px;padding:10px}.hall-badge>span{display:none}.hall-top-actions{right:12px;top:13px}.hall-bottom{flex-direction:column-reverse;align-items:flex-end;padding:30px 13px 16px}.hall-instructions{font-size:8px;max-width:100%;line-height:1.8}.hall-buttons button{font-size:10px;padding:10px 12px}.hall-tip{left:12px;right:12px;bottom:78px;font-size:9px}.tour-status{top:64px;left:13px}}@media(prefers-reduced-motion:reduce){.hall-loading i{animation:none}}
</style>
