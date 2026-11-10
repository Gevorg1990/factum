export default defineEventHandler(event => $fetch('/api/content',{query:{...getQuery(event),kind:'ARTICLE'},headers:{cookie:getHeader(event,'cookie')||''}}))
