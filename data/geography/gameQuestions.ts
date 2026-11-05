import {capitalPairs} from '../capitalQuiz'
export type GeographyGame='guess'|'map'|'larger'
export const geographyGames=[{id:'guess',title:'Գուշակիր երկիրը',description:'Ճանաչիր երկիրը դրոշով։'},{id:'map',title:'Գտիր քարտեզի վրա',description:'Ընտրիր պահանջվող երկիրը հենց երկրագնդի վրա։'},{id:'larger',title:'Ո՞րն է ավելի մեծ',description:'Համեմատիր տարածքն ու նույն տարվա բնակչությունը։'}] as const
// Stable reference bank, separate from UI. A session samples without replacement.
export const geographyCountryQuestions=capitalPairs
