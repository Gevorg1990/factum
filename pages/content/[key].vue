<script setup lang="ts">
const route=useRoute()
const rows=await usePublishedContent<{title:string;text:string}>('PAGE',[],{key:String(route.params.key)})
const page=rows[0]
if(!page)throw createError({statusCode:404,statusMessage:'Էջը չի գտնվել'})
useHead({title:page.title+' — COGNITIO'})
</script>
<template><main class="shell py-10"><article class="panel"><h1 class="heading">{{page.title}}</h1><p class="mt-6 whitespace-pre-wrap leading-8">{{page.text}}</p></article></main></template>
