export default defineEventHandler(async event=>{
 const body=await readBody<{question?:string}>(event)
 const question=String(body?.question||'').trim()
 if(question.length<3||question.length>500)throw createError({statusCode:400,statusMessage:'Question length must be 3–500 characters'})
 const config=useRuntimeConfig(event)
 const key=String(config.openaiApiKey||'')
 if(!key)return {available:false,message:'AI ծառայությունը դեռ կարգավորված չէ։ Սերվերում անհրաժեշտ է OPENAI_API_KEY։'}
 // Restrict to educational questions, do not expose key to browser.
 try{
  const result=await $fetch<{output?:{content?:{type:string;text?:string}[]}[]}>('https://api.openai.com/v1/responses',{
   method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},timeout:25000,
   body:{model:'gpt-4.1-mini',max_output_tokens:850,instructions:'You write clear, careful Armenian-language educational explanations. Answer in Armenian. Do not invent sources or citations. State uncertainty when needed. No HTML. Keep under 350 words.',input:question}
  })
  const answer=result.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text||'').join('\n').trim()
  if(!answer)throw new Error('Empty AI response')
  return {available:true,answer,generated:true}
 }catch{throw createError({statusCode:502,statusMessage:'AI ծառայությունը ժամանակավորապես անհասանելի է'})}
})
