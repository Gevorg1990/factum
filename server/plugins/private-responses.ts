export default defineNitroPlugin(nitro=>{
  nitro.hooks.hook('beforeResponse',event=>{
    const path=getRequestURL(event).pathname
    const staticAsset=/^\/(?:_nuxt|__nuxt|images|fonts|vendor|data|audio|videos\/previews)\//.test(path)||/^\/favicon[^/]*$/.test(path)
    if(!staticAsset){
      setHeader(event,'cache-control','private, no-store')
      setHeader(event,'cdn-cache-control','private, no-store')
      setHeader(event,'vercel-cdn-cache-control','private, no-store')
    }
  })
})
