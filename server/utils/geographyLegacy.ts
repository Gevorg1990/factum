import {worldFacts,worldFactCategories} from '../../data/worldFacts'
import {worldRecords} from '../../data/geography/records'
import {geographicPlaces} from '../../data/geography/places'
import facts from '../../public/data/geography/facts-v1.json'
import {geographyCategorySchema,geographyEntrySchema,type GeographyArea} from '../../shared/geographyCms'
export type GeographyLegacyRow={kind:'GEO_ENTRY'|'GEO_CATEGORY';key:string;title:string;data:Record<string,any>}
export function geographyLegacyRows():GeographyLegacyRow[]{
 const rows:GeographyLegacyRow[]=[],categories=new Map<string,GeographyLegacyRow>()
 const category=(area:GeographyArea,id:string,title:string)=>{const key=area+'-'+id;if(!categories.has(key))categories.set(key,{kind:'GEO_CATEGORY',key,title,data:geographyCategorySchema.parse({id:key,title,area,sortOrder:categories.size})});return key}
 const add=(area:GeographyArea,item:any,categoryKey:string,sortOrder:number)=>{const data=geographyEntrySchema.parse({...item,id:item.id,title:item.question||item.title,area,category:categoryKey,longitude:item.coordinates?.[0]??null,latitude:item.coordinates?.[1]??null,sortOrder,globeSearch:area==='places'&&item.category==='Կղզիներ և ժայռեր',includeInFacts:area==='records'||area==='places',livePopulation:item.id==='most-populous-country'});rows.push({kind:'GEO_ENTRY',key:area+':'+item.id,title:data.title,data})}
 worldFacts.forEach((item,i)=>add('world-facts',item,category('world-facts',item.category,worldFactCategories[item.category]),i))
 const recordLabels:Record<string,string>={mountain:'Լեռներ',water:'Ջրային աշխարհ',land:'Ցամաք',nature:'Բնություն',country:'Պետություններ'}
 worldRecords.forEach((item,i)=>add('records',item,category('records',item.kind,recordLabels[item.kind]||item.kind),i))
 geographicPlaces.forEach((item,i)=>add('places',item,category('places',item.category,item.category),i))
 const sharedIds=new Set([...worldRecords,...geographicPlaces].map(item=>item.id))
 facts.filter(item=>!sharedIds.has(item.id)&&!['Երկրներ','Մայրաքաղաքներ'].includes(item.category)).forEach((item,i)=>add('facts',item,category('facts',item.category,item.category),i))
 return [...categories.values(),...rows]
}
