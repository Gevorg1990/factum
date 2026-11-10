import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('speech resolves CMS published biographies without exposing drafts or reviving archived people', () => {
  const result = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const published={id:'cms-person',name:'Փորձնական անձ',isArmenian:true,bio:'Հրապարակված կենսագրություն'};
    const queried=[];
    globalThis.factumDb={content:{findUnique:async query=>{queried.push(query);return query.where.kind_key.key==='cms-person'?{publishedData:published}:{publishedData:null}}}};
    const {biographyPerson}=await import('./server/utils/biographyPerson.ts');
    assert.deepEqual(await biographyPerson('cms-person'),published);
    assert.equal(await biographyPerson('hambardzumyan'),undefined);
    assert.equal(await biographyPerson('draft-person'),undefined);
    assert.equal(await biographyPerson(null),undefined);
    assert.equal(queried.length,3);
    assert.deepEqual(queried[0].select,{publishedData:true});
    published.isArmenian=false;
    assert.equal(await biographyPerson('cms-person'),undefined);
    console.log('ok');
  `], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: 'postgresql://unused:test@localhost/test' }, encoding: 'utf8' })
  assert.equal(result.trim(), 'ok')
})
