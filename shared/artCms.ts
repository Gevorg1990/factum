import {z} from 'zod'

const text=z.string().trim().min(1).max(5000)
const image=z.string().trim().min(1).max(2000).refine(value=>/^\/(?!\/)/.test(value)||/^https:\/\//.test(value),'Ընտրիր կամ վերբեռնիր նկար')
export const artCmsSchema=z.object({
  id:z.string().trim().min(1).max(200),
  title:text,
  originalTitle:z.string().trim().max(500).default(''),
  creator:text,
  creatorInfo:text,
  creatorPortrait:z.union([image,z.literal('')]).default(''),
  creatorPortraitCredit:z.string().trim().max(5000).default(''),
  creatorPortraitSource:z.union([z.string().url(),z.literal('')]).default(''),
  date:text,
  medium:text,
  description:text,
  context:z.string().trim().max(10000).default(''),
  lookFor:z.string().trim().max(5000).default(''),
  location:z.string().trim().max(500).default(''),
  dimensions:z.string().trim().max(200).default(''),
  image,
  source:z.union([z.string().url(),z.literal('')]).default(''),
  imageCredit:z.string().trim().max(5000).default(''),
  imageSource:z.union([z.string().url(),z.literal('')]).default(''),
  imageLicense:z.string().trim().max(2000).default(''),
  modelCredit:z.string().trim().max(5000).default(''),
  modelSource:z.union([z.string().url(),z.literal('')]).default(''),
  room:z.number().int().min(0).max(5).optional(),
  gallerySlot:z.number().int().min(0).max(1023).optional(),
  displaySize:z.enum(['regular','medium','large']).default('regular'),
})
export type ArtCmsInput=z.infer<typeof artCmsSchema>
