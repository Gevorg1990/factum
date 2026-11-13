import {shelfAngle} from './navigation'
import {libraryBooks,libraryTopics} from '../../data/library/catalog'
export const STACK_BAYS=8
export const STACK_LEVELS=3
export const STACK_ROWS=3
export const BOOKS_PER_ROW=36
export const SLOTS_PER_TOPIC=STACK_LEVELS*STACK_ROWS*BOOKS_PER_ROW
export type ShelfPlacements=Record<string,number>
/** Keep the row and level of books placed before new subjects shared their bay. */
export function migrateLibraryShelfPlacement(topicId:string,index:number){
 const topic=libraryTopics.find(item=>item.id===topicId)
 if(!topic||topic.shelf>8||!Number.isInteger(index)||index<0)return null
 const oldPerRow=['novels','detective'].includes(topicId)?18:36
 const oldCapacity=STACK_LEVELS*STACK_ROWS*oldPerRow
 if(index>=oldCapacity)return null
 const shared=libraryTopics.filter(item=>shelfAngle(item.shelf)===shelfAngle(topic.shelf)).length
 const newPerRow=Math.floor(BOOKS_PER_ROW/shared)
 const level=Math.floor(index/(STACK_ROWS*oldPerRow)),row=Math.floor(index/oldPerRow)%STACK_ROWS,column=index%oldPerRow
 const newColumn=Math.round(column*(newPerRow-1)/(oldPerRow-1))
 const migrated=level*STACK_ROWS*newPerRow+row*newPerRow+newColumn
 return shelfSlot(topicId,migrated)?migrated:null
}
export function shelfSlot(topicId:string,index:number){
 const topic=libraryTopics.find(item=>item.id===topicId)
 if(!topic||!Number.isInteger(index)||index<0||index>=SLOTS_PER_TOPIC)return null
 const bay=Math.round((shelfAngle(topic.shelf)+Math.PI/2)/(Math.PI/4))
 const shared=libraryTopics.filter(item=>shelfAngle(item.shelf)===shelfAngle(topic.shelf)),section=shared.findIndex(item=>item.id===topicId)
 const perRow=Math.floor(BOOKS_PER_ROW/shared.length),capacity=STACK_LEVELS*STACK_ROWS*perRow
 if(index>=capacity)return null
 const sectionWidth=10.8/shared.length
 return {bay,level:Math.floor(index/(STACK_ROWS*perRow)),row:Math.floor(index/perRow)%STACK_ROWS,lateral:(section-(shared.length-1)/2)*sectionWidth+(index%perRow-(perRow-1)/2)*.28}
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
