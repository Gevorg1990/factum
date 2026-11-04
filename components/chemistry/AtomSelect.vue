<script setup lang="ts">
import { nextTick } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
type Option = { value: string | number; label: string }
const props = defineProps<{ id: string; modelValue: string | number; options: readonly Option[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const root = ref<HTMLElement | null>(null), trigger = ref<HTMLButtonElement | null>(null), list = ref<HTMLElement | null>(null)
const open = ref(false), active = ref(0), upward = ref(false), maxHeight = ref(264)
const selected = computed(() => props.options.find(option => option.value === props.modelValue))
let search = '', searchAt = 0
function position() {
  if (!trigger.value) return
  const bounds = trigger.value.getBoundingClientRect()
  const below = window.innerHeight - bounds.bottom - 12, above = bounds.top - 12
  upward.value = below < 200 && above > below
  maxHeight.value = Math.max(88, Math.min(264, upward.value ? above : below))
}
async function reveal() {
  await nextTick()
  list.value?.querySelector<HTMLElement>(`[data-option-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' })
}
function close() { open.value = false; search = '' }
function show() {
  position()
  active.value = Math.max(0, props.options.findIndex(option => option.value === props.modelValue))
  open.value = true
  void reveal()
}
function choose(index: number) {
  const option = props.options[index]
  if (!option) return
  emit('update:modelValue', option.value)
  close()
  trigger.value?.focus({ preventScroll: true })
}
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Tab') { close(); return }
  if (event.key === 'Escape') { if (open.value) { event.preventDefault(); close() }; return }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open.value ? choose(active.value) : show(); return }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
    event.preventDefault()
    if (!open.value) { show(); return }
    if (event.key === 'Home') active.value = 0
    else if (event.key === 'End') active.value = props.options.length - 1
    else active.value = Math.max(0, Math.min(props.options.length - 1, active.value + (event.key === 'ArrowUp' ? -1 : event.key === 'PageUp' ? -6 : event.key === 'PageDown' ? 6 : 1)))
    void reveal(); return
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const now = Date.now()
    search = now - searchAt > 700 ? event.key : search + event.key
    searchAt = now
    if (!open.value) show()
    const query = search.toLocaleLowerCase('hy')
    const prefix = props.options.findIndex(option => option.label.toLocaleLowerCase('hy').split(/[\s·]+/u).some(word => word.startsWith(query)))
    const index = prefix >= 0 ? prefix : props.options.findIndex(option => option.label.toLocaleLowerCase('hy').includes(query))
    if (index >= 0) { active.value = index; void reveal() }
  }
}
function outside(event: PointerEvent) { if (root.value && !root.value.contains(event.target as Node)) close() }
function blur(event: FocusEvent) { if (root.value && !root.value.contains(event.relatedTarget as Node | null)) close() }
watch(open, value => {
  if (value) { document.addEventListener('pointerdown', outside); window.addEventListener('resize', position) }
  else { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', position) }
})
watch(() => props.options, () => { if (open.value) { close() } })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', position) })
</script>
<template>
  <div ref="root" class="atom-select" @focusout="blur">
    <button :id="id" ref="trigger" type="button" role="combobox" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="`${id}-options`" :aria-activedescendant="open ? `${id}-option-${active}` : undefined" class="atom-select-trigger" @click="open ? close() : show()" @keydown="keyboard"><span>{{ selected?.label || 'Ընտրիր տարբերակը' }}</span><ChevronDown :size="16" aria-hidden="true" :class="{ 'is-open': open }"/></button>
    <ul v-if="open" :id="`${id}-options`" ref="list" role="listbox" :aria-labelledby="id" class="atom-select-options" :class="{ 'opens-up': upward }" :style="{ maxHeight: `${maxHeight}px` }">
      <li v-for="(option, index) in options" :id="`${id}-option-${index}`" :key="option.value" role="option" :aria-selected="option.value === modelValue" :data-option-index="index" :class="{ 'is-active': active === index }" @pointermove="active = index" @pointerdown.prevent @click="choose(index)">{{ option.label }}<span v-if="option.value === modelValue" aria-hidden="true">✓</span></li>
    </ul>
  </div>
</template>
<style scoped>
.atom-select{position:relative;min-width:0;width:100%;font-weight:400}.atom-select-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;border:1px solid #8ca4cc55;border-radius:10px;padding:10px 5px 10px 10px;background:#0c172b;color:#f0f5ff;font-size:12px;text-align:left}.atom-select-trigger>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.atom-select-trigger svg{flex-shrink:0;color:#b8cde4}.atom-select-trigger svg.is-open{transform:rotate(180deg)}.atom-select-trigger:focus-visible{outline:2px solid #dfc38f;outline-offset:3px}.atom-select-options{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:70;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;margin:0;padding:5px;list-style:none;border:1px solid #8ca4cc77;border-radius:10px;background:#0c172b;box-shadow:0 12px 28px #0008;color:#e3edfa;max-height:min(264px,45dvh)}.atom-select-options.opens-up{top:auto;bottom:calc(100% + 6px)}.atom-select-options li{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:44px;padding:9px 8px;border-radius:6px;cursor:pointer;font-size:12px;line-height:1.6;overflow-wrap:anywhere}.atom-select-options li.is-active{background:#27435f}.atom-select-options li[aria-selected=true]{color:#f1d69f}.atom-select-options li>span{flex-shrink:0}
</style>
