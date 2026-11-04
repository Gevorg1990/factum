import test from 'node:test'
import assert from 'node:assert/strict'
import { millionaireQuestionPairs } from '../data/factum_millionaire_45.ts'
import { moduleUrl } from './helpers/catalog.mjs'
const { findMillionBookmark, millionBookmarkId } = await import(moduleUrl(new URL('../utils/millionBookmarks.ts', import.meta.url)))
const { createMillionRound, millionTiers } = await import(moduleUrl(new URL('../utils/millionQuestionPool.ts', import.meta.url)))
const allQuestions = millionaireQuestionPairs.flatMap(level => level.flatMap(pair => [pair.primary, pair.replacement]))

test('every level has fifteen complete pairs and all ninety questions are distinct', () => {
  assert.equal(millionaireQuestionPairs.length, 3)
  assert.equal(allQuestions.length, 90)
  assert.equal(new Set(allQuestions.map(item => item.question)).size, 90)
  for (const level of millionaireQuestionPairs) {
    assert.equal(level.length, 15)
    for (const question of level.flatMap(pair => [pair.primary, pair.replacement])) {
      assert.equal(question.answers.length, 4)
      assert.ok(question.answers.every(answer => answer.trim()))
      assert.ok(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 4)
      assert.ok(question.hint.trim())
      assert.ok(question.explanation.trim())
    }
  }
})

test('both variants open from saved items even after answer shuffling', () => {
  for (const question of allQuestions) {
    const reversed = { ...question, answers: [...question.answers].reverse(), correct: 3 - question.correct }
    const id = millionBookmarkId(reversed)
    assert.equal(id, millionBookmarkId(question))
    const saved = findMillionBookmark(id)
    assert.equal(saved.question, question.question)
    assert.equal(saved.answers[saved.correct], question.answers[question.correct])
  }
})

test('either variant may start a numbered slot; the other is reserved and answers stay correct', () => {
  const before = JSON.stringify(millionaireQuestionPairs)
  for (const [levelIndex, level] of millionTiers.entries()) {
    for (const random of [() => 0, () => .99999]) {
      const { questions, replacements } = createMillionRound(level, random)
      assert.equal(questions.length, 15)
      assert.equal(replacements.length, 15)
      for (let index = 0; index < 15; index++) {
        const { primary, replacement } = millionaireQuestionPairs[levelIndex][index]
        const pair = [primary, replacement]
        assert.deepEqual(new Set([questions[index].question, replacements[index].question]), new Set(pair.map(q => q.question)))
        for (const question of [questions[index], replacements[index]]) {
          const source = pair.find(q => q.question === question.question)
          assert.equal(question.answers[question.correct], source.answers[source.correct])
          assert.deepEqual([...question.answers].sort(), [...source.answers].sort())
        }
      }
    }
    let calls = 0
    const mixed = createMillionRound(level, () => {
      const call = calls++
      return call % 7 === 0 ? (Math.floor(call / 7) % 2 ? .8 : .2) : .4
    })
    assert.ok(mixed.questions.some((q, i) => q.question === millionaireQuestionPairs[levelIndex][i].primary.question))
    assert.ok(mixed.questions.some((q, i) => q.question === millionaireQuestionPairs[levelIndex][i].replacement.question))
  }
  assert.equal(JSON.stringify(millionaireQuestionPairs), before)
})
