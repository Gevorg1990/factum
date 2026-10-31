import sourceElements from './periodicElements.json'

export const elementFamilies = {
  nonmetal: { name: 'Այլ ոչ մետաղներ', color: '#8cceaf', description: 'Ոչ մետաղների հատկությունները բազմազան են։ Այս խմբում են նաև կյանքի համար կարևոր ջրածինը, ածխածինը, ազոտն ու թթվածինը։' },
  alkali: { name: 'Ալկալիական մետաղներ', color: '#eda5a1', description: 'Առաջին խմբի այս մետաղները հեշտությամբ կորցնում են մեկ էլեկտրոն։ Շատ ակտիվ են և բնության մեջ հիմնականում հանդիպում են միացությունների ձևով։' },
  alkaline: { name: 'Հողալկալիական մետաղներ', color: '#e2c58a', description: 'Երկրորդ խմբի մետաղներն արտաքին շերտում ունեն երկու էլեկտրոն և իրենց միացություններում սովորաբար ունեն +2 օքսիդացման աստիճան։' },
  transition: { name: 'Անցումային մետաղներ', color: '#9bbce8', description: 'Աղյուսակի կենտրոնական հատվածի մետաղներից շատերը լավ հաղորդիչներ են։ Դրանց միացությունները հաճախ ունեն տարբեր օքսիդացման աստիճաններ։' },
  postTransition: { name: 'Հետանցումային մետաղներ', color: '#a9b3db', description: 'Այս դասակարգմամբ խմբավորված մետաղները գտնվում են անցումային մետաղներից աջ։ Նրանցից են ալյումինը, անագն ու կապարը։' },
  metalloid: { name: 'Կիսամետաղներ', color: '#b9c997', description: 'Կիսամետաղներն ունեն մետաղներին և ոչ մետաղներին բնորոշ հատկություններ։ Սիլիցիումն ու գերմանիումը կարևոր կիսահաղորդիչներ են։' },
  halogen: { name: 'Հալոգեններ', color: '#87cfd2', description: '17-րդ խմբի տարրերն են։ Բազմաթիվ մետաղների հետ առաջացնում են աղեր․ օրինակ՝ նատրիումի քլորիդը։' },
  noble: { name: 'Ազնիվ գազեր', color: '#c8ace5', description: '18-րդ խմբի տարրերն են։ Թեթև ներկայացուցիչներն ունեն լրացված արտաքին էլեկտրոնային շերտ և սովորաբար ցածր քիմիական ակտիվություն։' },
  lanthanide: { name: 'Լանթանոիդներ', color: '#d8acd0', description: 'Այստեղ առանձին շարքով ցուցադրված են 57–71 ատոմային համարներով տարրերը։ Դրանք պատկանում են 6-րդ պարբերությանը։' },
  actinide: { name: 'Ակտինոիդներ', color: '#c4a68d', description: 'Այստեղ առանձին շարքով ցուցադրված են 89–103 ատոմային համարներով տարրերը։ Բոլորը ռադիոակտիվ են և պատկանում են 7-րդ պարբերությանը։' },
} as const
export type ElementFamily = keyof typeof elementFamilies

const armenianNames = 'Ջրածին|Հելիում|Լիթիում|Բերիլիում|Բոր|Ածխածին|Ազոտ|Թթվածին|Ֆտոր|Նեոն|Նատրիում|Մագնեզիում|Ալյումին|Սիլիցիում|Ֆոսֆոր|Ծծումբ|Քլոր|Արգոն|Կալիում|Կալցիում|Սկանդիում|Տիտան|Վանադիում|Քրոմ|Մանգան|Երկաթ|Կոբալտ|Նիկել|Պղինձ|Ցինկ|Գալիում|Գերմանիում|Արսեն|Սելեն|Բրոմ|Կրիպտոն|Ռուբիդիում|Ստրոնցիում|Իտրիում|Ցիրկոնիում|Նիոբիում|Մոլիբդեն|Տեխնեցիում|Ռութենիում|Ռոդիում|Պալադիում|Արծաթ|Կադմիում|Ինդիում|Անագ|Ծարիր|Տելուր|Յոդ|Քսենոն|Ցեզիում|Բարիում|Լանթան|Ցերիում|Պրազեոդիմ|Նեոդիմ|Պրոմեթիում|Սամարիում|Եվրոպիում|Գադոլինիում|Տերբիում|Դիսպրոզիում|Հոլմիում|Էրբիում|Թուլիում|Իտերբիում|Լյուտեցիում|Հաֆնիում|Տանտալ|Վոլֆրամ|Ռենիում|Օսմիում|Իրիդիում|Պլատին|Ոսկի|Սնդիկ|Թալիում|Կապար|Բիսմութ|Պոլոնիում|Աստատ|Ռադոն|Ֆրանսիում|Ռադիում|Ակտինիում|Թորիում|Պրոտակտինիում|Ուրան|Նեպտունիում|Պլուտոնիում|Ամերիցիում|Կյուրիում|Բերկլիում|Կալիֆոռնիում|Էյնշտեյնիում|Ֆերմիում|Մենդելևիում|Նոբելիում|Լոուրենսիում|Ռեզերֆորդիում|Դուբնիում|Սիբորգիում|Բորիում|Հասիում|Մայտներիում|Դարմշտադտիում|Ռենտգենիում|Կոպեռնիցիում|Նիհոնիում|Ֆլերովիում|Մոսկովիում|Լիվերմորիում|Թենեսին|Օգանեսոն'.split('|')

const stateNames: Record<string, string> = {
  Gas: 'Գազային', Solid: 'Պինդ', Liquid: 'Հեղուկ',
  'Expected to be a Solid': 'Պինդ՝ կանխատեսված',
  'Expected to be a Gas': 'Գազային՝ կանխատեսված',
}

export function elementPosition(number: number): { column: number; row: number; period: number; group: number | null } {
  if (number >= 57 && number <= 71) return { column: number - 53, row: 9, period: 6, group: null }
  if (number >= 89 && number <= 103) return { column: number - 85, row: 10, period: 7, group: null }
  const period = number <= 2 ? 1 : number <= 10 ? 2 : number <= 18 ? 3 : number <= 36 ? 4 : number <= 54 ? 5 : number <= 86 ? 6 : 7
  let group: number
  if (period === 1) group = number === 1 ? 1 : 18
  else if (period === 2 || period === 3) {
    const offset = number - (period === 2 ? 2 : 10)
    group = offset <= 2 ? offset : offset + 10
  } else if (period === 4) group = number - 18
  else if (period === 5) group = number - 36
  else if (period === 6) group = number <= 56 ? number - 54 : number - 68
  else group = number <= 88 ? number - 86 : number - 100
  return { column: group, row: period, period, group }
}

// Numerical properties and classifications: PubChem PUG REST periodic table.
// Snapshot: 2026-10-28. Retain source strings and prediction labels, rather than
// substituting missing measurements with inferred values.
export const periodicElements = sourceElements.map(element => ({
  ...element,
  name: armenianNames[element.number - 1]!,
  family: element.family as ElementFamily,
  stateLabel: stateNames[element.state] || 'Տվյալ չկա',
  electronConfiguration: element.electronConfiguration.replace(' (predicted)', ''),
  configurationPredicted: element.electronConfiguration.includes('(predicted)'),
  ...elementPosition(element.number),
}))
export type PeriodicElement = typeof periodicElements[number]
export const periodicSource = 'https://pubchem.ncbi.nlm.nih.gov/periodic-table'
