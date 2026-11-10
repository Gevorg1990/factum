import {test} from 'node:test'
import assert from 'node:assert/strict'
import {millionStagePairs,millionStages} from '../shared/millionStages'
test('a round reserves five questions and five distinct swaps from each selected phase',()=>{
 const questions=millionStages.flatMap(stage=>Array.from({length:10},(_,id)=>({stage:stage.value,id:stage.value+id})))
 const pairs=millionStagePairs([...questions].reverse())
 assert.equal(pairs.length,15)
 assert.equal(new Set(pairs.flatMap(pair=>[pair.primary.id,pair.replacement.id])).size,30)
 for(let i=0;i<15;i++){assert.equal(pairs[i]!.primary.stage,millionStages[Math.floor(i/5)]!.value);assert.equal(pairs[i]!.replacement.stage,pairs[i]!.primary.stage)}
 assert.throws(()=>millionStagePairs(questions.filter(row=>row.id!=='middle0')),/6–10/)
})
