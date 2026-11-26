import {Prisma} from '@prisma/client'
import {firstGalleryBranchSlot,firstGalleryFrontSlot,galleryFirstFrontRoom,galleryRoomForSlot,lastGalleryBranchSlot} from '../../utils/art/galleryLayout'
import {galleryBranch,galleryBranchId} from '../../utils/art/galleryBranches'
import {db} from './db'

export async function publishedGalleryLayout(){
  // Each generation of side-wall slots is ordered internally, with their ranges interleaved in the rooms.
  const slot=Prisma.sql`(("publishedData"->>'gallerySlot')::integer)`
  const published=Prisma.sql`kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL AND "publishedData" ? 'gallerySlot'`
  const [last]=await db.$queryRaw<{legacy:number|null;extended:number|null;branches:number[]}[]>(Prisma.sql`
    SELECT
      (SELECT ${slot} FROM "Content" WHERE ${published} AND ${slot} < 600 ORDER BY ${slot} DESC LIMIT 1) AS legacy,
      (SELECT ${slot} FROM "Content" WHERE ${published} AND ${slot} >= 600 AND ${slot} < ${firstGalleryFrontSlot} ORDER BY ${slot} DESC LIMIT 1) AS extended,
      ARRAY(SELECT DISTINCT ((${slot}-${firstGalleryBranchSlot})/8)::integer FROM "Content" WHERE ${published} AND ${slot} BETWEEN ${firstGalleryBranchSlot} AND ${lastGalleryBranchSlot}) AS branches
  `)
  const branches=(last?.branches??[]).map(index=>galleryBranchId(1,'north')+index).sort((a,b)=>a-b)
  const frontRoom=Math.max(galleryFirstFrontRoom,...branches.map(room=>galleryBranch(room)!.parent),
    ...[last?.legacy,last?.extended].flatMap(value=>value==null?[]:[galleryRoomForSlot(value)]))
  return {frontRoom,branches}
}
