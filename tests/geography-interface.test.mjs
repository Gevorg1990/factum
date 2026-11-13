import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,readdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {moduleUrl} from './helpers/catalog.mjs'
const require=createRequire(import.meta.url),vue=require('vue'),ts=require('typescript'),sfc=require('@vue/compiler-sfc')
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8')
const countries=JSON.parse(read('public/data/geography/countries-v1.json')),statistics=JSON.parse(read('public/data/geography/statistics-2024-v1.json')),world=JSON.parse(read('public/data/geography/world-v1.json'))
const modules=Object.fromEntries(await Promise.all([['core','utils/geography/core.ts'],['labels','data/geography/labels.ts'],['places','data/geography/places.ts'],['population','data/countryPopulation.ts'],['globe','utils/globe.ts'],['games','utils/geography/games.ts'],['questions','data/geography/gameQuestions.ts']].map(async([key,p])=>[key,await import(moduleUrl(new URL(p,root)))])))
function compile(file){return ts.transpileModule(sfc.compileScript(sfc.parse(read(file),{filename:file}).descriptor,{id:'geo-test'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText}
function imports(name){if(name==='vue')return vue;if(name.includes('geography/core'))return modules.core;if(name.includes('geography/labels'))return modules.labels;if(name.includes('geography/places'))return modules.places;if(name.includes('countryPopulation'))return modules.population;if(name==='~/utils/globe')return modules.globe;if(name.includes('geography/games'))return modules.games;if(name.includes('gameQuestions'))return modules.questions;if(name==='lucide-vue-next')return {};throw Error(name)}
const tick=async()=>{await new Promise(r=>setImmediate(r));await vue.nextTick()}
test('all atlas, globe and existing profile templates and responsive styles compile',()=>{
 for(const file of [...readdirSync(new URL('components/globe/',root)).map(f=>'components/globe/'+f),'components/InteractiveGlobe.client.vue','pages/globe.vue','pages/profile.vue']){
  const d=sfc.parse(read(file),{filename:file}).descriptor
  assert.deepEqual(sfc.compileTemplate({source:d.template.content,filename:file,id:'geo-test'}).errors,[],file)
  for(const style of d.styles)assert.deepEqual(sfc.compileStyle({source:style.content,filename:file,id:'geo-test',scoped:true}).errors,[],file)
 }
})
function setupGlobe({reduced=true,failLayer=false,mobile=false,remoteSearch=async()=>({items:[]})}={}){
 const d3scope={};runInNewContext(read('public/vendor/d3-7.9.0.min.js'),d3scope)
 const frames=new Map(),cleanup=[],mounted=[],emitted=[],props=vue.reactive({mapQuiz:false}),atlas={countries:vue.ref(countries),statistics:vue.ref(statistics),load:async()=>{}}
 let id=0
 const scope={...vue,exports:{},useGeographyContent:()=>({items:vue.shallowRef(modules.places.geographicPlaces.map(p=>({...p,globeSearch:p.category==='Կղզիներ և ժայռեր'})))}),useGeographyAtlas:()=>atlas,usePopulationEstimates:()=>({estimates:vue.ref({}),status:vue.ref('ready')}),onMounted:fn=>mounted.push(fn),onBeforeUnmount:fn=>cleanup.push(fn),window:{d3:d3scope.d3,matchMedia:query=>({matches:query.includes('prefers-reduced-motion')?reduced:mobile})},document:{getElementById:()=>null},AbortController,setTimeout,clearTimeout,requestAnimationFrame:fn=>{const n=++id;frames.set(n,fn);return n},cancelAnimationFrame:n=>frames.delete(n),fetch:async()=>({ok:true,json:async()=>world}),$fetch:async (path,options)=>{if(path==='/api/geography/search')return remoteSearch(options);if(path.includes('timezones')&&failLayer)throw Error('Unavailable');return JSON.parse(read('public'+path))},require:imports}
 runInNewContext(compile('components/InteractiveGlobe.client.vue'),scope)
 const app=scope.exports.default.setup(props,{expose(){},emit:(...args)=>emitted.push(args)})
 mounted.forEach(fn=>fn())
 return {app,frames,emitted,props,dispose:()=>cleanup.forEach(fn=>fn())}
}
test('search, country centering, small-country markers, geographic markers and map-answer events use real data',async()=>{
 const t=setupGlobe();await tick();assert.equal(t.app.error.value,false)
 t.app.search.value='ՀԱՅԱՍՏԱՆ';assert.ok(t.app.results.value.some(c=>c.cca3==='ARM'))
 t.app.search.value='Տրոմելեն';assert.ok(t.app.placeResults.value.some(p=>p.id==='tromelin'))
 t.app.chooseCode('FRA');assert.equal(t.app.selectedCode.value,'FRA');assert.equal(t.emitted.at(-1)[1],'FRA');assert.equal(t.app.rotation.value[0],-2)
 t.app.chooseCode('VAT');assert.equal(t.app.selectedCode.value,'VAT');assert.ok(t.app.islandPoints.value.some(p=>p.code==='VAT'))
 t.app.locate({coordinates:[-72.545,-13.163],label:'Մաչու Պիկչու'});assert.ok(t.app.marker.value);assert.equal(t.app.location.value.label,'Մաչու Պիկչու')
 t.dispose();assert.equal(t.frames.size,0)
})
test('one countries globe supports population and night overlays together without changing geometry, zoom or selection',async()=>{
 const t=setupGlobe();await tick();assert.equal(t.app.night.value,false);assert.equal(t.app.showPopulation.value,false)
 const arm=t.app.countries.value.find(c=>c.properties.ADM0_A3==='ARM'),rotation=[...t.app.rotation.value],zoom=t.app.zoom.value,paths=t.app.paths.value,selection=t.app.selectedCode.value
 t.app.showPopulation.value=true;await tick();assert.notEqual(t.app.countryFill(arm),'#36445a')
 t.app.populationMetric.value='density';const dayColor=t.app.countryFill(arm);assert.notEqual(dayColor,'#36445a')
 t.app.night.value=true;await tick();assert.equal(t.app.showPopulation.value,true);assert.notEqual(t.app.countryFill(arm),dayColor)
 assert.strictEqual(t.app.paths.value,paths);assert.deepEqual([...t.app.rotation.value],rotation);assert.equal(t.app.zoom.value,zoom);assert.equal(t.app.selectedCode.value,selection)
 assert.equal(t.app.tooltipPopulation.value,statistics.countries.ARM.population)
 assert.equal(t.app.selectedPopulation.value.year,statistics.year);assert.equal(t.app.selectedPopulation.value.value,statistics.countries.ARM.population);assert.equal(t.app.selectedPopulation.value.source.url,statistics.source.url)
 t.app.rasterError();await tick();assert.equal(t.app.night.value,true);assert.equal(t.app.showPopulation.value,true);assert.equal(t.app.lightsFailed.value,true);assert.ok(t.app.layerError.value)
 t.app.night.value=false;await tick();assert.equal(t.app.lightsFailed.value,false)
 assert.equal(t.app.zonePaths,undefined);t.dispose()
})
test('smooth rotation is cancellable; reduced-motion uses an immediate position and unmount releases frames',async()=>{
 const t=setupGlobe({reduced:false});await tick();t.app.chooseCode('JPN');assert.equal(t.frames.size,1);t.app.reset();assert.equal(t.frames.size,0);t.app.chooseCode('ARM');t.dispose();assert.equal(t.frames.size,0)
})
test('map game accepts one answer, scores once, advances and clears the map task on disposal',async()=>{
 const mounted=[],cleanup=[],emitted=[],props=vue.reactive({}),scope={...vue,exports:{},usePopulationEstimates:()=>({estimates:vue.ref({}),status:vue.ref('ready')}),useGeographyContent:()=>({items:vue.shallowRef(modules.places.geographicPlaces.map(p=>({...p,globeSearch:p.category==='Կղզիներ և ժայռեր'})))}),useGeographyAtlas:()=>({countries:vue.ref(countries),statistics:vue.ref(statistics),status:vue.ref('ready')}),onBeforeUnmount:fn=>cleanup.push(fn),require:imports}
 runInNewContext(compile('components/globe/GeographyGames.vue'),scope)
 const game=scope.exports.default.setup(props,{expose(){},emit:(...args)=>emitted.push(args)})
 game.mode.value='map';await tick();game.start();assert.ok(emitted.at(-1)[1]?.label)
 game.revealAnswer();assert.ok(!emitted.some(e=>e[0]==='mapReveal'))
 const correct=game.current.value.answer;props.mapAnswer={code:correct,requestId:1};await tick();assert.equal(game.score.value,10)
 props.mapAnswer={code:correct,requestId:2};await tick();assert.equal(game.score.value,10)
 assert.equal(game.isCorrect.value,true);assert.equal(game.canRevealAnswer.value,false);game.revealAnswer();assert.ok(!emitted.some(e=>e[0]==='mapReveal'))
 game.next();assert.equal(game.index.value,1);assert.equal(game.answer.value,null);assert.equal(game.isCorrect.value,false);assert.equal(game.canRevealAnswer.value,false)
 const nextCorrect=game.current.value.answer;props.mapAnswer={code:nextCorrect==='ARM'?'JPN':'ARM',requestId:3};await tick();assert.equal(game.canRevealAnswer.value,true);game.revealAnswer();assert.equal(emitted.at(-1)[1],nextCorrect);assert.equal(game.score.value,10)
 cleanup.forEach(fn=>fn());assert.equal(emitted.at(-1)[1],null)
})
test('raster projection samples geographic pixels, keeps the globe outside transparent and releases scheduled frames',async()=>{
 const d3scope={};runInNewContext(read('public/vendor/d3-7.9.0.min.js'),d3scope)
 const frames=new Map(),mounted=[],cleanup=[],emitted=[];let frameId=0,output
 const pixels=new Uint8ClampedArray(4*2*4)
 for(let y=0;y<2;y++)for(let x=0;x<4;x++){const i=(y*4+x)*4;pixels[i]=100+x*50;pixels[i+1]=70+y*80;pixels[i+3]=255}
 const context={clearRect(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:data=>{output=data}}
 class Image{width=4;height=2;set src(v){this.onload()}}
 const scope={...vue,exports:{},Image,document:{createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels,width:4,height:2})})})},onMounted:fn=>mounted.push(fn),onBeforeUnmount:fn=>cleanup.push(fn),requestAnimationFrame:fn=>{const id=++frameId;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),require:imports}
 runInNewContext(compile('components/globe/RasterLayer.client.vue'),scope)
 const props=vue.reactive({mode:'night',rotation:[-45,-25,0],zoom:1,projection:d3scope.d3.geoOrthographic().translate([340,340]).clipAngle(90)})
 const app=scope.exports.default.setup(props,{expose(){},emit:(...args)=>emitted.push(args)})
 app.canvas.value={getContext:()=>context};mounted.forEach(fn=>fn());assert.equal(frames.size,1)
 const [id,draw]=frames.entries().next().value;frames.delete(id);draw()
 const center=(140*280+140)*4;assert.equal(output.data[center],200);assert.equal(output.data[center+1],70);assert.ok(output.data[center+3]>0 && output.data[center+3]<255);assert.equal(output.data[3],0)
 props.rotation=[0,0,0];await tick();assert.equal(frames.size,1);cleanup.forEach(fn=>fn());assert.equal(frames.size,0);assert.equal(emitted.length,0)
})

