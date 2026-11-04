import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { moduleUrl } from './helpers/catalog.mjs'
const { atomIsotopes, defaultIsotope, electronShells, createAtomModel, atomIsotopeSource } = await import(moduleUrl(new URL('../utils/chemistry/atomModel.ts', import.meta.url)))
const { periodicElements, elementPosition } = await import(moduleUrl(new URL('../data/periodicTable.ts', import.meta.url)))

test('all 118 original elements retain their positions, source numbers and neutral electron counts', () => {
  const original = JSON.parse(readFileSync(new URL('../data/periodicElements.json', import.meta.url), 'utf8'))
  assert.equal(original.length, 118)
  assert.equal(periodicElements.length, 118)
  const cells = new Set()
  for (const [index, element] of periodicElements.entries()) {
    assert.equal(element.number, index + 1)
    assert.equal(element.symbol, original[index].symbol)
    assert.equal(element.atomicMass, original[index].atomicMass)
    const model = createAtomModel(element.number, defaultIsotope(element.number))
    assert.equal(model.protons, element.number)
    assert.equal(model.electrons, element.number)
    assert.equal(model.shells.reduce((sum, shell) => sum + shell.count, 0), element.number)
    for (const shell of model.shells) assert.ok(shell.count > 0 && shell.count <= 2 * shell.number ** 2)
    const position = elementPosition(element.number)
    assert.ok(!cells.has(`${position.column}:${position.row}`))
    cells.add(`${position.column}:${position.row}`)
  }
})

test('selected NIST isotopes have explicit mass numbers and never derive neutrons from atomic weights', () => {
  assert.ok(atomIsotopeSource.url.startsWith('https://physics.nist.gov/'))
  let count = 0
  for (const element of periodicElements) {
    const isotopes = atomIsotopes(element.number)
    assert.ok(isotopes.length)
    assert.equal(new Set(isotopes.map(item => item.massNumber)).size, isotopes.length)
    for (const isotope of isotopes) {
      count++
      assert.ok(Number.isInteger(isotope.massNumber) && isotope.massNumber >= element.number)
      assert.ok(isotope.abundance === null || (isotope.abundance >= 0 && isotope.abundance <= 1))
      assert.equal(createAtomModel(element.number, isotope.massNumber).neutrons, isotope.massNumber - element.number)
    }
  }
  assert.equal(count, 354)
  assert.equal(createAtomModel(1, 1).neutrons, 0)
  assert.equal(createAtomModel(1, 2).neutrons, 1)
  assert.equal(createAtomModel(1, 3).neutrons, 2)
  assert.equal(createAtomModel(26, 54).neutrons, 28)
  assert.equal(createAtomModel(26, 56).neutrons, 30)
  assert.equal(defaultIsotope(26), 56)
  assert.equal(defaultIsotope(92), 238)
  assert.throws(() => createAtomModel(26, 999), /Unlisted isotope/)
  assert.throws(() => createAtomModel(119, 300), /Unlisted isotope/)
})

test('electron shells retain actual configuration exceptions and prediction labels', () => {
  assert.deepEqual(electronShells(24).map(shell => shell.count), [2, 8, 13, 1])
  assert.deepEqual(electronShells(26).map(shell => shell.count), [2, 8, 14, 2])
  assert.deepEqual(electronShells(46).map(shell => shell.count), [2, 8, 18, 18])
  assert.equal(createAtomModel(109, defaultIsotope(109)).configurationPredicted, true)
  assert.equal(createAtomModel(118, 294).configurationPredicted, true)
  assert.equal(createAtomModel(6, 12).configurationPredicted, false)
  assert.throws(() => electronShells(0), /Unknown element/)
})
