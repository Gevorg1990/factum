import { armenianPortraits } from './personPortraits'

export interface PersonMonument {
  id: string
  personId: string
  name: string
  city: string
  location: string
  openedYear?: number
  openedDate?: string
  installedYear?: number
  sculptor?: string
  architect?: string
  image?: {
    src: string
    alt: string
    credit: string
    sourceUrl: string
    license: string
    licenseUrl: string
    fit?: 'contain' | 'cover'
    position?: string
  }
  source: { name: string; url: string }
}

// A person can have multiple monuments. Each record represents one actual site;
// installation and public opening dates are kept separate when they differ.
function commonsImage(filename: string, alt: string, author: string, license = 'CC BY-SA 4.0'): NonNullable<PersonMonument['image']> {
  const file = encodeURIComponent(filename.replaceAll(' ', '_'))
  const sourceUrl = `https://commons.wikimedia.org/wiki/File:${file}`
  return {
    src: `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=960`,
    alt, credit: `${author} / Wikimedia Commons`, sourceUrl, license,
    licenseUrl: license === 'CC BY-SA 4.0' ? 'https://creativecommons.org/licenses/by-sa/4.0/' : license === 'CC BY-SA 3.0' ? 'https://creativecommons.org/licenses/by-sa/3.0/' : license === 'CC BY 2.0' ? 'https://creativecommons.org/licenses/by/2.0/' : license === 'CC BY 4.0' ? 'https://creativecommons.org/licenses/by/4.0/' : license === 'CC0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : `${sourceUrl}#Licensing`,
  }
}

