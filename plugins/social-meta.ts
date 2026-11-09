import { injectHead } from '#imports'

export default defineNuxtPlugin(() => {
  const head = injectHead()
  head.hooks.hook('tags:afterResolve', ({ tags }) => {
    const title = tags.find(tag => tag.tag === 'title')?.textContent
    const description = tags.find(tag => tag.tag === 'meta' && tag.props.name === 'description')?.props.content
    const metaValue = (property: string) => tags.find(tag => tag.tag === 'meta' && tag.props.property === property)?.props.content
    const addMeta = (attribute: 'name' | 'property', key: string, content: unknown) => {
      if (typeof content !== 'string' || !content) return
      if (tags.some(tag => tag.tag === 'meta' && tag.props[attribute] === key)) return
      tags.push({ tag: 'meta', props: { [attribute]: key, content } })
    }

    // Resolve page-level titles and descriptions before filling social defaults.
    addMeta('property', 'og:title', title)
    addMeta('property', 'og:description', description)
    addMeta('name', 'twitter:title', metaValue('og:title') || title)
    addMeta('name', 'twitter:description', metaValue('og:description') || description)
    if (String(metaValue('og:image')).endsWith('/images/social/factum-og.png')) {
      addMeta('property', 'og:image:width', '1200')
      addMeta('property', 'og:image:height', '630')
      addMeta('property', 'og:image:type', 'image/png')
    }
    addMeta('name', 'twitter:image', metaValue('og:image'))
    addMeta('name', 'twitter:image:alt', metaValue('og:image:alt'))
  })
})
