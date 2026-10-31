<script setup lang="ts">
import { people } from '~/data/content'
import { workDetails } from '~/data/peopleWorks'

const route = useRoute()
const person = computed(() => people.find(item => item.id === route.params.id))
const workIndex = computed(() => Number(route.params.work))
const work = computed(() => Number.isInteger(workIndex.value) && workIndex.value >= 0 ? person.value?.works[workIndex.value] : undefined)
const info = computed(() => person.value && work.value ? workDetails[person.value.id]?.[work.value] : undefined)
const type = computed(() => {
  if (info.value?.type) return info.value.type
  const category = person.value?.category
  if (category === 'Գրականություն') return 'Գրական ստեղծագործություն'
  if (category === 'Երաժշտություն') return 'Երաժշտական ժառանգություն'
  if (category === 'Սպորտ') return 'Մարզական ձեռքբերում'
  if (category === 'Կինո և թատրոն') return 'Կինո և թատրոն'
  if (category === 'Կերպարվեստ և ճարտարապետություն') return 'Կերպարվեստ և ճարտարապետություն'
  if (category === 'Մշակույթ և պատմություն') return 'Մշակութային ձեռքբերում'
  if (category === 'Պետական և ռազմական գործիչներ') return 'Պետական և ռազմական գործունեություն'
  return 'Գիտական և տեխնիկական ձեռքբերում'
})
const suggestions = computed(() => {
  if (info.value?.type === 'Գրական ստեղծագործություն') return ['Կարդալ ամբողջական ստեղծագործությունը', 'Ուսումնասիրել գրական և պատմական համատեքստը']
  switch (person.value?.category) {
    case 'Գրականություն': return ['Կարդալ ամբողջական ստեղծագործությունը', 'Համեմատել գրական մեկնաբանություններն ու պատմական համատեքստը']
    case 'Երաժշտություն': return ['Լսել տարբեր կատարումներ և ձայնագրություններ', 'Ուսումնասիրել երաժշտական նյութն ու ստեղծման պատմությունը']
    case 'Կերպարվեստ և ճարտարապետություն': return ['Դիտել թանգարանային պատկերներն ու նկարագրությունները', 'Ուսումնասիրել նյութը, կառուցվածքն ու ստեղծման միջավայրը']
    case 'Կինո և թատրոն': return ['Դիտել ֆիլմը կամ հասանելի բեմական ձայնագրությունը', 'Ուսումնասիրել ռեժիսորական և դերասանական լուծումները']
    case 'Սպորտ': return ['Դիտել մրցման պաշտոնական արդյունքներն ու տեսագրությունը', 'Ծանոթանալ մրցաձևի կանոններին և հաղթանակի պատմությանը']
    case 'Պետական և ռազմական գործիչներ': return ['Ուսումնասիրել պաշտոնական կենսագրությունն ու ժամանակագրությունը', 'Համադրել պատմագիտական ուսումնասիրություններն ու ժամանակաշրջանի աղբյուրները']
    case 'Մշակույթ և պատմություն': return ['Կարդալ սկզբնաղբյուրներն ու գիտական մեկնաբանությունները', 'Ուսումնասիրել ժամանակաշրջանի մշակութային միջավայրը']
    default: return ['Կարդալ հետազոտության բացատրություններն ու սկզբնական հրապարակումները', 'Ուսումնասիրել հայտնագործության կամ տեխնոլոգիայի պատմությունը']
  }
})
const libraryQuery = computed(() => `${person.value?.name || ''} ${work.value || ''}`)
const libraryUrl = computed(() => `https://www.google.com/search?q=${encodeURIComponent(libraryQuery.value + (person.value?.category === 'Գրականություն' ? ' site:hy.wikisource.org' : ''))}`)
const mediaUrl = computed(() => `https://www.youtube.com/results?search_query=${encodeURIComponent(libraryQuery.value)}`)
useHead({ title: computed(() => `${work.value || 'Գործ'} — FACTUM`), meta: [{ name: 'description', content: 'FACTUM․ հայտնի գործերի բացատրություններ և լրացուցիչ ուսումնասիրության հնարավորություններ' }] })
</script>

<template>
  <main class="shell page-with-back py-10">
    <NuxtLink :to="person ? `/people/${person.id}` : '/people'" class="gold">← Վերադառնալ կենսագրությանը</NuxtLink>
    <article v-if="person && work" class="panel p-6 md:p-9 mt-5">
      <p class="gold text-sm mb-3">{{ type }}</p>
      <h1 class="heading">{{ work }}</h1>
      <p v-if="info?.date" class="gold mt-3">Տարեթիվ՝ {{ info.date }}</p>
      <NuxtLink :to="`/people/${person.id}`" class="muted inline-block mt-2 hover:underline">{{ person.name }}</NuxtLink>
      <section class="mt-8">
        <h2 class="text-xl font-bold mb-3">Ինչի՞ մասին է</h2>
        <p class="leading-8">{{ info?.description || 'Այս գործը տվյալ գործչի ժառանգության կարևոր մասն է։' }}</p>
      </section>
      <section v-if="info?.significance" class="mt-8">
        <h2 class="text-xl font-bold mb-3">Ինչո՞ւ է կարևոր</h2>
        <p class="leading-8">{{ info.significance }}</p>
      </section>
      <section v-if="info?.sources?.length" class="mt-8">
        <h2 class="text-xl font-bold mb-3">Աղբյուրներ</h2>
        <ul class="grid gap-2">
          <li v-for="source in info.sources" :key="source.url"><a :href="source.url" target="_blank" rel="noopener noreferrer" class="gold underline underline-offset-4">{{ source.name }} ↗</a></li>
        </ul>
      </section>
      <section class="mt-8">
        <h2 class="text-xl font-bold mb-3">Ինչպե՞ս ուսումնասիրել ավելին</h2>
        <ul class="grid gap-3 mt-4">
          <li v-for="item in suggestions" :key="item" class="rounded-xl border border-amber-300/20 p-4">✦ {{ item }}</li>
        </ul>
        <p class="muted mt-5 leading-7">Ստորև նշված հղումները բացում են որոնման արդյունքներ, ոչ թե հաստատված ամբողջական նյութեր։ Ընտրիր վստահելի և օրինական հրապարակումներ։</p>
        <div class="flex flex-wrap gap-3 mt-4">
          <a v-if="person.source" :href="person.source.url" target="_blank" rel="noopener noreferrer" class="btn-secondary">Կարդալ աղբյուրը ↗</a>
          <a :href="libraryUrl" target="_blank" rel="noopener noreferrer" class="btn-secondary">Փնտրել լրացուցիչ տեղեկություններ ↗</a>
          <a :href="mediaUrl" target="_blank" rel="noopener noreferrer" class="btn-secondary">Փնտրել տեսանյութեր և ձայնագրություններ ↗</a>
        </div>
      </section>
    </article>
    <div v-else class="panel p-6 mt-5"><h1 class="text-xl font-bold">Գործը չի գտնվել</h1><NuxtLink to="/people" class="gold mt-3 inline-block">Վերադառնալ նշանավոր մարդկանց բաժին</NuxtLink></div>
  </main>
</template>
