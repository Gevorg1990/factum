import { categoryMedia } from '../utils/categoryMedia'
import { millionSlotOf } from './millionStages'
export type CmsKind = 'GEO_ENTRY'|'GEO_CATEGORY'|'BOOK'|'ARTICLE'|'CATEGORY'|'AUTHOR'|'PERSON'|'FACT'|'EVENT'|'GAME'|'MONUMENT'|'WORK'|'PAGE'|'VIDEO'|'SETTING'
export const contentSections: {kind:CmsKind;label:string;singular:string;description:string;icon:string;group:string}[] = [
  {kind:'GEO_ENTRY',label:'Երկրագունդ · նյութեր',singular:'աշխարհագրական նյութ',description:'Հարցուպատասխաններ, ռեկորդներ, վայրեր և փաստեր։',icon:'MapPin',group:'Երկրագունդ'},
  {kind:'GEO_CATEGORY',label:'Երկրագունդ · բաժիններ',singular:'աշխարհագրական բաժին',description:'Աշխարհագրական նյութերի թեմաներն ու հերթականությունը։',icon:'FolderOpen',group:'Երկրագունդ'},
  {kind:'BOOK',label:'Գրադարանի գրքեր',singular:'գիրք',description:'Հայերեն գրքեր՝ կազմով, ժանրով և ամբողջական տեքստով։',icon:'BookOpen',group:'Հիմնական բովանդակություն'},
  {kind:'ARTICLE',label:'Հոդվածներ',singular:'հոդված',description:'Հանրագիտարանի հարցեր, պատասխաններ և բացատրություններ։',icon:'BookOpen',group:'Հիմնական բովանդակություն'},
  {kind:'FACT',label:'Հետաքրքիր փաստեր',singular:'փաստ',description:'Կարճ, հետաքրքիր տեղեկություններ՝ թեմաներով և աղբյուրներով։',icon:'Sparkles',group:'Հիմնական բովանդակություն'},
  {kind:'PERSON',label:'Հայտնի մարդիկ',singular:'կենսագրություն',description:'Անուններ, կենսագրություններ, դիմանկարներ և գործունեություն։',icon:'UsersRound',group:'Հիմնական բովանդակություն'},
  {kind:'EVENT',label:'Պատմություն',singular:'իրադարձություն',description:'Պատմական իրադարձություններ և դրանց մանրամասները։',icon:'Landmark',group:'Հիմնական բովանդակություն'},
  {kind:'GAME',label:'Խաղերի հարցեր',singular:'խաղի հարց',description:'Միլիոնատեր, Ճիշտ / սխալ և Տրամաբանություն խաղերի հարցերը։',icon:'Gamepad2',group:'Հիմնական բովանդակություն'},
  {kind:'VIDEO',label:'Տեսանյութեր',singular:'տեսանյութ',description:'Տեսանյութի հղում, վերնագիր և նախադիտման նկար։',icon:'Video',group:'Հիմնական բովանդակություն'},
  {kind:'CATEGORY',label:'Բաժիններ',singular:'բաժին',description:'Հանրագիտարանի թեմաները, օրինակ՝ Քիմիա կամ Պատմություն։',icon:'FolderOpen',group:'Կազմակերպում'},
  {kind:'AUTHOR',label:'Հեղինակներ',singular:'հեղինակ',description:'Հոդվածների հեղինակների անուններն ու տեղեկությունները։',icon:'PenLine',group:'Կազմակերպում'},
  {kind:'MONUMENT',label:'Հուշարձաններ',singular:'հուշարձան',description:'Հայտնի մարդկանց նվիրված հուշարձաններ՝ ստուգված աղբյուրներով։',icon:'MapPin',group:'Կազմակերպում'},
  {kind:'WORK',label:'Ստեղծագործություններ',singular:'ստեղծագործություն',description:'Անձի էջում արդեն նշված ստեղծագործության մանրամասները։',icon:'LibraryBig',group:'Կազմակերպում'},
  {kind:'PAGE',label:'Կայքի էջեր',singular:'էջ',description:'«Մեր մասին», «Աջակցիր» և լրացուցիչ տեքստային էջեր։',icon:'FileText',group:'Կայքի կարգավորումներ'},
  {kind:'SETTING',label:'Կայքի տեղեկություններ',singular:'տեղեկություն',description:'Կայքի ստորագրության և այլ տեղեկությունների տեքստերը։',icon:'Settings2',group:'Կայքի կարգավորումներ'},
]
export const editorTemplates:Record<CmsKind,Record<string,any>> = {
  GEO_CATEGORY:{id:'',title:'',area:'world-facts',sortOrder:0},
  GEO_ENTRY:{id:'',title:'',area:'world-facts',category:'',detail:'',answer:'',measure:'',location:'',longitude:null,latitude:null,countryCode:'',dataYear:null,source:{name:'',url:''},sortOrder:0,includeInFacts:false,globeSearch:false,livePopulation:false},
  BOOK:{id:'',title:'',author:'',topic:'detective',description:'',cover:'',text:''},
  ARTICLE:{id:'',title:'',subject:'',answer:'',detail:'',image:'',video:'',listed:true,sections:[],example:'',takeaway:''},
  CATEGORY:{slug:'',name:'',image:'',cardVideo:''},AUTHOR:{name:'',bio:''},
  PERSON:{id:'',name:'',years:'',role:'',category:'Գրականություն',bio:'',portrait:'',isArmenian:true,works:[],biographySections:[],timeline:[]},
  FACT:{id:'',title:'',text:'',category:'space',image:''},
  EVENT:{year:'',title:'',era:'',details:{intro:'',sections:[],facts:[]}},
  GAME:{mode:'million',difficulty:'easy',slot:0,question:'',answers:['','','',''],correct:0,explanation:'',hint:''},
  MONUMENT:{id:'',personId:'',name:'',city:'',location:'',source:{name:'',url:''},image:{src:'',alt:'',credit:'',license:'',licenseUrl:'',sourceUrl:''}},
  WORK:{personId:'',index:0,title:'',description:'',significance:''},
  PAGE:{title:'',text:''},VIDEO:{title:'',url:'',preview:''},SETTING:{title:'',text:''},
}
export const fieldLabels:Record<string,string> = {
  globeSearch:'Ներառել երկրագնդի տեղանունների որոնման մեջ',area:'Երկրագնդի բաժինը',sortOrder:'Ցուցադրման հերթականություն',measure:'Ռեկորդի արժեքը / չափանիշը',longitude:'Երկայնություն (−180…180)',latitude:'Լայնություն (−90…90)',countryCode:'Երկրի ISO եռատառ կոդը',dataYear:'Տվյալների տարեթիվը',includeInFacts:'Ցուցադրել նաև «Գիտեի՞ր, որ…» բաժնում',livePopulation:'Հնդկաստանի բնակչության պատասխանը թարմացնել քարտեզի տվյալներից',
  cover:'Գրքի կազմ',author:'Գրքի հեղինակ',textLicense:'Տեքստի օգտագործման իրավունք / արտոնագիր',coverCredit:'Կազմի աղբյուր / իրավատեր',coverSource:'Կազմի աղբյուրի հղում',coverLicense:'Կազմի օգտագործման իրավունք',edition:'Հայերեն հրատարակություն / թարգմանիչ',rightsConfirmed:'Հաստատում եմ հայերեն տեքստը և կազմը հրապարակելու իրավունքը',
  details:'Իրադարձության մանրամասներ',heading:'Ենթավերնագիր',body:'Տեքստ',listed:'Ցուցադրել բաժնի նյութերի ցանկում',id:'Նյութի ներքին նշում',slug:'Էջի հասցեի մաս',name:'Անուն',title:'Վերնագիր',subject:'Հանրագիտարանի բաժին',answer:'Կարճ պատասխան',detail:'Հիմնական բացատրություն',sections:'Լրացուցիչ բաժիններ',text:'Տեքստ',example:'Օրինակ',takeaway:'Ի՞նչ հիշել',source:'Տեղեկության աղբյուր',url:'Հղում',years:'Կյանքի տարեթվեր',role:'Մասնագիտություն կամ գործունեություն',bio:'Հակիրճ ներկայացում',works:'Ստեղծագործությունների անվանումներ',biographySections:'Կենսագրության բաժիններ',timeline:'Կյանքի կարևոր իրադարձություններ',date:'Ամսաթիվ կամ ժամանակաշրջան',year:'Իրադարձության տարեթիվ',era:'Պատմական ժամանակաշրջան',category:'Թեմա',isArmenian:'Ցուցադրել «Հայ հայտնիներ» բաժնում',portrait:'Դիմանկար',mode:'Խաղի տեսակը',difficulty:'Բարդություն',question:'Հարց',statement:'Պնդում',answers:'Պատասխանի տարբերակներ',correct:'Ճիշտ պատասխանը',explanation:'Պատասխանի բացատրություն',hint:'Հուշում',topic:'Թեմա',personId:'Ո՞ւմ է վերաբերում',city:'Քաղաք',location:'Հասցե կամ տեղադրության նկարագրություն',openedYear:'Բացման տարի',openedDate:'Բացման ճշգրիտ ամսաթիվ',installedYear:'Տեղադրման տարի',sculptor:'Քանդակագործ',architect:'Ճարտարապետ',image:'Նկար',src:'Լուսանկար',alt:'Նկարի նկարագրություն',credit:'Նկարի հեղինակ կամ աղբյուր',license:'Օգտագործման արտոնագիր',licenseUrl:'Արտոնագրի հղում',sourceUrl:'Սկզբնական աղբյուրի հղում',fit:'Նկարի տեղավորումը',position:'Նկարի դիրքը',index:'Ստեղծագործության հերթականություն',description:'Նկարագրություն',significance:'Կարևորություն և նշանակություն',type:'Տեսակ',group:'Խումբ',sources:'Աղբյուրներ',video:'Մանրամասն բաժնի վիդեո',cardVideo:'Քարտի շարժվող նախադիտում',preview:'Նախադիտման նկար',slot:'Հարցի դիրք',variant:'Հարցի տարբերակ',img:'Բաժնի նկարի անվանում',symbol:'Խորհրդանիշ',shortName:'Կարճ անվանում',biographyDocument:'Կենսագրության փաստաթուղթ',workInformation:'Ստեղծագործությունների տեղեկություններ',portraitTitle:'Դիմանկարի սկզբնական անվանում',portraitLanguage:'Դիմանկարի լեզու',intro:'Ներածություն',facts:'Հետաքրքիր փաստեր',summary:'Համառոտ նկարագրություն',authorId:'Հեղինակ',categoryId:'Բաժին',key:'Նյութի հասցեն',data:'Բովանդակություն',
}
export const fieldHints:Record<string,string> = {
  answer:'Մեկ կամ երկու նախադասությամբ ներկայացրու հարցի պատասխանը։',detail:'Այստեղ գրիր հոդվածի ամբողջական բացատրությունը։ Պարբերությունները բաժանիր նոր տողով։',listed:'Անջատելիս հոդվածը չի երևա բաժնի ցանկում, բայց հրապարակված հղումը կշարունակի աշխատել։',sections:'Յուրաքանչյուր բաժին կարող է ունենալ իր ենթավերնագիրն ու տեքստը։',years:'Օրինակ՝ 1869–1923։',role:'Օրինակ՝ բանաստեղծ, կոմպոզիտոր կամ գիտնական։',bio:'Մի քանի նախադասությամբ ներկայացրու մարդուն։ Ամբողջական կենսագրությունը լրացրու ստորև։',works:'Գործող անվանումները պահպանիր նույն հերթականությամբ՝ նախկին հղումները չփոխելու համար։',year:'Օրինակ՝ 1918 կամ մ.թ.ա. 859։ Պահպանելուց հետո տարեթիվը չի փոխվում, քանի որ այն նյութի հասցեի մասն է։',era:'Օրինակ՝ Նորագույն շրջան։',explanation:'Բացատրիր, թե ինչու է ընտրված պատասխանը ճիշտ։',source:'Նշիր ստուգելի աղբյուրի անունն ու ամբողջական հղումը։',location:'Գրիր այնքան հստակ, որ այցելուն կարողանա գտնել հուշարձանը։',openedYear:'Լրացրու միայն հաստատված լինելու դեպքում։ Տեղադրման տարին առանձին դաշտ ունի։',credit:'Նշիր լուսանկարչին կամ նկարի իրավատիրոջը։',license:'Օրինակ՝ CC BY-SA 4.0 կամ սեփական լուսանկար։',url:'Օգտագործիր ամբողջական հղում՝ https:// սկզբով։',preview:'Թեթև նկար, որը կերևա մինչև տեսանյութը միացնելը։',index:'Առաջին ստեղծագործությունը՝ 1, երկրորդը՝ 2 և այդպես շարունակ։',
}
export function newContent(kind:CmsKind) {
  return {kind,key:kind==='SETTING'?'footer':`${kind.toLowerCase()}-${crypto.randomUUID().slice(0,8)}`,title:'',summary:'',body:'',categoryId:null,authorId:null,data:structuredClone(editorTemplates[kind])}
}
export function editorRecord(record:any){const value=JSON.parse(JSON.stringify(record));if(value.kind==='ARTICLE'){value.data.video ??='';value.data.sections=(value.data.sections||[]).map((section:any)=>({...section,image:section.image||''}));}if(value.kind==='GEO_ENTRY'||value.kind==='GEO_CATEGORY')value.data={...structuredClone(editorTemplates[value.kind as CmsKind]),...value.data};if(value.kind==='CATEGORY'){const media=categoryMedia(value.data);value.data.image ??='';value.data.cardVideo ??=media.video;if(!value.data.cardVideoPoster)value.data.cardVideoPoster=media.poster;}if(value.kind==='GAME'){value.title=value.data.mode==='genius'?value.data.statement:value.data.question;if(value.data.mode==='million')value.data.slot=millionSlotOf(value.data);}return value}
// Keep the UI's single title consistent with legacy payload shapes without losing extra fields.
export function prepareContent(record:any) {
  const value=JSON.parse(JSON.stringify(record))
  const data=value.data
  if(value.kind==='GEO_ENTRY'&&!data.id)data.id=value.key
  if(['GEO_CATEGORY','BOOK','ARTICLE','PERSON','FACT','MONUMENT'].includes(value.kind))data.id=value.key
  if(['PERSON','AUTHOR','CATEGORY','MONUMENT'].includes(value.kind))data.name=value.title
  if(['GEO_ENTRY','GEO_CATEGORY','BOOK','ARTICLE','FACT','EVENT','WORK','PAGE','VIDEO','SETTING'].includes(value.kind))data.title=value.title
  if(value.kind==='CATEGORY')data.slug=value.key
  if(value.kind==='GAME'){data[data.mode==='genius'?'statement':'question']=value.title;if(data.mode==='logic'&&!data.title?.trim())data.title=value.title}
  if(value.kind==='EVENT'){if(!value.id)value.key=data.year;else data.year=value.key}
  if(value.kind==='WORK'&&!value.id)value.key=`${data.personId}:${data.index}`
  if(data.source&&typeof data.source==='object'&&!data.source.name?.trim()&&!data.source.url?.trim())delete data.source
  return value
}
export function contentUrl(record:any) {
  const key=encodeURIComponent(record.key)
  return ({GEO_ENTRY:'/globe',GEO_CATEGORY:'/globe',BOOK:'/library',ARTICLE:`/articles/${key}`,PERSON:`/people/${key}`,FACT:`/facts?fact=${key}`,EVENT:`/history?event=${key}`,CATEGORY:`/subjects/${key}`,PAGE:['about','support'].includes(record.key)?`/${key}`:`/content/${key}`,VIDEO:'/videos',SETTING:'/',MONUMENT:`/people/${encodeURIComponent(record.data?.personId||'')}`,WORK:`/works/${encodeURIComponent(record.data?.personId||'')}/${record.data?.index??0}` } as Record<string,string>)[record.kind] || ''
}
