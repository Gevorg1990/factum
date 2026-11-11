import {test} from 'node:test'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import ffmpeg from 'ffmpeg-static'
import {optimizePreviewVideo} from '../server/utils/previewVideo'
import {categoryMedia} from '../utils/categoryMedia'
import {editorRecord,prepareContent} from '../shared/cmsEditor'
import {parseContent} from '../shared/cms'
const run=promisify(execFile)
test('real uploaded video is resized, shortened, muted, compressed and optimized for fast start',async()=>{
 assert.ok(ffmpeg)
 const dir=await mkdtemp(join(tmpdir(),'factum-video-test-'))
 try{
  const source=join(dir,'source.mp4'),output=join(dir,'preview.mp4')
  await run(ffmpeg!,['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=1280x720:rate=30','-f','lavfi','-i','sine=frequency=440','-t','10','-c:v','libx264','-threads','2','-preset','ultrafast','-c:a','aac','-y',source],{timeout:30000})
  const raw=await readFile(source),optimized=await optimizePreviewVideo(raw)
  assert.ok(optimized.length<raw.length);assert.ok(optimized.length<3*1024*1024)
  assert.ok(optimized.indexOf(Buffer.from('moov'))<optimized.indexOf(Buffer.from('mdat')))
  await writeFile(output,optimized)
  const metadata=await run(ffmpeg!,['-hide_banner','-i',output,'-f','null','-'],{timeout:30000})
  assert.match(metadata.stderr,/960x540/);assert.match(metadata.stderr,/24 fps/);assert.match(metadata.stderr,/Duration: 00:00:08/);assert.doesNotMatch(metadata.stderr,/Audio:/)
 }finally{await rm(dir,{recursive:true,force:true})}
})
test('category media keeps original previews and allows a CMS picture plus optimized video',()=>{
 const old=editorRecord({kind:'CATEGORY',key:'physics',title:'Ֆիզիկա',data:{slug:'physics',name:'Ֆիզիկա'}})
 assert.match(old.data.cardVideo,/Glowing_atom/)
 const category=parseContent(prepareContent({...old,data:{...old.data,image:'/images/my-picture.webp'}}))
 const media=categoryMedia(category.data as any)
 assert.equal(media.poster,'/images/my-picture.webp');assert.match(media.video,/Glowing_atom/)
 const plain=categoryMedia({slug:'custom',image:'/images/custom.webp',cardVideo:''});assert.equal(plain.video,'');assert.equal(plain.image,'/images/custom.webp')
 assert.throws(()=>parseContent({...old,data:{...old.data,cardVideo:'https://example.com/raw.mp4'}}))
})

test('article videos preserve full duration and audio while optimizing delivery',async()=>{
 const {optimizeArticleVideo}=await import('../server/utils/previewVideo')
 assert.ok(ffmpeg)
 const dir=await mkdtemp(join(tmpdir(),'factum-article-video-test-'))
 try{
  const source=join(dir,'source.mp4'),output=join(dir,'article.mp4')
  await run(ffmpeg!,['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=640x360:rate=30','-f','lavfi','-i','sine=frequency=440','-t','10','-c:v','libx264','-threads','2','-preset','ultrafast','-c:a','aac','-y',source],{timeout:30000})
  const optimized=await optimizeArticleVideo(await readFile(source))
  assert.ok(optimized.indexOf(Buffer.from('moov'))<optimized.indexOf(Buffer.from('mdat')))
  await writeFile(output,optimized)
  const metadata=await run(ffmpeg!,['-hide_banner','-i',output,'-f','null','-'],{timeout:30000})
  assert.match(metadata.stderr,/Duration: 00:00:10/)
  assert.match(metadata.stderr,/Audio: aac/)
 }finally{await rm(dir,{recursive:true,force:true})}
})
