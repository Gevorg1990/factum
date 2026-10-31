export type Testament = 'old' | 'new'
export type BibleBook = { id: string; code: string; name: string; chapters: number; testament: Testament; category: string }

// Book/chapter navigation follows the New Revised Ararat edition (Bible Society
// of Armenia). Scripture is read on the publisher's Bible.com reading pages.
const oldBooks: [string, string, string, number, string][] = [
  ['genesis','GEN','Ծննդոց',50,'Հնգամատյան'], ['exodus','EXO','Ելք',40,'Հնգամատյան'],
  ['leviticus','LEV','Ղևտական',27,'Հնգամատյան'], ['numbers','NUM','Թվեր',36,'Հնգամատյան'], ['deuteronomy','DEU','Երկրորդ Օրենք',34,'Հնգամատյան'],
  ['joshua','JOS','Հեսու',24,'Պատմական գրքեր'], ['judges','JDG','Դատավորներ',21,'Պատմական գրքեր'], ['ruth','RUT','Հռութ',4,'Պատմական գրքեր'],
  ['first-samuel','1SA','Ա Թագավորաց',31,'Պատմական գրքեր'], ['second-samuel','2SA','Բ Թագավորաց',24,'Պատմական գրքեր'],
  ['first-kings','1KI','Գ Թագավորաց',22,'Պատմական գրքեր'], ['second-kings','2KI','Դ Թագավորաց',25,'Պատմական գրքեր'],
  ['first-chronicles','1CH','Ա Մնացորդաց',29,'Պատմական գրքեր'], ['second-chronicles','2CH','Բ Մնացորդաց',36,'Պատմական գրքեր'],
  ['ezra','EZR','Եզրաս',10,'Պատմական գրքեր'], ['nehemiah','NEH','Նեեմիա',13,'Պատմական գրքեր'], ['esther','EST','Եսթեր',10,'Պատմական գրքեր'],
  ['job','JOB','Հոբ',42,'Իմաստության գրքեր'], ['psalms','PSA','Սաղմոսներ',150,'Իմաստության գրքեր'], ['proverbs','PRO','Առակներ',31,'Իմաստության գրքեր'],
  ['ecclesiastes','ECC','Ժողովող',12,'Իմաստության գրքեր'], ['song','SNG','Երգ Երգոց',8,'Իմաստության գրքեր'],
  ['isaiah','ISA','Եսայի',66,'Մարգարեներ'], ['jeremiah','JER','Երեմիա',52,'Մարգարեներ'], ['lamentations','LAM','Ողբ Երեմիայի',5,'Մարգարեներ'],
  ['ezekiel','EZK','Եզեկիել',48,'Մարգարեներ'], ['daniel','DAN','Դանիել',12,'Մարգարեներ'], ['hosea','HOS','Ովսեե',14,'Մարգարեներ'],
  ['joel','JOL','Հովել',3,'Մարգարեներ'], ['amos','AMO','Ամովս',9,'Մարգարեներ'], ['obadiah','OBA','Աբդիու',1,'Մարգարեներ'],
  ['jonah','JON','Հովնան',4,'Մարգարեներ'], ['micah','MIC','Միքիա',7,'Մարգարեներ'], ['nahum','NAM','Նավում',3,'Մարգարեներ'],
  ['habakkuk','HAB','Ամբակում',3,'Մարգարեներ'], ['zephaniah','ZEP','Սոփոնիա',3,'Մարգարեներ'], ['haggai','HAG','Անգեոս',2,'Մարգարեներ'],
  ['zechariah','ZEC','Զաքարիա',14,'Մարգարեներ'], ['malachi','MAL','Մաղաքիա',4,'Մարգարեներ'],
]
const newBooks: [string, string, string, number, string][] = [
  ['matthew','MAT','Մատթեոս',28,'Ավետարաններ'], ['mark','MRK','Մարկոս',16,'Ավետարաններ'], ['luke','LUK','Ղուկաս',24,'Ավետարաններ'], ['john','JHN','Հովհաննես',21,'Ավետարաններ'],
  ['acts','ACT','Գործք Առաքելոց',28,'Առաքելական պատմություն'], ['romans','ROM','Հռոմեացիներին',16,'Թղթեր'],
  ['first-corinthians','1CO','Ա Կորնթացիներին',16,'Թղթեր'], ['second-corinthians','2CO','Բ Կորնթացիներին',13,'Թղթեր'],
  ['galatians','GAL','Գաղատացիներին',6,'Թղթեր'], ['ephesians','EPH','Եփեսացիներին',6,'Թղթեր'], ['philippians','PHP','Փիլիպպեցիներին',4,'Թղթեր'], ['colossians','COL','Կողոսացիներին',4,'Թղթեր'],
  ['first-thessalonians','1TH','Ա Թեսաղոնիկեցիներին',5,'Թղթեր'], ['second-thessalonians','2TH','Բ Թեսաղոնիկեցիներին',3,'Թղթեր'],
  ['first-timothy','1TI','Ա Տիմոթեոսին',6,'Թղթեր'], ['second-timothy','2TI','Բ Տիմոթեոսին',4,'Թղթեր'], ['titus','TIT','Տիտոսին',3,'Թղթեր'], ['philemon','PHM','Փիլիմոնին',1,'Թղթեր'],
  ['hebrews','HEB','Եբրայեցիներին',13,'Թղթեր'], ['james','JAS','Հակոբոս',5,'Թղթեր'], ['first-peter','1PE','Ա Պետրոս',5,'Թղթեր'], ['second-peter','2PE','Բ Պետրոս',3,'Թղթեր'],
  ['first-john','1JN','Ա Հովհաննես',5,'Թղթեր'], ['second-john','2JN','Բ Հովհաննես',1,'Թղթեր'], ['third-john','3JN','Գ Հովհաննես',1,'Թղթեր'], ['jude','JUD','Հուդա',1,'Թղթեր'],
  ['revelation','REV','Հայտնություն',22,'Հայտնություն'],
]
export const bibleBooks: BibleBook[] = [
  ...oldBooks.map(([id,code,name,chapters,category]) => ({id,code,name,chapters,category,testament:'old' as const})),
  ...newBooks.map(([id,code,name,chapters,category]) => ({id,code,name,chapters,category,testament:'new' as const})),
]
export const testamentNames = {old:'Հին Կտակարան',new:'Նոր Կտակարան'}
export const bibleVersionUrl = 'https://www.bible.com/hy/versions/2329'
export const etchmiadzinUrl = 'https://www.bible.com/hy/versions/2860'
export function clampBibleChapter(book: BibleBook, chapter: number) {
  return Math.max(1, Math.min(book.chapters, Number.isFinite(chapter) ? Math.trunc(chapter) : 1))
}
export function bibleChapterUrl(book: BibleBook, chapter: number) {
  const valid = clampBibleChapter(book, chapter)
  return `https://www.bible.com/hy/bible/2329/${book.code}.${valid}.${encodeURIComponent('ՆՎԱԱ')}`
}
export function bibleProgressKey(book: BibleBook, chapter: number) { return `bible-${book.id}-${chapter}` }

