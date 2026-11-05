/** Rebuild small CDN catalogs from the reviewed editorial sources and country snapshot.
 * Usage: node scripts/prepare-geography-catalog.mjs
 * No network, no shared archive imports, stable IDs for profile bookmarks.
 */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
const ts=createRequire(import.meta.url)('typescript'),cache=new Map()
function moduleUrl(url){
 if(cache.has(url.href))return cache.get(url.href)
 let code=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
 code=code.replace(/from\s+(['"])(\.[^'"]+)\1/g,(_,q,spec)=>`from '${moduleUrl(new URL(spec+'.ts',url))}'`)
 const result='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(url.href,result);return result
}
const root=new URL('../',import.meta.url)
const {worldRecords}=await import(moduleUrl(new URL('data/geography/records.ts',root)))
const {natureFacts}=await import(moduleUrl(new URL('data/geography/natureFacts.ts',root)))
const {capitalPairs}=await import(moduleUrl(new URL('data/capitalQuiz.ts',root)))
const countries=JSON.parse(readFileSync(new URL('public/data/geography/countries-v1.json',root),'utf8'))
const source={name:'Countries · բաց տվյալների բազա',url:'https://github.com/mledoze/countries'}
const facts=[...worldRecords,...natureFacts],languages=new Intl.DisplayNames(['hy'],{type:'language'}),currencies=new Intl.DisplayNames(['hy'],{type:'currency'})
for(const [index,pair] of capitalPairs.entries()){
 const c=countries.find(c=>c.cca3===pair.countryCode)
 if(!c||!c.capital.some(value=>pair.capitalAliases.includes(value)))throw Error('Review capital '+pair.countryCode)
 const coordinates=[c.latlng[1],c.latlng[0]]
 facts.push({id:'capital-'+c.cca3,title:pair.country+' · մայրաքաղաքը',detail:`${pair.country} երկրի մայրաքաղաքը ${pair.capital} քաղաքն է։ Մայրաքաղաքը պետք է տարբերել ամենամեծ քաղաքից․ դրանք միշտ նույնը չեն։`,category:'Մայրաքաղաքներ',coordinates,countryCode:c.cca3,source})
 const neighbors=c.borders.map(code=>countries.find(c=>c.cca3===code)?.nameHy).filter(Boolean)
 const choices=[
 ['աշխարհագրական դիրքը',c.landlocked?'Երկիրը ծովային ափ չունի և ցամաքային պետություն է։ Նրա արտաքին առևտրի ճանապարհների համար կարևոր են հարևան երկրներով անցնող ուղիները։':'Երկիրը ցամաքային մեկուսացված պետությունների խմբին չի պատկանում․ ունի ծովային ափ։ Ափամերձ դիրքը պայմանավորում է ծովային հաղորդակցության հնարավորությունները։','Աշխարհագրություն'],
 ['լեզուները',`Countries բազայում նշված լեզուներն են՝ ${Object.keys(c.languages).map(k=>languages.of(k)).join(', ')}։ Լեզուների այս ցանկը չի չափում լեզվակիրների թիվը կամ յուրաքանչյուր լեզվի տարածվածությունը։`,'Լեզուներ'],
 ['արժույթը',`Բազայում նշված արժույթը՝ ${Object.keys(c.currencies).map(k=>currencies.of(k)+' ('+k+')').join(', ')}։ Արժույթի անվանումը չի նշանակում, որ բոլոր հարևան երկրները նույնպես օգտագործում են այն։`,'Երկրներ'],
 ['հարևանները',neighbors.length?`Ցամաքային սահմանակից երկրներն են՝ ${neighbors.join(', ')}։ Ցանկը ծովային հարևաններին չի ներառում և արտացոլում է աղբյուրի սահմանային դասակարգումը։`:'Բազայում ցամաքային սահմանակից պետություն նշված չէ։ Ծովային հարևանությունը դրանից առանձին աշխարհագրական հասկացություն է։','Աշխարհագրություն']
 ]
 const [title,detail,category]=choices[index%4]
 facts.push({id:'country-'+c.cca3,title:pair.country+' · '+title,detail,category,coordinates,countryCode:c.cca3,source})
}
for(const f of facts)if(!f.source.url||!f.id)throw Error('Incomplete source '+f.id)
writeFileSync(new URL('public/data/geography/records-v1.json',root),JSON.stringify(worldRecords))
writeFileSync(new URL('public/data/geography/facts-v1.json',root),JSON.stringify(facts))
console.log(`Prepared ${worldRecords.length} records and ${facts.length} facts.`)