test('night and vector layers share a square stage, tooltips stack above the SVG and time zones stay in the country panel',()=>{
 const file=read('components/InteractiveGlobe.client.vue'),css=sfc.parse(file).descriptor.styles[0].content
 const stage=css.match(/\.globe-stage \{([^}]+)\}/)[1]
 assert.match(stage,/aspect-ratio: 1/);assert.match(stage,/width: min\(100%, 680px\)/);assert.ok(!stage.includes('max-height'))
 const tooltip=css.match(/\.globe-tooltip \{([^}]+)\}/)[1],svg=css.match(/\.globe-stage>svg\{([^}]+)\}/)[1]
 assert.ok(Number(tooltip.match(/z-index:\s*(\d+)/)[1])>Number(svg.match(/z-index:\s*(\d+)/)[1]))
 const panel=sfc.parse(read('components/globe/CountryPanel.vue')).descriptor.template.content;for(const removed of ['Կառավարման ձև','Պատմություն','Մշակույթ','Հետաքրքիր փաստեր','role="tablist"'])assert.ok(!panel.includes(removed));assert.ok(!file.includes('timezones-v1.json'));assert.ok(read('components/globe/CountryPanel.vue').includes('Ժամային շեղումներ'))
 assert.ok(!file.includes('GlobeViewModes'))
 assert.ok(file.includes('v-model="showPopulation" type="checkbox"'))
 assert.ok(file.includes('v-model="night" type="checkbox"'))
})

