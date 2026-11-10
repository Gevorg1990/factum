import { requireUser } from '../utils/auth'
export default defineEventHandler(async event=>{
  const path=getRequestURL(event).pathname
  if(!path.startsWith('/api/'))return
  setHeader(event,'cache-control','private, no-store')
  if(path.startsWith('/api/auth/')||path==='/api/health')return
  // Branding may be shown on the sign-in screen; other content requires an account.
  const query=getQuery(event)
  if(event.method==='GET'&&path==='/api/content'&&query.kind==='SETTING'&&query.key==='footer')return
  await requireUser(event)
})
