<script setup lang="ts">
const videos=await usePublishedContent<{title:string;url:string;preview?:string}>('VIDEO',[])
useHead({title:'Տեսանյութեր — FACTUM'})
</script>
<template><main class="shell py-10"><h1 class="heading">🎬 FACTUM Video</h1><div v-if="!videos.length" class="panel p-8"><h2 class="text-xl font-bold">Կրթական տեսանյութեր</h2><p class="muted mt-3">Այժմ տեսանյութեր չեն հրապարակվել։</p></div><article v-for="(video,index) in videos" :key="index" class="panel my-5"><h2 class="text-xl font-bold mb-4">{{video.title}}</h2><video controls preload="none" :poster="video.preview" class="w-full" :src="video.url"/></article><CatalogMore :items="videos" kind="VIDEO"/></main></template>
