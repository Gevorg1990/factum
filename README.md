# FACTUM — Nuxt/Vue, Phase 2

Սա նախորդ փաթեթի ուղղված **մշակման տարբերակն** է, ոչ ավարտված հանրագիտարան։

## Mac-ում գործարկել

```bash
cd FACTUM-nuxt-v2
npm install
npm run dev
```

Բացիր http://localhost:3000։ Node.js-ի արդիական LTS տարբերակ է անհրաժեշտ։

## Փոփոխություններ

- Գլխավոր էջի վերնագրերը, կոճակները, որոնումը և բաժինները իրական HTML/Vue տարրեր են. սքրինշոթը որպես ֆոն չի օգտագործվում։
- Լոգոյի նշանը ուղեղի պատկեր է (🧠)։
- Ներքին էջերում՝ մուգ նուրբ գրադիենտային ֆոն, ոչ կրկնվող աստղային պատկեր։
- Երկնքում հայտնվում են պատահական ընկնող աստղեր՝ մոտավորապես 12–21 վայրկյանը մեկ. reduced-motion կարգավորումը հարգվում է։
- Նշանավոր մարդկանց համար փորձ է արվում ստանալ **յուրաքանչյուրի առանձին դիմանկարը** հայերեն Վիքիպեդիայի API-ից։ Ինտերնետի կամ պատկերի բացակայության դեպքում ցուցադրվում է անունով placeholder, ոչ ուրիշ մարդու լուսանկար։ Իրական կայքում պետք է հավաքել ստուգված/լիցենզավորված տեղային լուսանկարներ։
- Հարցերը կարելի է բացել առանձին ընթերցման էջով (`/articles/[id]`)։
- Որոնումը գործում է `/search` էջում՝ նախ տեղային հարցեր, կենսագրություններ, պատմություն, փաստեր, գրքեր, առարկաներ (և CMS հոդվածների վերնագրեր, եթե Directus-ը կարգավորված է)։
- **Միայն զրո արդյունքի դեպքում** հայտնվում է «Ստեղծել AI բացատրություն» կոճակը։ AI հարցումն իրականացվում է միայն սերվերում, API բանալին բրաուզերին չի փոխանցվում։ AI-ն ավտոմատ չի հրապարակում նյութ CMS-ում։

## AI-ի միացում (ընտրովի)

`.env` ֆայլում տեղադրիր `OPENAI_API_KEY=...` (մի հրապարակիր և Git մի ավելացրու)։ Առանց բանալու որոնումը շարունակում է աշխատել, բայց AI-ն ցուցադրում է հստակ բացատրություն, որ կարգավորված չէ։ API օգտագործումը կարող է վճարովի լինել. անհրաժեշտ են սերվերային rate limit, ծախսերի սահմանաչափ և abuse protection նախքան հանրային թողարկումը։

## CMS

Directus + PostgreSQL Docker կազմաձևը պահպանվել է նախորդ տարբերակից։ `/api/search`-ը կարող է որոնել CMS-ի հրապարակված հոդվածների վերնագրերն ու ամփոփումները, բայց CMS արդյունքի համար լիարժեք հոդվածի էջը և ամբողջական ինդեքսավորումը դեռ պետք է ավարտել։

## Սահմանափակումներ

- Նյութերի բազան դեռ ցուցադրական է, հարյուրավոր հարցեր և բոլոր բաժինների խորացված նյութեր չկան։
- Վիքիպեդիայի պատկերները կախված են արտաքին ծառայությունից և կարող են չբեռնվել։
- AI-ն չի գործի առանց API բանալու, և դեռ production-ready չէ։
- Անհրաժեշտ են իրական QA թեստեր, անվտանգություն, սերվերի կարգավորում և բովանդակության ստուգում։
- Գլխավոր էջի Երկիրը այժմ CSS ձևավորում է, ոչ 3D գլոբուս։



## Phase 3 — Visual fidelity
- Rebuilt the homepage as live HTML/Vue components (not a screenshot background).
- Added cropped Earth imagery, responsive header, subject strip, game cards, discovery/history/person columns and stats strip.
- Screenshot reference is a visual target; pixel-perfect identity is not yet verified.
- Run `npm install && npm run dev` and compare at 1280px viewport.


## Phase 4 — թարմացումներ
- Հանրաճանաչ հարցերի չիպերը և նշանավոր մարդկանց քարտը փոխվում են ամեն 60 վայրկյանը մեկ։
- Էջի յուրաքանչյուր վերաբացման ժամանակ ցուցադրվում է պատահական հավաքածու (client-side՝ hydration խնդիրներից խուսափելու համար)։
- Նշանավոր մարդկանց քարտի լուսանկարի տարածքն ընդարձակված է։
- «Այսօր պատմության մեջ» բաժինը ստացել է ուղղահայաց ժամանակագծի նոր ոճ։
- Ժամանակագծի բովանդակությունն այս փուլում դեռ ցուցադրական պատմական իրադարձություններ են, ոչ տվյալ օրվա ավտոմատ հավաքածու։


