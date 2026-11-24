import {z} from 'zod'

const text=z.string().trim().min(1).max(5000)
const image=z.string().trim().min(1).max(2000).refine(value=>/^\/(?!\/)/.test(value)||/^https:\/\//.test(value),'Ընտրիր կամ վերբեռնիր նկար')
export const artCmsSchema=z.object({
  id:z.string().trim().min(1).max(200),
  title:text,
  originalTitle:z.string().trim().max(500).default(''),
  creator:text,
  creatorInfo:text,
  creatorPortrait:image,
  creatorPortraitCredit:text,
  creatorPortraitSource:z.string().url(),
  date:text,
  medium:text,
  description:text,
  context:z.string().trim().max(10000).default(''),
  lookFor:z.string().trim().max(5000).default(''),
  location:z.string().trim().max(500).default(''),
  dimensions:z.string().trim().max(200).default(''),
  image,
  source:z.string().url(),
  imageCredit:text,
  imageSource:z.string().url(),
  imageLicense:z.string().trim().max(2000).default(''),
})
export type ArtCmsInput=z.infer<typeof artCmsSchema>
