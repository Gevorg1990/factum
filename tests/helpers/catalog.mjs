import { readFileSync, existsSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const modules = new Map()

// Resolve the catalog's real module graph after erasing type-only imports.
export function moduleUrl(file) {
  const path = fileURLToPath(file)
  if (modules.has(path)) return modules.get(path)
  if (path.endsWith('.json')) {
    const source = 'export default ' + JSON.stringify(JSON.parse(readFileSync(file, 'utf8')))
    const result = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
    modules.set(path, result)
    return result
  }
  let source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  source = source.replace(/from\s+(['"])(\.[^'"]+)\1/g, (_, quote, specifier) => {
    let target = new URL(specifier, file)
    if (existsSync(target) && statSync(target).isDirectory()) target = new URL('index.ts', new URL(target.href + '/'))
    else if (!existsSync(target)) target = new URL(target.href + '.ts')
    return `from '${moduleUrl(target)}'`
  })
  const result = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
  modules.set(path, result)
  return result
}
export const contentUrl = moduleUrl(new URL('../../data/content.ts', import.meta.url))
