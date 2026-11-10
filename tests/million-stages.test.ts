import {test} from 'node:test'
import assert from 'node:assert/strict'
import {millionSlotPairs,millionSlots} from '../shared/millionStages'
test('each numbered question and its swap come from their own bank even with forty candidates per bank',()=>{
 const questions=millionSlots.flatMap(({value:slot})=>Array.from({length:40},(_,id)=>({slot,id:slot+'-'+id})))
 const pairs=millionSlotPairs([...questions].reverse())
 assert.equal(pairs.length,15)
 assert.equal(new Set(pairs.flatMap(pair=>[pair.primary.id,pair.replacement.id])).size,30)
 for(let slot=0;slot<15;slot++){assert.equal(pairs[slot]!.primary.slot,slot);assert.equal(pairs[slot]!.replacement.slot,slot)}
 assert.throws(()=>millionSlotPairs(questions.filter(row=>row.slot!==7||row.id==='7-0')),/8-րդ/)
})
