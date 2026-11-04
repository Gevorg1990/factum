import { countryPopulations, countryPopulation, type PopulationEstimate } from './countryPopulation'

const indiaPopulation = countryPopulations.IND!

export const worldFactCategories = {
  population: 'Բնակչություն',
  countries: 'Երկրներ',
  nature: 'Բնություն և օվկիանոսներ',
} as const
export type WorldFact = {
  id: string
  category: keyof typeof worldFactCategories
  question: string
  answer: string
  detail: string
  source: { name: string; url: string }
  dataYear?: number
  countryCode?: string
}

export const worldFacts: WorldFact[] = [
  {
    id: 'most-populous-country', category: 'population',
    question: 'Ո՞ր երկիրն ունի ամենաշատ բնակչությունը',
    answer: `Հնդկաստանը՝ մոտ ${Math.round(indiaPopulation.value / 1_000_000).toLocaleString('hy-AM')} միլիոն մարդ՝ ${indiaPopulation.year} թ. գնահատմամբ։`,
    detail: `ՄԱԿ-ի Բնակչության հիմնադրամի ${indiaPopulation.year} թվականի տվյալներում Հնդկաստանի բնակչությունը գնահատվում է ${indiaPopulation.value.toLocaleString('hy-AM')} մարդ։ Սա տվյալ տարվա գնահատական է․ բնակչության թիվը փոխվում է, իսկ նոր գնահատումները կարող են վերանայվել։`,
    source: indiaPopulation.source,
    dataYear: indiaPopulation.year, countryCode: 'IND',
  },
  {
    id: 'largest-country', category: 'countries',
    question: 'Ո՞րն է աշխարհի ամենամեծ երկիրը տարածքով',
    answer: 'Ռուսաստանը՝ մոտ 17,1 միլիոն կմ² ընդհանուր տարածքով։',
    detail: 'ՄԱԿ-ի վիճակագրական տվյալներում Ռուսաստանի ընդհանուր մակերեսը 17 098 246 կմ² է։ Ընդհանուր մակերեսը և միայն ցամաքային մակերեսը տարբեր ցուցանիշներ են․ այստեղ համեմատվում է ընդհանուր տարածքը։',
    source: { name: 'ՄԱԿ-ի վիճակագրական բաժին', url: 'https://data.un.org/legacy/en/iso/ru.html' },
    countryCode: 'RUS',
  },
  {
    id: 'smallest-country', category: 'countries',
    question: 'Ո՞րն է աշխարհի ամենափոքր անկախ պետությունը',
    answer: 'Վատիկանը՝ մոտ 0,44 կմ² տարածքով։',
    detail: 'Վատիկանը գտնվում է Հռոմի ներսում։ Նրա պաշտոնական աշխարհագրական նկարագրությունը նշում է 44 հեկտար՝ 0,44 կմ² տարածք։ Այստեղ խոսքը անկախ պետությունների մասին է, ոչ թե բոլոր կղզիների կամ կախյալ տարածքների։',
    source: { name: 'Վատիկանի պաշտոնական կայք', url: 'https://www.vaticanstate.va/en/state-and-government/general-informations/geography.html' },
  },
  {
    id: 'largest-ocean', category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ օվկիանոսը',
    answer: 'Խաղաղ օվկիանոսը։',
    detail: 'Խաղաղ օվկիանոսը Համաշխարհային օվկիանոսի ամենամեծ և ամենախոր ավազանն է։ Մեծությամբ նրան հաջորդում է Ատլանտյան օվկիանոսը։',
    source: { name: 'NOAA', url: 'https://oceanservice.noaa.gov/facts/biggestocean.html' },
  },
  {
    id: 'ocean-count', category: 'nature',
    question: 'Քանի՞ օվկիանոս են սովորաբար առանձնացնում',
    answer: 'Հինգ՝ Խաղաղ, Ատլանտյան, Հնդկական, Հարավային և Հյուսիսային Սառուցյալ։',
    detail: 'Իրականում դրանք միացած են և կազմում են մեկ Համաշխարհային օվկիանոս։ Հինգ մասի բաժանումը աշխարհագրական պայմանականություն է․ որոշ հին դասակարգումներում Հարավային օվկիանոսն առանձին չէր նշվում։',
    source: { name: 'NOAA', url: 'https://oceanservice.noaa.gov/facts/howmanyoceans.html' },
  },
  {
    id: 'ocean-surface', category: 'nature',
    question: 'Երկրի մակերևույթի ո՞ր մասն է ծածկված օվկիանոսով',
    answer: 'Մոտ 71%-ը՝ մակերևույթի ավելի քան երկու երրորդը։',
    detail: 'Մնացած մոտ 29%-ը ցամաք է։ Այս համեմատությունը վերաբերում է Երկրի մակերևույթի մակերեսին, ոչ թե մոլորակի ծավալին կամ զանգվածին։',
    source: { name: 'NASA', url: 'https://science.nasa.gov/earth/facts/' },
  },
  {
    id: 'un-members', category: 'countries',
    question: 'Քանի՞ անդամ պետություն ունի ՄԱԿ-ը',
    answer: '193 անդամ պետություն։',
    detail: 'ՄԱԿ-ի անդամների թիվը նույնը չէ, ինչ աշխարհի բոլոր պետությունների հնարավոր հաշվարկները։ Տարբեր ցանկերը կարող են ներառել նաև դիտորդ պետություններ կամ տարբեր ճանաչում ունեցող տարածքներ։ Այստեղ նշված է միայն ՄԱԿ-ի անդամների թիվը՝ 2026 թ. ստուգմամբ։',
    source: { name: 'ՄԱԿ', url: 'https://www.un.org/about-us' },
    dataYear: 2026,
  },
  {
    id: 'largest-hot-desert', category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ տաք անապատը',
    answer: 'Սահարան՝ Հյուսիսային Աֆրիկայում։',
    detail: 'Սահարան տարածվում է մի քանի երկրների տարածքներով։ «Տաք» բառը կարևոր է․ անապատները սահմանվում են չորությամբ և սակավ տեղումներով, ուստի կան նաև բևեռային սառը անապատներ։',
    source: { name: 'NASA', url: 'https://svs.gsfc.nasa.gov/13656' },
  },

  {
    id: 'highest-mountain',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենաբարձր լեռը ծովի մակարդակից',
    answer: 'Էվերեստը՝ 8 848,86 մետր։',
    detail: 'Էվերեստը գտնվում է Հիմալայներում՝ Նեպալի և Չինաստանի սահմանին։ 2020 թվականին երկու երկրները համատեղ հայտարարեցին լեռան բարձրության նոր չափումը՝ 8 848,86 մետր։ Այստեղ բարձրությունը հաշվվում է ծովի մակարդակից։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Mount-Everest' },
  },
  {
    id: 'deepest-ocean-point',
    category: 'nature',
    question: 'Որտե՞ղ է Համաշխարհային օվկիանոսի ամենախոր հայտնի կետը',
    answer: 'Մարիանյան իջվածքի Չելենջերի անդունդում։',
    detail: 'Չելենջերի անդունդը գտնվում է Խաղաղ օվկիանոսի արևմտյան մասում։ Դրա խորությունը մոտ 10 900 մետր է։ Տարբեր չափումների արդյունքները փոքր-ինչ տարբերվում են։',
    source: { name: 'NOAA', url: 'https://oceanservice.noaa.gov/facts/oceandepth.html' },
  },
  {
    id: 'largest-island',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ կղզին',
    answer: 'Գրենլանդիան՝ մոտ 2,17 միլիոն կմ²։',
    detail: 'Գրենլանդիան աշխարհի ամենամեծ կղզին է, եթե Ավստրալիան դիտարկում ենք որպես մայրցամաք։ Գրենլանդիայի տարածքի մեծ մասը ծածկված է սառցաշերտով։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Greenland' },
  },
  {
    id: 'largest-lake',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ լիճը մակերեսով',
    answer: 'Կասպից ծովը՝ մոտ 371 000 կմ²։',
    detail: 'Չնայած անվանմանը՝ Կասպից ծովը համարվում է աշխարհի ամենամեծ փակ ջրավազանը և լիճը։ Այն չունի բնական ելք դեպի Համաշխարհային օվկիանոս։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Caspian-Sea' },
  },
  {
    id: 'deepest-lake',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենախոր լիճը',
    answer: 'Բայկալը՝ առավելագույնը մոտ 1 642 մետր խորությամբ։',
    detail: 'Բայկալը գտնվում է Ռուսաստանում՝ Սիբիրում։ Այն նաև աշխարհի ամենամեծ քաղցրահամ լիճն է ջրի ծավալով և պարունակում է Երկրի չսառած մակերևութային քաղցրահամ ջրի զգալի մասը։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Lake-Baikal' },
  },
  {
    id: 'largest-freshwater-lake-area',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ քաղցրահամ լիճը մակերեսով',
    answer: 'Վերին լիճը՝ մոտ 82 100 կմ²։',
    detail: 'Վերին լիճը գտնվում է ԱՄՆ-ի և Կանադայի սահմանին։ Այն Մեծ լճերից ամենամեծն է։ Բայկալը գերազանցում է նրան ջրի ծավալով, բայց ոչ մակերեսով։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Lake-Superior' },
  },
  {
    id: 'longest-river',
    category: 'nature',
    question: 'Ո՞ր գետն է սովորաբար համարվում աշխարհի ամենաերկարը',
    answer: 'Նեղոսը՝ մոտ 6 650 կմ։',
    detail: 'Նեղոսը հոսում է Աֆրիկայում և թափվում Միջերկրական ծով։ Ամազոնի հետ համեմատությունը գիտական քննարկման թեմա է, քանի որ գետերի երկարությունը կախված է ակունքի և հունի որոշման մեթոդներից։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Nile-River' },
  },
  {
    id: 'largest-river-discharge',
    category: 'nature',
    question: 'Ո՞ր գետն է ամենաջրառատն աշխարհում',
    answer: 'Ամազոնը՝ միջին ջրի հոսքով։',
    detail: 'Ամազոնը գտնվում է Հարավային Ամերիկայում։ Այն Համաշխարհային օվկիանոս է հասցնում ավելի շատ ջուր, քան աշխարհի ցանկացած այլ գետ։ Ջրի հոսքը տարբեր է ըստ եղանակների։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Amazon-River' },
  },
  {
    id: 'largest-desert',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ անապատը՝ ներառյալ սառը անապատները',
    answer: 'Անտարկտիկական անապատը՝ մոտ 14 միլիոն կմ²։',
    detail: 'Անապատը բնորոշվում է տեղումների սակավությամբ, ոչ թե պարտադիր բարձր ջերմաստիճանով։ Այդ պատճառով Անտարկտիդան համարվում է աշխարհի ամենամեծ անապատային տարածաշրջանը, իսկ Սահարան՝ ամենամեծ տաք անապատը։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Antarctica' },
  },
  {
    id: 'largest-rainforest',
    category: 'nature',
    question: 'Որտե՞ղ է գտնվում աշխարհի ամենամեծ արևադարձային անձրևային անտառը',
    answer: 'Ամազոնի ավազանում՝ Հարավային Ամերիկայում։',
    detail: 'Ամազոնի արևադարձային անտառները տարածվում են մի քանի երկրների վրա, իսկ ամենամեծ մասը գտնվում է Բրազիլիայում։ Դրանք կարևոր դեր ունեն կենսաբազմազանության, ջրի շրջապտույտի և կլիմայի կարգավորման մեջ։',
    source: { name: 'WWF', url: 'https://www.worldwildlife.org/places/amazon' },
  },
  {
    id: 'largest-coral-reef',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենամեծ կորալային խութային համակարգը',
    answer: 'Մեծ արգելախութը՝ Ավստրալիայի հյուսիսարևելյան ափերի մոտ։',
    detail: 'Մեծ արգելախութը բաղկացած է հազարավոր առանձին խութերից և հարյուրավոր կղզիներից։ Այն աշխարհի ամենամեծ կորալային խութային համակարգն է և ՅՈՒՆԵՍԿՕ-ի համաշխարհային ժառանգության օբյեկտ։',
    source: { name: 'UNESCO', url: 'https://whc.unesco.org/en/list/154/' },
  },
  {
    id: 'largest-waterfall-volume',
    category: 'nature',
    question: 'Ո՞ր ջրվեժն է հայտնի աշխարհի ամենամեծ ջրային վարագույրով',
    answer: 'Վիկտորիա ջրվեժը՝ Զամբեզի գետի վրա։',
    detail: 'Վիկտորիա ջրվեժը գտնվում է Զամբիայի և Զիմբաբվեի սահմանին։ Այն հայտնի է իր մեծ լայնության և բարձրության համադրությամբ։ Սա չի նշանակում, որ այն ամենաբարձր կամ ամենաջրառատ ջրվեժն է բոլոր չափանիշներով։',
    source: { name: 'UNESCO', url: 'https://whc.unesco.org/en/list/509/' },
  },
  {
    id: 'highest-waterfall',
    category: 'nature',
    question: 'Ո՞րն է աշխարհի ամենաբարձր ջրվեժը',
    answer: 'Անխել ջրվեժը՝ Վենեսուելայում, մոտ 979 մետր ընդհանուր բարձրությամբ։',
    detail: 'Անխել ջրվեժը գտնվում է Կանայմա ազգային պարկում։ Նրա ջրի հիմնական ազատ անկումը մոտ 807 մետր է, իսկ ընդհանուր բարձրությունը՝ մոտ 979 մետր։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Angel-Falls' },
  },
  {
    id: 'most-time-zones',
    category: 'countries',
    question: 'Ո՞ր երկիրն ունի ամենաշատ ժամային գոտիները՝ ներառյալ անդրծովյան տարածքները',
    answer: 'Ֆրանսիան՝ սովորաբար հաշվարկվող 12 ժամային գոտիներով։',
    detail: 'Ֆրանսիայի անդրծովյան տարածքները գտնվում են աշխարհի տարբեր մասերում։ Այդ պատճառով երկրի ժամային գոտիների թիվը գերազանցում է նույնիսկ Ռուսաստանի ցուցանիշը։ Որոշ հաշվարկներում սեզոնային փոփոխությունների պատճառով թիվը կարող է հասնել 13-ի։',
    source: { name: 'Time and Date', url: 'https://www.timeanddate.com/time/zone/france' },
  },
  {
    id: 'largest-landlocked-country',
    category: 'countries',
    question: 'Ո՞րն է աշխարհի ամենամեծ երկիրը, որը ելք չունի դեպի Համաշխարհային օվկիանոս',
    answer: 'Ղազախստանը՝ մոտ 2,72 միլիոն կմ² տարածքով։',
    detail: 'Ղազախստանը գտնվում է Կենտրոնական Ասիայում և մասամբ՝ Եվրոպայում։ Այն սահմանակից է Կասպից ծովին, սակայն Կասպիցը փակ ջրավազան է, ուստի երկիրը համարվում է օվկիանոսային ելք չունեցող պետություն։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Kazakhstan' },
    countryCode: 'KAZ',
  },
  {
    id: 'most-populous-continent',
    category: 'population',
    question: 'Ո՞ր մայրցամաքում է ապրում աշխարհի բնակչության ամենամեծ մասը',
    answer: 'Ասիայում՝ աշխարհի բնակչության կեսից ավելին։',
    detail: 'Ասիան ներառում է բնակչությամբ խոշոր երկրներ, այդ թվում՝ Հնդկաստանը և Չինաստանը։ Տարածաշրջանների բնակչության թվերը փոփոխվում են, սակայն Ասիան շարունակում է մնալ ամենաբնակեցված մայրցամաքը։',
    source: { name: 'ՄԱԿ-ի բնակչության բաժին', url: 'https://population.un.org/wpp/' },
  },
  {
    id: 'least-populous-continent',
    category: 'population',
    question: 'Ո՞ր բնակեցված մայրցամաքն ունի ամենաքիչ բնակչությունը',
    answer: 'Ավստրալիան՝ Օվկիանիայի տարածաշրջանի մաս կազմող մայրցամաքը։',
    detail: 'Եթե դիտարկում ենք մշտապես բնակեցված մայրցամաքները, Ավստրալիան ամենաքիչ բնակչություն ունեցողն է։ Անտարկտիդան չունի մշտական բնակչություն և այս համեմատության մեջ չի ներառվում։',
    source: { name: 'ՄԱԿ-ի բնակչության բաժին', url: 'https://population.un.org/wpp/' },
  },
  {
    id: 'population-billion-milestone',
    category: 'population',
    question: 'Ե՞րբ աշխարհի բնակչությունը հասավ մոտ 8 միլիարդի',
    answer: '2022 թվականի նոյեմբերի 15-ին՝ ՄԱԿ-ի խորհրդանշական հաշվարկով։',
    detail: 'ՄԱԿ-ը 2022 թվականի նոյեմբերի 15-ը հայտարարեց աշխարհի բնակչության 8 միլիարդի հասնելու խորհրդանշական օր։ Դա վիճակագրական գնահատում է, ոչ թե բոլոր մարդկանց ճշգրիտ հաշվառում։',
    source: { name: 'ՄԱԿ', url: 'https://www.un.org/en/dayof8billion' },
    dataYear: 2022,
  },
  {
    id: 'earth-continents',
    category: 'countries',
    question: 'Քանի՞ մայրցամաք են սովորաբար առանձնացնում յոթմայրցամաքային համակարգում',
    answer: 'Յոթ՝ Ասիա, Աֆրիկա, Հյուսիսային Ամերիկա, Հարավային Ամերիկա, Անտարկտիդա, Եվրոպա և Ավստրալիա։',
    detail: 'Մայրցամաքների քանակը կախված է աշխարհագրական դասակարգումից։ Որոշ կրթական համակարգերում Եվրոպան և Ասիան միավորվում են Եվրասիայի մեջ, իսկ որոշներում Ամերիկան դիտարկվում է որպես մեկ մայրցամաք։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/science/continent' },
  },
  {
    id: 'largest-continent',
    category: 'countries',
    question: 'Ո՞րն է աշխարհի ամենամեծ մայրցամաքը',
    answer: 'Ասիան՝ մոտ 44,6 միլիոն կմ² տարածքով։',
    detail: 'Ասիան զբաղեցնում է Երկրի ցամաքային մակերեսի մոտ 30%-ը։ Այն առաջինն է նաև բնակչության թվով և ներառում է կլիմայական ու բնական պայմանների մեծ բազմազանություն։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Asia' },
  },
  {
    id: 'smallest-continent',
    category: 'countries',
    question: 'Ո՞րն է աշխարհի ամենափոքր մայրցամաքը',
    answer: 'Ավստրալիան՝ մոտ 7,7 միլիոն կմ² տարածքով։',
    detail: 'Ավստրալիան ամենափոքր մայրցամաքն է յոթմայրցամաքային համակարգում։ Պետք է տարբերել Ավստրալիա մայրցամաքը Օվկիանիա աշխարհագրական տարածաշրջանից, որն ընդգրկում է նաև բազմաթիվ կղզիներ։',
    source: { name: 'Britannica', url: 'https://www.britannica.com/place/Australia' },
  },
  {
    id: 'earth-circumference',
    category: 'nature',
    question: 'Որքա՞ն է Երկրի հասարակածի երկարությունը',
    answer: 'Մոտ 40 075 կիլոմետր։',
    detail: 'Երկիրը կատարյալ գունդ չէ․ այն փոքր-ինչ սեղմված է բևեռներում։ Հետևաբար հասարակածային շրջագիծը փոքր-ինչ ավելի մեծ է, քան միջօրեականով հաշվվող շրջագիծը։',
    source: { name: 'NASA', url: 'https://science.nasa.gov/earth/facts/' },
  },
]

/** Update population facts from exactly the same estimates used by the map. */
export function withPopulationEstimates(facts: WorldFact[], estimates: Readonly<Record<string, PopulationEstimate | undefined>>): WorldFact[] {
  return facts.map(fact => {
    if (fact.id !== 'most-populous-country') return fact
    const population = countryPopulation('IND', indiaPopulation.value, indiaPopulation.year, estimates)
    return {
      ...fact,
      answer: `Հնդկաստանը՝ մոտ ${Math.round(population.value / 1_000_000).toLocaleString('hy-AM')} միլիոն մարդ՝ ${population.year} թ. գնահատմամբ։`,
      detail: `${population.source.name} աղբյուրի ${population.year} թվականի տվյալներում Հնդկաստանի բնակչությունը գնահատվում է ${population.value.toLocaleString('hy-AM')} մարդ։ Սա տվյալ տարվա գնահատական է․ բնակչության թիվը փոխվում է, իսկ նոր գնահատումները կարող են վերանայվել։`,
      source: population.source, dataYear: population.year,
    }
  })
}
