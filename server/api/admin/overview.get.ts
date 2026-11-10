import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'
export default defineEventHandler(async event=>{
  await requireUser(event,['ADMIN','EDITOR'])
  const [groups,recent,media]=await Promise.all([
    db.content.groupBy({by:['kind','status'],_count:{_all:true}}),
    db.content.findMany({take:6,orderBy:[{updatedAt:'desc'},{id:'asc'}],select:{id:true,kind:true,title:true,status:true,updatedAt:true}}),
    db.media.count(),
  ])
  return {groups,recent,media}
})
