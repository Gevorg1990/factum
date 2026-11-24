import type {GalleryArtwork} from './gallery'

// Museum records document the work; Wikimedia Commons links credit the exact local reproduction.
export const galleryAdditions: readonly GalleryArtwork[] = [
  {
    id:'starry-night',room:3,title:'Աստղալից գիշեր',originalTitle:'The Starry Night',creator:'Վինսենթ վան Գոգ',date:'1889',medium:'Յուղաներկ, կտավ',
    description:'Սեն Ռեմիի գիշերային բնապատկերում պտտվող երկինքը, փայլող աստղերը և բարձր նոճին միավորում են դիտարկումն ու երևակայությունը։ Գյուղի տեսարանը նկարիչը կառուցել է տարբեր դիտակետերի հիշողությունից։',
    context:'Վան Գոգը գործը ստեղծել է 1889 թվականի հունիսին։ Նկարը 1941 թվականից Նյու Յորքի Ժամանակակից արվեստի թանգարանի հավաքածուում է։',lookFor:'Հետևիր երկնքի պտույտներին և համեմատիր դրանք գյուղի հանգիստ հորիզոնի հետ։',location:'Ժամանակակից արվեստի թանգարան, Նյու Յորք',
    image:'/images/art/starry-night.webp',source:'https://www.moma.org/collection/works/79802',imageCredit:'Վինսենթ վան Գոգ · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_Starry_Night.jpg',
  },
  {
    id:'sunflowers',room:3,title:'Արևածաղիկներ',originalTitle:'Sunflowers',creator:'Վինսենթ վան Գոգ',date:'1888',medium:'Յուղաներկ, կտավ',
    description:'Ծաղիկների տարբեր փուլերը՝ բացված, թառամող ու սերմերով լի, հավաքված են դեղին երանգների հարուստ մի պատկերի մեջ։ Վան Գոգն այն ստեղծել է Արլում։',
    context:'Սա Լոնդոնի Ազգային պատկերասրահում պահվող 1888 թվականի տարբերակն է։ Ծաղկեփունջը նկարիչը նախատեսում էր իր հյուրասենյակի պատերի համար։',lookFor:'Համեմատիր ծաղիկների գլխիկները և դեղինի տարբեր տաք ու սառը երանգները։',location:'Ազգային պատկերասրահ, Լոնդոն',
    image:'/images/art/sunflowers.webp',source:'https://www.nationalgallery.org.uk/paintings/vincent-van-gogh-sunflowers',imageCredit:'Վինսենթ վան Գոգ · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Sunflowers_(1888,_National_Gallery_London).jpg',
  },
  {
    id:'irises',room:3,title:'Հիրիկներ',originalTitle:'Irises',creator:'Վինսենթ վան Գոգ',date:'1889',medium:'Յուղաներկ, կտավ',
    description:'Կապույտ հիրիկները գրեթե ամբողջությամբ լցնում են դաշտը։ Նկարիչը յուրաքանչյուր տերևն ու ծաղիկը կառուցել է տարբեր ուղղությամբ շարժվող վրձնահարվածներով։',
    context:'Նկարը ստեղծվել է Սեն Ռեմիում և այժմ պահվում է Գեթի թանգարանում։ 74.3 × 94.3 սմ կտավը պատկերում է այգու ցածր դիտակետ։',lookFor:'Փնտրիր միակ սպիտակ հիրիկը և հետևիր տերևների շարժմանը։',location:'Ջ. Փոլ Գեթի թանգարան, Լոս Անջելես',dimensions:'74.3 × 94.3 սմ',
    image:'/images/art/irises.webp',source:'https://www.getty.edu/art/collection/object/103JNH',imageCredit:'Ջ. Փոլ Գեթի թանգարան · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Irises_(1889).jpg',
  },
  {
    id:'poppies',room:3,title:'Կակաչներ',originalTitle:'Coquelicots',creator:'Կլոդ Մոնե',date:'1873',medium:'Յուղաներկ, կտավ',
    description:'Կարմիր կակաչների շերտը թեք գծով առաջնորդում է հայացքը դաշտի միջով։ Երկու մայր ու երեխա զույգերը տեղադրված են կոմպոզիցիայի տարբեր խորություններում։',
    context:'Մոնեն գործը ներկայացրել է իմպրեսիոնիստների առաջին ցուցահանդեսում՝ 1874 թվականին։ Բնապատկերը այժմ Օրսեի թանգարանում է։',lookFor:'Նկատիր առաջին պլանի մեծ կարմիր բծերը և հեռվում դրանց փոքրացող կրկնությունը։',location:'Օրսեի թանգարան, Փարիզ',dimensions:'50 × 65.3 սմ',
    image:'/images/art/poppies.webp',source:'https://www.musee-orsay.fr/en/artworks/coquelicots-1010',imageCredit:'Կլոդ Մոնե · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Monet_Poppies.jpg',
  },
  {
    id:'moulin',room:3,title:'Պար Մուլեն դը լա Գալետում',originalTitle:'Bal du moulin de la Galette',creator:'Պիեռ Օգյուստ Ռենուար',date:'1876',medium:'Յուղաներկ, կտավ',
    description:'Մոնմարտրի բացօթյա պարահրապարակը լի է զրույցներով, շարժումով և ծառերի միջով անցնող արևի բծերով։ Ռենուարը մարդկանց բազմությունը կազմակերպում է առանց գլխավոր կերպարի։',
    context:'1876 թվականի մեծ կտավը ցուցադրվել է իմպրեսիոնիստների 1877 թվականի ցուցահանդեսում։ Այժմ այն Օրսեի թանգարանի հավաքածուում է։',lookFor:'Նկատիր, թե ինչպես են լույսի կլոր բծերը հայտնվում հագուստի ու գետնի վրա։',location:'Օրսեի թանգարան, Փարիզ',dimensions:'131 × 175 սմ',
    image:'/images/art/moulin.webp',source:'https://www.musee-orsay.fr/en/artworks/bal-du-moulin-de-la-galette-497',imageCredit:'Պիեռ Օգյուստ Ռենուար · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir,_Le_Moulin_de_la_Galette.jpg',
  },
  {
    id:'lady-ermine',room:4,title:'Կզաքիսով տիկինը',originalTitle:'Lady with an Ermine',creator:'Լեոնարդո դա Վինչի',date:'մոտ 1489–1490',medium:'Յուղաներկ, ընկուզենու տախտակ',
    description:'Դիմանկարում երիտասարդ կինը և նրա գրկի կզաքիսը շրջված են նույն ուղղությամբ։ Մութ ֆոնի վրա դեմքի, ձեռքի ու կենդանու լուսավոր ձևերը ստեղծում են ուժեղ շարժում։',
    context:'Հավանական բնորդուհին Միլանի արքունիքի Սեսիլիա Գալերանին է։ Նկարը պահվում է Կրակովի Չարտորիսկիների թանգարանում։',lookFor:'Համեմատիր կնոջ ձեռքի շարժումը կենդանու գլխի ուղղության հետ։',location:'Չարտորիսկիների թանգարան, Կրակով',
    image:'/images/art/lady-ermine.webp',source:'https://mnk.pl/en/collections/lady-with-an-ermine/',imageCredit:'Լեոնարդո դա Վինչի · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Lady_with_an_Ermine_-_Leonardo_da_Vinci_-_Google_Art_Project.jpg',
  },
  {
    id:'virgin-rocks',room:4,title:'Աստվածամայրը ժայռերում',originalTitle:'Virgin of the Rocks',creator:'Լեոնարդո դա Վինչի',date:'մոտ 1483–1494',medium:'Յուղաներկ, տախտակ',
    description:'Մարիամը, մանուկ Հիսուսը, Հովհաննես Մկրտիչը և հրեշտակը տեղադրված են քարքարոտ, մշուշոտ բնապատկերում։ Դեմքերի և ձեռքերի ուղղությունները կապում են չորս կերպարներին։',
    context:'Լուվրում պահվող սա գործի երկու հայտնի տարբերակներից մեկն է։ Փափուկ լուսաստվերը Լեոնարդոյի կերպարներին տալիս է ծավալ և խորություն։',lookFor:'Հետևիր ձեռքերի շարժման շղթային և հեռվում մարող ժայռերին։',location:'Լուվր, Փարիզ',
    image:'/images/art/virgin-rocks.webp',source:'https://collections.louvre.fr/ark:/53355/cl010062373',imageCredit:'Լեոնարդո դա Վինչի · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Leonardo_da_Vinci_-_Virgin_of_the_Rocks_(Louvre).jpg',
  },
  {
    id:'impression-sunrise',room:1,title:'Տպավորություն․ արևածագ',originalTitle:'Impression, soleil levant',creator:'Կլոդ Մոնե',date:'1872',medium:'Յուղաներկ, կտավ',
    description:'Լը Հավրի նավահանգստի մշուշոտ տեսարանում արևի նարնջագույն կետն ու նրա անդրադարձը ջրի վրա գրեթե միակ հստակ լուսավոր շեշտերն են։',
    context:'Այս նկարի անունը կապվեց ամբողջ իմպրեսիոնիստական շարժման անվան հետ։ Գործը պահվում է Մարմոտան Մոնե թանգարանում։',lookFor:'Նկատիր, թե ինչպես են նավերը մարում մշուշի մեջ, իսկ արևը մնում է պարզ։',location:'Մարմոտան Մոնե թանգարան, Փարիզ',dimensions:'48 × 63 սմ',
    image:'/images/art/impression-sunrise.webp',source:'https://www.marmottan.fr/notice/4014/',imageCredit:'Կլոդ Մոնե · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Monet_-_Impression,_Sunrise.jpg',
  },
  {
    id:'bathers',room:1,title:'Լողացողները Անյերում',originalTitle:'Bathers at Asnières',creator:'Ժորժ Սյորա',date:'1884',medium:'Յուղաներկ, կտավ',
    description:'Սենի ափին հանգստացող մարդիկ ու հեռվում ծխացող գործարանները միավորում են ամառային հանգիստն ու արդյունաբերական քաղաքի ներկայությունը։',
    context:'Մոտ 2 × 3 մ չափերով այս խոշոր կտավը Սյորայի վաղ մեծ գործերից է և պահվում է Լոնդոնի Ազգային պատկերասրահում։',lookFor:'Հետևիր գետի ափից դեպի հեռավոր գործարաններ տանող անկյունագծին։',location:'Ազգային պատկերասրահ, Լոնդոն',dimensions:'201 × 300 սմ',
    image:'/images/art/bathers.webp',source:'https://www.nationalgallery.org.uk/paintings/georges-seurat-bathers-at-asnieres',imageCredit:'Ազգային պատկերասրահ, Լոնդոն · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Baigneurs_a_Asnieres.jpg',
  },
  {
    id:'blue-armchair',room:1,title:'Փոքրիկ աղջիկը կապույտ բազկաթոռում',originalTitle:'Little Girl in a Blue Armchair',creator:'Մերի Կասատ',date:'1878',medium:'Յուղաներկ, կտավ',
    description:'Աղջիկը թուլացած նստած է վառ կապույտ բազկաթոռում, իսկ մյուս բազկաթոռին շունն է։ Կահույքի կրկնվող ձևերը և երեխայի անկաշկանդ դիրքը առօրյա պահը դարձնում են հստակ կոմպոզիցիա։',
    context:'Գործը Վաշինգտոնի Ազգային պատկերասրահի հավաքածուում է։ Նկարի մանկական կերպարը ներկայացված է սեփական տրամադրությամբ, ոչ թե հանդիսավոր դիրքով։',lookFor:'Համեմատիր բազկաթոռների կապույտն ու աղջկա զգեստի բաց գույները։',location:'Ազգային պատկերասրահ, Վաշինգտոն',dimensions:'89.5 × 129.8 սմ',
    image:'/images/art/blue-armchair.webp',source:'https://www.nga.gov/artworks/61368-little-girl-blue-armchair',imageCredit:'Ազգային պատկերասրահ, Վաշինգտոն · CC0',imageSource:'https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_Little_Girl_in_a_Blue_Armchair_-_NGA_1983.1.18.jpg',
  },
  {
    id:'floor-scrapers',room:1,title:'Հատակ հարթեցնողները',originalTitle:'Les raboteurs de parquet',creator:'Գյուստավ Կայբոտ',date:'1875',medium:'Յուղաներկ, կտավ',
    description:'Երեք աշխատավորները ծնկի եկած հարթեցնում են փայտե հատակը։ Ուժեղ հեռանկարը հայացքը տանում է պատուհանի լույսից դեպի մարդկանց աշխատանքը։',
    context:'Կայբոտի գործը մերժվել է 1875 թվականի Սալոնում, հետո ցուցադրվել իմպրեսիոնիստների ցուցահանդեսում։ Այժմ այն Օրսեի թանգարանում է։',lookFor:'Նկատիր հատակի տախտակների գծերն ու ձեռքերի կրկնվող շարժումը։',location:'Օրսեի թանգարան, Փարիզ',dimensions:'102 × 147 սմ',
    image:'/images/art/floor-scrapers.webp',source:'https://www.musee-orsay.fr/en/artworks/raboteurs-de-parquet-105',imageCredit:'Գյուստավ Կայբոտ · հանրային սեփականություն',imageSource:'https://commons.wikimedia.org/wiki/File:Caillebotte_Rabotteurs_1875.jpg',
  },
]
