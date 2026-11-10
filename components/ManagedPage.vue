<script setup lang="ts">
const props=defineProps<{pageKey:string}>()
const rows=await usePublishedContent<{title:string;text:string}>('PAGE',[],{key:props.pageKey})
</script>
<template><article v-if="rows[0]" class="panel my-6"><h2 class="text-xl font-bold">{{rows[0].title}}</h2><p class="mt-4 whitespace-pre-wrap leading-8">{{rows[0].text}}</p></article><slot v-else/></template>
