export const millionStages = [
  {value:'first',label:'1–5-րդ հարցեր',description:'Խաղի սկիզբ'},
  {value:'middle',label:'6–10-րդ հարցեր',description:'Միջին փուլ'},
  {value:'final',label:'11–15-րդ հարցեր',description:'Վերջնական փուլ'},
] as const
export type MillionStage = typeof millionStages[number]['value']
export function millionStageOf(question:{stage?:unknown;slot?:unknown}):MillionStage {
  if(millionStages.some(stage=>stage.value===question.stage))return question.stage as MillionStage
  const slot=typeof question.slot==='number'?question.slot:0
  return slot>=10?'final':slot>=5?'middle':'first'
}
export function millionStagePairs<T extends {stage?:unknown;slot?:unknown}>(items:T[]) {
  return millionStages.flatMap(stage=>{
    const pool=items.filter(item=>millionStageOf(item)===stage.value)
    if(pool.length<10)throw new Error(`${stage.label} փուլի համար անհրաժեշտ է առնվազն 10 հրապարակված հարց՝ 5 հիմնական և 5 փոխարինող։`)
    return Array.from({length:5},(_,i)=>({primary:pool[i*2]!,replacement:pool[i*2+1]!}))
  })
}