const introductions: Record<string,string> = {
  genesis:'Սկզբնավորումների գիրքը․ արարչագործության պատումից մինչև Աբրահամի, Իսահակի, Հակոբի ու Հովսեփի պատմությունները։ Բարձրացնում է ծագման, պատասխանատվության և ուխտի հարցերը։',
  exodus:'Մովսեսի առաջնորդությամբ Եգիպտոսից ելքի, անապատային ճանապարհի և Սինայի ուխտի պատմությունը։ Կենտրոնում ազատությունն է, առաջնորդությունն ու համայնքի ձևավորումը։',
  ruth:'Ընտանիքի, հավատարմության և նոր հայրենիքում տեղ գտնելու պատմություն։ Հռութի ու Նոեմիի հարաբերությունները ցույց են տալիս հոգատարության ուժը։',
  job:'Արդար մարդու տառապանքի և կյանքի դժվար հարցերի շուրջ երկխոսություն։ Գիրքը հրավիրում է խորհելու հավատքի, արդարության և մարդկային իմացության սահմանների մասին։',
  psalms:'Աղոթքների և հոգևոր երգերի ժողովածու՝ երախտագիտության, վշտի, հույսի ու վստահության տարբեր ձայներով։ Կարելի է սկսել առանձին սաղմոսից։',
  proverbs:'Իմաստության կարճ խոսքեր՝ խոսքի, աշխատանքի, արդարության, ընտանիքի և առօրյա ընտրությունների մասին։',
  ecclesiastes:'Մարդկային աշխատանքի, ժամանակի և կյանքի անցողիկության մասին խորհրդածություններ։ Հրավիրում է մտածելու՝ ինչն է արժեքավոր մեր կյանքում։',
  jonah:'Մարգարեի ճանապարհը՝ փախուստից մինչև Նինվե։ Պատումի առանցքում ողորմությունն է, պատասխանատվությունն ու սեփական դատողությունները վերանայելը։',
  matthew:'Հիսուսի կյանքի և ուսուցման ավետարանական պատում՝ առանձնահատուկ ուշադրությամբ Հին Կտակարանի հետ կապերին։ Այստեղ են Լեռան քարոզն ու բազմաթիվ առակներ։',
  mark:'Հիսուսի ծառայության դինամիկ ավետարանական պատում՝ գործողություններով, հանդիպումներով և աշակերտության մասին հարցերով։',
  luke:'Հիսուսի կյանքի ավետարանական պատում՝ ողորմության, աղոթքի և հասարակության լուսանցքում գտնվող մարդկանց նկատմամբ ուշադրության շեշտադրումներով։',
  john:'Հիսուսի անձի, նշանների և ուսուցման շուրջ կառուցված ավետարան՝ կյանքի, լույսի, սիրո և հավատքի թեմաներով։',
  acts:'Առաջին քրիստոնեական համայնքների և առաքյալների ճանապարհների պատմությունը՝ Երուսաղեմից դեպի միջերկրածովյան աշխարհ։',
  'first-corinthians':'Թուղթ քրիստոնեական համայնքի կյանքի, միասնության և պատասխանատվության մասին։ Տասներեքերորդ գլուխն անդրադառնում է սիրո նշանակությանը։',
  revelation:'Տեսիլքներով և խորհրդանիշներով հարուստ գիրք՝ փորձության, հույսի և նորոգման մասին։ Պատկերները կարևոր է կարդալ իրենց գրական ու պատմական համատեքստում։',
}
const categoryIntroductions: Record<string,string> = {
  'Հնգամատյան':'Իսրայելի սկզբնավորումների, ուխտի, օրենքի և համայնքային կյանքի մասին ավանդույթների մաս է։ Ընթերցելիս ուշադրություն դարձրու պատմությունների և պատվիրանների կապին։',
  'Պատմական գրքեր':'Ներկայացնում է Իսրայելի ժողովրդի, առաջնորդների ու համայնքների պատմությունները։ Կենտրոնական թեմաներն են հավատարմությունը, պատասխանատվությունն ու պատմական հիշողությունը։',
  'Իմաստության գրքեր':'Բանաստեղծական ու իմաստասիրական հայացք է մարդու կյանքին, հարաբերություններին և Աստծու հետ երկխոսությանը։',
  'Մարգարեներ':'Մարգարեական խոսք՝ արդարության, ապաշխարության, համայնքի ճգնաժամերի և վերականգնման հույսի մասին։',
  'Թղթեր':'Վաղ քրիստոնեական համայնքներին կամ անհատներին ուղղված ուսուցում։ Անդրադառնում է հավատքին, փոխհարաբերություններին և համայնքային կյանքի հարցերին։',
}
export function bibleIntroduction(book: BibleBook) { return introductions[book.id] ?? categoryIntroductions[book.category] ?? 'Ուսումնասիրիր գրքի գլուխները և բացահայտիր դրանց պատմություններն ու հիմնական թեմաները։' }