test('geography games live below the atlas with consistent scoring',()=>{
 const page=read('pages/globe.vue'),atlas=read('components/globe/Atlas.vue'),game=read('components/globe/GeographyGames.vue')
 assert.ok(page.indexOf('<LazyGlobeGames')>page.indexOf('<WorldFacts'))
 const hub=read('components/globe/Games.client.vue');assert.match(hub,/CapitalVoiceQuiz/);assert.match(hub,/LazyGlobeGeographyGames/);assert.match(hub,/ՓՈՐՁԻՐ ՔՈ ԳԻՏԵԼԻՔՆԵՐԸ/)
 assert.doesNotMatch(atlas,/LazyGlobeGeographyGames/)
 assert.doesNotMatch(game,/difficulty|Դժվարության մակարդակ/)
 assert.match(game,/score\.value\+=10/)
})

test('latest population wins over the snapshot and density follows its actual year',async()=>{
 const t=setupGlobe();await tick()
 const latest={value:3100000,year:2025,source:{name:'World Bank',url:'https://data.worldbank.org/indicator/SP.POP.TOTL'}}
 t.app.populationEstimates.value={ARM:latest};await tick()
 assert.equal(t.app.selectedPopulation.value.year,2025);assert.equal(t.app.selectedPopulation.value.value,latest.value)
 const props=vue.reactive({country:countries.find(c=>c.cca3==='ARM'),countries,statistics,population:latest}),scope={...vue,exports:{},require:imports}
 runInNewContext(compile('components/globe/CountryPanel.vue'),scope)
 const panel=scope.exports.default.setup(props,{expose(){},emit(){}})
 assert.equal(panel.populationDensity.value,latest.value/props.country.area);assert.equal(panel.densityCalculated.value,true)
 props.population={value:statistics.countries.ARM.population,year:statistics.year,source:statistics.source};await tick()
 assert.equal(panel.populationDensity.value,statistics.countries.ARM.density);assert.equal(panel.densityCalculated.value,false)
 t.dispose()
})

