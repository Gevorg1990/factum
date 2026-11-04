import { readFileSync, writeFileSync } from 'node:fs'

// Offline import of the NIST ASCII table; the app never downloads isotope data at runtime.
// Usage: node scripts/prepare-atom-isotopes.mjs /path/to/nist-table.html [YYYY-MM-DD]
const input = process.argv[2]
if (!input) throw Error('Supply the downloaded NIST ASCII table HTML')
const html = readFileSync(input, 'utf8')
const pre = html.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1]
if (!pre) throw Error('NIST preformatted table missing')
const elements = {}
let number
for (const raw of pre.replace(/<[^>]+>/g, '').split('\n')) {
  const line = raw.replaceAll('&nbsp;', ' ')
  const start = line.match(/^(\d+)\s+([A-Z][a-z]?)\s+(\d+)\s+/)
  const continuation = line.match(/^\s+(?:[A-Z][a-z]?\s+)?(\d+)\s+/)
  let massNumber
  if (start) {
    number = Number(start[1])
    massNumber = Number(start[3])
    elements[number] = []
  } else if (continuation && number) massNumber = Number(continuation[1])
  else continue
  if (massNumber < number || massNumber > 400) throw Error('Invalid isotope mass number')
  const abundance = line.slice(31, 45).trim().match(/^(0?\.\d+|1)(?:\(|\s|$)/)
  elements[number].push({ massNumber, abundance: abundance ? Number(abundance[1]) : null })
}
if (Object.keys(elements).length !== 118 || !elements[118] || elements[1]?.[0]?.abundance !== .999885) throw Error('Incomplete or unexpected NIST table')
const output = {
  source: {
    url: 'https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ascii=ascii',
    title: 'NIST — Atomic Weights and Isotopic Compositions',
    retrievedOn: process.argv[3] || new Date().toISOString().slice(0, 10),
    coverage: 'Selected isotopes listed in the NIST composition table, not an exhaustive nuclide catalog.',
    abundance: 'Representative isotopic amount fraction where supplied; null means not specified.',
  }, elements,
}
writeFileSync(new URL('../data/chemistry/atomIsotopes.json', import.meta.url), JSON.stringify(output, null, 2) + '\n')
console.log(`Imported 118 elements and ${Object.values(elements).flat().length} selected isotopes`)