export const bibleReadingPaths = [
  {id:'beginnings',title:'Սկզբնավորումների ճանապարհը',subtitle:'Աշխարհ, մարդ և պատասխանատվություն',book:'genesis',chapter:1,icon:'sun'},
  {id:'wisdom',title:'Իմաստություն՝ ամեն օրվա համար',subtitle:'Խոսք, ընտրություն և արդարություն',book:'proverbs',chapter:1,icon:'sparkles'},
  {id:'hope',title:'Աղոթքի և հույսի էջեր',subtitle:'Խաղաղություն փնտրող ընթերցում',book:'psalms',chapter:23,icon:'leaf'},
  {id:'teaching',title:'Լեռան քարոզը',subtitle:'Երջանկության և մարդկանց հանդեպ վերաբերմունքի մասին',book:'matthew',chapter:5,icon:'mountain'},
]
export type BibleEvent = {id:string;era:Testament|'armenian';period:string;title:string;description:string;reference:string;book?:string;chapter?:number}
// Narrative periods are not presented as established historical dates.
export const bibleTimeline: BibleEvent[] = [
  {id:'creation',era:'old',period:'Սկզբնավորումների պատում',title:'Արարչագործություն',description:'Ծննդոցի բացումը ներկայացնում է աշխարհի ու մարդու ստեղծման աստվածաշնչյան պատումը։',reference:'Ծննդոց 1–2',book:'genesis',chapter:1},
  {id:'noah',era:'old',period:'Նախապատմության պատում',title:'Նոյ և ջրհեղեղ',description:'Պատմություն դատաստանի, փրկության և նոր ուխտի մասին։',reference:'Ծննդոց 6–9',book:'genesis',chapter:6},
  {id:'abraham',era:'old',period:'Նահապետների շրջան',title:'Աբրահամի ճանապարհը',description:'Կանչը ճանապարհի սկիզբ է դառնում՝ խոստման և վստահության թեմաներով։',reference:'Ծննդոց 12',book:'genesis',chapter:12},
  {id:'moses',era:'old',period:'Ելքի պատում',title:'Մովսես և ազատագրում',description:'Եգիպտոսից ելքի և անապատային ճանապարհի պատմությունը։',reference:'Ելք 12–14',book:'exodus',chapter:12},
  {id:'sinai',era:'old',period:'Սինայի ուխտ',title:'Տասը պատվիրանները',description:'Համայնքի կյանքի հիմքում դրվում են ուխտն ու բարոյական պատասխանատվությունը։',reference:'Ելք 19–20',book:'exodus',chapter:20},
  {id:'david',era:'old',period:'Թագավորությունների շրջան',title:'Դավթի թագավորությունը',description:'Թագավորության և առաջնորդի պատասխանատվության մասին պատմություններ։',reference:'Բ Թագավորաց 5',book:'second-samuel',chapter:5},
  {id:'exile',era:'old',period:'Մ.թ.ա. VI դար',title:'Գերություն և վերադարձ',description:'Բաբելոնյան գերությունից հետո համայնքի վերականգնումը դառնում է նոր սկիզբ։',reference:'Եզրաս 1',book:'ezra',chapter:1},
  {id:'birth',era:'new',period:'Հռոմեական շրջան',title:'Հիսուսի ծնունդը',description:'Ավետարանները պատմում են Հիսուսի ծննդյան և մանկության մասին։',reference:'Ղուկաս 2',book:'luke',chapter:2},
  {id:'sermon',era:'new',period:'Մ.թ. I դար',title:'Լեռան քարոզը',description:'Հիսուսի ուսուցման առանցքային թեմաները՝ ողորմություն, արդարություն և սեր։',reference:'Մատթեոս 5–7',book:'matthew',chapter:5},
  {id:'easter',era:'new',period:'Մ.թ. I դար',title:'Խաչելություն և Հարություն',description:'Քրիստոնեական հավատքի կենտրոնական իրադարձությունները՝ ավետարանական պատումներում։',reference:'Հովհաննես 19–20',book:'john',chapter:20},
  {id:'pentecost',era:'new',period:'Առաջին համայնքներ',title:'Հոգեգալուստ և առաքյալներ',description:'Գործք Առաքելոցը ներկայացնում է առաջին համայնքների կազմավորումն ու տարածումը։',reference:'Գործք 2',book:'acts',chapter:2},
  {id:'armenian',era:'armenian',period:'V դար',title:'Աստվածաշունչը՝ հայերեն',description:'Սահակ Պարթևի, Մեսրոպ Մաշտոցի և թարգմանիչների աշխատանքը Սուրբ Գիրքը դարձնում է հայ մշակույթի հենասյուն։',reference:'Հայ թարգմանչաց ավանդույթ'},
]

