interface ArtistPortrait {
  image: string
  alt: string
  credit: string
  source: string
}

// Small local copies keep the artist index fast and make the person pictured unambiguous.
export const artistPortraits: Record<string, ArtistPortrait> = {
  'Վինսենթ վան Գոգ': {
    image: '/images/art/self-portrait.webp',
    alt: 'Վինսենթ վան Գոգի ինքնադիմանկարը',
    credit: 'Վինսենթ վան Գոգ, ինքնադիմանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Self-Portrait_-_1954.326_-_Art_Institute_of_Chicago.jpg',
  },
  'Կլոդ Մոնե': {
    image: '/images/art/artists/monet.webp',
    alt: 'Կլոդ Մոնեի լուսանկարը',
    credit: 'Նադար, Կլոդ Մոնեի լուսանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Claude_Monet_1899_Nadar_crop.jpg',
  },
  'Լեոնարդո դա Վինչի': {
    image: '/images/art/artists/leonardo.webp',
    alt: 'Լեոնարդո դա Վինչիի դիմանկարը',
    credit: 'Ֆրանչեսկո Մելցիին վերագրվող դիմանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:A_portrait_of_Leonardo,_by_Francesco_Melzi.jpg',
  },
  'Մերի Կասատ': {
    image: '/images/art/artists/cassatt.webp',
    alt: 'Մերի Կասատի լուսանկարը',
    credit: 'Մերի Կասատի լուսանկար, մոտ 1914 · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:1914_Mary_Cassatt.jpg',
  },
  'Ժորժ Սյորա': {
    image: '/images/art/artists/seurat.webp',
    alt: 'Ժորժ Սյորայի լուսանկարը',
    credit: 'Ժորժ Սյորայի լուսանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Georges_Seurat_1888.jpg',
  },
  'Գյուստավ Կայբոտ': {
    image: '/images/art/artists/caillebotte.webp',
    alt: 'Գյուստավ Կայբոտի լուսանկարը',
    credit: 'Գյուստավ Կայբոտի լուսանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Gustave_Caillebotte_photo_c1878.jpg',
  },
  'Պիեռ Օգյուստ Ռենուար': {
    image: '/images/art/artists/renoir.webp',
    alt: 'Պիեռ Օգյուստ Ռենուարի ինքնադիմանկարը',
    credit: 'Պիեռ Օգյուստ Ռենուար, ինքնադիմանկար · հանրային սեփականություն',
    source: 'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir_-_Autoportrait,_1910.jpg',
  },
}
