<script setup lang="ts">
import {Bookmark} from 'lucide-vue-next'
import type {ReadingLine} from '~/utils/library/reading'
const props=defineProps<{lines:readonly ReadingLine[];marks:ReadonlySet<number>;touchLine:number;resumeLine:number;poemTitle?:boolean}>()
const emit=defineEmits<{bookmark:[line:number];touchLine:[line:number]}>()
const hovered=ref(-1),focused=ref(-1)
function enter(event:PointerEvent,line:number){if(event.pointerType==='mouse')hovered.value=line}
function displayedText(line:ReadingLine){return props.poemTitle&&line.index===0?line.text.replace(/^(?:#\s+|\d+[.)]\s+)/,''):line.text}
</script>
<template>
 <div class="reading-chunk" @pointerleave="hovered=-1">
  <div v-for="line in props.lines" :key="line.index" :data-line="line.index" class="reading-line" :class="{'marked-line':marks.has(line.index),'resume-line':resumeLine===line.index,'empty-line':!line.text.trim(),'poem-title':poemTitle&&line.index===0}" :tabindex="line.text.trim()?0:undefined" :aria-label="line.text.trim()?displayedText(line):undefined" @pointerenter="enter($event,line.index)" @pointerdown="($event.pointerType==='touch'||$event.pointerType==='pen')&&emit('touchLine',line.index)" @focus="focused=line.index" @blur="focused=-1" @keydown.enter.self.prevent="line.text.trim()&&emit('bookmark',line.index)" @keydown.space.self.prevent="line.text.trim()&&emit('bookmark',line.index)">
   <button v-if="line.text.trim()&&(marks.has(line.index)||hovered===line.index||touchLine===line.index||focused===line.index)" type="button" class="line-bookmark" :aria-label="marks.has(line.index)?'Հանել էջանշանը․ '+displayedText(line).slice(0,100):'Էջանշել հատվածը․ '+displayedText(line).slice(0,100)" :aria-pressed="marks.has(line.index)" @click="emit('bookmark',line.index)"><Bookmark :size="15" :fill="marks.has(line.index)?'currentColor':'none'"/></button><span>{{displayedText(line)||' '}}</span>
  </div>
 </div>
</template>
<style scoped>
/* Eager, small layout blocks: no virtualized gaps or scroll-triggered text loading. */
.reading-chunk{contain:layout style}
.reading-line{position:relative;white-space:pre-wrap;overflow-wrap:anywhere;min-height:1.85em;padding-left:32px}
.poem-title{font-size:1.2em;font-weight:700;line-height:1.5;color:#d7b879;margin-bottom:.5em}
.empty-line{min-height:.8em;height:.8em}
.line-bookmark{position:absolute;left:0;top:.35em;color:#bc9c61;padding:4px;border-radius:4px;display:grid;place-items:center}
.marked-line{background:#bc9c6112;border-radius:4px}.resume-line{background:#bc9c6128;box-shadow:inset 3px 0 #bc9c61;border-radius:4px}
.reading-line:focus-visible,.line-bookmark:focus-visible{outline:2px solid #d9bd87;outline-offset:-2px}
@media(pointer:coarse){.line-bookmark{width:36px;height:36px;top:0;padding:0}.reading-line{padding-left:40px}}
</style>
