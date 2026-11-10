export default defineNuxtRouteMiddleware(async to=>{
  if(to.path==='/login'||to.path.startsWith('/__nuxt'))return
  const {refresh}=useAuth()
  let account
  try{account=await refresh()}catch{throw createError({statusCode:503,statusMessage:'Մուտքի ծառայությունն անհասանելի է․ փորձիր կրկին։'})}
  if(!account)return navigateTo({path:'/login',query:{next:to.fullPath}},{replace:true})
  if(to.path.startsWith('/admin')&&!['ADMIN','EDITOR'].includes(account.role))return navigateTo('/profile',{replace:true})
})
