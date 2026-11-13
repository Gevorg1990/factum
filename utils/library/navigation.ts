export const ROOM_RADIUS=17
export const MAX_WALK_RADIUS=13.8
export const EYE_HEIGHT=2.40
export const shelfAngle=(index:number)=>-Math.PI/2+([0,2,4,6,1,3,5,7,6][index]??index)*Math.PI/4
export function shelfPoint(index:number,radius=14.7){const angle=shelfAngle(index);return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius}}
export function constrainPosition(x:number,z:number){
 const radius=Math.hypot(x,z),max=MAX_WALK_RADIUS
 if(radius>max){x=x/radius*max;z=z/radius*max}
 // Walk around the central reading desk rather than through it.
 if(Math.abs(x)<2.5&&Math.abs(z)<1.7){if(Math.abs(x)/2.5>Math.abs(z)/1.7)x=Math.sign(x||1)*2.5;else z=Math.sign(z||1)*1.7}
 return {x,z}
}
export function normalizeBookSearch(value:string){return value.normalize('NFC').toLocaleLowerCase('hy-AM').trim()}
export function splitReadingPages(text:string,maxLength=5200){
 const paragraphs=text.replace(/\r\n/g,'\n').split(/\n\s*\n/),pages:string[]=[]
 let current=''
 for(const paragraph of paragraphs){
  if(paragraph.length>maxLength){if(current){pages.push(current);current=''};for(let i=0;i<paragraph.length;i+=maxLength)pages.push(paragraph.slice(i,i+maxLength));continue}
  if(current.length+paragraph.length+2>maxLength){pages.push(current);current=''}
  current+=(current?'\n\n':'')+paragraph
 }
 if(current.trim())pages.push(current)
 return pages.length?pages:['']
}

export function isWalkablePoint(x:number,z:number,obstacles:readonly {x:number;z:number;r:number}[]=[]){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x,z)>MAX_WALK_RADIUS)return false
 if(Math.abs(x)<2.5&&Math.abs(z)<1.7)return false
 return obstacles.every(obstacle=>Math.hypot(x-obstacle.x,z-obstacle.z)>=obstacle.r+.3)
}

export type WalkPoint={x:number;z:number}
export type WalkObstacle={x:number;z:number;r:number}
export function clearWalkSegment(a:WalkPoint,b:WalkPoint,obstacles:readonly WalkObstacle[]){
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.15))
 for(let i=0;i<=steps;i++){const t=i/steps;if(!isWalkablePoint(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,obstacles))return false}
 return true
}
// Bounded local navigation grid; no catalogue-sized work runs during a frame.
export function findWalkPath(start:WalkPoint,goal:WalkPoint,obstacles:readonly WalkObstacle[]):WalkPoint[]{
 if(!isWalkablePoint(goal.x,goal.z,obstacles))return []
 if(clearWalkSegment(start,goal,obstacles))return [goal]
 const step=.6,key=(x:number,z:number)=>`${x},${z}`,point=(id:string)=>{const [x,z]=id.split(',').map(Number);return {x:x!*step,z:z!*step}}
 function nearest(p:WalkPoint){const x=Math.round(p.x/step),z=Math.round(p.z/step);for(let r=0;r<4;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){const next={x:(x+dx)*step,z:(z+dz)*step};if(isWalkablePoint(next.x,next.z,obstacles)&&clearWalkSegment(p,next,obstacles))return key(x+dx,z+dz)}return ''}
 const first=nearest(start),last=nearest(goal);if(!first||!last)return []
 const open=new Set([first]),closed=new Set<string>(),cost=new Map([[first,0]]),rank=new Map([[first,0]]),parent=new Map<string,string>()
 for(let iteration=0;open.size&&iteration<3000;iteration++){
  let current='',best=Infinity;for(const id of open){const value=rank.get(id)??Infinity;if(value<best){best=value;current=id}}
  if(current===last){const route=[goal];let id=last;while(id!==first){route.unshift(point(id));id=parent.get(id)!}route.unshift(point(first));const simplified:WalkPoint[]=[];let anchor=start,index=0;while(index<route.length){let furthest=index;for(let j=index+1;j<route.length;j++){if(!clearWalkSegment(anchor,route[j]!,obstacles))break;furthest=j}simplified.push(route[furthest]!);anchor=route[furthest]!;index=furthest+1}return simplified}
  open.delete(current);closed.add(current);const p=point(current),gx=Math.round(p.x/step),gz=Math.round(p.z/step)
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const id=key(gx+dx!,gz+dz!),next=point(id);if(closed.has(id)||!clearWalkSegment(p,next,obstacles))continue
   const value=cost.get(current)!+Math.hypot(dx!,dz!)*step;if(value>=(cost.get(id)??Infinity))continue
   parent.set(id,current);cost.set(id,value);rank.set(id,value+Math.hypot(goal.x-next.x,goal.z-next.z));open.add(id)
  }
 }
 return []
}
export function smoothJourneyProgress(progress:number){const t=Math.max(0,Math.min(1,progress));return t*t*t*(t*(t*6-15)+10)}

// Numbered headings in verse collections mark complete poems, not stanzas.
export function splitBookPages(text:string,topic:string,maxLength=4400){
 const normalized=text.replace(/\r\n?/g,'\n').trim()
 if(topic==='poetry')return [normalized]
 if(topic!=='verse')return splitReadingPages(normalized,maxLength)
 const headings=[...normalized.matchAll(/^(?:\d+[.)]\s+[^\n]+)\n(?=\s*\n)/gm)]
 if(headings.length<2)return [normalized]
 return headings.map((heading,index)=>normalized.slice(index===0?0:heading.index,headings[index+1]?.index??normalized.length).trim())
}

export function readingPageTitle(page:string,index:number){
 const heading=page.split('\n').find(line=>/^\d+[.)]\s+/.test(line.trim()))
 return heading?.trim().replace(/^\d+[.)]\s+/,'')||page.split('\n').find(line=>line.trim())?.trim()||`Բանաստեղծություն ${index+1}`
}
