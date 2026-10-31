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
