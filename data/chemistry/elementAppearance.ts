import additionalPhotos from './elementPhotos.json'
import symbolicImages from './elementSymbols.json'

export type ElementSample = {
  kind?: string
  file: string
  caption: string
  width: number
  height: number
  photographer: string
  sourceUrl: string
  license: string
  licenseUrl: string
}

/** Verified specimen photographs. The source file descriptions identify each sample. */
export const elementSamples: Record<number, ElementSample> = {
  ...additionalPhotos,
  ...symbolicImages,
  13: {
    file: 'aluminium', caption: 'Ալյումինի մետաղական նմուշ։ Մշակված մակերեսի վրա երևում է նրա արծաթավուն փայլը։',
    width: 800, height: 800, photographer: 'Chemical Elements — A Virtual Museum · հեղինակն անհայտ է',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aluminium-4.jpg',
    license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
  },
  14: {
    file: 'silicon', caption: 'Մաքրված սիլիցիումի կտոր՝ մուգ մոխրագույն, փայլուն մակերեսով։',
    width: 800, height: 556, photographer: 'Enricoros',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:SiliconCroda.jpg',
    license: 'Հանրային սեփականություն', licenseUrl: 'https://commons.wikimedia.org/wiki/File:SiliconCroda.jpg#Licensing',
  },
  16: {
    file: 'sulfur', caption: 'Տարրական ծծմբի դեղին նմուշ։ Գույնն ու կառուցվածքը երևում են նյութի կտորների վրա։',
    width: 800, height: 600, photographer: 'Ben Mills',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sulfur-sample.jpg',
    license: 'Հանրային սեփականություն', licenseUrl: 'https://commons.wikimedia.org/wiki/File:Sulfur-sample.jpg#Licensing',
  },
  26: {
    file: 'iron', caption: 'Մաքուր երկաթի կտորներ և հղկված խորանարդ։ Նույն նյութի մշակված ու անհարթ մակերեսները տարբեր կերպ են արտացոլում լույսը։',
    width: 800, height: 498, photographer: 'Alchemist-hp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Iron_electrolytic_and_1cm3_cube.jpg',
    license: 'Free Art License 1.3', licenseUrl: 'https://artlibre.org/licence/lal/en/',
  },
  29: {
    file: 'copper', caption: 'Պղնձի բյուրեղային նմուշ՝ բնորոշ կարմրաշագանակագույն մետաղական փայլով։',
    width: 800, height: 800, photographer: 'Hi-Res Images of Chemical Elements',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Copper_crystals.jpg',
    license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
  },
  79: {
    file: 'gold', caption: 'Լաբորատորիայում աճեցված ոսկու բյուրեղներ։ Լուսանկարը ներկայացնում է ոսկու նմուշի դեղին մետաղական փայլն ու բյուրեղային կառուցվածքը։',
    width: 800, height: 518, photographer: 'Alchemist-hp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gold-crystals.jpg',
    license: 'CC BY-SA 3.0 DE', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/de/',
  },
}

/** Appearance descriptions checked against the Royal Society of Chemistry element pages. */
export const appearanceDescriptions: Record<number, string> = {
  1: '20 °C-ում ջրածինն անգույն գազ է։ Դրա սովորական գազային նմուշը թափանցիկ է։ Տեսանելի լուսարձակումը կարող է կախված լինել փորձի պայմաններից։',
  6: 'Ածխածնի արտաքին տեսքը կախված է նրա կառուցվածքային ձևից։ Գրաֆիտը սև կամ մուգ մոխրագույն է, իսկ ադամանդը կարող է լինել թափանցիկ։ Երկու ձևում էլ ատոմները ածխածնի ատոմներ են՝ տարբեր դասավորությամբ։',
  7: '20 °C-ում ազոտն անգույն գազ է։ Հեղուկ ազոտը ստացվում է շատ ցածր ջերմաստիճանում․ նմուշի տեսքը կախված է նրա վիճակից և պայմաններից։',
  8: '20 °C-ում թթվածինն անգույն գազ է։ Հեղուկ թթվածինն ունի գունատ կապույտ երանգ, ուստի լուսանկարի պայմանները կարևոր են նյութի տեսքը հասկանալու համար։',
}
