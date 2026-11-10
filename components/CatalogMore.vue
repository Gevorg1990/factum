<script setup lang="ts">
const props=defineProps<{items:any[];kind:string;subject?:string;armenian?:boolean}>()
const page=ref(1),done=ref(props.items.length<100),busy=ref(false),error=ref('')
async function more(){busy.value=true;try{const result=await $fetch<any>('/api/content',{query:{kind:props.kind,subject:props.subject,armenian:props.armenian,page:page.value+1,limit:100}});props.items.push(...result.items);page.value++;done.value=page.value*100>=result.total}catch{error.value='Չհաջողվեց բեռնել․ փորձեք կրկին'}finally{busy.value=false}}
</script>
<template><div class="my-6 text-center"><button v-if="!done" class="gold" :disabled="busy" @click="more">{{busy?'Բեռնվում է…':'Բեռնել հաջորդ նյութերը'}}</button><p role="status">{{error}}</p></div></template>
