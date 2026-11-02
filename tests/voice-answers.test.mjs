import test from 'node:test'
import assert from 'node:assert/strict'
import { moduleUrl } from './helpers/catalog.mjs'
const { capitalPairs } = await import(moduleUrl(new URL('../data/capitalQuiz.ts', import.meta.url)))
const { formatVoiceTranscript, isVoiceAnswerCorrect } = await import(moduleUrl(new URL('../utils/voiceQuiz.ts', import.meta.url)))
const { isCapitalAnswerCorrect } = await import(moduleUrl(new URL('../utils/capitalQuiz.ts', import.meta.url)))
const { symbolSpeechAliases } = await import(moduleUrl(new URL('../utils/elementQuiz.ts', import.meta.url)))
const { periodicElements } = await import(moduleUrl(new URL('../data/periodicTable.ts', import.meta.url)))
const capitals = capitalPairs.map(pair => ({ expected: pair.capital, aliases: pair.capitalAliases }))
const armenia = capitalPairs.find(pair => pair.countryCode === 'ARM')
const yerevan = { expected: armenia.capital, aliases: armenia.capitalAliases }
test('Armenian articles and spoken copulas accept the full city name', () => {
  const italy = capitalPairs.find(pair => pair.capital === 'Հռոմ')
  assert.ok(italy)
  const rome = { expected: italy.capital, aliases: italy.capitalAliases }
  for (const transcript of ['Հռոմ', 'Հռոմը', 'հռոմնա', 'Հռոմն է։', 'Հռոմ է', 'Հռոմ ա', 'Հռոմը՝', 'Հռոմը է', 'Հռոմում', 'Հռոմից', 'Հռոմ չէ', 'Հռոմնան', 'Romea']) {
    assert.equal(isVoiceAnswerCorrect(rome, transcript), true, transcript)
    assert.equal(isCapitalAnswerCorrect({ pair: italy, direction: 'capital' }, transcript), true, transcript)
    assert.equal(formatVoiceTranscript(transcript, capitals, 'hy-AM'), 'Հռոմ', transcript)
  }
  for (const transcript of ['Փարիզը', 'Երևանն է', 'Հռո', '']) {
    assert.equal(isVoiceAnswerCorrect(rome, transcript), false, transcript)
    assert.equal(isCapitalAnswerCorrect({ pair: italy, direction: 'capital' }, transcript), false, transcript)
  }
  assert.equal(formatVoiceTranscript('Փարիզն է', capitals, 'hy-AM'), 'Փարիզ')
  assert.equal(isVoiceAnswerCorrect(rome, formatVoiceTranscript('Փարիզն է', capitals, 'hy-AM')), false)
  assert.equal(formatVoiceTranscript('Հռոմը', capitals, 'en-US'), 'Հռոմը')
})
test('Armenian country endings are accepted without changing chemical symbols', () => {
  assert.equal(isCapitalAnswerCorrect({ pair: armenia, direction: 'country' }, 'Հայաստանն է'), true)
  assert.equal(isVoiceAnswerCorrect({ expected: 'Հայաստան', aliases: ['Armenia'] }, 'Հայաստաննա'), true)
  assert.equal(isVoiceAnswerCorrect({ expected: 'K', aliases: ['կ'] }, 'կնա'), false)
})
test('Erevan, Yerevan and Armenian spelling are accepted and displayed as Երևան', () => {
  for (const transcript of ['Erevan', 'erevan.', 'YEREVAN', ' Երևան ', 'Երեվան']) {
    assert.equal(formatVoiceTranscript(transcript, capitals, 'hy-AM'), 'Երևան')
    assert.equal(isVoiceAnswerCorrect(yerevan, transcript), true)
    assert.equal(isCapitalAnswerCorrect({ pair: armenia, direction: 'capital' }, transcript), true)
  }
})
test('a recognized wrong city stays wrong and unknown words are not guessed', () => {
  assert.equal(formatVoiceTranscript('Paris', capitals, 'hy-AM'), 'Փարիզ')
  assert.equal(isVoiceAnswerCorrect(yerevan, formatVoiceTranscript('Paris', capitals, 'hy-AM')), false)
  assert.equal(formatVoiceTranscript('everyone', capitals, 'hy-AM'), 'everyone')
  assert.equal(isVoiceAnswerCorrect(yerevan, 'everyone'), false)
  assert.equal(formatVoiceTranscript('', capitals, 'hy-AM'), '')
})
test('English mode preserves English text', () => {
  assert.equal(formatVoiceTranscript('Yerevan', capitals, 'en-US'), 'Yerevan')
})
test('countries and chemical symbols retain their correct canonical form', () => {
  const countries = capitalPairs.map(pair => ({ expected: pair.country, aliases: pair.countryAliases }))
  assert.equal(formatVoiceTranscript('Armenia', countries, 'hy-AM'), 'Հայաստան')
  const iron = { expected: 'Fe', aliases: symbolSpeechAliases('Fe') }
  assert.equal(formatVoiceTranscript('էֆ ի', [iron], 'hy-AM'), 'Fe')
  assert.equal(isVoiceAnswerCorrect(iron, 'էֆ ի'), true)
})
test('spoken կ is accepted as K when asked for the symbol, while name questions still require Կալիում', () => {
  const symbols = periodicElements.map(element => ({ expected: element.symbol, aliases: symbolSpeechAliases(element.symbol) }))
  const potassium = symbols.find(candidate => candidate.expected === 'K')
  for (const transcript of ['կ', 'Կ', 'կը', 'կա', 'քեյ', 'K', 'k']) {
    assert.equal(formatVoiceTranscript(transcript, symbols, 'hy-AM'), 'K')
    assert.equal(isVoiceAnswerCorrect(potassium, transcript), true)
  }
  assert.equal(isVoiceAnswerCorrect({ expected: 'Կալիում', aliases: ['Potassium'] }, 'կ'), false)
  assert.equal(isVoiceAnswerCorrect(potassium, 'ն'), false)
})
test('Latin transcriptions of Armenian element names become canonical Armenian names', () => {
  const names = periodicElements.map(element => ({ expected: element.name, aliases: [element.nameEn] }))
  for (const [transcript, expected] of [['Voski', 'Ոսկի'], ['voski.', 'Ոսկի'], ['Oski', 'Ոսկի'], ['Yerkat', 'Երկաթ'], ['Erkat', 'Երկաթ'], ['Kalium', 'Կալիում'], ['Gold', 'Ոսկի']]) {
    const displayed = formatVoiceTranscript(transcript, names, 'hy-AM')
    assert.equal(displayed, expected)
    assert.equal(isVoiceAnswerCorrect(names.find(item => item.expected === expected), transcript), true)
  }
  const gold = names.find(item => item.expected === 'Ոսկի')
  assert.equal(isVoiceAnswerCorrect(gold, 'Kalium'), false)
  assert.equal(isVoiceAnswerCorrect(gold, 'Au'), false)
})
test('chemical symbols remain Latin even when their letters are spoken in Armenian', () => {
  const symbols = periodicElements.map(element => ({ expected: element.symbol, aliases: symbolSpeechAliases(element.symbol) }))
  for (const [spoken, expected] of [['կ', 'K'], ['էյ յու', 'Au'], ['էֆ ի', 'Fe'], ['Au', 'Au'], ['fe', 'Fe']]) {
    assert.equal(formatVoiceTranscript(spoken, symbols, 'hy-AM'), expected)
  }
  assert.equal(formatVoiceTranscript('Voski', symbols, 'hy-AM'), 'Voski')
  assert.equal(isVoiceAnswerCorrect(symbols.find(item => item.expected === 'Au'), 'Voski'), false)
})

