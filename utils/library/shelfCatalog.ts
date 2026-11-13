import {shelfAngle} from './navigation'
import {libraryBooks,libraryTopics} from '../../data/library/catalog'
export const STACK_BAYS=8
export const STACK_LEVELS=3
export const STACK_ROWS=3
export const BOOKS_PER_ROW=36
export const SLOTS_PER_TOPIC=STACK_LEVELS*STACK_ROWS*BOOKS_PER_ROW
export type ShelfPlacements=Record<string,number>
export function shelfSlot(topicId:string,index:number){
 const topic=libraryTopics.find(item=>item.id===topicId)
 if(!topic||!Number.isInteger(index)||index<0||index>=SLOTS_PER_TOPIC)return null
 const bay=Math.round((shelfAngle(topic.shelf)+Math.PI/2)/(Math.PI/4))
 const shared=libraryTopics.filter(item=>shelfAngle(item.shelf)===shelfAngle(topic.shelf)),section=shared.findIndex(item=>item.id===topicId)
 const perRow=Math.floor(BOOKS_PER_ROW/shared.length),capacity=STACK_LEVELS*STACK_ROWS*perRow
 if(index>=capacity)return null
 return {bay,level:Math.floor(index/(STACK_ROWS*perRow)),row:Math.floor(index/perRow)%STACK_ROWS,lateral:(section-(shared.length-1)/2)*5.4+(index%perRow-(perRow-1)/2)*.28}
}
/** One physical copy per catalogue record. Empty slots await real additions. */
export function libraryShelfEntries(books:readonly typeof libraryBooks[number][]=libraryBooks,placements:ShelfPlacements={}){
 return libraryTopics.flatMap(topic=>{
  const topicBooks=books.filter(book=>book.topic===topic.id)
  const used=new Set<number>()
  const reserved=new Map<string,number>()
  for(const book of topicBooks){const index=placements[book.id];if(shelfSlot(topic.id,index)&&!used.has(index)){used.add(index);reserved.set(book.id,index)}}
  return topicBooks.map(book=>{
   let index=reserved.get(book.id)
   if(index===undefined){index=0;while(used.has(index))index++}
   used.add(index)
   return {...shelfSlot(topic.id,index)!,book,slot:index}
  })
 })
}
