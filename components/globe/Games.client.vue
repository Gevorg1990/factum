<script setup lang="ts">
import {Mic} from 'lucide-vue-next'
import {geographyGames,type GeographyGame} from '~/data/geography/gameQuestions'
defineProps<{mapAnswer?:{code:string;requestId:number};paused?:boolean}>()
const emit=defineEmits<{mapTask:[task:{label:string}|null];mapVisit:[];mapReveal:[code:string];showOnMap:[code:string]}>()
const selected=ref<'capitals'|GeographyGame>('capitals')
</script>
<template>
  <section id="globe-knowledge" class="panel knowledge-games" aria-label="Փորձիր քո գիտելիքները">
    <header class="knowledge-header"><span><Mic :size="16" aria-hidden="true"/> ՓՈՐՁԻՐ ՔՈ ԳԻՏԵԼԻՔՆԵՐԸ</span><nav aria-label="Աշխարհագրական խաղեր"><button type="button" :aria-pressed="selected==='capitals'" @click="selected='capitals'">Երկիր և մայրաքաղաք</button><button v-for="game in geographyGames" :key="game.id" type="button" :aria-pressed="selected===game.id" @click="selected=game.id">{{game.title}}</button></nav></header>
    <CapitalVoiceQuiz v-if="selected==='capitals'" embedded :paused="paused" @show-on-map="emit('showOnMap',$event)"/>
    <LazyGlobeGeographyGames v-else embedded :game="selected" :map-answer="mapAnswer" @map-task="emit('mapTask',$event)" @map-visit="emit('mapVisit')" @map-reveal="emit('mapReveal',$event)"/>
  </section>
</template>
<style scoped>
.knowledge-games{margin-top:28px;overflow:hidden;border-color:#dfc38f66;min-width:0}.knowledge-header{padding:26px 34px;border-bottom:1px solid #8997c02b}.knowledge-header>span{display:flex;align-items:center;gap:9px;color:#dfc38f;font-size:10px;letter-spacing:1px}.knowledge-header nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.knowledge-header button{padding:10px 12px;min-height:44px;border:1px solid #8997c044;border-radius:12px;font-size:11px;line-height:1.7}.knowledge-header button[aria-pressed=true]{color:#dfc38f;border-color:#dfc38f;background:#dfc38f10}.knowledge-header button:focus-visible{outline:2px solid #dfc38f;outline-offset:3px}@media(max-width:600px){.knowledge-header{padding:24px}.knowledge-header nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.knowledge-header button{text-align:left;overflow-wrap:anywhere}}
</style>
