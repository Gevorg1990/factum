import {geographyLegacyRows} from './geographyLegacy'
import type { ContentKind } from '@prisma/client'
// Server-only imports: archive data never enter the admin bundle.
import { legacyLiteratureQuestions } from '../../data/encyclopedia/literatureLegacy'
import { legacyHealthQuestions } from '../../data/encyclopedia/healthLegacy'
import { allEncyclopediaQuestions, questions, subjects, collectionSubjects, people, timeline } from '../../data/content'
import { historyDetails } from '../../data/historyDetails'
import { facts } from '../../data/facts'
import { personMonuments } from '../../data/personMonuments'
import { workDetails } from '../../data/peopleWorks'
import { localPortraits } from '../../data/personPortraits'
import { geniusStatements } from '../../data/geniusStatements'
import { logicPuzzles } from '../../data/logicPuzzles'
import { millionaireQuestionPairs } from '../../data/factum_millionaire_45'
export type LegacyRecord = {kind:ContentKind;key:string;title:string;data:Record<string,any>}
export function legacyContent(): LegacyRecord[] {
  const visibleArticles=new Set(questions.map(x=>x.id))
  return [
    ...geographyLegacyRows(),
    ...[...subjects,...collectionSubjects].map(x=>({kind:'CATEGORY' as const,key:x.slug,title:x.name,data:x})),
    ...[...allEncyclopediaQuestions,...legacyLiteratureQuestions,...legacyHealthQuestions].map(x=>({kind:'ARTICLE' as const,key:x.id,title:x.title,data:{...x,listed:visibleArticles.has(x.id)}})),
    ...people.map(x=>({kind:'PERSON' as const,key:x.id,title:x.name,data:{...x,portrait:localPortraits[x.id]}})),
    ...facts.map(x=>({kind:'FACT' as const,key:x.id,title:x.title,data:x})),
    ...timeline.map(x=>({kind:'EVENT' as const,key:x.year,title:x.title,data:{...x,details:historyDetails[x.year]}})),
    ...personMonuments.map(x=>({kind:'MONUMENT' as const,key:x.id,title:x.name,data:x})),
    ...people.flatMap(person=>person.works.map((title,index)=>({kind:'WORK' as const,key:`${person.id}:${index}`,title,data:{personId:person.id,index,title,...workDetails[person.id]?.[title],description:workDetails[person.id]?.[title]?.description||''}}))),
    ...geniusStatements.map((x,i)=>({kind:'GAME' as const,key:`genius-${i}`,title:x.statement,data:{...x,mode:'genius'}})),
    ...logicPuzzles.map((x,i)=>({kind:'GAME' as const,key:`logic-${i}`,title:x.title,data:{...x,mode:'logic'}})),
    ...millionaireQuestionPairs.flatMap((level,l)=>level.flatMap((pair,i)=>Object.entries(pair).map(([variant,x])=>({kind:'GAME' as const,key:`million-${l}-${i}-${variant}`,title:x.question,data:{...x,mode:'million',difficulty:['easy','medium','hard'][l],slot:i,variant}})))),
  ]
}
let cache:LegacyRecord[]|undefined
export const getLegacyContent = () => cache ??= legacyContent()
