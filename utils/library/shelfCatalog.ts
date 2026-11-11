import {shelfAngle} from './navigation'
import {libraryBooks,libraryTopics} from '../../data/library/catalog'
export const STACK_BAYS=8
export const STACK_LEVELS=3
export const STACK_ROWS=3
export const BOOKS_PER_ROW=36
/** One physical copy per catalogue record. Empty slots await real additions. */
export function libraryShelfEntries(books:readonly typeof libraryBooks[number][]=libraryBooks){
 return libraryTopics.flatMap(topic=>{
  const topicBooks=books.filter(book=>book.topic===topic.id)
  const bay=Math.round((shelfAngle(topic.shelf)+Math.PI/2)/(Math.PI/4))
  const shared=libraryTopics.filter(item=>shelfAngle(item.shelf)===shelfAngle(topic.shelf)),slot=shared.findIndex(item=>item.id===topic.id)
  const perRow=Math.floor(BOOKS_PER_ROW/shared.length),center=(slot-(shared.length-1)/2)*5.4
  return topicBooks.map((book,index)=>({book,bay,level:Math.floor(index/(STACK_ROWS*perRow))%STACK_LEVELS,row:Math.floor(index/perRow)%STACK_ROWS,lateral:center+(index%perRow-(Math.min(topicBooks.length,perRow)-1)/2)*.28}))
 })
}
