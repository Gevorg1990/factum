import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { fieldLabels } from '../../../shared/cmsEditor'
import { parseContent, kindSchema } from '../../../shared/cms'
import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event => {
  const user = await requireUser(event, ['ADMIN','EDITOR'])
  const query = getQuery(event)
  if (event.method === 'GET') {
    if (query.id) return db.content.findUniqueOrThrow({ where: { id: String(query.id) } })
    const kind = kindSchema.parse(query.kind || 'ARTICLE')
    const page = Math.max(1, Math.min(100000, Number(query.page) || 1))
    const q = String(query.q || '').slice(0,160)
    const status=z.enum(['DRAFT','PUBLISHED','ARCHIVED']).safeParse(query.status)
    const gameFilters: Prisma.ContentWhereInput[]=[]
    if(kind==='GAME'){
      if(query.mode!==undefined)gameFilters.push({data:{path:['mode'],equals:z.enum(['million','genius','logic']).parse(query.mode)}})
      if(query.difficulty!==undefined)gameFilters.push({data:{path:['difficulty'],equals:z.enum(['easy','medium','hard']).parse(query.difficulty)}})
      if(query.slot!==undefined)gameFilters.push({data:{path:['slot'],equals:z.coerce.number().int().min(0).max(14).parse(query.slot)}})
    }
    const where: Prisma.ContentWhereInput = { kind,...(gameFilters.length?{AND:gameFilters}:{}),...(status.success?{status:status.data}:{}), ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { key: { contains: q, mode: 'insensitive' } }] } : {}) }
    const [items,total] = await db.$transaction([db.content.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 25, skip: (page-1)*25, select: { id:true,key:true,title:true,status:true,version:true,updatedAt:true } }), db.content.count({ where })])
    return { items,total,page }
  }
  if (event.method === 'DELETE') {
    if (user.role !== 'ADMIN') throw createError({ statusCode:403, statusMessage:'Ջնջումը թույլատրված է միայն ադմինիստրատորին' })
    // Tombstones keep deleted imported records from reappearing via legacy fallback or reseeding.
    const id = z.string().min(1).parse(query.id)
    if (query.permanent === 'true') {
      const confirmation = z.object({ title:z.string().min(1).max(500), version:z.number().int().positive() }).parse(await readBody(event))
      await db.$transaction(async tx => {
        const current = await tx.content.findUnique({where:{id}})
        if (!current) throw createError({statusCode:404,statusMessage:'Նյութն այլևս գոյություն չունի'})
        if (confirmation.title !== current.title) throw createError({statusCode:400,statusMessage:'Հաստատման համար մուտքագրիր նյութի ամբողջական անվանումը'})
        if (confirmation.version !== current.version) throw createError({statusCode:409,statusMessage:'Նյութը փոփոխվել է։ Վերաբացիր այն ցանկից և կրկին ստուգիր։'})
        const deleted = await tx.content.deleteMany({where:{id,version:confirmation.version}})
        if (!deleted.count) throw createError({statusCode:409,statusMessage:'Նյութը փոփոխվել է։ Վերաբացիր այն ցանկից։'})
        await tx.deletedContentKey.upsert({where:{kind_key:{kind:current.kind,key:current.key}},create:{kind:current.kind,key:current.key},update:{deletedAt:new Date()}})
        await tx.auditLog.create({data:{userId:user.id,action:'permanent-delete',target:id}})
      })
      return {ok:true,permanent:true}
    }
    await db.$transaction([db.content.update({ where:{id}, data:{status:'ARCHIVED',publishedData:Prisma.DbNull,version:{increment:1}} }), db.auditLog.create({data:{userId:user.id,action:'delete',target:id}})])
    return {ok:true}
  }
  if (!['POST','PUT'].includes(event.method)) throw createError({statusCode:405})
  let input
  try { input = parseContent(await readBody(event)) } catch(error) {
    const fields=error instanceof z.ZodError?error.issues.slice(0,12).map(issue=>({path:issue.path.join('.'),label:issue.path.map(part=>typeof part==='number'?String(part+1):fieldLabels[String(part)]||'Բովանդակություն').join(' → '),message:'Ստուգիր այս դաշտը․ այն բացակայում է կամ սխալ է լրացված։'})):[]
    throw createError({statusCode:400,statusMessage:'Որոշ դաշտեր լրացված չեն կամ սխալ են։ Ստուգիր ստորև նշված դաշտերը։',data:{fields}})
  }
  const { action, version, data, ...fields } = input
  for (const [id,kind] of [[fields.categoryId,'CATEGORY'],[fields.authorId,'AUTHOR']] as const) {
    if (id && !(await db.content.findFirst({where:{id,kind}}))) throw createError({statusCode:400,statusMessage:'Սխալ հեղինակ կամ կատեգորիա'})
  }
  const status = action === 'archive' ? 'ARCHIVED' : action === 'publish' ? 'PUBLISHED' : 'DRAFT'
  const publish = action === 'publish' ? {publishedData:data as Prisma.InputJsonValue,publishedAt:new Date()} : action === 'archive' ? {publishedData:Prisma.DbNull} : {}
  try {
    return await db.$transaction(async tx => {
      let record
      if (event.method === 'POST') record = await tx.content.create({data:{...fields,data:data as Prisma.InputJsonValue,status,...publish,editorId:user.id}})
      else {
        const id = z.string().min(1).parse(query.id)
        const current = await tx.content.findUniqueOrThrow({where:{id}})
        if (current.kind !== fields.kind || current.key !== fields.key) throw createError({statusCode:400,statusMessage:'Նյութի տեսակը և սկզբնական ID-ն անփոփոխ են'})
        const updated = await tx.content.updateMany({where:{id,version:version || 0},data:{...fields,data:data as Prisma.InputJsonValue,status,...publish,editorId:user.id,version:{increment:1}}})
        if (!updated.count) throw createError({statusCode:409,statusMessage:'Նյութը մեկ ուրիշն արդեն փոփոխել է։ Վերաբացիր այն ցանկից՝ վերջին տարբերակը ստանալու համար։'})
        record = await tx.content.findUniqueOrThrow({where:{id}})
      }
      await tx.auditLog.create({data:{userId:user.id,action,target:record.id}})
      return record
    })
  } catch(error:any) {
    if(error.code === 'P2002') throw createError({statusCode:409,statusMessage:'Այդ հասցեով նյութ արդեն կա։ Գտիր այն ցանկում և խմբագրիր գործող նյութը։'})
    throw error
  }
})
