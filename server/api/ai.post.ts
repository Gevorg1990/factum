export default defineEventHandler(async event=>{
 const body=await readBody<{question?:string}>(event)
 const question=String(body?.question||'').trim()
 if(question.length<3||question.length>500)throw createError({statusCode:400,statusMessage:'Question length must be 3–500 characters'})
 const config=useRuntimeConfig(event)
 const key=String(config.openaiApiKey||process.env.NUXT_OPENAI_API_KEY||process.env.OPENAI_API_KEY||'')
 if(!key)return {available:false,message:'AI ծառայությունը դեռ կարգավորված չէ։ Vercel-ում ավելացրու NUXT_OPENAI_API_KEY։'}
 // Restrict to educational questions, do not expose key to browser.
 try{
  const result=await $fetch<{output?:{content?:{type:string;text?:string}[]}[]}>('https://api.openai.com/v1/responses',{
   method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},timeout:25000,
   body:{model:'gpt-4.1-mini',max_output_tokens:850,instructions:'You write clear, careful Armenian-language educational explanations. Answer in Armenian. Do not invent sources or citations. State uncertainty when needed. No HTML. Keep under 350 words.',input:question}
  })
  const answer=result.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text||'').join('\n').trim()
  if(!answer)throw new Error('Empty AI response')
  return {available:true,answer,generated:true}
 }catch(error){
  const failure=error as {status?:number;statusCode?:number;response?:{status?:number};data?:{error?:{code?:string;type?:string}}}
  const status=Number(failure.statusCode||failure.status||failure.response?.status||0)
  const code=String(failure.data?.error?.code||failure.data?.error?.type||'')
  console.error('[FACTUM AI] OpenAI request failed', {status,code})
  if(status===401)return {available:false,message:'OpenAI API բանալին անվավեր է կամ անջատված։ Ստուգիր API key-ը։'}
  if(status===403)return {available:false,message:'API բանալին մոդելի հարցումներ կատարելու թույլտվություն չունի։ Ստուգիր նախագծի մոդելի հասանելիությունն ու key-ի իրավունքները։'}
  if(status===429&&(/quota|billing/i.test(code)))return {available:false,message:'OpenAI API-ի վարկը կամ ծախսի սահմանաչափը լրացել է։ Ստուգիր API billing-ը։'}
  if(status===429)return {available:false,message:'OpenAI API-ի հարցումների սահմանաչափը լրացել է։ Փորձիր ավելի ուշ։'}
  return {available:false,message:'Չհաջողվեց կապ հաստատել OpenAI API-ի հետ։ Ստուգիր ինտերնետն ու փորձիր կրկին։'}
 }
})