test('a country name anywhere in a phrase is accepted without a filler word list', () => {
  const portugal = capitalPairs.find(pair => pair.countryCode === 'PRT')
  assert.ok(portugal)
  const question = { expected: portugal.country, aliases: portugal.countryAliases }
  const countries = capitalPairs.map(pair => ({ expected: pair.country, aliases: pair.countryAliases }))
  for (const transcript of ['պորտուգալիանա երևի', 'Պորտուգալիան ա, երևի։', 'Երևի Պորտուգալիան է', 'Երևի թե Պորտուգալիա', 'Պորտուգալիա հավանաբար', 'կարող ա Պորտուգալիան լինի', 'հնարավոր ա Պորտուգալիա', 'իմ պատասխանը Պորտուգալիա է', 'Պորտուգալիա չէ երևի', 'Պորտուգալիա կամ Իսպանիա', 'պորտուգալիացին']) {
    assert.equal(isVoiceAnswerCorrect(question, transcript), true, transcript)
    assert.equal(isCapitalAnswerCorrect({ pair: portugal, direction: 'country' }, transcript), true, transcript)
    assert.equal(formatVoiceTranscript(transcript, countries, 'hy-AM'), transcript === 'Պորտուգալիա կամ Իսպանիա' ? transcript : portugal.country, transcript)
  }
  for (const transcript of ['երևի Իսպանիա', 'երևի', 'կարող ա', 'հնարավոր ա']) {
    assert.equal(isVoiceAnswerCorrect(question, transcript), false, transcript)
  }
  assert.equal(formatVoiceTranscript('Իսպանիա երևի', countries, 'hy-AM'), 'Իսպանիա')
  assert.equal(formatVoiceTranscript('անհայտ երևի', countries, 'hy-AM'), 'անհայտ երևի')
})
