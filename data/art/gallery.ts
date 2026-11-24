import {galleryAdditions} from './galleryAdditions'

export interface GalleryArtwork {
  id: string
  room: number
  title: string
  originalTitle: string
  creator: string
  date: string
  medium: string
  description: string
  context?: string
  lookFor?: string
  location?: string
  dimensions?: string
  modelCredit?: string
  modelSource?: string
  image: string
  source: string
  imageCredit: string
  imageSource: string
  imageLicense?: string
  creatorInfo?: string
  creatorPortrait?: string
  creatorPortraitCredit?: string
  creatorPortraitSource?: string
}

export const galleryRooms = [
  { id: 0, name: 'Կենտրոնական դահլիճ', era: 'ՍԿԻԶԲ', summary: 'Չորս ուղղությամբ բացվող պատկերասրահ։', direction: 'կենտրոն' },
  { id: 1, name: 'Քանդակների սրահ', era: 'ԱՐԵՎԵԼՔ', summary: 'Քար, բրոնզ և եռաչափ ձև։', direction: 'արևելք' },
  { id: 2, name: 'Գեղանկարչության սրահ', era: 'ԱՐԵՎՄՈՒՏՔ', summary: 'Լույս, գույն և ժամանակակից քաղաք։', direction: 'արևմուտք' },
  { id: 3, name: 'Գլուխգործոցների սրահ', era: 'ՀՅՈՒՍԻՍ', summary: 'Նշանավոր գեղանկարներ ու մեծ կտավներ։', direction: 'հյուսիս' },
  { id: 4, name: 'Վերածննդի սրահ', era: 'ՀԱՐԱՎ', summary: 'Լեոնարդո դա Վինչիի երկու գլուխգործոց։', direction: 'հարավ' },
  { id: 5, name: 'Նկարիչների երկրորդ սրահ', era: 'ՀԵՌԱՎՈՐ ԱՐԵՎՄՈՒՏՔ', summary: 'Իմպրեսիոնիստներ և հետիմպրեսիոնիստներ։', direction: 'արևմուտք՝ հաջորդ սրահ' },
] as const