test('mobile map answers remain visible for one second before returning and pending timers are cancelled',()=>{
 const timers=new Map(),cleanup=[],scrolls=[];let id=0
 const scope={...vue,exports:{},useHead(){},onBeforeUnmount:fn=>cleanup.push(fn),require:name=>name.endsWith('.css')?{}:imports(name),setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),window:{matchMedia:()=>({matches:true})},document:{getElementById:id=>({scrollIntoView:()=>scrolls.push(id),setAttribute(){},focus(){}})}}
 runInNewContext(compile('pages/globe.vue'),scope)
 const page=scope.exports.default.setup({}, {expose(){}})
 page.mapTask.value={label:'Գտիր երկիրը'};page.answerCountry('ARM')
 assert.equal(page.mapAnswerPending.value,true);assert.equal(page.mapAnswer.value.code,'ARM');assert.equal(scrolls.length,0)
 page.answerCountry('JPN');assert.equal(page.mapAnswer.value.code,'ARM');assert.equal(timers.size,1)
 const timer=timers.values().next().value;assert.equal(timer.ms,1000);timers.clear();timer.fn()
 assert.equal(page.mapAnswerPending.value,false);assert.deepEqual(scrolls,['globe-games'])
 page.answerCountry('JPN');assert.equal(timers.size,1);cleanup.forEach(fn=>fn());assert.equal(timers.size,0)
})


