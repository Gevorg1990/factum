import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {articleVideoSource} from '../shared/articleVideo'
import {newContent,editorRecord,prepareContent} from '../shared/cmsEditor'
import {parseContent} from '../shared/cms'
const require=createRequire(import.meta.url)
const {parse,compileScript}=require('@vue/compiler-sfc')
const ts=require('typescript')
const vue=require('vue')
const {renderToString}=require('@vue/server-renderer')

test('video links normalize trusted providers and reject executable or spoofed URLs',()=>{
 assert.equal(articleVideoSource('https://youtu.be/dQw4w9WgXcQ')?.src,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1')
 assert.equal(articleVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')?.kind,'embed')
 assert.equal(articleVideoSource('https://vimeo.com/123456')?.src,'https://player.vimeo.com/video/123456?autoplay=1')
 assert.equal(articleVideoSource('https://cdn.example.org/video.mp4?version=1')?.kind,'file')
 assert.equal(articleVideoSource('/videos/lesson.webm')?.kind,'file')
 for(const url of ['javascript:alert(1)','http://example.org/a.mp4','https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','//evil.test/a.mp4','/videos/../secret.mp4','https://example.org/page','https://user:password@example.org/video.mp4'])assert.equal(articleVideoSource(url),null,url)
})
test('new and existing CMS articles save and remove videos without changing their addresses',()=>{
 const form=newContent('ARTICLE');form.title='Հարց';Object.assign(form.data,{subject:'physics',answer:'Պատասխան',detail:'Բացատրություն',video:'https://vimeo.com/123456'})
 const published=parseContent(prepareContent(form));assert.equal(published.data.video,form.data.video)
 const edited=editorRecord({...published,id:'existing',version:3});edited.data.video=''
 assert.equal(parseContent(prepareContent(edited)).data.video,'');assert.equal(edited.key,form.key)
 edited.data.video='javascript:alert(1)';assert.throws(()=>parseContent(prepareContent(edited)))
})
test('article initial HTML has a play button and no video or iframe request',async()=>{
 const file=new URL('../components/ArticleVideo.vue',import.meta.url)
 const {descriptor}=parse(readFileSync(file,'utf8'))
 const compiled=compileScript(descriptor,{id:'article-video-test',inlineTemplate:true}).content
 const js=ts.transpileModule(compiled,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const context={exports:{},require:(path:string)=>path==='~/shared/articleVideo'?{articleVideoSource}:require(path),...vue}
 runInNewContext(js,context)
 for(const src of ['https://youtu.be/dQw4w9WgXcQ','https://cdn.example.org/lesson.mp4']){
  const html=await renderToString(vue.createSSRApp((context.exports as any).default,{src,title:'Դաս'}))
  assert.match(html,/Դիտել վիդեոն/);assert.doesNotMatch(html,/<video|<iframe|src="https:\/\/(?:cdn|www.youtube)/)
 }
})
