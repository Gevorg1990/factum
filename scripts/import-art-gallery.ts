import {PrismaClient, Prisma} from '@prisma/client'
import {galleryArtworks} from '../data/art/gallery'
import {artistPortraits} from '../data/art/artistPortraits'
import {artCmsSchema} from '../shared/artCms'

const db=new PrismaClient()
try {
  const deleted=await db.deletedContentKey.findMany({where:{kind:'ARTWORK'},select:{key:true}})
  const excluded=new Set(deleted.map(row=>row.key))
  const records=galleryArtworks.filter(work=>!excluded.has(work.id)).map(work=>{
    const artist=artistPortraits[work.creator]
    const data=artCmsSchema.parse({
      ...work,
      creatorInfo:work.creatorInfo||artist?.bio||'Ստեղծագործության հեղինակի անունը հայտնի չէ։',
      creatorPortrait:work.creatorPortrait||artist?.image||'',
      creatorPortraitCredit:work.creatorPortraitCredit||artist?.credit||'',
      creatorPortraitSource:work.creatorPortraitSource||artist?.source||'',
    })
    return {kind:'ARTWORK' as const,key:work.id,title:work.title,data:data as Prisma.InputJsonValue,publishedData:data as Prisma.InputJsonValue,status:'PUBLISHED' as const,publishedAt:new Date()}
  })
  const result=await db.content.createMany({data:records,skipDuplicates:true})
  console.log(`Պատկերասրահի ${result.count} նոր գործ ներմուծվեց CMS (${records.length} սկզբնական գործ)։`)
} finally {
  await db.$disconnect()
}
