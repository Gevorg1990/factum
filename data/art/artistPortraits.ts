interface ArtistPortrait {
  image: string
  alt: string
  credit: string
  source: string
  bio: string
  bioSource: string
}

// Small local copies keep the artist index fast and make the person pictured unambiguous.
export const artistPortraits: Record<string, ArtistPortrait> = {
  'Վինսենթ վան Գոգ': {
    bio: 'Նիդեռլանդացի հետիմպրեսիոնիստը գույնն ու շարժուն վրձնահարվածը դարձրել է անձնական արտահայտման միջոց։ Իր կարճ ստեղծագործական տարիներին նկարել է բնանկարներ, ծաղիկներ և բազմաթիվ ինքնադիմանկարներ։',
    bioSource: 'https://www.vangoghmuseum.nl/en/art-and-stories/art/vincent-van-gogh',
    image: '/images/art/self-portrait.webp',
    alt: 'Վինսենթ վան Գոգի ինքնադիմանկարը',
    credit: 'Վինսենթ վան Գոգ, ինքնադիմանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Self-Portrait_-_1954.326_-_Art_Institute_of_Chicago.jpg',
  },
  'Կլոդ Մոնե': {
    bio: 'Ֆրանսիացի իմպրեսիոնիստը բացօթյա նկարում էր բնության լույսի փոփոխությունը։ Նույն տեսարանը տարբեր ժամերի պատկերելու նրա շարքերը ավարտվեցին Ժիվեռնիի ջրաշուշանների մեծ կտավներով։',
    bioSource: 'https://www.metmuseum.org/essays/claude-monet-1840-1926',
    image: '/images/art/artists/monet.webp',
    alt: 'Կլոդ Մոնեի լուսանկարը',
    credit: 'Նադար, Կլոդ Մոնեի լուսանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Claude_Monet_1899_Nadar_crop.jpg',
  },
  'Լեոնարդո դա Վինչի': {
    bio: 'Իտալական Վերածննդի նկարիչ, գծանկարիչ և ճարտարագետ։ Ֆլորենցիայում Վերոկիոյի արվեստանոցում սովորելուց հետո աշխատել է Միլանում ու Ֆրանսիայում և ստեղծել «Մոնա Լիզան» ու «Խորհրդավոր ընթրիքը»։',
    bioSource: 'https://www.nga.gov/artists/1479-leonardo-da-vinci',
    image: '/images/art/artists/leonardo.webp',
    alt: 'Լեոնարդո դա Վինչիի դիմանկարը',
    credit: 'Ֆրանչեսկո Մելցիին վերագրվող դիմանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:A_portrait_of_Leonardo,_by_Francesco_Melzi.jpg',
  },
  'Մերի Կասատ': {
    bio: 'Ամերիկացի իմպրեսիոնիստը երկար տարիներ աշխատել է Փարիզում։ Նրա նկարներն ու գրաֆիկական գործերը հաճախ ուսումնասիրում են կանանց և երեխաների առօրյա կյանքը՝ ազատ դիտակետերով ու հստակ ձևերով։',
    bioSource: 'https://www.nga.gov/press/mary-cassatt-american-paris',
    image: '/images/art/artists/cassatt.webp',
    alt: 'Մերի Կասատի լուսանկարը',
    credit: 'Մերի Կասատի լուսանկար, մոտ 1914 · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:1914_Mary_Cassatt.jpg',
  },
  'Ժորժ Սյորա': {
    bio: 'Ֆրանսիացի նեոիմպրեսիոնիստը գույները բաժանում էր կողք կողքի դրված փոքր հպումների։ Այդ մեթոդով նա կառուցեց Սենի ափի և Փարիզի հանգստյան տեսարանների խոշոր, ճշգրիտ կոմպոզիցիաներ։',
    bioSource: 'https://www.metmuseum.org/art/collection/search/437658',
    image: '/images/art/artists/seurat.webp',
    alt: 'Ժորժ Սյորայի լուսանկարը',
    credit: 'Ժորժ Սյորայի լուսանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Georges_Seurat_1888.jpg',
  },
  'Գյուստավ Կայբոտ': {
    bio: 'Ֆրանսիացի իմպրեսիոնիստը նկարում էր ժամանակակից Փարիզի փողոցներն ու աշխատող մարդկանց՝ անսովոր հեռանկարներով։ Նա նաև կազմակերպում ու ֆինանսապես աջակցում էր իմպրեսիոնիստների ցուցահանդեսներին։',
    bioSource: 'https://www.nga.gov/exhibitions/gustave-caillebotte-painters-eye',
    image: '/images/art/artists/caillebotte.webp',
    alt: 'Գյուստավ Կայբոտի լուսանկարը',
    credit: 'Գյուստավ Կայբոտի լուսանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Gustave_Caillebotte_photo_c1878.jpg',
  },
  'Պիեռ Օգյուստ Ռենուար': {
    bio: 'Ֆրանսիացի իմպրեսիոնիզմի հիմնադիրներից մեկը հայտնի է մարդկանց ու հանրային ժամանցի լուսավոր տեսարաններով։ Ավելի ուշ նա մշակեց դասական արվեստից ներշնչված, ավելի ծավալուն կերպարներ։',
    bioSource: 'https://www.metmuseum.org/essays/auguste-renoir-1841-1919',
    image: '/images/art/artists/renoir.webp',
    alt: 'Պիեռ Օգյուստ Ռենուարի ինքնադիմանկարը',
    credit: 'Պիեռ Օգյուստ Ռենուար, ինքնադիմանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir_-_Autoportrait,_1910.jpg',
  },
}