## Phase 5 — մաքուր նկարներ
Խաղերի քարտերի ֆոնային պատկերներից հեռացվել են բնօրինակ նկարի մեջ եղած տեքստային/կոճակային հատվածները. HTML տեքստն ու կոճակները մնում են միակ շերտը։ Առարկաների պատկերները կտրված են առանց նախկին ստորին պիտակների և եզրագծերի, իսկ աշխարհագրության քարտի պատկերը փոխարինված է լեռնային տեսարանով։ Պատկերների մի մասը դեռ վերամշակված կտրվածքներ են, ոչ բնօրինակ առանձին բարձրորակ նկարներ։


## FACTUM Visual v6
- Home hero artwork is isolated from reference screenshot text; headline and search remain accessible HTML.
- Games use cropped illustration-only assets (`*-art.jpg`), while all copy and buttons are Vue DOM elements.
- Topic cards use art-only images without embedded labels or borders; borders are CSS.
- Featured people and popular questions rotate on refresh and every 60 seconds.
- This is a closer visual implementation, **not a guaranteed pixel-perfect 100% reproduction**; the exact original source artwork and fonts are needed for that.
- CMS, AI generation and payments still require deployment/configuration and are not fully integrated.


## Phase 7 — առանձին բնօրինակ պատկերներ
Օգտագործվել են օգտատիրոջ տրամադրած 15 առանձին, առանց տեքստի պատկերները։
Առարկաների քարտերում օգտագործվում է `object-fit: contain`, որպեսզի նկարի հիմնական հատվածները չկտրվեն։
Խաղերի քարտերում պատկերն ու HTML տեքստը տարբեր շերտեր են, իսկ նկարի եզրը մեղմորեն մարում է։
Նոր նկարները տեղադրված են `public/images/*-art.jpg` և `aurora.jpg` ֆայլերում։


## Phase 8 — նշանավոր մարդկանց պատկերներ

- `public/images/armenian-people/` պանակում պահվում են օգտատիրոջ տրամադրած հայ գործիչների չորս պատկերները։
- Նկարները կապված են Ալբերտ Էյնշտեյնի, Հովհաննես Թումանյանի, Կոմիտասի և Մեսրոպ Մաշտոցի քարտերին։
- Դրանք գեղարվեստական պատկերազարդումներ են, ոչ փաստագրական լուսանկարներ։
- `components/PersonPortrait.vue` կոմպոնենտը նախ ընտրում է տեղային պատկերը։
- Vue/TypeScript/CSS սկզբնական կոդը չի մինիֆիկացվել։


## Phase 9 — հանրագիտարան և discovery-grid

- `pages/subjects/index.vue` — հանրագիտարանի քարտերն օգտագործում են `public/images/*-art.jpg` առանձին նկարները։
- `pages/subjects/[slug].vue` — յուրաքանչյուր առարկայի էջում ավելացվել է նույն նոր նկարով վերնամաս։
- `assets/css/main.css` — ֆայլի վերջում ավելացվել են `encyclopedia-*` և `discovery-grid` կանոնները։
- Լայն էկրանների վրա «Հանրահայտ գիտնականներ» բաժինը ստացել է ավելի մեծ սյունակ և դիմանկար։
- Բոլոր `.vue`, `.ts`, `.css` աղբյուրները պահպանված են ընթեռնելի ձևով, առանց մինիֆիկացման։


## Phase 12 — Discovery Grid ուղղումներ
- «Հետաքրքիր փաստեր»-ը փոխվում է էջը թարմացնելիս և փորձում է չկրկնել նախորդ փաստը նույն բրաուզերի ներդիրում։
- Երեք discovery քարտերը desktop-ում հավասար բարձրություն ունեն՝ CSS Grid + Flexbox։
- Հանված է քարտերի պարտադիր `height: 100%`-ից կախված դիրքավորման խնդիրը։
- Ներքևի վիճակագրական հատվածը մնում է բնական document flow-ում։
- Vue/TypeScript/CSS ֆայլերը չմինիֆիկացված են։

## Կայքի հրապարակում

Vercel-ում՝ ձայնային ընթերցման և որոնման սերվերային գործառույթներով հրապարակելու քայլերը՝ [հրապարակման ուղեցույցում](docs/DEPLOYMENT.md)։

### Globe place search

The globe keeps local country/place matches and uses `/api/geography/search?q=...` automatically after a typing pause (500 ms debounce and at least 1.1 seconds between requests). Photon/OpenStreetMap searches are restricted at the provider and validated again on the server to countries, islands/islets/archipelagos, rocks and reefs. Cities, addresses, schools and other internal points of interest are excluded. Results provide a point marker, place context and source link. The provider does not guarantee every name, language or small feature; ambiguous names return up to six choices. No full worldwide place catalog is shipped to the browser.

The default provider is the public Photon demo, intended for moderate traffic with no availability guarantee. For growing production traffic, point `NUXT_GEOGRAPHY_SEARCH_URL` at a dedicated Photon instance or compatible managed endpoint (base URL without `/api`). See https://github.com/komoot/photon#demo-server. The proxy uses eight-second timeouts, single-flight requests, a bounded 500-query cache, 24-hour positive/5-minute empty-result TTLs, and a one-second per-worker request interval. This local limiter is not a distributed site-wide quota. Configure provider capacity and edge limits for the deployment's expected traffic. The URL is server configuration, never supplied by the user.
