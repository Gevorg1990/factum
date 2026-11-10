import ffmpegPath from 'ffmpeg-static'
import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
export const maxVideoSourceBytes=25*1024*1024
export async function optimizePreviewVideo(source:Buffer){
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
      '-map','0:v:0','-t','8','-an','-sn','-dn','-map_metadata','-1',
      '-vf',"scale=w='min(960,iw)':h='min(540,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=24,format=yuv420p",
      '-c:v','libx264','-preset','veryfast','-crf','28','-maxrate','900k','-bufsize','1800k','-threads','2',
      '-movflags','+faststart','-y',output,
    ],{timeout:35000,maxBuffer:65536},error=>error?reject(new Error('Video conversion failed')):resolve()))
    const video=await readFile(output)
    if(video.length>3*1024*1024)throw new Error('Preview exceeds size limit')
    return video
  }finally{await rm(directory,{recursive:true,force:true})}
}
