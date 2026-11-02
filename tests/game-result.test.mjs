import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseGameResult, gameResultPath, facebookShareUrl, shareableGames } from '../utils/gameResult.ts'

test('each game shares every possible score with a distinct, reversible URL', () => {
  for (const [mode, game] of Object.entries(shareableGames)) {
    for (let score = 0; score <= game.total; score++) {
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
})

test('result preview exposes the score in server-rendered Open Graph metadata', () => {
  const page = readFileSync(new URL('../pages/games/results/[mode]/[score].vue', import.meta.url), 'utf8')
  assert.match(page, /useSeoMeta/)
  assert.match(page, /ogTitle: \(\) => title.value/)
  assert.match(page, /result.value!.score/)
  assert.match(page, /ogUrl: \(\) => url.value/)
})
