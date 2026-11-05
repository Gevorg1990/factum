import { AmbientLight, ACESFilmicToneMapping, Color, LineSegments, ShaderMaterial, Float32BufferAttribute, DirectionalLight, DoubleSide, Group, Line, LineBasicMaterial, BufferGeometry, Mesh, MeshStandardMaterial, PerspectiveCamera, Raycaster, Scene, SphereGeometry, Spherical, Vector2, Vector3, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EARTH_RADIUS, earthLayers } from '../../data/earth/interior'
import type { EarthLayerId } from '../../data/earth/interior'
import type { CountryFeature } from '../globe'
import { clampDepth } from './interior'
import { EARTH_CUT_ANGLE, sectionGeometry, shellSurface } from './geometry'
import { createEarthSurfaceTexture } from './surface.client'
import { createInteriorMaterial, createInteriorEnvironment, selectInteriorMaterial } from './materials'
export type EarthScene = ReturnType<typeof createEarthScene>
export function createEarthScene(host: HTMLElement, select: (id: EarthLayerId)=>void, onError: ()=>void, reducedMotion=false) {
  const renderer=new WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})
  renderer.toneMapping=ACESFilmicToneMapping
  renderer.toneMappingExposure=1.05
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6))
  renderer.domElement.setAttribute('aria-hidden','true'); host.appendChild(renderer.domElement)
  const scene=new Scene(), root=new Group(), camera=new PerspectiveCamera(40,1,.05,100)
  const environment=createInteriorEnvironment()
  scene.environment=environment
  scene.add(root,new AmbientLight(0xe4e0d5,.8))
  const key=new DirectionalLight(0xffedda,3.2); key.position.set(-3,5,7); scene.add(key)
  const fill=new DirectionalLight(0xadcfff,1.3);fill.position.set(-5,1,-2);scene.add(fill)
  const rim=new DirectionalLight(0xd7e4ee,1.1); rim.position.set(4,-2,-3); scene.add(rim)
  const controls=new OrbitControls(camera,renderer.domElement)
  controls.enablePan=false; controls.enableDamping=false; controls.minDistance=3.2; controls.maxDistance=16
  const parts: { surface: Mesh; first: Mesh; second: Mesh; inner:number; outer:number; id:EarthLayerId; material:MeshStandardMaterial; cutMaterial:MeshStandardMaterial }[]=[]
  for(const layer of earthLayers) {
    const outer=(EARTH_RADIUS-layer.top)/EARTH_RADIUS*2,inner=(EARTH_RADIUS-layer.bottom)/EARTH_RADIUS*2
    const material=createInteriorMaterial(layer.id,false,{inner,outer}),cutMaterial=createInteriorMaterial(layer.id,true,{inner,outer})
    material.side=DoubleSide;cutMaterial.side=DoubleSide
    const surface=new Mesh(shellSurface(outer,0),material),first=new Mesh(sectionGeometry(inner,outer,0),cutMaterial),second=new Mesh(sectionGeometry(inner,outer,0,true),cutMaterial)
    for(const mesh of [surface,first,second]) { mesh.userData.layer=layer.id; root.add(mesh) }
    parts.push({surface,first,second,inner,outer,id:layer.id,material,cutMaterial})
  }
  const boundaryMaterial=new LineBasicMaterial({color:'#ffd7a0',transparent:true,opacity:.42})
  const boundaries=new LineSegments(new BufferGeometry(),boundaryMaterial);boundaries.name='earth-layer-boundaries';root.add(boundaries)
  const markerMaterial=new MeshStandardMaterial({color:'#d4f8ff',emissive:new Color('#4ce0ff'),emissiveIntensity:1.8,depthTest:false})
  const marker=new Mesh(new SphereGeometry(.035,16,12),markerMaterial);marker.renderOrder=10;root.add(marker)
  const routeMaterial=new LineBasicMaterial({color:'#b9eaff',transparent:true,opacity:.65,depthTest:false})
  const direction=new Vector3(-.65,0,.76).normalize()
  const route=new Line(new BufferGeometry().setFromPoints([new Vector3(),direction.clone().multiplyScalar(2.05)]),routeMaterial); route.renderOrder=9;root.add(route)
  const surfaceMaterial=new ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opening:{value:0}},
    vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform float opening;varying vec3 vPosition;void main(){float phi=atan(vPosition.z,-vPosition.x);if(phi<0.0)phi+=6.28318530718;if(opening>0.001&&phi<opening)discard;gl_FragColor=vec4(0.70,0.91,0.90,0.18);}'})
  let surfaceLines:LineSegments|undefined
  let surfaceTexture:ReturnType<typeof createEarthSurfaceTexture> = null
  function setSurface(features:readonly CountryFeature[]){
    surfaceTexture?.dispose()
    surfaceTexture=createEarthSurfaceTexture(features)
    const crust=parts.find(part=>part.id==='crust')!
    crust.material.map=surfaceTexture
    crust.material.color.set(surfaceTexture?'#ffffff':'#286989')
    crust.material.needsUpdate=true
    if(surfaceLines){root.remove(surfaceLines);surfaceLines.geometry.dispose();surfaceLines=undefined}
    const vertices:number[]=[]
    const point=(lon:number,lat:number)=>{const a=lat*Math.PI/180,b=lon*Math.PI/180;return[2.003*Math.cos(a)*Math.cos(b),2.003*Math.sin(a),-2.003*Math.cos(a)*Math.sin(b)]}
    for(const feature of features){
      const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates
      for(const polygon of polygons)for(const ring of polygon)for(let i=1;i<ring.length;i++){
        const a=ring[i-1]!,b=ring[i]!
        if(a.length<2||b.length<2||![...a,...b].every(Number.isFinite))continue
        let delta=b[0]!-a[0]!;if(delta>180)delta-=360;if(delta< -180)delta+=360
        const steps=Math.max(1,Math.ceil(Math.max(Math.abs(delta),Math.abs(b[1]!-a[1]!))/2))
        for(let j=0;j<steps;j++)vertices.push(...point(a[0]!+delta*j/steps,a[1]!+(b[1]!-a[1]!)*j/steps),...point(a[0]!+delta*(j+1)/steps,a[1]!+(b[1]!-a[1]!)*(j+1)/steps))
      }
    }
    if(vertices.length){const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));surfaceLines=new LineSegments(geometry,surfaceMaterial);surfaceLines.name='earth-country-outlines';root.add(surfaceLines)}
    render()
  }
  let opening=0,target=EARTH_CUT_ANGLE,frame=0,last=0,disposed=false,visible=true,reduced=reducedMotion
  const pointers=new Set<number>()
  let pointer: {x:number;y:number;id:number} | undefined
  const raycaster=new Raycaster(), pointerVector=new Vector2()
  function render() { if(!disposed&&visible&&!document.hidden) renderer.render(scene,camera) }
  function applyOpening(value:number) {
    opening=value
    const edges:number[]=[]
    if(value>.001)for(const part of parts)for(const phi of [0,value])for(let i=0;i<64;i++){
      for(const t of [i*Math.PI/64,(i+1)*Math.PI/64]){
        const r=part.outer+0.001
        edges.push(-r*Math.cos(phi)*Math.sin(t),r*Math.cos(t),r*Math.sin(phi)*Math.sin(t))
      }
    }
    boundaries.geometry.dispose();boundaries.geometry=new BufferGeometry()
    boundaries.geometry.setAttribute('position',new Float32BufferAttribute(edges,3))
    surfaceMaterial.uniforms.opening!.value=value
    for(const part of parts) {
      part.surface.geometry.dispose();part.surface.geometry=shellSurface(part.outer,value)
      part.second.geometry.dispose();part.second.geometry=sectionGeometry(part.inner,part.outer,value,true)
      part.first.visible=part.second.visible=value>.001
    }
    // Probe lies in the middle of the removed wedge and remains readable through the cut.
    direction.set(-Math.cos(value/2),0,Math.sin(value/2))
    route.geometry.dispose();route.geometry=new BufferGeometry().setFromPoints([new Vector3(),direction.clone().multiplyScalar(2.05)])
    marker.position.copy(direction).multiplyScalar(marker.userData.radius ?? 2)
  }
  function animate(time:number) {
    frame=0
    if(disposed||!visible||document.hidden) return
    const dt=last?Math.min((time-last)/1000,.05):1/30;last=time
    const delta=target-opening
    applyOpening(Math.abs(delta)<.003?target:opening+Math.sign(delta)*Math.min(Math.abs(delta),dt*1.6))
    render()
    if(opening!==target) frame=requestAnimationFrame(animate)
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;last=0
    if(reduced) applyOpening(target)
    render()
    if(!disposed&&visible&&!document.hidden&&opening!==target) frame=requestAnimationFrame(animate)
  }
  function reset() { camera.position.set(-5.2,1.6,3.3); controls.target.set(0,0,0);controls.update();render() }
  function resize() { const {width,height}=host.getBoundingClientRect();if(!width||!height||disposed)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);render() }
  function pointerDown(event:PointerEvent) { pointers.add(event.pointerId);if(pointers.size>1){pointer=undefined;return}if(event.isPrimary&&event.button===0)pointer={x:event.clientX,y:event.clientY,id:event.pointerId} }
  function pointerUp(event:PointerEvent) {
    pointers.delete(event.pointerId)
    if(!pointer||pointer.id!==event.pointerId) return
    const moved=Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y);pointer=undefined
    if(moved>6) return
    const rect=renderer.domElement.getBoundingClientRect()
    pointerVector.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
    raycaster.setFromCamera(pointerVector,camera)
    const hit=raycaster.intersectObjects(parts.flatMap(p=>[p.surface,...(opening>.001?[p.first,p.second]:[])]),false)[0]
    if(hit) select(hit.object.userData.layer)
  }
  function cancelPointer(){pointer=undefined;pointers.clear()}
  function contextLost(event:Event){event.preventDefault();cancelAnimationFrame(frame);onError()}
  const canvas=renderer.domElement
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('webglcontextlost',contextLost)
  controls.addEventListener('change',render);document.addEventListener('visibilitychange',sync)
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host)
  const intersection=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;sync()});intersection.observe(host)
  reset();resize();applyOpening(0);sync()
  return {
    setSurface,
    setOpening(value:number){target=Math.max(0,Math.min(1,value))*EARTH_CUT_ANGLE;sync()},
    setReducedMotion(value:boolean){reduced=value;sync()},
    setDepth(depth:number){marker.userData.radius=2*(1-clampDepth(depth)/EARTH_RADIUS);marker.position.copy(direction).multiplyScalar(marker.userData.radius);render()},
    setLayer(id:EarthLayerId){for(const part of parts){selectInteriorMaterial(part.material,part.id===id);selectInteriorMaterial(part.cutMaterial,part.id===id)}render()},
    zoom(factor:number){camera.position.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,camera.position.length()*factor)));controls.update();render()},
    rotate(x:number,y:number){const s=new Spherical().setFromVector3(camera.position);s.theta+=x;s.phi=Math.max(.05,Math.min(Math.PI-.05,s.phi+y));camera.position.setFromSpherical(s);controls.update();render()},
    reset,
    dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',sync);controls.removeEventListener('change',render);controls.dispose();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',cancelPointer);canvas.removeEventListener('webglcontextlost',contextLost);for(const p of parts){p.surface.geometry.dispose();p.first.geometry.dispose();p.second.geometry.dispose();p.material.dispose();p.cutMaterial.dispose()}boundaries.geometry.dispose();boundaryMaterial.dispose();environment.dispose();surfaceTexture?.dispose();surfaceLines?.geometry.dispose();surfaceMaterial.dispose();marker.geometry.dispose();markerMaterial.dispose();route.geometry.dispose();routeMaterial.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove() },
  }
}
