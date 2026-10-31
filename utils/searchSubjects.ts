import { questions, subjects, collectionSubjects } from '../data/content'
import type { SearchSubject } from './searchRecords'

const subjectBySlug = new Map([...subjects, ...collectionSubjects].map(subject => [subject.slug, {name:subject.name,url:`/subjects/${subject.slug}`}]))
const articleSubjects = new Map(questions.map(question => [question.id,subjectBySlug.get(question.subject)]))
const sections: Record<string,SearchSubject> = {
  people: {name:'Նշանավոր մարդիկ',url:'/people'},
  history: {name:'Հայոց պատմություն',url:'/history'},
  facts: {name:'Հետաքրքիր փաստեր',url:'/facts'},
  library: {name:'Գրադարան',url:'/library'},
  bible: {name:'Աստվածաշունչ',url:'/bible'},
}

/** Also resolves section labels for results loaded before metadata was added. */
export function getSearchSubject(url: string): SearchSubject | undefined {
  try {
    const path = url.split(/[?#]/u)[0]!.split('/').filter(Boolean).map(segment=>decodeURIComponent(segment))
    if (path[0] === 'articles') return articleSubjects.get(path[1] ?? '')
    if (path[0] === 'subjects') return subjectBySlug.get(path[1] ?? '')
    return sections[path[0] ?? '']
  } catch {
    return undefined
  }
}
