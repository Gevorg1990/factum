export const millionSlots = Array.from({length:15},(_,slot)=>({value:slot,label:`${slot+1}-${slot===0?'ին':'րդ'} հարցի բանկ`}))
export function millionSlotOf(question:{slot?:unknown;stage?:unknown}):number {
  if(typeof question.slot==='number'&&Number.isInteger(question.slot)&&question.slot>=0&&question.slot<15)return question.slot
  return question.stage==='final'?10:question.stage==='middle'?5:0
}
export function millionSlotPairs<T extends {slot?:unknown}>(items:T[]) {
  return millionSlots.map(({value:slot})=>{
    const pool=items.filter(item=>item.slot===slot)
    if(pool.length<2)throw new Error(`${slot+1}-րդ հարցի բանկում անհրաժեշտ է առնվազն 2 հրապարակված հարց՝ հիմնական և փոխարինող։`)
    return {primary:pool[0]!,replacement:pool[1]!}
  })
}
