import ffmpegPath from 'ffmpeg-static'
import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
export const maxVideoSourceBytes=25*1024*1024
export const optimizePreviewVideo = (source: Buffer) => encodeVideo(source, true)
export const optimizeArticleVideo = (source: Buffer) => encodeVideo(source, false)
async function encodeVideo(source:Buffer, preview:boolean){
  const executable=ffmpegPath
  if(!executable)throw new Error('Video encoder unavailable')
  if(!source.length||source.length>maxVideoSourceBytes)throw new Error('Invalid source size')
  const format=source.toString('ascii',4,8)==='ftyp'?'mov':source.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))?'matroska':undefined
  if(!format)throw new Error('Unsupported video container')
  const directory=await mkdtemp(join(tmpdir(),'factum-video-'))
  try{
    const input=join(directory,'source'),output=join(directory,'preview.mp4')
    await writeFile(input,source)
    await new Promise<void>((resolve,reject)=>execFile(executable,[
      '-hide_banner','-loglevel','error','-nostdin','-protocol_whitelist','file,pipe','-threads','2','-f',format,'-i',input,
      '-map','0:v:0',...(preview?['-t','8','-an']:['-map','0:a:0?','-c:a','aac','-b:a','96k']),'-sn','-dn','-map_metadata','-1',
      '-vf',`scale=w='min(${preview?960:1280},iw)':h='min(${preview?540:720},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=24,format=yuv420p`,
      '-c:v','libx264','-preset','veryfast','-crf',preview?'28':'26','-maxrate',preview?'900k':'1500k','-bufsize',preview?'1800k':'3000k','-threads','2',
      '-movflags','+faststart','-y',output,
    ],{timeout:preview?35000:45000,maxBuffer:65536},error=>error?reject(new Error('Video conversion failed')):resolve()))
    const video=await readFile(output)
    if(video.length>(preview?3:25)*1024*1024)throw new Error('Video exceeds size limit')
    return video
  }finally{await rm(directory,{recursive:true,force:true})}
}
