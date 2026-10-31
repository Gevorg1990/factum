<script setup lang="ts">
import { Check } from 'lucide-vue-next'
defineProps<{ modelValue: 'male' | 'female'; name: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: 'male' | 'female'] }>()
const options = [
  { value: 'male' as const, icon: '👨', label: 'Տղամարդ', description: 'Տղամարդու ձայն՝ Հայկ' },
  { value: 'female' as const, icon: '👩', label: 'Կին', description: 'Կնոջ ձայն՝ Անահիտ' },
]
</script>

<template>
  <fieldset class="voice-choice">
    <legend>Ընթերցողի ձայնը</legend>
    <div class="voice-choice-options">
      <label v-for="option in options" :key="option.value" class="voice-choice-option" :class="{ 'is-selected': modelValue === option.value }">
        <input class="sr-only" type="radio" :name="name" :value="option.value" :checked="modelValue === option.value" :aria-label="option.description" @change="emit('update:modelValue', option.value)" />
        <span class="voice-choice-avatar" aria-hidden="true">{{ option.icon }}</span>
        <span>{{ option.label }}</span>
        <Check :size="14" class="voice-choice-check" :class="{ 'is-hidden': modelValue !== option.value }" aria-hidden="true" />
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.voice-choice { min-width: 0; margin: 0; padding: 0; border: 0; }
legend { margin-bottom: 8px; font-size: 12px; }
.voice-choice-options { display: flex; gap: 10px; }
.voice-choice-option { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; width: 104px; min-height: 84px; padding: 10px 20px; border: 1px solid #8997c055; border-radius: 12px; font-size: 11px; cursor: pointer; transition: background-color .15s, border-color .15s; }
.voice-choice-option:hover { background: #dfc38f0d; border-color: #dfc38f99; }
.voice-choice-option.is-selected { border-color: #dfc38f; background: #dfc38f18; box-shadow: inset 0 0 0 1px #dfc38f; }
.voice-choice-option:focus-within { outline: 2px solid #dfc38f; outline-offset: 3px; }
.voice-choice-avatar { font-size: 30px; line-height: 1; }
.voice-choice-check { position: absolute; top: 7px; right: 7px; color: #dfc38f; }
.voice-choice-check.is-hidden { visibility: hidden; }
</style>
