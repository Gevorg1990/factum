import test from 'node:test'
import assert from 'node:assert/strict'
import {moduleUrl} from './helpers/catalog.mjs'
const {atomLessons}=await import(moduleUrl(new URL('../data/chemistry/atomLessons.ts',import.meta.url)))
test('exactly five Armenian lessons meet the requested 300–500 words with readable sections and scientific sources',()=>{
  assert.deepEqual(atomLessons.map(l=>l.title),['Պրոտոն','Նեյտրոն','Էլեկտրոն','Իզոտոպ','Էլեկտրոնային ամպ'])
  for(const lesson of atomLessons){
    const words=lesson.sections.flatMap(s=>s.paragraphs).join(' ').trim().split(/\s+/u).length
    assert.ok(words>=300&&words<=500,`${lesson.title}: ${words} words`)
    assert.ok(lesson.sections.length>=5)
    assert.ok(lesson.sections.every(s=>s.title&&s.paragraphs.every(p=>p.length>100)))
    assert.ok(lesson.sources.length>=3)
    assert.ok(lesson.sources.every(s=>s.title&&new URL(s.url).protocol==='https:'))
  }
})