test('mobile map selection previews without answering, offers nearby small countries and confirms once',async()=>{
 const t=setupGlobe({mobile:true});await tick();t.props.mapQuiz=true;await tick()
 t.app.chooseCode('ARM');assert.equal(t.app.quizCandidate.value,'ARM');assert.equal(t.emitted.length,0)
 t.app.chooseCode('JPN');assert.equal(t.app.quizCandidate.value,'JPN');assert.equal(t.emitted.length,0)
 t.app.rotation.value=[-50.55,-26.07,0]
 t.app.stage.value={getBoundingClientRect:()=>({left:0,top:0,width:340,height:340})}
 t.app.nearbyAt({clientX:170,clientY:170});assert.ok(t.app.nearbyQuizCountries.value.some(c=>c.cca3==='BHR'));assert.ok(t.app.nearbyQuizCountries.value.length<=5)
 t.app.previewQuizCountry('BHR');assert.ok(t.app.marker.value);assert.equal(t.emitted.length,0)
 t.app.confirmQuizCountry();assert.equal(t.emitted.at(-1)[1],'BHR');const count=t.emitted.length;t.app.confirmQuizCountry();assert.equal(t.emitted.length,count)
 t.props.mapQuiz=false;await tick();assert.equal(t.app.quizCandidate.value,null);assert.equal(t.app.nearbyQuizCountries.value.length,0)
 t.dispose()
})

 test('mapped islands have visible selectable land points and mobile quiz selection waits for confirmation',async()=>{
 const t=setupGlobe({mobile:true});await tick()
 assert.ok(t.app.countries.value.some(c=>c.properties.ADM0_A3==='MDV'&&c.properties.POINT))
 t.app.chooseCode('MDV');await tick()
 assert.ok(t.app.islandPoints.value.some(p=>p.code==='MDV'))
 const island=countries.find(c=>c.cca3==='MDV')
 t.app.rotation.value=[180-island.latlng[1],island.latlng[0],0];await tick()
 assert.ok(!t.app.islandPoints.value.some(p=>p.code==='MDV'))
 t.props.mapQuiz=true;await tick();const count=t.emitted.length
 t.app.chooseCode('MDV');assert.equal(t.app.quizCandidate.value,'MDV');assert.equal(t.emitted.length,count)
 t.app.confirmQuizCountry();assert.equal(t.emitted.at(-1)[1],'MDV')
 t.dispose()
})

test('all island markers are on their own actual land geometry',()=>{
 const scope={};runInNewContext(read('public/vendor/d3-7.9.0.min.js'),scope)
 for(const feature of world.features){
  const point=feature.properties.POINT;if(!point)continue
  const oriented=modules.globe.orientCountry(feature,scope.d3.geoArea)
  assert.ok(scope.d3.geoContains(oriented,point),feature.properties.ADM0_A3)
 }
})

