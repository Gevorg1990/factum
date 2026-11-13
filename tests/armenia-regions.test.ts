import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {armeniaRegions,armeniaRegionStories} from '../data/geography/armeniaRegions'
const raw=readFileSync(new URL('../data/geography/armenia-map.json',import.meta.url),'utf8'),map=JSON.parse(raw)
function inside(x:number,y:number,ring:number[][]){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i]!,b=ring[j]!;if((a[1]!>y)!==(b[1]!>y)&&x<(b[0]!-a[0]!)*(y-a[1]!)/(b[1]!-a[1]!)+a[0]!)hit=!hit}return hit}
test('Armenia has ten selectable marzes and a separate capital with matching map shapes',()=>{
 assert.equal(armeniaRegions.filter(region=>region.kind==='region').length,10);assert.equal(armeniaRegions.filter(region=>region.kind==='capital').length,1)
 assert.equal(new Set(armeniaRegions.map(region=>region.id)).size,11);assert.equal(map.features.length,11)
 assert.equal(armeniaRegions.reduce((sum,region)=>sum+region.area,0),29743)
 for(const region of armeniaRegions){const shape=map.features.find((shape:any)=>shape.id===region.id);assert.ok(shape,region.name);assert.ok(region.source.startsWith('https:'));assert.equal(region.highlights.length,3)
 const p=map.projection,[lon,lat]=region.coordinates,x=(lon-p.xmin)*p.xscale*p.scale+p.offsetX,y=(p.ymax-lat)*p.scale+p.offsetY
 const rings=shape.path.match(/M[^Z]+Z/g).map((ring:string)=>ring.slice(1,-1).split('L').map(pair=>pair.split(',').map(Number)))
 assert.ok(rings.some((ring:number[][])=>inside(x,y,ring)),region.center+' must lie inside its region')
 }
})
test('the map is a compact local vector asset with provenance and finite geometry',()=>{
 assert.ok(Buffer.byteLength(raw)<30000);assert.equal(map.license,'CC BY 2.5');assert.ok(map.source.startsWith('https://www.geoboundaries.org/'))
 for(const shape of map.features){assert.ok(!/NaN|Infinity/.test(shape.path));const pairs=[...shape.path.matchAll(/([\d.]+),([\d.]+)/g)];assert.ok(pairs.length>10);for(const pair of pairs){assert.ok(Number(pair[1])>=0&&Number(pair[1])<=600);assert.ok(Number(pair[2])>=0&&Number(pair[2])<=560)}}
})

test('each region has nature, heritage and explained sights, and Sevan has its own water layer',()=>{
 for(const region of armeniaRegions){const story=armeniaRegionStories[region.id]!;assert.ok(story.nature.length>100);assert.ok(story.heritage.length>100);assert.equal(story.places.length,region.highlights.length);assert.ok(story.places.every(text=>text.length>30))}
 assert.equal(map.lake.name,'Սևանա լիճ');assert.ok(map.lake.path.length>100);assert.equal(map.lake.license,'Public domain')
})

test('village layers have unique Armenian records and remain small per-region downloads',()=>{
 let total=0;const ids=new Set<string>()
 for(const region of armeniaRegions){const body=readFileSync(new URL(`../public/data/armenia/villages/${region.id}.json`,import.meta.url),'utf8'),layer=JSON.parse(body);assert.equal(layer.region,region.id);assert.equal(layer.license,'ODbL-1.0');assert.ok(Buffer.byteLength(body)<40000)
 for(const village of layer.items){assert.ok(!ids.has(village.id));ids.add(village.id);assert.match(village.name,/[Ա-Ֆա-ֆև]/);assert.ok(['village','hamlet'].includes(village.kind));assert.match(village.source,/^https:\/\/www.openstreetmap.org\/(node|way|relation)\/\d+$/);assert.ok(village.coordinates.every(Number.isFinite));assert.ok(village.point.every(Number.isFinite));total++}}
 assert.ok(total>800)
})

test('audited village identities do not duplicate across marzes or leak into Yerevan',()=>{
 const rows=armeniaRegions.flatMap(region=>JSON.parse(readFileSync(new URL(`../public/data/armenia/villages/${region.id}.json`,import.meta.url),'utf8')).items.map((village:any)=>({...village,region:region.id})))
 const identities=new Set<string>()
 for(const village of rows){if(!village.wikidata)continue;assert.ok(!identities.has(village.wikidata),village.name+' is duplicated');identities.add(village.wikidata)}
 assert.equal(rows.filter(village=>village.region==='AM-ER').length,0)
 for(const identity of ['Q2222235','Q2667137']){const village=rows.find(village=>village.wikidata===identity);assert.ok(village);assert.equal(village.region,'AM-AR')}
 for(const id of ['node/13069494840','node/13069494838','way/552362290','node/10973341911','way/448793044','node/12296547256'])assert.ok(!rows.some(village=>village.id===id))
})
test('Yerevan has twelve district polygons in a compact separate map with attribution',()=>{
 const raw=readFileSync(new URL('../public/data/armenia/districts/yerevan-map.json',import.meta.url),'utf8'),data=JSON.parse(raw)
 assert.ok(Buffer.byteLength(raw)<40000);assert.equal(data.license,'CC BY-SA 4.0');assert.equal(data.credit,'517design')
 assert.deepEqual(data.items.map((item:any)=>item.name),['Աջափնյակ','Ավան','Արաբկիր','Դավթաշեն','Էրեբունի','Կենտրոն','Մալաթիա-Սեբաստիա','Նոր Նորք','Նորք-Մարաշ','Նուբարաշեն','Շենգավիթ','Քանաքեռ-Զեյթուն'])
 for(const item of data.items){assert.ok(item.path.startsWith('M'));assert.ok(item.path.endsWith('Z'));assert.ok(item.label.every(Number.isFinite))}
})
