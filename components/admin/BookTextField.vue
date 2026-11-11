<script setup lang="ts">
defineProps<{modelValue:string}>()
const emit=defineEmits<{ 'update:modelValue':[value:string] }>()
const error=ref('')
async function importText(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];error.value='';if(!file)return;try{if(!file.name.toLowerCase().endsWith('.txt')||file.size>4000000)throw new Error('Ընտրիր մինչև 4 ՄԲ UTF-8 .txt ֆայլ։');const text=await file.text();if(text.length>2000000||!/[Ա-Ֆա-ֆև]/.test(text))throw new Error('Ֆայլը պետք է պարունակի հայերեն տեքստ։');emit('update:modelValue',text)}catch(e){error.value=(e as Error).message}finally{input.value=''}}
</script>
<template><div class="book-text-field"><label class="text-import">Ներմուծել հայերեն .txt ֆայլ<input type="file" accept=".txt,text/plain" @change="importText"></label><p>UTF-8 տեքստ․ կարող ես նաև տեղադրել կամ խմբագրել ստորև։</p><textarea :value="modelValue" required rows="14" maxlength="2000000" aria-label="Գրքի ամբողջական հայերեն տեքստը" @input="emit('update:modelValue',($event.target as HTMLTextAreaElement).value)"/><small>{{modelValue.length.toLocaleString()}} նիշ</small><p v-if="error" role="alert">{{error}}</p></div></template>
<style scoped>.book-text-field{display:grid;gap:10px}.text-import{display:grid;gap:10px;color:#e0c18a;font-size:12px}.book-text-field textarea{width:100%;padding:14px;background:#071426;color:#edf3fc;border:1px solid #304661;border-radius:10px;font:inherit;line-height:1.8;resize:vertical}.book-text-field p,.book-text-field small{color:#91a6bf;font-size:11px}.book-text-field [role=alert]{color:#efaaaa}</style>
