import {Prisma} from '@prisma/client'
import {visibleGalleryArtworks} from '../../data/art/gallery'
import {galleryHiddenSculptureIds} from '../../utils/art/galleryLayout'
import type {SearchRecord} from '../../utils/searchRecords'
import {db} from './db'

type ArtworkMatch={id:string;title:string;originalTitle:string;creator:string;date:string}
const subject={name:'Պատկերասրահ',url:'/art'}

export function escapeGallerySearch(value:string){
  return value.replace(/[\\%_]/g,'\\$&')
}

function galleryArtworkSearchRecord(work:ArtworkMatch):SearchRecord{
  return {
    title:work.title,description:[work.creator,work.date,work.originalTitle].filter(Boolean).join(' · '),
    url:'/art?artwork='+encodeURIComponent(work.id),kind:'Պատկերասրահի գործ',subject,
  }
}

function galleryArtistSearchRecord(creator:string):SearchRecord{
  return {
    title:creator,description:'Հեղինակի գործերը պատկերասրահում',
    url:'/art?artist='+encodeURIComponent(creator)+'#gallery-works',kind:'Նկարիչ',subject,
  }
}

export const localGallerySearchRecords=[
  ...new Set(visibleGalleryArtworks.map(work=>work.creator)),
].map(galleryArtistSearchRecord).concat(visibleGalleryArtworks.map(galleryArtworkSearchRecord))

const publicArtworks=Prisma.sql`
  kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
  AND key NOT IN (${Prisma.join(galleryHiddenSculptureIds)})
`
export {publicArtworks}

export async function publishedGallerySearchRecords(query:string,terms:string[]):Promise<SearchRecord[]>{
  const patterns=terms.map(term=>term.length<3
    ? `${escapeGallerySearch(term)}%`
    : `%${escapeGallerySearch(term)}%`)
  if(!patterns.length)return []
  const phrasePrefix=escapeGallerySearch(query)+'%'
  const creatorMatch=Prisma.join(patterns.map(pattern=>Prisma.sql`"publishedData"->>'creator' ILIKE ${pattern} ESCAPE chr(92)`),' OR ')
  const artworkMatch=Prisma.join(patterns.map(pattern=>Prisma.sql`(
    "publishedData"->>'title' ILIKE ${pattern} ESCAPE chr(92)
    OR "publishedData"->>'originalTitle' ILIKE ${pattern} ESCAPE chr(92)
    OR "publishedData"->>'creator' ILIKE ${pattern} ESCAPE chr(92)
  )`),' OR ')
  const [artworks,artists]=await Promise.all([
    db.$queryRaw<ArtworkMatch[]>(Prisma.sql`
      SELECT key AS id, "publishedData"->>'title' AS title, "publishedData"->>'originalTitle' AS "originalTitle",
        "publishedData"->>'creator' AS creator, "publishedData"->>'date' AS date
      FROM "Content" WHERE ${publicArtworks} AND (${artworkMatch})
      ORDER BY (("publishedData"->>'title' ILIKE ${phrasePrefix} ESCAPE chr(92))
        OR ("publishedData"->>'originalTitle' ILIKE ${phrasePrefix} ESCAPE chr(92))) DESC NULLS LAST,
        title, key
      LIMIT 200
    `),
    db.$queryRaw<{creator:string}[]>(Prisma.sql`
      SELECT "publishedData"->>'creator' AS creator
      FROM "Content" WHERE ${publicArtworks} AND (${creatorMatch})
      GROUP BY "publishedData"->>'creator'
      ORDER BY (("publishedData"->>'creator') ILIKE ${phrasePrefix} ESCAPE chr(92)) DESC, creator
      LIMIT 100
    `),
  ])
  return [...artists.map(artist=>galleryArtistSearchRecord(artist.creator)),...artworks.map(galleryArtworkSearchRecord)]
}