test('mixed winding island polygons never paint the globe as a country',()=>{
 const scope={};runInNewContext(read('public/vendor/d3-7.9.0.min.js'),scope)
 for(const feature of world.features){
  const oriented=modules.globe.orientCountry(feature,scope.d3.geoArea)
  assert.ok(scope.d3.geoArea(oriented)<2*Math.PI,feature.properties.ADM0_A3)
  const polygons=oriented.geometry.type==='Polygon'?[oriented.geometry.coordinates]:oriented.geometry.coordinates
  for(const coordinates of polygons)assert.ok(scope.d3.geoArea({type:'Polygon',coordinates})<=2*Math.PI,feature.properties.ADM0_A3)
 }
})

 test('Bishop Rock is searchable and uses Trinity House lighthouse coordinates',async()=>{
 const t=setupGlobe();await tick()
 for(const query of ['Բիշոփ Ռոք','Bishop Rock']){t.app.search.value=query;assert.ok(t.app.placeResults.value.some(p=>p.id==='bishop-rock'))}
 const place=t.app.placeResults.value.find(p=>p.id==='bishop-rock')
 assert.ok(Math.abs(place.coordinates[0]-(-(6+26.734/60)))<1e-8)
 assert.ok(Math.abs(place.coordinates[1]-(49+52.371/60))<1e-8)
 t.app.locate({coordinates:place.coordinates,label:place.title});await tick()
 assert.ok(t.app.landmarkPoints.value.some(p=>p.place.id==='bishop-rock'));assert.ok(t.app.marker.value)
 t.dispose()
})

test('Bouvet Island is searchable with the Armenian definite article and centers its land marker',async()=>{
 const t=setupGlobe();await tick()
 for(const query of ['Բուվե','Բուվե կղզի','Բուվե կղզին','Bouvet Island']){t.app.search.value=query;assert.ok(t.app.results.value.some(c=>c.cca3==='BVT'),query)}
 t.app.chooseCode('BVT');await tick()
 assert.equal(t.app.selectedCode.value,'BVT');assert.ok(t.app.islandPoints.value.some(p=>p.code==='BVT'))
 assert.equal(t.app.rotation.value[0],-3.4);assert.equal(t.app.rotation.value[1],54.43333333)
 t.dispose()
})

test('Tromelin is searchable in Armenian with its article and English and has a map point',async()=>{
 const t=setupGlobe();await tick()
 for(const query of ['Տրոմելեն','Տրոմելեն կղզին','Tromelin']){t.app.search.value=query;assert.ok(t.app.placeResults.value.some(p=>p.id==='tromelin'),query)}
 const place=t.app.placeResults.value.find(p=>p.id==='tromelin')
 t.app.locate({coordinates:place.coordinates,label:place.title});await tick()
 assert.ok(t.app.landmarkPoints.value.some(p=>p.place.id==='tromelin'));assert.ok(t.app.marker.value)
 t.dispose()
})

test('global results center a source-linked map marker and stale searches cannot replace new ones',async()=>{
 let resolve
 const t=setupGlobe({remoteSearch:async()=>await new Promise(r=>resolve=r)});await tick()
 const place={id:'node/1',label:'Reykjavík',context:'Iceland',coordinates:[-21.94,64.15],url:'https://www.openstreetmap.org/node/1'}
 t.app.search.value='Reykjavik';await tick();const request=t.app.searchWorld()
 assert.equal(t.app.worldSearchState.value,'loading');resolve({items:[place]});await request
 assert.equal(t.app.worldResults.value[0].label,'Reykjavík')
 t.app.chooseWorldPlace(place);await tick()
 assert.equal(t.app.location.value.source.url,place.url);assert.ok(t.app.marker.value);assert.equal(t.app.rotation.value[0],21.94)
 t.app.search.value='Paris';await tick();const stale=t.app.searchWorld()
 t.app.search.value='Tokyo';await tick();resolve({items:[place]});await stale
 assert.equal(t.app.worldResults.value.length,0);assert.equal(t.app.worldSearchState.value,'idle')
 t.dispose()
})

