import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseGameResult, gameResultPath, facebookShareUrl, shareableGames } from '../utils/gameResult.ts'

test('each game shares every possible score with a distinct, reversible URL', () => {
  for (const [mode, game] of Object.entries(shareableGames)) {
    for (let score = 0; score <= game.total; score += game.step) {
      const path = gameResultPath(mode, score)
      const result = parseGameResult(...path.split('/').slice(-2))
      assert.equal(result.score, score)
      assert.equal(result.total, game.total)
      const target = new URL(`https://factum.example${path}`)
      const share = new URL(facebookShareUrl(target.href))
      assert.equal(share.origin, 'https://www.facebook.com')
      assert.equal(share.searchParams.get('u'), target.href)
    }
  }
})

test('invalid game names and scores cannot produce a result preview', () => {
  for (const mode of ['unknown', '__proto__', 'constructor']) assert.equal(parseGameResult(mode, '0'), null)
  for (const score of ['-1', '16', '1.5', 'NaN', 'Infinity', '', '01', '1e1', '<script>']) assert.equal(parseGameResult('million', score), null)
  assert.equal(parseGameResult('logic', '6'), null)
  assert.equal(parseGameResult('genius', '11'), null)
  assert.equal(parseGameResult('geography', '50'), null)
  assert.equal(parseGameResult('chemistry', '1001'), null)
  assert.equal(parseGameResult('geography', '300').playPath, '/globe#capital-quiz-title')
  assert.equal(parseGameResult('chemistry', '700').playPath, '/periodic-table#element-quiz-title')
})

test('result preview exposes the score in server-rendered Open Graph metadata', () => {
  const page = readFileSync(new URL('../pages/games/results/[mode]/[score].vue', import.meta.url), 'utf8')
  assert.match(page, /useSeoMeta/)
  assert.match(page, /ogTitle: \(\) => title.value/)
  assert.match(page, /result.value!.score/)
  assert.match(page, /ogUrl: \(\) => url.value/)
})

test('Genius shares each difficulty in its own Facebook result URL', async () => {
  const { parseResultLevel, resultLevels } = await import('../utils/gameResult.ts')
  const urls = new Set()
  for (const level of Object.keys(resultLevels)) {
    const url = new URL(gameResultPath('genius', 10, level), 'https://factum.example')
    assert.equal(parseResultLevel(url.searchParams.get('level')), level)
    assert.equal(new URL(facebookShareUrl(url.href)).searchParams.get('u'), url.href)
    urls.add(url.href)
  }
  assert.equal(urls.size, 3)
  for (const invalid of [undefined, null, '', 'unknown', '__proto__', ['hard']]) {
    assert.equal(parseResultLevel(invalid), null)
  }
  assert.equal(gameResultPath('genius', 10), '/games/results/genius/10')
  assert.equal(gameResultPath('logic', 5, 'hard'), '/games/results/logic/5')
})
