import {test} from 'node:test'
import assert from 'node:assert/strict'
import {audioTime,bookAudioChunks,estimatedBookAudioSeconds,parseBookAudioPosition} from '../utils/library/audio'

test('book speech keeps the complete Armenian text in bounded, ordered requests',()=>{
 const text=Array.from({length:500},(_,i)=>`Նախադասություն ${i+1} ավարտվեց։`).join(' ')
 const chunks=bookAudioChunks(text)
 assert.ok(chunks.length>10)
 assert.ok(chunks[0]!.length<=300)
 assert.ok(chunks.slice(1).every(chunk=>chunk.length<=900))
 assert.equal(chunks.join(' '),text)
 assert.ok(estimatedBookAudioSeconds(chunks)>120)
 assert.equal(estimatedBookAudioSeconds(['մեկ երկու երեք չորս։']),3)
})

test('a saved book audio position survives storage and rejects invalid values',()=>{
 const position={part:12,seconds:37.25,elapsed:3677.25,voice:'female' as const,updatedAt:1234}
 assert.deepEqual(parseBookAudioPosition(JSON.parse(JSON.stringify(position))),position)
 assert.deepEqual(parseBookAudioPosition({part:-1,seconds:Infinity,elapsed:-20,voice:'invalid',updatedAt:NaN}),{part:0,seconds:0,elapsed:0,voice:'male',updatedAt:0})
 assert.deepEqual(parseBookAudioPosition(null),{part:0,seconds:0,elapsed:0,voice:'male',updatedAt:0})
 assert.equal(audioTime(position.elapsed),'1:01:17')
 assert.equal(audioTime(69),'0:01:09')
 assert.equal(audioTime(0),'0:00:00')
})