const monumentRecords: PersonMonument[] = [
  {
    id:'van-gogh-nuenen-memorial',personId:'vincent-van-gogh',name:'Վինսենթ վան Գոգի հուշաքար',city:'Նյունեն',location:'Berg 44, Նյունեն, Նիդեռլանդներ',
    openedYear:1932,openedDate:'1932 թ. հուլիսի 30',sculptor:'Հիլդո Կրոպ',
    image:commonsImage('Nuenen-Berg-Gedenksteen-Van-Gogh.jpg','Վան Գոգի հուշաքարը Նյունենի Բերգ հրապարակում','Wammes Waggel','CC BY-SA 3.0'),
    source:{name:'Նիդեռլանդների մշակութային ժառանգության պետական ռեեստր',url:'https://monumentenregister.cultureelerfgoed.nl/monumenten/518014'},
  },
  {
    id:'van-gogh-auvers-zadkine',personId:'vincent-van-gogh',name:'Վան Գոգի արձան',city:'Օվեր սյուր Ուազ',location:'Վան Գոգի հանրային այգի, Օվեր սյուր Ուազ, Ֆրանսիա',sculptor:'Օսիպ Զադկին',
    image:commonsImage('Statue de Zadkine de Vincent Van Gogh à Auvers-sur-Oise.jpg','Օսիպ Զադկինի Վան Գոգի արձանը Օվերի այգում','LERUSTE','CC BY 4.0'),
    source:{name:'Ֆրանսիայի պատմական հուշարձանների ռեեստր · PM95000851',url:'https://pop.culture.gouv.fr/notice/palissy/PM95000851'},
  },
  {
    id:'monet-giverny-bust',personId:'claude-monet',name:'Կլոդ Մոնեի կիսանդրի',city:'Ժիվեռնի',location:'Parking de la Prairie, Էպտ գետի ափ, Ժիվեռնի, Ֆրանսիա',installedYear:2007,sculptor:'Դանիել Գուպիլ',
    image:commonsImage('Statue du buste de Claude Monet.jpg','Կլոդ Մոնեի կիսանդրին Ժիվեռնիում','XioNoX'),
    source:{name:'Նորմանդիայի զբոսաշրջության ծառայություն',url:'https://www.normandie-tourisme.fr/sites-lieux-de-visites/buste-de-claude-monet/'},
  },
  {
    id:'monet-giverny-grave',personId:'claude-monet',name:'Կլոդ Մոնեի ընտանեկան գերեզման',city:'Ժիվեռնի',location:'Սուրբ Ռադեգոնդ եկեղեցու գերեզմանատուն, Ժիվեռնի, Ֆրանսիա',
    image:commonsImage('Grave of impressionist painter Claude Monet (1).jpg','Կլոդ Մոնեի գերեզմանը Ժիվեռնիի գերեզմանատանը','Ibex73'),
    source:{name:'Wikimedia Commons · տեղանքի լուսանկար',url:'https://commons.wikimedia.org/wiki/File:Grave_of_impressionist_painter_Claude_Monet_(1).jpg'},
  },
  {
    id:'leonardo-milan-scala',personId:'leonardo-da-vinci',name:'Լեոնարդո դա Վինչիի հուշարձան',city:'Միլան',location:'Պիացա դելա Սկալա, Միլան, Իտալիա',installedYear:1872,sculptor:'Պիետրո Մանի',
    image:commonsImage('Monumento Leonardo da Vinci PIazza della Scala Milano dic2024.jpg','Լեոնարդո դա Վինչիի հուշարձանը Միլանի Սկալա հրապարակում','AriannaGuaglione'),
    source:{name:'Միլանի հանրային արվեստի տեղեկատու · MUDEC',url:'https://www.mudec.it/en/2022/05/10/monumento-a-leonardo-da-vinci/'},
  },
  {
    id:'cassatt-mesnil-theribus-grave',personId:'mary-cassatt',name:'Մերի Կասատի ընտանեկան գերեզման',city:'Լե Մենիլ Տերիբյուս',location:'Սեն Լուի գերեզմանատուն, Լե Մենիլ Տերիբյուս, Ֆրանսիա',
    image:commonsImage('2018 08 15 - Le Mesnil-Théribus - Tombe de Mary Cassatt et famille.jpg','Մերի Կասատի ընտանեկան գերեզմանը Լե Մենիլ Տերիբյուսում','Daniel Volpatti'),
    source:{name:'Wikimedia Commons · տեղանքի լուսանկար',url:'https://commons.wikimedia.org/wiki/File:2018_08_15_-_Le_Mesnil-Th%C3%A9ribus_-_Tombe_de_Mary_Cassatt_et_famille.jpg'},
  },
  {
    id:'seurat-pere-lachaise',personId:'georges-seurat',name:'Ժորժ Սյորայի ընտանեկան դամբարան',city:'Փարիզ',location:'Պեր Լաշեզ գերեզմանատուն, բաժին 66, Փարիզ, Ֆրանսիա',
    image:commonsImage('Père-Lachaise - Division 66 - Seurat 01.jpg','Ժորժ Սյորայի ընտանեկան դամբարանը Պեր Լաշեզում','Pierre-Yves Beaudouin','CC BY-SA 3.0'),
    source:{name:'Մետրոպոլիտեն թանգարանի Սյորայի կատալոգ',url:'https://libmma.contentdm.oclc.org/digital/api/collection/p15324coll10/id/73114/download'},
  },
  {
    id:'caillebotte-pere-lachaise',personId:'gustave-caillebotte',name:'Գյուստավ Կայբոտի ընտանեկան դամբարան',city:'Փարիզ',location:'Պեր Լաշեզ գերեզմանատուն, բաժին 70, Փարիզ, Ֆրանսիա',
    image:commonsImage('Père-Lachaise - Division 70 - Caillebotte 01.jpg','Գյուստավ Կայբոտի ընտանեկան դամբարանը Պեր Լաշեզում','Pierre-Yves Beaudouin','CC BY-SA 3.0'),
    source:{name:'Պեր Լաշեզի բարեկամների ընկերակցություն',url:'https://www.appl-lachaise.net/caillebotte-gustave-1848-1894/'},
  },
  {
    id:'renoir-essoyes-grave',personId:'pierre-auguste-renoir',name:'Օգյուստ Ռենուարի գերեզման և կիսանդրի',city:'Էսուա',location:'Էսուայի գերեզմանատուն, Օբ, Ֆրանսիա',sculptor:'Ռիշար Գինո',
    image:commonsImage("Tombe d'Auguste Renoir (1841–1919), de Pierre Renoir (1885–1952) et de Jean Renoir (1894–1979) 2.jpg",'Օգյուստ Ռենուարի և նրա որդիների գերեզմանը Էսուայում','Antoine Rex','CC0'),
    source:{name:'Էսուայի Ռենուարի կենտրոն',url:'https://renoir-essoyes.fr/en/your-visite/cemetery/'},
  },
  {
    id: 'babajanyan-swan-lake', personId: 'babajanyan',
    name: 'Առնո Բաբաջանյանի հուշարձան', city: 'Երևան',
    location: 'Թումանյան և Տերյան փողոցների խաչմերուկ, Կարապի լճի հարևանությամբ',
    openedYear: 2003, openedDate: '2003 թ. հուլիսի 4',
    sculptor: 'Դավիթ Բեջանյան', architect: 'Լևոն Իգիթյան',
    image: commonsImage('Arno Babajanian statue, Yerevan 20.jpg', 'Առնո Բաբաջանյանի՝ դաշնամուրի առջև նստած հուշարձանը Կարապի լճի մոտ', '23artashes'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/104/am/' },
  },
  {
    id: 'tumanyan-freedom-square', personId: 'tumanyan',
    name: 'Հովհաննես Թումանյանի հուշարձան', city: 'Երևան',
    location: 'Ազատության հրապարակ, Օպերայի և բալետի թատրոնի գլխավոր մուտքից ձախ',
    openedYear: 1957, openedDate: '1957 թ. նոյեմբերի 17',
    sculptor: 'Արա Սարգսյան', architect: 'Գրիգոր Աղաբաբյան',
    image: commonsImage('Hovhannes Tumanyan statue in Freedom Square, Yerevan.jpg', 'Հովհաննես Թումանյանի նստած արձանը Երևանի Ազատության հրապարակում', 'Yerevantsi'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/101/am/' },
  },
  {
    id: 'teryan-circular-park', personId: 'teryan',
    name: 'Վահան Տերյանի հուշարձան', city: 'Երևան',
    location: 'Օղակաձև զբոսայգի, Տերյան փողոցին հարող հատված',
    installedYear: 1999, openedYear: 2000, openedDate: '2000 թ. փետրվարի 9',
    sculptor: 'Նորայր Կարգանյան', architect: 'Համլետ Խաչատրյան',
    image: commonsImage('Statue of Armenian writer Vahan Teryan 01.jpg', 'Վահան Տերյանի հուշարձանը Երևանի Օղակաձև զբոսայգում', 'Violmsyan'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/91/am/' },
  },
  {
    id: 'komitas-conservatory', personId: 'komitas',
    name: 'Կոմիտասի հուշարձան', city: 'Երևան',
    location: 'Սայաթ-Նովայի պողոտա, Կոմիտասի անվան պետական կոնսերվատորիայի առջևի պուրակ',
    openedYear: 1988, openedDate: '1988 թ. հունվարի 8',
    sculptor: 'Արա Հարությունյան', architect: 'Ֆենիքս Դարբինյան',
    image: commonsImage('Statue of Komitas, Yerevan.jpg', 'Կոմիտասի հուշարձանը Երևանի պետական կոնսերվատորիայի պուրակում', 'Kevorkmail', 'Հանրային սեփականություն'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/92/am/' },
  },
  {
    id: 'komitas-pantheon', personId: 'komitas',
    name: 'Կոմիտասի մահարձան', city: 'Երևան',
    location: 'Կոմիտասի անվան զբոսայգու պանթեոն, Կոմիտասի գերեզմանի մոտ',
    installedYear: 1955,
    sculptor: 'Արա Հարությունյան', architect: 'Գրիգոր Աղաբաբյան',
    image: commonsImage('Komitas Grave, Komitas Pantheon, Yerevan 01.jpg', 'Կոմիտասի կիսանդրին նրա անվան պանթեոնում', 'GeoO'),
    source: { name: 'Visit Yerevan', url: 'https://www.visityerevan.am/places/details/309/am/' },
  },
  {
    id: 'mashtots-matenadaran', personId: 'mashtots',
    name: 'Մեսրոպ Մաշտոցի հուշարձան', city: 'Երևան',
    location: 'Մատենադարանի առջև, Մաշտոցի պողոտա',
    openedYear: 1962, openedDate: '1962 թ. մայիսի 26', sculptor: 'Ղուկաս Չուբարյան',
    image: commonsImage('2014 Erywań, Matenadaran (16).jpg', 'Մեսրոպ Մաշտոցի և նրա աշակերտ Կորյունի քանդակները Մատենադարանի առջև', 'Marcin Konsek'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/89/am/' },
  },
  {
    id: 'vazgen-sargsyan-yerevan', personId: 'vazgen-sargsyan',
    name: 'Վազգեն Սարգսյանի կիսանդրի', city: 'Երևան', location: 'Վազգեն Սարգսյան փողոց',
    openedYear: 2007, sculptor: 'Տիգրան Հովումյան', architect: 'Ասլան Մխիթարյան',
    image: commonsImage('Bust of Vazgen Sargsyan, Yerevan 14.jpg', 'Վազգեն Սարգսյանի բրոնզե կիսանդրին Երևանի Վազգեն Սարգսյան փողոցում', '23artashes'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/187/am/' },
  },
  {
    id: 'raffi-komitas-school', personId: 'raffi',
    name: 'Րաֆֆու կիսանդրի', city: 'Երևան',
    location: 'Արաբկիր, Կոմիտասի պողոտա 37, Րաֆֆու անվան թիվ 36 դպրոցի առջև',
    installedYear: 1987,
    sculptor: 'Արշամ Շահինյան',
    image: commonsImage('Raffi monument Yerevan.jpg', 'Րաֆֆու կիսանդրին Երևանի Կոմիտասի պողոտայում՝ թիվ 36 դպրոցի առջև', 'Vilnius', 'CC BY-SA 3.0'),
    source: { name: 'Հուշարձանների պետական ցուցակ · ARLIS', url: 'https://www.arlis.am/hy/acts/154750' },
  },
  {
    id: 'hambardzumyan-student-park', personId: 'hambardzumyan',
    name: 'Վիկտոր Համբարձումյանի հուշարձան', city: 'Երևան',
    location: 'Ուսանողական պուրակ, Աբովյան և Տերյան փողոցների միջև, Երևանի աստղադիտարանի հարևանությամբ',
    openedYear: 2009, openedDate: '2009 թ. դեկտեմբերի 15',
    sculptor: 'Տարիել Հակոբյան', architect: 'Հայկ Ասատրյան',
    image: commonsImage('Viktor Hambardzumyan statue, Yerevan, July 2023.jpeg', 'Վիկտոր Համբարձումյանի արձանը Երևանի Ուսանողական պուրակում՝ ցերեկային լուսավորությամբ', 'Textfabrikant'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/111/am/' },
  },
  {
    id: 'hambardzumyan-baghramyan-memorial', personId: 'hambardzumyan',
    name: 'Վիկտոր Համբարձումյանի հուշակոթող', city: 'Երևան',
    location: 'Բաղրամյան պողոտա, գիտնականի երևանյան տան առջև',
    installedYear: 1996,
    image: commonsImage('Monument to Victor Hambardzumyan, Baghramyan street.jpg', 'Վիկտոր Համբարձումյանի սկավառակաձև հուշակոթողը Բաղրամյան պողոտայում', 'Armineaghayan'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/438/am/' },
  },
  {
    id: 'bakunts-goris-square', personId: 'bakunts',
    name: 'Ակսել Բակունցի կիսանդրի', city: 'Գորիս',
    location: 'Ակսել Բակունցի անվան հրապարակ',
    openedYear: 1964,
    // The museum memoir dates the opening to 1964. Sculptor credits conflict
    // between sources, so omit that field until the attribution is resolved.
    image: commonsImage('Ակսել Բակունցի կիսանդրին Գորիսում.jpg', 'Ակսել Բակունցի կիսանդրին Գորիսում՝ նրա անվան հրապարակում', 'Արարատ Թրվանց'),
    source: { name: 'Ակսել Բակունցի տուն-թանգարան · հուշարձանի բացման հուշագրություն', url: 'https://bakuntsmuseum.blogspot.com/2024/12/Tehmina-Marutyan-Aksel-Bakuntsy-Sero-Xanzadyani-kyanqum.html' },
  },
  {
    id: 'momik-ijevan-sculpture-park', personId: 'momik',
    name: '«Մոմիկ» քանդակ', city: 'Իջևան',
    location: 'Քաղաքային զբոսայգի՝ «Քանդակների զբոսայգի», ժամանակակից քանդակի բացօթյա ցուցադրություն',
    installedYear: 1987, sculptor: 'Յուրի Սամվելյան',
    image: commonsImage('Մոմիկ.jpg', 'Յուրի Սամվելյանի «Մոմիկ» քանդակը Իջևանի քանդակների զբոսայգում', 'AKB7'),
    source: { name: 'Հուշարձանների պետական ցուցակ · ARLIS', url: 'https://www.arlis.am/hy/acts/210712' },
  },
  {
    id: 'nalbandyan-circular-park', personId: 'nalbandian',
    name: 'Միքայել Նալբանդյանի հուշարձան', city: 'Երևան',
    location: 'Օղակաձև զբոսայգի, Խանջյան, Մոսկովյան և Նալբանդյան փողոցների խաչմերուկ, ԱԱԾ շենքի դիմաց',
    openedYear: 1965, openedDate: '1965 թ. նոյեմբերի 29',
    sculptor: 'Նիկողայոս Նիկողոսյան', architect: 'Ջիմ Թորոսյան',
    image: commonsImage('Statue of Mikael Nalbandyan, Yerevan 21.jpg', 'Միքայել Նալբանդյանի հուշարձանը Երևանի Օղակաձև զբոսայգում', '23artashes'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/132/am/' },
  },
  {
    id: 'abovyan-yerevan-square', personId: 'abovyan',
    name: 'Խաչատուր Աբովյանի հուշարձան', city: 'Երևան',
    location: 'Խաչատուր Աբովյանի հրապարակ՝ Աբովյան փողոցի վերջնամասում',
    installedYear: 1950, sculptor: 'Սուրեն Ստեփանյան', architect: 'Գևորգ Թամանյան',
    image: commonsImage('Khachatur Abovyan statue.jpg', 'Խաչատուր Աբովյանի հուշարձանը Երևանի համանուն հրապարակում', 'Armenian World'),
    source: { name: 'Visit Yerevan', url: 'https://visityerevan.am/places/details/123/am/' },
  },
  {
    id: 'aghayan-yerevan-school-63', personId: 'aghayan',
    name: 'Ղազարոս Աղայանի կիսանդրի', city: 'Երևան',
    location: 'Կիևյան փողոց 9, Ղազարոս Աղայանի անվան թիվ 63 դպրոցի առջև',
    installedYear: 1955, sculptor: 'Երեմ Վարդանյան',
    image: { ...commonsImage('ՂԱԶԱՐՈՍ ԱՂԱՅԱՆ (1).JPG', 'Ղազարոս Աղայանի կիսանդրին Երևանի Կիևյան փողոցում՝ թիվ 63 դպրոցի առջև', 'Armineaghayan', 'CC BY-SA 3.0'), fit: 'cover', position: 'center 25%' },
    source: { name: 'Վիքիպեդիա · Ղազարոս Աղայանի կիսանդրի (Երևան)', url: 'https://hy.wikipedia.org/wiki/Ղազարոս_Աղայանի_կիսանդրի_(Երևան)' },
  },
  {
    id: 'aghayan-dilijan-library', personId: 'aghayan',
    name: 'Ղազարոս Աղայանի հուշարձան', city: 'Դիլիջան',
    location: 'Մյասնիկյան փողոց 61, նախկին քաղաքային գրադարանի շենքի մուտքի մոտ',
    installedYear: 1976,
    image: commonsImage('Akhaian, in Dilijan.JPG', 'Ղազարոս Աղայանի հուշարձանը Դիլիջանի նախկին գրադարանի առջև', 'Beko', 'CC BY-SA 3.0'),
    source: { name: 'Հուշարձանների պետական ցուցակ · ARLIS', url: 'https://www.arlis.am/hy/acts/210712' },
  },
  {
    id: 'aznavour-gyumri-square', personId: 'aznavour',
    name: 'Շառլ Ազնավուրի հուշարձան', city: 'Գյումրի',
    location: 'Շառլ Ազնավուրի հրապարակ՝ նախկին Աստղի հրապարակ',
    installedYear: 2001, sculptor: 'Սամվել Պետրոսյան', architect: 'Ջիմ Թորոսյան',
    image: commonsImage('Statue of Charles Aznavour in Gyumri.jpg', 'Շառլ Ազնավուրի հուշարձանը Գյումրիի համանուն հրապարակում', 'Rita Willaert', 'CC BY 2.0'),
    source: { name: 'Արմենպրես · հուշարձանի բացումը', url: 'https://armenpress.am/hy/article/374007' },
  },
  {
    id: 'aznavour-yerevan-la-boheme', personId: 'aznavour',
    name: 'Շառլ Ազնավուրի «Լա Բոհեմ» հուշարձան', city: 'Երևան',
    location: 'Շառլ Ազնավուրի հրապարակ, «Մոսկվա» կինոթատրոնի դիմաց',
    openedYear: 2025, openedDate: '2025 թ. հուլիսի 18', sculptor: 'Դավիթ Մինասյան',
    image: commonsImage('Charles Aznavour statue in Yerevan, Abovyan street.jpg', 'Շառլ Ազնավուրի «Լա Բոհեմ» հուշարձանը Երևանի Շառլ Ազնավուրի հրապարակում', 'Armenian World', 'CC BY 4.0'),
    source: { name: 'Visit Yerevan · «Լա Բոհեմ»', url: 'https://visityerevan.am/uobjects/details/152/am/' },
  },
  {
    id: 'abraham-alikhanov-itep-plaque', personId: 'abraham-alikhanov',
    name: 'Աբրահամ Ալիխանովի հուշատախտակ', city: 'Մոսկվա',
    location: 'Բոլշայա Չերյոմուշկինսկայա փողոց 25, շենք 1, Տեսական և փորձարարական ֆիզիկայի ինստիտուտ (ԻՏԷՖ)',
    // The inscription's 1945–1968 range refers to his work here, not installation.
    // A date and appropriately credited photograph have not yet been verified.
    source: { name: 'Մոսկվայի հայկական հուշատախտակները · լուսանկարչական ակնարկ', url: 'https://russia-artsakh.ru/node/3007' },
  },
]

export const personMonuments = monumentRecords.filter(monument => Boolean(armenianPortraits[monument.personId]))

export function monumentMapUrl(monument: PersonMonument): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${monument.name}, ${monument.city}, ${monument.location}`)
}