/** Short Eastern Armenian paraphrases, not verbatim text of a Bible edition.
 * Source: https://www.bible.com/hy/bible/2329/EXO.20.%D5%86%D5%8E%D4%B1%D4%B1
 */
export const bibleCommandments = [
  { number:1, title:'Հավատարմություն միակ Աստծուն', text:'Միայն Տիրոջը ճանաչիր որպես քո Աստվածը։', reference:'Ելք 20:3' },
  { number:2, title:'Կուռքերի մերժում', text:'Կուռքեր մի՛ ստեղծիր պաշտելու համար և դրանց մի՛ երկրպագիր։', reference:'Ելք 20:4–6' },
  { number:3, title:'Աստծու անվան հարգանք', text:'Աստծու անունը մի՛ օգտագործիր անպատշաճ կամ անիմաստ կերպով։', reference:'Ելք 20:7' },
  { number:4, title:'Հանգստի օրվա սրբություն', text:'Սուրբ պահիր հանգստի օրը՝ այն առանձնացնելով առօրյա աշխատանքից։', reference:'Ելք 20:8–11' },
  { number:5, title:'Ծնողների պատիվ', text:'Հարգանքով վերաբերվիր հորդ և մորդ։', reference:'Ելք 20:12' },
  { number:6, title:'Մարդկային կյանքի պաշտպանություն', text:'Մի՛ կատարիր սպանություն։', reference:'Ելք 20:13' },
  { number:7, title:'Ամուսնական հավատարմություն', text:'Հավատարիմ մնա ամուսնությանդ և մի՛ խախտիր ամուսնական կապը։', reference:'Ելք 20:14' },
  { number:8, title:'Ուրիշի ունեցվածքի հարգանք', text:'Ուրիշի ունեցվածքին մի՛ տիրացիր գողությամբ։', reference:'Ելք 20:15' },
  { number:9, title:'Ճշմարիտ վկայություն', text:'Ուրիշի մասին ստով մի՛ վկայիր։', reference:'Ելք 20:16' },
  { number:10, title:'Ուրիշի ունեցածը չցանկանալ', text:'Մի՛ ցանկացիր տիրանալ ուրիշի կնոջը, տանը կամ ունեցվածքին։', reference:'Ելք 20:17' },
]
