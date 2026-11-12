import { articleVideoSource } from './articleVideo'
import {geographyCategorySchema,geographyEntrySchema} from './geographyCms'
import { millionSlotOf } from './millionStages'
import {libraryTopics} from '../data/library/catalog'
import { z } from 'zod'
export const kinds = ['GEO_ENTRY','GEO_CATEGORY','BOOK','ARTICLE','CATEGORY','AUTHOR','PERSON','FACT','EVENT','GAME','MONUMENT','WORK','PAGE','VIDEO','SETTING'] as const
export const kindSchema = z.enum(kinds)
const text = z.string().max(200000)
const section = z.object({ title: text, text })
const source = z.object({ name: text, url: z.string().url() })
// Preserve rich legacy fields while validating the fields used by public renderers.
const shapes = {
  GEO_ENTRY:geographyEntrySchema,
  GEO_CATEGORY:geographyCategorySchema,
  BOOK:z.object({id:text,title:text,author:text.trim().min(1),topic:z.string().refine(value=>libraryTopics.some(topic=>topic.id===value)),description:text.trim().min(1),cover:z.string().min(1).max(2000).refine(value=>/^\/(?!\/)/.test(value)||/^https:\/\//.test(value)),text:z.string().trim().min(100).max(2000000).refine(value=>(value.match(/[Ա-Ֆա-ֆև]/g)||[]).length>50,'Գրքի տեքստը պետք է լինի հայերեն'),source:text.optional(),textLicense:text.optional(),coverCredit:text.optional(),coverSource:text.optional(),coverLicense:text.optional(),edition:text.optional(),rightsConfirmed:z.boolean().optional()}),
  ARTICLE: z.object({ id: text, subject: text, title: text.min(1), answer: text, detail: text, video: z.string().trim().max(2000).refine(value => !value || Boolean(articleVideoSource(value)), 'Մուտքագրիր YouTube, Vimeo կամ HTTPS MP4/WebM հղում').optional(), sections: z.array(section.extend({image:z.string().max(2000).refine(v=>!v||/^\/(?!\/)[^\\]*$/.test(v)||/^https:\/\//.test(v)).optional()})).optional(), source: source.optional() }).passthrough(),
  CATEGORY: z.object({ slug: text.min(1), name: text.min(1),image:z.string().max(2000).optional(),cardVideo:z.string().max(2000).refine(value=>!value||/^\/videos\/previews\/[^\\]+\.(mp4|webm)$/.test(value)||/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/factum\/previews\/[^/]+\.mp4$/i.test(value),'Վերբեռնիր վիդեոն՝ ավտոմատ օպտիմիզացման համար').optional() }).passthrough(),
  AUTHOR: z.object({ name: text.min(1), bio: text.optional() }).passthrough(),
  PERSON: z.object({ id: text, name: text.min(1), years: text, role: text, bio: text, works: z.array(text), biographySections: z.array(section).optional() }).passthrough(),
  FACT: z.object({ id: text, title: text.min(1), text, category: text }).passthrough(),
  EVENT: z.object({ year: text.min(1), title: text.min(1), era: text }).passthrough(),
  GAME: z.object({ mode: z.enum(['million','genius','logic']), difficulty: z.enum(['easy','medium','hard']), stage: z.enum(['first','middle','final']).optional(), slot:z.number().int().min(0).max(14).optional(), question: text.optional(), statement: text.optional(), answers: z.array(text).min(2).max(8).optional(), correct: z.union([z.number().int().nonnegative(), z.boolean()]), explanation: text }).passthrough().superRefine((v, ctx) => {
    if (v.mode === 'genius' ? !v.statement || typeof v.correct !== 'boolean' : !v.question || !v.answers || typeof v.correct !== 'number' || v.correct >= v.answers.length) ctx.addIssue({ code: 'custom', message: 'Ստուգեք հարցն ու ճիշտ պատասխանը' })
  }),
  MONUMENT: z.object({ id: text, personId: text, name: text.min(1), city: text, location: text, source }).passthrough(),
  WORK: z.object({ personId: text, index: z.number().int().nonnegative(), title: text.min(1), description: text }).passthrough(),
  PAGE: z.object({ title: text.min(1), text }).passthrough(),
  VIDEO: z.object({ title: text.min(1), url: z.string().url(), preview: text.optional() }).passthrough(),
  SETTING: z.object({ title: text.min(1), text }).passthrough(),
}
export const contentInput = z.object({ kind: kindSchema, key: z.string().min(1).max(200), title: z.string().trim().min(1).max(500), summary: z.string().max(5000).default(''), body: text.default(''), data: z.record(z.string(),z.unknown()), categoryId: z.string().nullish(), authorId: z.string().nullish(), version: z.number().int().positive().optional(), action: z.enum(['save','publish','archive']).default('save') })
export function parseContent(value: unknown) {
  const result = contentInput.parse(value)
  result.data = shapes[result.kind].parse(result.data)
  if(result.kind==='GAME'&&result.data.mode==='million')result.data.slot=millionSlotOf(result.data);
  if(result.kind==='GAME'&&result.data.mode==='million')delete result.data.stage
  // The public title and key always agree with the editorial record.
  if ('title' in result.data) result.data.title = result.title
  if (result.kind==='GEO_ENTRY'&&!result.data.id) result.data.id=result.key
  if (['GEO_CATEGORY','BOOK','ARTICLE','PERSON','FACT','MONUMENT'].includes(result.kind)) result.data.id = result.key
  if (result.kind === 'ARTICLE' && result.data.listed === undefined) result.data.listed = true
  if (result.kind === 'EVENT') result.data.year = result.key
  if (result.kind === 'CATEGORY') result.data.slug = result.key
  if (result.kind === 'PERSON') result.data.name = result.title
  return result
}
export const kindLabels: Record<typeof kinds[number], string> = { GEO_ENTRY:'Երկրագունդ · նյութեր',GEO_CATEGORY:'Երկրագունդ · բաժիններ',BOOK:'Գրադարանի գրքեր',ARTICLE:'Հոդվածներ',CATEGORY:'Կատեգորիաներ',AUTHOR:'Հեղինակներ',PERSON:'Հայտնի մարդիկ',FACT:'Հետաքրքիր փաստեր',EVENT:'Պատմական իրադարձություններ',GAME:'Խաղերի հարցեր',MONUMENT:'Հուշարձաններ',WORK:'Ստեղծագործություններ',PAGE:'Էջեր',VIDEO:'Տեսանյութեր',SETTING:'Կայքի տեղեկություններ' }
