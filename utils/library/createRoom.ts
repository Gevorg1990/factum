import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {libraryBooks,libraryTopics} from '../../data/library/catalog'
import {libraryShelfEntries,type ShelfPlacements} from './shelfCatalog'
import {shelfPoint,shelfAngle} from './navigation'
export type BookObject={id:string;mesh:T.Mesh;rest:T.Vector3;normal:T.Vector3}
export function shelfBookMatrix(entry:Pick<ReturnType<typeof libraryShelfEntries>[number],'bay'|'level'|'row'|'lateral'>){
 const a=-Math.PI/2+entry.bay*Math.PI/4,rot=-a-Math.PI/2
 const normal=new T.Vector3(-Math.cos(a),0,-Math.sin(a)),tangent=new T.Vector3(Math.cos(rot),0,-Math.sin(rot))
 const p=new T.Vector3(Math.cos(a)*18.4,.25+entry.level*3.25+.2+entry.row*.9,Math.sin(a)*18.4).addScaledVector(tangent,entry.lateral).addScaledVector(normal,.72)
 return new T.Matrix4().compose(new T.Vector3(p.x,p.y+.75/2,p.z),new T.Quaternion().setFromEuler(new T.Euler(0,rot,0)),new T.Vector3(.25,.75,.55))
}
export function createLibraryRoom(scene:T.Scene,mobile:boolean,books:readonly typeof libraryBooks[number][]=libraryBooks,placements:ShelfPlacements={}){
 const batches=new Map<T.Material,T.BufferGeometry[]>(),textures:T.Texture[]=[],materials:T.Material[]=[],selectable:BookObject[]=[],stackMeshes:T.InstancedMesh[]=[],colliders:{x:number;z:number;r:number}[]=[]
 const mat=(color:string,metalness=0,roughness=.8)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});materials.push(m);return m}
 function texture(draw:(ctx:CanvasRenderingContext2D,size:number)=>void,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d')!,size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);return t}
 const marble=texture((c,s)=>{c.fillStyle='#e3d9c7';c.fillRect(0,0,s,s);for(let i=0;i<65;i++){c.beginPath();c.strokeStyle=i%3?'#85755c19':'#fff6df30';c.lineWidth=1+i%3;c.moveTo(-20,i*13);c.bezierCurveTo(s*.3,i*13-100,s*.6,i*13+90,s+20,i*13-20);c.stroke()}})
 const woodTex=texture((c,s)=>{c.fillStyle='#493329';c.fillRect(0,0,s,s);for(let i=0;i<180;i++){c.strokeStyle=i%2?'#c5915018':'#120b101c';c.lineWidth=1+i%3;c.beginPath();c.moveTo(i*3,0);c.bezierCurveTo(i*3+12,s*.33,i*3-9,s*.7,i*3,s);c.stroke()}})
 const stone=mat('#f5f0e6',.03,.78);stone.map=marble
 const wood=mat('#d6bd9d',.02,.72);wood.map=woodTex
 const gold=mat('#c4a46a',.58,.42),dark=mat('#102330'),plaster=mat('#e3d7c2',0,.95),velvet=mat('#663e3b'),black=mat('#152025'),glass=mat('#bbcdd2',.08,.42)
 glass.emissive.set('#6e9baf');glass.emissiveIntensity=.4
 const blueDome=mat('#2c465b',.04,.88);blueDome.side=T.DoubleSide
 function geometry(g:T.BufferGeometry,m:T.Material,matrix:T.Matrix4){g.applyMatrix4(matrix);const list=batches.get(m)||[];list.push(g);batches.set(m,list)}
 const matrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(1,1,1)
 function add(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,rx=0,ry=0,rz=0){q.setFromEuler(new T.Euler(rx,ry,rz));matrix.compose(new T.Vector3(x,y,z),q,scale);geometry(g,m,matrix)}
 function box(w:number,h:number,d:number,m:T.Material,x:number,y:number,z:number,ry=0){add(new T.BoxGeometry(w,h,d),m,x,y,z,0,ry)}
 function cylinder(r:number,h:number,m:T.Material,x:number,y:number,z:number,top=r){add(new T.CylinderGeometry(top,r,h,mobile?16:24),m,x,y,z)}
 function torus(r:number,tube:number,m:T.Material,x:number,y:number,z:number,rx=Math.PI/2,ry=0){add(new T.TorusGeometry(r,tube,6,mobile?64:96),m,x,y,z,rx,ry)}
 // A marble compass mosaic establishes the rotunda's scale.
 const mosaic=texture((c,s)=>{
  c.fillStyle='#b9ac94';c.fillRect(0,0,s,s);const cx=s/2
  for(let ring=0;ring<8;ring++){c.beginPath();c.arc(cx,cx,cx-ring*cx/9,0,Math.PI*2);c.strokeStyle=ring%2?'#26353c':'#d7c19a';c.lineWidth=ring%2?3:7;c.stroke()}
  for(let i=0;i<16;i++){const a=i*Math.PI/8;c.beginPath();c.moveTo(cx,cx);c.lineTo(cx+Math.cos(a-.09)*cx*.75,cx+Math.sin(a-.09)*cx*.75);c.lineTo(cx+Math.cos(a)*cx*.93,cx+Math.sin(a)*cx*.93);c.closePath();c.fillStyle=i%2?'#37444a':'#d6c39c';c.fill()}
 },mobile?1024:2048)
 const floor=mat('#ffffff',.15,.55);floor.map=mosaic;add(new T.CircleGeometry(19,96),floor,0,-.015,0,-Math.PI/2)
 cylinder(19,.25,stone,0,-.18,0)
 for(const r of [3.3,6.5,13.9,17.7])torus(r,.035,gold,0,.015,0)
 // Soft baked contact shadows stay cheap: one texture and one batched material.
 const contactTexture=texture((c,s)=>{
  const gradient=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2)
  gradient.addColorStop(0,'rgba(8,15,21,.65)');gradient.addColorStop(.4,'rgba(8,15,21,.28)');gradient.addColorStop(1,'rgba(8,15,21,0)')
  c.fillStyle=gradient;c.fillRect(0,0,s,s)
 },128)
 const contact=new T.MeshBasicMaterial({map:contactTexture,transparent:true,opacity:.38,depthWrite:false,toneMapped:false});materials.push(contact)
 function contactShadow(x:number,z:number,w:number,d:number){add(new T.PlaneGeometry(w,d),contact,x,-.004,z,-Math.PI/2)}
 contactShadow(0,0,6,6)
 // Octagonal walls, three-storey stacks, marble piers, and glazed clerestory.
 for(let i=0;i<8;i++){
  const a=-Math.PI/2+i*Math.PI/4,x=Math.cos(a)*18.4,z=Math.sin(a)*18.4,rot=-a-Math.PI/2
  box(14.5,13,.35,plaster,x,6.4,z,rot)
  const normal=new T.Vector3(-Math.cos(a),0,-Math.sin(a)),tangent=new T.Vector3(Math.cos(rot),0,-Math.sin(rot))
  const point=(lx:number,ly:number,lz:number)=>new T.Vector3(x,ly,z).addScaledVector(tangent,lx).addScaledVector(normal,lz)
  function local(w:number,h:number,d:number,m:T.Material,lx:number,ly:number,lz:number){const p=point(lx,ly,lz);box(w,h,d,m,p.x,p.y,p.z,rot)}
  for(const offset of [-3,0,3]){
   local(2.2,2.5,.12,glass,offset,11,.25)
   local(.09,2.7,.2,gold,offset,11,.4);local(2.45,.09,.2,gold,offset,11,.4)
   for(const side of [-1,1])local(.16,2.8,.3,stone,offset+side*1.2,11,.35)
   local(2.6,.2,.4,gold,offset,12.45,.35)
  }
  // Each bay has three levels, each filled with instanced books.
  for(let level=0;level<3;level++){
   const y=.25+level*3.25
   local(10.8,2.95,.28,dark,0,y+1.48,.28)
   for(const sx of [-5.45,-1.82,1.82,5.45])local(.17,3.12,.95,wood,sx,y+1.5,.6)
   for(let row=0;row<4;row++)local(11,.11,1,wood,0,y+.14+row*.9,.65)
   local(11.25,.19,1.12,gold,0,y+3,.6)
  }
  const ca=a+Math.PI/8,px=Math.cos(ca)*15.85,pz=Math.sin(ca)*15.85
  colliders.push({x:px,z:pz,r:.85});contactShadow(px,pz,2.8,2.8)
  cylinder(.64,11.4,stone,px,5.8,pz,.52);cylinder(.95,.32,stone,px,.16,pz)
  for(const y of [10.9,11.15,11.4])cylinder(.85,.15,stone,px,y,pz)
 }
 // Decorated real geometry dome, with ribs, coffer rings, and an illuminated oculus.
 const dome=new T.SphereGeometry(19,mobile?40:64,20,0,Math.PI*2,0,Math.PI/2);dome.scale(1,.5,1);add(dome,blueDome,0,12,0)
 for(const y of [12,12.3,12.65])torus(18.8,.18,y===12.3?gold:stone,0,y,0)
 for(let ring=1;ring<=5;ring++){const theta=ring*Math.PI/12;torus(19*Math.sin(theta),.075,gold,0,12+9.5*Math.cos(theta),0)}
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,points:T.Vector3[]=[]
  for(let j=0;j<=24;j++){const t=j/24*Math.PI/2;points.push(new T.Vector3(Math.cos(a)*19*Math.sin(t),12+9.5*Math.cos(t),Math.sin(a)*19*Math.sin(t)))}
  add(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.08,5,false),gold)
 }
 const oculus=new T.MeshBasicMaterial({color:'#fff1c8',side:T.DoubleSide});materials.push(oculus)
 add(new T.CircleGeometry(2.15,48),oculus,0,21.3,0,Math.PI/2);torus(2.2,.16,gold,0,21.2,0)
 // Every physical copy has a real catalogue identity; editions reuse materials/textures.
 const coverCache=new Map<string,T.Texture>(),spineCache=new Map<string,T.Texture>()
 function coverTexture(book:typeof libraryBooks[number]){
  const cached=coverCache.get(book.id);if(cached)return cached
  let cover:T.Texture
  if(typeof window!=='undefined'){
   cover=new T.TextureLoader().load(book.cover);cover.colorSpace=T.SRGBColorSpace;cover.anisotropy=4;textures.push(cover)
   if(book.id==='origin-species'){cover.repeat.x=.5;cover.offset.x=.5}
  }else cover=titleTexture(book.title,book.author,book.color,true)
  coverCache.set(book.id,cover);return cover
 }
 function spineTexture(book:typeof libraryBooks[number]){
  const cached=spineCache.get(book.id);if(cached)return cached
  const canvas=document.createElement('canvas');canvas.width=mobile?128:256;canvas.height=mobile?768:1024;const c=canvas.getContext('2d')!
  c.scale(canvas.width/256,canvas.height/1024)
  c.fillStyle=book.color;c.fillRect(0,0,256,1024)
  const shading=c.createLinearGradient(0,0,256,0);shading.addColorStop(0,'#00000040');shading.addColorStop(.18,'#ffffff10');shading.addColorStop(.8,'#00000000');shading.addColorStop(1,'#00000035');c.fillStyle=shading;c.fillRect(0,0,256,1024)
  c.strokeStyle='#e8ce98';c.lineWidth=2
  for(const y of [48,64,960,976]){c.beginPath();c.moveTo(18,y);c.lineTo(238,y);c.stroke()}
  c.save();c.translate(128,512);c.rotate(-Math.PI/2);c.textAlign='center';c.textBaseline='middle'
  function wrap(text:string,width:number){
   const lines:string[]=[];let line=''
   for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(line&&c.measureText(next).width>width){lines.push(line);line=word}else line=next}
   if(line)lines.push(line);return lines
  }
  let size=72,titleLines:string[]=[]
  do{c.font=`700 ${size}px "Noto Sans Armenian",sans-serif`;titleLines=wrap(book.title,820);if(titleLines.length<=2||size<=28)break;size-=4}while(size>=28)
  if(titleLines.length===3&&size>48){size=48;c.font=`700 ${size}px "Noto Sans Armenian",sans-serif`;titleLines=wrap(book.title,820)}
  const leading=Math.min(76,size*1.08)
  c.fillStyle='#fff4d9';c.shadowColor='#07101f';c.shadowBlur=2;c.shadowOffsetY=1
  titleLines.forEach((line,index)=>c.fillText(line,0,-25+(index-(titleLines.length-1)/2)*leading,820))
  c.shadowBlur=0;c.shadowOffsetY=0
  let authorSize=32;c.font=`500 ${authorSize}px "Noto Sans Armenian",sans-serif`
  while(c.measureText(book.author).width>820&&authorSize>20){authorSize-=2;c.font=`500 ${authorSize}px "Noto Sans Armenian",sans-serif`}
  c.fillStyle='#e8d8b4';c.fillText(book.author,0,92,820);c.restore()
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=mobile?4:8;textures.push(texture);spineCache.set(book.id,texture);return texture
 }
 for(const entry of libraryShelfEntries(books,placements)){
  const book=entry.book
  const cover=mat('#ffffff',0,.88);cover.map=coverTexture(book)
  const spine=mat('#ffffff',0,.92);spine.map=spineTexture(book)
  const back=mat(book.color,.06,.7),paper=mat('#dfd0ad')
  const copies=new T.InstancedMesh(new T.BoxGeometry(1,1,1),[cover,back,paper,paper,spine,spine],1)
  copies.userData.bookId=book.id;copies.userData.topic=book.topic
  copies.setMatrixAt(0,shelfBookMatrix(entry))
  copies.instanceMatrix.needsUpdate=true;copies.computeBoundingSphere();scene.add(copies);stackMeshes.push(copies)
 }
 function titleTexture(title:string,author:string,color:string,portrait=false){
  const canvas=document.createElement('canvas');canvas.width=portrait?512:1024;canvas.height=portrait?720:180;const c=canvas.getContext('2d')!,w=canvas.width,h=canvas.height
  c.fillStyle=color;c.fillRect(0,0,w,h);c.strokeStyle='#dec492';c.lineWidth=4;c.strokeRect(15,15,w-30,h-30);c.lineWidth=1;c.strokeRect(24,24,w-48,h-48);c.textAlign='center';c.fillStyle='#f2e1b9'
  if(portrait){c.font='18px sans-serif';c.fillText('COGNITIO · LIBRARY',w/2,78);c.font='35px "Noto Sans Armenian",sans-serif';const words=title.split(' ');let line='',lines:string[]=[];for(const word of words){if(c.measureText(line+' '+word).width>w-70){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);lines.forEach((text,i)=>c.fillText(text,w/2,250+i*55));c.font='21px "Noto Sans Armenian",sans-serif';c.fillText(author,w/2,560,w-65);c.font='55px serif';c.fillText('✦',w/2,640)}else{c.font='600 76px "Noto Sans Armenian",sans-serif';c.textBaseline='middle';c.fillText(title,w/2,h/2,w-90)}
  const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;textures.push(t);return t
 }
 for(const topic of libraryTopics){
  const angle=shelfAngle(topic.shelf),rot=-angle-Math.PI/2
  const material=new T.MeshBasicMaterial({map:titleTexture(topic.title,'','#102033'),toneMapped:false});materials.push(material)
  const siblings=libraryTopics.filter(item=>shelfAngle(item.shelf)===angle),slot=siblings.findIndex(item=>item.id===topic.id)
  const offset=(slot-(siblings.length-1)/2)*4.4
  const sign=new T.Mesh(new T.PlaneGeometry(siblings.length>1?4.1:8.5,1.15),material);sign.position.set(Math.cos(angle)*17.05+Math.cos(rot)*offset,10.45,Math.sin(angle)*17.05-Math.sin(rot)*offset);sign.rotation.y=rot;scene.add(sign)
  const lectern=shelfPoint(topic.shelf,13.7);box(2.1,.15,1.2,wood,lectern.x,1.1,lectern.z,rot);box(.22,1,.22,gold,lectern.x,.5,lectern.z)
 }
 // Central circular desk, radial reading tables, brass lamps and chairs.
 cylinder(2.2,.92,wood,0,.46,0);cylinder(2.35,.12,gold,0,.96,0)
 const bulbMat=new T.MeshBasicMaterial({color:'#ffe9b2'});materials.push(bulbMat)
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+Math.PI/8,x=Math.cos(a)*8,z=Math.sin(a)*8,rot=-a
  box(2.6,.15,1.25,wood,x,.95,z,rot)
  for(const side of [-1,1]){const tx=x+Math.cos(rot)*side;const tz=z-Math.sin(rot)*side;box(.12,.9,.12,gold,tx,.45,tz,rot)}
  cylinder(.035,.65,gold,x,1.32,z)
  add(new T.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI/2),mat('#486758',.3,.4),x,1.65,z)
  add(new T.SphereGeometry(.11,8,6),bulbMat,x,1.62,z)
  const cx=Math.cos(a)*9.4,cz=Math.sin(a)*9.4;box(.85,.14,.85,velvet,cx,.55,cz,rot);box(.85,.95,.12,wood,cx,1,cz,rot)
  colliders.push({x,z,r:1.5},{x:cx,z:cz,r:.65});contactShadow(x,z,3.7,2.6);contactShadow(cx,cz,1.5,1.5)
 }
 // Merge static geometry by material to keep mobile draw calls low.
 for(const [material,geometries] of batches){const merged=mergeGeometries(geometries);if(merged)scene.add(new T.Mesh(merged,material));geometries.forEach(g=>g.dispose())}
 const ambient=new T.HemisphereLight('#eaf0f4','#9a8872',1.6);scene.add(ambient)
 const sun=new T.DirectionalLight('#fff1dc',2.6);sun.position.set(-8,19,4);scene.add(sun)
 const fill=new T.DirectionalLight('#d4e4f1',.65);fill.position.set(10,11,-10);scene.add(fill)
 for(const [x,z] of [[0,0],[-10,-8],[10,8]]){const light=new T.PointLight('#ffe3ba',mobile?60:80,30,2);light.position.set(x!,8,z!);scene.add(light)}
 return {selectable,stackMeshes,colliders,textures,materials}
}
