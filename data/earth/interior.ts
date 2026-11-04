/** PREM Table I, Dziewonski & Anderson (1981); radii/depths in km. */
export const EARTH_RADIUS = 6371
export const earthSources = [
  { name: 'USGS · Երկրի կառուցվածքը', url: 'https://pubs.usgs.gov/gip/dynamic/inside.html' },
  { name: 'USGS · Թիկնոցը պինդ է', url: 'https://www.usgs.gov/faqs/are-tectonic-plates-floating-magma' },
  { name: 'PREM · սկզբնաղբյուր, աղյուսակ I', url: 'https://lweb.cfa.harvard.edu/~lzeng/papers/PREM.pdf' },
  { name: 'EarthScope · PREM', url: 'https://ds.iris.edu/ds/products/emc-prem/' },
  { name: 'Alberta Geological Survey · ջերմաստիճան', url: 'https://ags.aer.ca/our-science/geothermal-energy/about-geothermal-energy-renewable-resource' },
  { name: 'McDonough · ջերմային գնահատումներ, էջ 11', url: 'https://indico.fnal.gov/event/53004/contributions/245228/attachments/158242/207568/MMTE_30July-McDonough.pdf' },
] as const
export const earthLayers = [
  { id: 'crust', name: 'Երկրակեղև', top: 0, bottom: 24.4, color: '#72bdc7', state: 'Պինդ', composition: 'Սիլիկատային ապարներ՝ մայրցամաքային գրանիտներից մինչև օվկիանոսային բազալտներ։', explanation: 'Երկրի բարակ արտաքին քարային շերտն է։ Իրական հաստությունը տեղից տեղ տարբերվում է։ Այստեղ PREM-ի միջին երկրակեղևն ու վերին 3 կմ ջրային շերտը միավորված են արտաքին պատյանի մեջ․ դա որևէ կոնկրետ վայրի հորատանցք չէ։', temperature: 'Մակերևույթի պայմաններից մինչև մոտ 900 °C՝ ստորին սահմանի համար ուսուցողական գնահատմամբ։' },
  { id: 'mantle', name: 'Թիկնոց', top: 24.4, bottom: 2891, color: '#de7953', state: 'Հիմնականում պինդ', composition: 'Մագնեզիումով ու երկաթով հարուստ սիլիկատներ։ Հանքային կառուցվածքները փոխվում են ճնշման աճին զուգընթաց։', explanation: 'Թիկնոցը համատարած մագմայի օվկիանոս չէ։ Նրա պինդ ապարները երկրաբանական երկար ժամանակում կարող են դանդաղ հոսել։ Ջերմության փոխանցումն ու այդ շարժումները կապված են սալերի տեկտոնիկայի հետ։', temperature: 'Մոտ 900–4000 °C՝ այս մոտավոր պրոֆիլում․ հատկապես սահմանի մոտ գնահատումները տարբերվում են։' },
  { id: 'outer-core', name: 'Արտաքին միջուկ', top: 2891, bottom: 5149.5, color: '#f8b64c', state: 'Հեղուկ', composition: 'Հիմնականում երկաթի հեղուկ համաձուլվածք՝ նիկելով և ավելի թեթև տարրերով։ Ճշգրիտ բաղադրությունը հետազոտվում է։', explanation: 'Հեղուկ մետաղի շարժումը Երկրի պտույտի հետ միասին պահպանում է Երկրի հիմնական մագնիսական դաշտը։ Սեյսմիկ S ալիքներն այս հեղուկ շերտով չեն տարածվում։', temperature: 'Հազարավոր աստիճաններ․ միջուկի վերին սահմանից դեպի ներքին միջուկ տաքանում է։ Գրաֆիկում տրված է մոտավոր միջակայք։' },
  { id: 'inner-core', name: 'Ներքին միջուկ', top: 5149.5, bottom: 6371, color: '#fff0b3', state: 'Պինդ', composition: 'Հիմնականում երկաթ՝ նիկելի և փոքր քանակով այլ տարրերի հետ։', explanation: 'Թեև այստեղ շատ շոգ է, հսկայական ճնշումը նպաստում է երկաթի պինդ վիճակին։ Կենտրոնում ճնշումը մոտ 364 ԳՊա է՝ PREM-ի հիդրոստատիկ մոդելով։', temperature: 'Մոտ 4700–6700 °C՝ ներքին միջուկի սահմանի լայն գնահատումների կարգով։ Կենտրոնի իրական ջերմաստիճանը ճշգրիտ հայտնի չէ։' },
] as const
export type EarthLayerId = typeof earthLayers[number]['id']
/** Chosen educational anchors, NOT PREM temperatures or a measured global geotherm.
 * AGS: crust base ~900 C, CMB ~4000 C, core >5500 C.
 * McDonough (2022), slide 11: 200/410/660/2800 km and core bounds in K;
 * convert K→C. At the centre hold the ICB envelope: no invented centre measurement.
 */
export const temperatureAnchors = [
  { depth: 0, low: 15, high: 15 },
  { depth: 24.4, low: 900, high: 900 },
  { depth: 200, low: 1407, high: 1487 },
  { depth: 410, low: 1547, high: 1627 },
  { depth: 660, low: 1622, high: 1702 },
  { depth: 2800, low: 2257, high: 2377 },
  { depth: 2891, low: 3227, high: 4227 },
  { depth: 5149.5, low: 4727, high: 6727 },
  { depth: 6371, low: 4727, high: 6727 },
] as const