// Collection facts are from the linked museum records. Image credits refer to
// the exact local reproduction used here; sculpture photographs retain credits.
export const galleryArtworks: readonly GalleryArtwork[] = [
  ...galleryAdditions,
  {
    id: 'buddha-shakyamuni', room: 1, title: 'Մեդիտացիայի մեջ նստած Շաքյամունի Բուդդա',
    originalTitle: 'Buddha Shakyamuni Seated in Meditation (Dhyanamudra)', creator: 'Անհայտ վարպետ · Չոլայի ժամանակաշրջան',
    date: 'մոտ 12-րդ դար', medium: 'Քանդակ',
    description: 'Նստած կերպարի ձեռքերի դիրքը՝ դհյանա մուդրան, խորհրդանշում է մեդիտացիան։ Ստեղծագործությունը ներկայացնում է հարավհնդկական Չոլայի շրջանի բուդդայական քանդակագործությունը։',
    context: 'Հարավային Հնդկաստանի Չոլայի ժամանակաշրջանի կերպարը ցույց է տալիս, թե ինչպես էր մեդիտացիան դառնում քանդակագործական թեմա։ Այստեղ ներկայացված է Չիկագոյի արվեստի ինստիտուտի հավաքածուի գործը։',
    lookFor: 'Ուշադրություն դարձրու ձեռքերի հանգիստ դիրքին և մարմնի հավասարակշռված կառուցվածքին։',
    location: 'Չիկագոյի արվեստի ինստիտուտ',
    image: '/images/art/buddha-shakyamuni.webp', source: 'https://www.artic.edu/artworks/21023/buddha-shakyamuni-seated-in-meditation-dhyanamudra',
    imageCredit: 'Art Institute of Chicago · CC0', imageSource: 'https://commons.wikimedia.org/wiki/File:Buddha_Shakyamuni_Seated_in_Meditation_(Dhyanamudra).jpg',
  },
  {
    id: 'buddha-indra-brahma', room: 1, title: 'Բուդդան՝ Ինդրայի և Բրահմայի երկրպագությամբ',
    originalTitle: 'Buddha Worshipped by Indra and Brahma', creator: 'Անհայտ վարպետ · Գանդհարա',
    date: '2–3-րդ դարեր', medium: 'Քարե ռելիեֆ',
    description: 'Գանդհարայի քանդակագործությունը միավորում էր հարավասիական և հելլենիստական պատկերային ավանդույթները։ Այս ռելիեֆում Բուդդան պատկերված է երկրպագության տեսարանում։',
    context: 'Գանդհարայի շրջանում պատմողական քանդակները հաճախ ներկայացնում էին բուդդայական թեմաները բազմաֆիգուր հորինվածքով։ Այս ռելիեֆի լուսանկարը տեսանելի է նաև բնօրինակ պատկերի աղբյուրում։',
    lookFor: 'Համեմատիր կենտրոնական կերպարի դիրքը նրա շուրջը կանգնած կերպարների հետ։',
    image: '/images/art/buddha-relief.webp', source: 'https://commons.wikimedia.org/wiki/File:Gandhara,_rilievo_con_buddha_adorato_da_indra_e_brahma,_II-III_secolo.jpg',
    imageCredit: 'Sailko · Wikimedia Commons · CC BY 3.0 · փոքրացված WebP', imageSource: 'https://commons.wikimedia.org/wiki/File:Gandhara,_rilievo_con_buddha_adorato_da_indra_e_brahma,_II-III_secolo.jpg', imageLicense: 'https://creativecommons.org/licenses/by/3.0/',
  },
  {
    id: 'thinker', room: 1, title: 'Մտածողը', originalTitle: 'The Thinker', creator: 'Օգյուստ Ռոդեն · ձուլվածքը՝ Ալեքսի Ռյուդիե',
    date: 'մոդելավորված՝ մոտ 1880, բրոնզե ձուլվածք՝ մոտ 1910', medium: 'Բրոնզե քանդակ',
    description: 'Ռոդենի հայտնի մտածող կերպարը սկզբում նախատեսված էր «Դժոխքի դարպասները» հորինվածքի համար։ Այստեղ ներկայացված է Մետրոպոլիտեն թանգարանի մոտ 1910 թվականի բրոնզե ձուլվածքը։',
    context: 'Մետրոպոլիտեն թանգարանի բրոնզե ձուլվածքը պատրաստվել է մոտ 1910 թվականին՝ Ռոդենի մոտ 1880 թվականին ստեղծած մոդելի հիման վրա։ Կերպարը սկզբում կապված էր «Դժոխքի դարպասները» նախագծի հետ։',
    lookFor: 'Նայիր ձեռքի ու գլխի հարաբերությանը, լարված մկաններին և նստած մարմնի հավաքված դիրքին։',
    location: 'Մետրոպոլիտեն արվեստի թանգարան, Նյու Յորք',
    image: '/images/art/thinker.webp', source: 'https://www.metmuseum.org/art/collection/search/191811',
    imageCredit: 'The Metropolitan Museum of Art · CC0', imageSource: 'https://commons.wikimedia.org/wiki/File:The_Thinker_MET_DP-13618-012.jpg',
  },
  {
    id: 'grande-jatte', room: 2, title: 'Կիրակի կեսօր Գրանդ Ժատ կղզում',
    originalTitle: 'A Sunday on La Grande Jatte — 1884', creator: 'Ժորժ Սյորա', date: '1884–1886, եզրագիծը՝ 1888–1889', medium: 'Յուղաներկ, կտավ',
    description: 'Փարիզյան զբոսանքի տեսարանը կառուցված է մանր գունային հպումներով։ Սյորայի այս գործը նեոիմպրեսիոնիզմի ամենահայտնի օրինակներից է։',
    context: 'Սյորան մեծ կտավի վրա աշխատել է 1884–1886 թվականներին, իսկ գունավոր եզրագիծը ավելացրել ավելի ուշ։ Նեոիմպրեսիոնիստական մանր հպումները դիտողի աչքում միավորվում են ամբողջական տեսարանի մեջ։',
    lookFor: 'Մոտիկից ուսումնասիրիր գունային փոքր կետերը, հետո հեռացիր՝ տեսնելու ամբողջ կոմպոզիցիան։',
    location: 'Չիկագոյի արվեստի ինստիտուտ',
    image: '/images/art/grande-jatte.webp', source: 'https://www.artic.edu/artworks/27992/a-sunday-on-la-grande-jatte-1884',
    imageCredit: 'Art Institute of Chicago · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg',
  },
  {
    id: 'bedroom', room: 2, title: 'Ննջասենյակը', originalTitle: 'The Bedroom', creator: 'Վինսենթ վան Գոգ', date: '1889', medium: 'Յուղաներկ, կտավ',
    description: 'Արլի իր սենյակի այս տարբերակում Վան Գոգը տարածությունն ու առարկաները ներկայացնում է հստակ ու արտահայտիչ գույներով։',
    context: 'Չիկագոյի 1889 թվականի նկարը Վան Գոգի Արլի ննջասենյակի երկրորդ տարբերակն է։ Նա այն նկարել է Սեն Ռեմիում, երբ առաջին տարբերակը վնասվել էր։',
    lookFor: 'Նկատիր հատակի թեքված հեռանկարը և կահույքի հստակ գունային հակադրությունները։',
    location: 'Չիկագոյի արվեստի ինստիտուտ',
    image: '/images/art/bedroom.webp', source: 'https://www.artic.edu/artworks/28560/the-bedroom',
    imageCredit: 'Art Institute of Chicago · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:Van_Gogh_-_The_Bedroom,_1889_Chicago.jpg',
  },
  {
    id: 'paris-rain', room: 2, title: 'Փարիզյան փողոց․ անձրևոտ օր', originalTitle: 'Paris Street; Rainy Day',
    creator: 'Գյուստավ Կայբոտ', date: '1877', medium: 'Յուղաներկ, կտավ',
    description: 'Խոշոր կտավում քաղաքի նոր փողոցներն ու անցորդները դիտվում են լուսանկարչական կադր հիշեցնող տեսանկյունից։',
    context: 'Կայբոտի 1877 թվականի մեծ նկարը ցույց է տալիս Փարիզի նոր լայն պողոտաների միջավայրը։ Այն մոտ 212 × 276 սմ է, և կտրված կերպարներն ու փողոցի անկյունը հիշեցնում են ակնթարթային լուսանկարչական կադր։',
    lookFor: 'Նայիր, թե ինչպես են անձրևանոցներն ու փողոցների գծերը կազմակերպում մարդկանց շարժումը։',
    location: 'Չիկագոյի արվեստի ինստիտուտ',
    image: '/images/art/paris-rain.webp', source: 'https://www.artic.edu/artworks/20684/paris-street-rainy-day',
    imageCredit: 'Art Institute of Chicago · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:Gustave_Caillebotte_-_Paris_Street,_Rainy_Day_-_1964.336_-_Art_Institute_of_Chicago.jpg',
  },
  {
    id: 'water-lilies', room: 2, title: 'Ջրաշուշաններ', originalTitle: 'Water Lilies', creator: 'Կլոդ Մոնե', date: '1906', medium: 'Յուղաներկ, կտավ',
    description: 'Մոնեն կենտրոնանում է ջրի մակերեսին լույսի, անդրադարձների ու ջրաշուշանների փոփոխվող հարաբերության վրա։',
    context: '1906 թվականի այս գործը Մոնեի ջրաշուշանների երկար շարքի մաս է։ Ջրի մակերեսը գրեթե ամբողջությամբ զբաղեցնում է պատկերը՝ առանց հստակ հորիզոնի։',
    lookFor: 'Փնտրիր, թե որտեղ են ավարտվում բույսերը և սկսվում երկնքի անդրադարձները։',
    location: 'Չիկագոյի արվեստի ինստիտուտ',
    image: '/images/art/water-lilies.webp', source: 'https://www.artic.edu/artworks/16568/water-lilies',
    imageCredit: 'Art Institute of Chicago · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg',
  },
  {
    id: 'venus-de-milo', room: 1, title: 'Միլոսյան Վեներա', originalTitle: 'Venus de Milo',
    creator: 'Անհայտ հույն քանդակագործ', date: 'մ.թ.ա. մոտ 150–125', medium: 'Պարոսյան մարմարե քանդակ',
    description: 'Հելլենիստական դարաշրջանի քանդակը հայտնաբերվել է Միլոս կղզում և 1821 թվականին հասել Լուվր։ Կորած ձեռքերը, մարմնի շրջադարձը և ծալքավոր հանդերձը այս կերպարին տալիս են առանձնահատուկ շարժում և առեղծված։',
    context: 'Քանդակը այսօր պահվում է Փարիզի Լուվրում։ Սրահում ցուցադրվող եռաչափ մոդելը Լուվրի բնօրինակի սկան չէ․ այն Դանիայի ազգային պատկերասրահի գիպսե կրկնօրինակի սկանն է։ Լուսանկարում ներկայացված է Լուվրի քանդակը։',
    lookFor: 'Շրջիր պատվանդանի շուրջը և հետևիր, թե ինչպես են մարմնի ու հանդերձի կորերը փոխվում տարբեր դիտանկյուններից։',
    location: 'Լուվր, Փարիզ · Salle des Caryatides (սրահ 345)',
    image: '/images/art/venus-de-milo.webp', source: 'https://collections.louvre.fr/en/ark:/53355/cl010277627',
    imageCredit: 'Yair Haklai · Wikimedia Commons · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:Venus_de_Milo-Louvre.jpg',
    modelCredit: 'Դանիայի ազգային պատկերասրահի գիպսե կրկնօրինակի 3D սկան · CC0', modelSource: 'https://fixtures.iiif.io/info.html?file=/3d/smk/venus.glb',
  },
  {
    id: 'mona-lisa', room: 4, title: 'Մոնա Լիզա', originalTitle: 'La Joconde / Mona Lisa',
    creator: 'Լեոնարդո դա Վինչի', date: 'սկսված մոտ 1503-ին, շարունակված մինչև 1519', medium: 'Յուղաներկ, բարդու փայտե տախտակ',
    description: 'Դիմանկարի հայացքն ու հազիվ նշմարելի ժպիտը դարեր շարունակ գրավել են դիտողներին։ Լեոնարդոն մեղմ անցումներով միացնում է դեմքի լուսավորված ու ստվերոտ հատվածները, իսկ հեռավոր բնապատկերը խորություն է տալիս կոմպոզիցիային։',
    context: 'Ըստ Լուվրի՝ Լեոնարդոն գործն սկսել է մոտ 1503 թվականին և շարունակել մշակել մինչև իր կյանքի ավարտը։ Նկարը այժմ Լուվրի հավաքածուում է։',
    lookFor: 'Մոտեցիր աչքերին ու բերանի անկյուններին․ հստակ ուրվագծերի փոխարեն տեսանելի են շատ մեղմ գունային անցումներ։',
    location: 'Լուվր, Փարիզ',
    image: '/images/art/mona-lisa.webp', source: 'https://collections.louvre.fr/ark:/53355/cl010062370',
    imageCredit: 'Լեոնարդո դա Վինչի · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:Mona_Lisa.jpg',
  },
  {
    id: 'last-supper', room: 4, title: 'Խորհրդավոր ընթրիք', originalTitle: 'The Last Supper / Il Cenacolo',
    creator: 'Լեոնարդո դա Վինչի', date: '1495–1498', medium: 'Պատանկար՝ չոր սվաղի վրա',
    description: 'Հիսուսի հայտարարությունից հետո առաքյալների տարբեր արձագանքները Լեոնարդոն ներկայացրել է դեմքի արտահայտություններով և շարժումներով։ Հեռանկարի գծերը հայացքը տանում են դեպի կենտրոնում նստած Հիսուսը։',
    context: 'Աշխատանքը ստեղծվել է Միլանի Սանտա Մարիա դելլե Գրացիե վանքի սեղանատան պատին՝ Լուդովիկո Սֆորցայի պատվերով։ Լեոնարդոն փորձել է չոր սվաղի վրա աշխատելու եղանակ, ինչն այլ է սովորական թաց որմնանկարչությունից։ Այն մոտ 460 × 880 սմ է և մնում է իր սկզբնական միջավայրում։',
    lookFor: 'Նկատիր, թե ինչպես են առաքյալները կազմավորում փոքր խմբեր, և ինչպես են պատերի ու առաստաղի գծերը միավորվում Քրիստոսի հետևում։',
    location: 'Սանտա Մարիա դելլե Գրացիե, Միլան', dimensions: '460 × 880 սմ',
    image: '/images/art/last-supper.webp', source: 'https://cenacolovinciano.org/en/museum/the-works/the-last-supper-leonardo-da-vinci-1452-1519/',
    imageCredit: 'Լեոնարդո դա Վինչի · Public Domain', imageSource: 'https://commons.wikimedia.org/wiki/File:Leonardo_da_Vinci_(1452-1519)_-_The_Last_Supper_(1495-1498).jpg',
  },
  {
    id:'self-portrait',room:5,title:'Ինքնադիմանկար',originalTitle:'Self-Portrait',creator:'Վինսենթ վան Գոգ',date:'1887',medium:'Յուղաներկ, ստվարաթուղթ',
    description:'Փարիզում ստեղծված այս ինքնադիմանկարում Վան Գոգը դեմքը կառուցում է կարճ, շարժուն վրձնահարվածներով և գունային հակադրությամբ։',
    context:'Ստեղծագործությունը պահվում է Չիկագոյի արվեստի ինստիտուտում։ Այն հնարավորություն է տալիս նույն նկարչի «Ննջասենյակի» հետ համեմատել նրա գունային և վրձնային լուծումները։',
    lookFor:'Դիտիր, թե ինչպես են փոքր գունավոր հպումները ձևավորում դեմքն ու ֆոնը։',location:'Չիկագոյի արվեստի ինստիտուտ',
    image:'/images/art/self-portrait.webp',source:'https://www.artic.edu/artworks/80607/self-portrait',imageCredit:'Art Institute of Chicago · Public Domain',imageSource:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Self-Portrait_-_1954.326_-_Art_Institute_of_Chicago.jpg',
  },
  {
    id:'poets-garden',room:5,title:'Բանաստեղծի այգին',originalTitle:"The Poet's Garden",creator:'Վինսենթ վան Գոգ',date:'1888',medium:'Յուղաներկ, կտավ',
    description:'Արլի այգու տեսարանը Վան Գոգը պատկերել է խիտ կանաչներով, դեղին լույսով և հստակ ուղղություններ ունեցող վրձնահարվածներով։',
    context:'Այս բնապատկերը ստեղծվել է «Ննջասենյակից» առաջ և նույն նկարչի գործերի մեջ ցույց է տալիս, թե որքան տարբեր կերպ կարող էր նա օգտագործել գույնը տարածություն կառուցելու համար։',
    lookFor:'Հետևիր ծառերի ստվերներին ու կանաչի բազմաթիվ երանգներին։',location:'Չիկագոյի արվեստի ինստիտուտ',
    image:'/images/art/poets-garden.webp',source:'https://www.artic.edu/artworks/14586/the-poets-garden',imageCredit:'Art Institute of Chicago · Public Domain',imageSource:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_Poet%27s_Garden_-_1933.433_-_Art_Institute_of_Chicago.jpg',
  },
  {
    id:'stack-wheat',room:5,title:'Ցորենի դեզը',originalTitle:'Stack of Wheat',creator:'Կլոդ Մոնե',date:'1890–1891',medium:'Յուղաներկ, կտավ',
    description:'Մոնեի դեզերի շարքում նույն առարկան փոխվում է լույսի, եղանակի և օրվա ժամի հետ։ Պատկերը կենտրոնանում է գույնի ու մթնոլորտի կարճատև ազդեցության վրա։',
    context:'Մոնեն դեզերի շարքի մոտ 25 կտավ է ստեղծել։ Չիկագոյի արվեստի ինստիտուտի հավաքածուում այդ շարքի մի քանի տարբերակ կա։ Այս գործը թույլ է տալիս համեմատել Մոնեի «Ջրաշուշանների» հետ՝ տեսնելով նույն հետաքրքրությունը փոփոխվող լույսի նկատմամբ։',
    lookFor:'Համեմատիր դեզի, երկնքի ու հողի գույները՝ փորձելով պատկերացնել օրվա ժամը։',location:'Չիկագոյի արվեստի ինստիտուտ',
    image:'/images/art/stack-wheat.webp',source:'https://www.artic.edu/artworks/111318/stack-of-wheat',imageCredit:'Art Institute of Chicago · Public Domain',imageSource:'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Stack_of_Wheat_-_1983.29_-_Art_Institute_of_Chicago.jpg',
  },
  {
    id:'two-sisters',room:5,title:'Երկու քույրերը պատշգամբում',originalTitle:'Two Sisters (On the Terrace)',creator:'Պիեռ Օգյուստ Ռենուար',date:'1881',medium:'Յուղաներկ, կտավ',
    description:'Երկու կերպարները ներկայացված են լուսավոր բացօթյա միջավայրում՝ ծաղիկների ու կանաչ բնության առջև։ Ռենուարի փափուկ գույները կենտրոնացնում են ուշադրությունը դեմքերի և հագուստի վրա։',
    context:'Գործը պատկանում է Ռենուարի Սեն գետի ափին հանգստի տեսարանների շրջանին և պահվում է Չիկագոյի արվեստի ինստիտուտում։',
    lookFor:'Նկատիր ծաղկեփնջերի գույների կրկնությունը հերոսուհիների հագուստի ու գլխարկների մեջ։',location:'Չիկագոյի արվեստի ինստիտուտ',
    image:'/images/art/two-sisters.webp',source:'https://www.artic.edu/artworks/14655/two-sisters-on-the-terrace',imageCredit:'Art Institute of Chicago · Public Domain',imageSource:'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir_-_Two_Sisters_(On_the_Terrace)_-_1933.455_-_Art_Institute_of_Chicago.jpg',
  },
  {
    id:'childs-bath',room:5,title:'Երեխայի լոգանքը',originalTitle:"The Child's Bath",creator:'Մերի Կասատ',date:'1893',medium:'Յուղաներկ, կտավ',
    description:'Կասատը մայրական խնամքի առօրյա պահը դիտում է վերևից՝ շեշտելով երկու կերպարների մոտիկությունը և պատկերի հարթության նախշերը։',
    context:'Գործը պահվում է Չիկագոյի արվեստի ինստիտուտում։ Դիտակետը և զարդանախշերի հարթ դասավորությունը տալիս են սովորական ընտանեկան տեսարանին ուժեղ կոմպոզիցիա։',
    lookFor:'Տես, թե ինչպես են գծավոր հագուստը, գորգը և ջրով լոգարանը ուղղորդում հայացքը։',location:'Չիկագոյի արվեստի ինստիտուտ',
    image:'/images/art/childs-bath.webp',source:'https://www.artic.edu/artworks/111442/the-childs-bath',imageCredit:'Art Institute of Chicago · Public Domain',imageSource:'https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
  },
  {
    id:'woman-bathing',room:5,title:'Լողացող կինը',originalTitle:'Woman Bathing',creator:'Մերի Կասատ',date:'1890–1891',medium:'Գունավոր չոր ասեղ և ակվատինտա',
    description:'Կասատը առօրյա լոգանքի տեսարանը վերածել է գունավոր տպագրության։ Սահմանափակ գունաշարը և հստակ կոր գծերը մոտ են ճապոնական փորագրության հարթ պատկերային լեզվին։',
    context:'Այս գունավոր տպագրությունը Չիկագոյի արվեստի ինստիտուտի հավաքածուից է և Կասատի «Երեխայի լոգանքի» կողքին ցույց է տալիս նույն թեմայի երկու տարբեր տեխնիկա։',
    lookFor:'Համեմատիր այս թերթի գծային ձևերը նույն հեղինակի յուղանկարի փափուկ մակերեսի հետ։',location:'Չիկագոյի արվեստի ինստիտուտ',
    image:'/images/art/woman-bathing.webp',source:'https://www.artic.edu/artworks/13506/woman-bathing',imageCredit:'Art Institute of Chicago · Public Domain',imageSource:'https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_Woman_Bathing.jpg',
  },
]