test('world search errors preserve local matches and map quizzes prevent external selection',async()=>{
 const t=setupGlobe({remoteSearch:async()=>{throw Error('offline')}});await tick()
 t.app.search.value='Բուվե';await tick();await t.app.searchWorld()
 assert.equal(t.app.worldSearchState.value,'error');assert.ok(t.app.results.value.some(c=>c.cca3==='BVT'))
 t.props.mapQuiz=true;await tick()
 t.app.chooseWorldPlace({id:'node/1',label:'Test',context:'',coordinates:[0,0],url:'https://www.openstreetmap.org/node/1'})
 assert.equal(t.app.location.value,null);assert.equal(t.app.worldResults.value.length,0)
 t.dispose()
})

test('typing automatically searches after a pause without Enter and excludes internal local places',async()=>{
 let calls=0
 const t=setupGlobe({remoteSearch:async()=>{calls++;return {items:[]}}});await tick()
 t.app.search.value='school';await tick();assert.equal(calls,0)
 t.app.search.value='island';await tick()
 await new Promise(resolve=>setTimeout(resolve,650));await tick()
 assert.equal(calls,1);assert.equal(t.app.worldSearchState.value,'ready')
 t.app.search.value='Երևան';await tick();assert.equal(t.app.results.value.length,0)
 t.app.search.value='Մաչու Պիկչու';await tick();assert.equal(t.app.placeResults.value.length,0)
 t.dispose()
})


test('centering renders each animation frame and returns to detailed outlines when finished',async()=>{
 const t=setupGlobe({reduced:false});await tick()
 t.app.chooseCode('JPN');assert.equal(t.app.moving.value,true)
 const advance=time=>{const [id,callback]=t.frames.entries().next().value;t.frames.delete(id);callback(time)}
 advance(0);advance(16);const first=[...t.app.rotation.value]
 advance(32);assert.notDeepEqual([...t.app.rotation.value],first)
 advance(700);assert.equal(t.frames.size,0);assert.equal(t.app.moving.value,false)
 assert.equal(t.app.rotation.value[0],-138)
 t.dispose()
})

test('mouse and touch drags share frame batching and commit the final movement on release',async()=>{
 for(const pointerType of ['mouse','touch']){
  const t=setupGlobe();await tick()
  t.app.stage.value={clientWidth:680,clientHeight:680,getBoundingClientRect:()=>({left:0,top:0,width:680,height:680})}
  const svg={setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){}}
  const event={button:0,pointerId:1,pointerType,clientX:100,clientY:100,target:{getAttribute:()=>null},currentTarget:svg}
  t.app.pointerDown(event)
  t.app.pointerMove({...event,clientX:120});t.app.pointerMove({...event,clientX:150})
  assert.equal(t.frames.size,1);assert.equal(t.app.moving.value,true)
  const before=[...t.app.rotation.value]
  t.app.pointerUp({...event,type:'pointerup',clientX:150})
  assert.notDeepEqual([...t.app.rotation.value],before);assert.equal(t.frames.size,0);assert.equal(t.app.moving.value,false)
  assert.equal(t.emitted.length,0);t.dispose()
 }
})

test('motion outlines retain every country, island and hole without globe-covering polygons',()=>{
 const scope={};runInNewContext(read('public/vendor/d3-7.9.0.min.js'),scope)
 let fullCount=0,motionCount=0
 for(const feature of world.features){
  const light=modules.globe.orientCountry(modules.globe.simplifyGlobeFeature(feature),scope.d3.geoArea)
  const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates
  const full=polygons(feature),motion=polygons(light)
  assert.equal(motion.length,full.length,feature.properties.ADM0_A3)
  for(let i=0;i<full.length;i++){
   assert.equal(motion[i].length,full[i].length)
   assert.ok(scope.d3.geoArea({type:'Polygon',coordinates:motion[i]})<=2*Math.PI)
   for(let j=0;j<full[i].length;j++){
    fullCount+=full[i][j].length;motionCount+=motion[i][j].length
    assert.ok(motion[i][j].length>=4);assert.deepEqual(motion[i][j][0],motion[i][j].at(-1))
   }
  }
 }
 assert.ok(motionCount<fullCount*.65,`${motionCount} / ${fullCount}`)
})
