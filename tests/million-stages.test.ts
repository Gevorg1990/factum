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

test('all three questions and every allowed replacement are equally reachable, without self replacement',async()=>{
 const {distinctQuestionIndices}=await import('../shared/millionStages')
 const pairs:string[]=[]
 for(let first=0;first<3;first++)for(let second=0;second<2;second++){
  const draws=[first,second],limits:number[]=[]
  const pair=distinctQuestionIndices(3,limit=>{limits.push(limit);return draws.shift()!})
  assert.deepEqual(limits,[3,2]);assert.notEqual(pair[0],pair[1]);pairs.push(pair.join(','))
 }
 assert.equal(new Set(pairs).size,6)
 for(let question=0;question<3;question++)assert.equal(pairs.filter(pair=>pair.startsWith(question+',')).length,2)
 for(const size of [2,40,1000])for(let first=0;first<size;first++){
  const draws=[first,size-2];const pair=distinctQuestionIndices(size,()=>draws.shift()!)
  assert.equal(pair[0],first);assert.ok(pair[1]!>=0&&pair[1]!<size);assert.notEqual(pair[0],pair[1])
 }
 assert.deepEqual(distinctQuestionIndices(0),[]);assert.deepEqual(distinctQuestionIndices(1,()=>0),[0])
})
