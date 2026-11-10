<script setup lang="ts">
import { people } from '~/data/content'
import { workDetails } from '~/data/peopleWorks'

const route = useRoute()
const publishedPeople = await usePublishedContent('PERSON', people.filter(item => item.id === route.params.id), {key:String(route.params.id)})
const person = computed(() => publishedPeople[0])
if (!person.value) throw createError({statusCode:404,statusMessage:'Անձը չի գտնվել'})
const { toggleSaved, saved } = useProgress()
const selectedWork = ref<string | null>(null)
const publishedWorks = await usePublishedContent<any>('WORK', [], {subject:String(route.params.id)})
const details = computed(() => publishedWorks.length ? Object.fromEntries(publishedWorks.map(work => [work.title,work])) : person.value ? workDetails[person.value.id] || {} : {})
const workGroups = computed(() => {
  const groups: { title: string; items: { work: string; index: number }[] }[] = []
  for (const [index, work] of (person.value?.works || []).entries()) {
    const title = details.value[work]?.group || ''
    let group = groups.find(item => item.title === title)
    if (!group) { group = { title, items: [] }; groups.push(group) }
    group.items.push({ work, index })
  }
  return groups
})
watch(() => route.params.id, () => { selectedWork.value = null })
useHead({ title: computed(() => `${person.value?.name || 'Հայ հայտնիներ'} — FACTUM`) })
useSavedScroll(() => route.hash === '#saved-person' ? 'saved-person' : undefined)
</script>

<template>
  <main class="shell page-with-back py-10">
    <NuxtLink to="/people" class="gold">← Հայ հայտնիներ</NuxtLink>
    <article v-if="person" id="saved-person" tabindex="-1" class="panel p-7 mt-5 saved-destination">
      <div class="person-biography-intro">
        <div class="person-biography-photo"><PersonPortrait :person="person" size="biography" /></div>
        <div>
          <h1 class="heading">{{ person.name }}</h1>
          <p class="gold text-xl">{{ person.years }}</p>
          <p class="muted">{{ person.role }}</p>
          <BiographyReader v-if="person.isArmenian" :key="person.id" :person="person" />
        </div>
      </div>
      <details :key="person.id" class="person-biography mt-6">
        <summary class="biography-toggle gold">
          <span>Կենսագրություն</span>
          <span class="biography-open-label">Բացել</span>
          <span class="biography-close-label">Փակել</span>
        </summary>
        <p class="mt-6 leading-8">{{ person.bio }}</p>
      <section v-for="section in person.biographySections" :key="section.title" class="mt-8">
        <h2 class="text-xl font-bold mb-3">{{ section.title }}</h2>
        <p class="leading-8">{{ section.text }}</p>
      </section>
      <section v-if="person.timeline?.length" class="mt-8" aria-labelledby="person-timeline-title">
        <h2 id="person-timeline-title" class="text-xl font-bold mb-4">Կարևոր տարեթվեր</h2>
        <ol class="biography-timeline">
          <li v-for="event in person.timeline" :key="event.date" class="py-3">
            <strong class="gold">{{ event.date }}</strong>
            <p class="muted leading-7">{{ event.text }}</p>
          </li>
        </ol>
      </section>
      <p v-if="person.biographyDocument" class="mt-6"><a :href="person.biographyDocument.url" download class="gold underline underline-offset-4">Ներբեռնել կենսագրությունը · DOCX</a></p>
      <p v-if="person.source" class="muted text-sm mt-6"><a :href="person.source.url" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4">Աղբյուր՝ {{ person.source.name }} ↗<span class="sr-only"> (բացվում է նոր ներդիրում)</span></a></p>
      </details>
      <PersonMonuments :person-id="person.id" :name="person.name" />
      <h2 class="text-xl font-bold mt-8 mb-3">Հայտնի գործեր և ձեռքբերումներ</h2>
      <p class="muted mb-4">Սեղմիր գործի անվան վրա՝ դրա մասին ավելին իմանալու համար։</p>
      <div class="grid gap-6">
        <section v-for="group in workGroups" :key="group.title">
          <h3 v-if="group.title" class="text-lg font-bold gold mb-3">{{ group.title }}</h3>
          <div class="grid gap-3">
        <div v-for="{ work, index } in group.items" :key="work" class="rounded-xl border border-amber-300/20 overflow-hidden">
          <button type="button" class="w-full text-left p-4 flex justify-between items-center gap-3 hover:bg-white/5 transition-colors" :aria-expanded="selectedWork === work" @click="selectedWork = selectedWork === work ? null : work">
            <span class="font-semibold"><span class="gold mr-2">{{ index + 1 }}.</span>{{ work }}</span>
            <span class="gold text-xl" aria-hidden="true">{{ selectedWork === work ? '−' : '+' }}</span>
          </button>
          <p v-if="details[work]?.date" class="gold text-sm px-4 pb-3">Տարեթիվ՝ {{ details[work].date }}</p>
          <NuxtLink :to="`/works/${person.id}/${index}`" class="gold inline-flex px-4 pb-3 hover:underline">Դիտել գործի էջը →</NuxtLink>
          <div v-if="selectedWork === work" class="p-4 pt-0 border-t border-amber-300/20 leading-8">
            <p class="mt-3">{{ details[work]?.description || 'Այս գործը կարևոր տեղ ունի տվյալ գործչի ստեղծագործական և գիտական ժառանգության մեջ։' }}</p>
          </div>
        </div>
          </div>
        </section>
      </div>
      <div class="flex gap-3 mt-7 flex-wrap">
        <button class="btn-secondary" @click="toggleSaved('person-' + person.id, $event)">{{ saved.includes('person-' + person.id) ? '★ Պահպանված' : '☆ Պահպանել' }}</button>
      </div>
    </article>
    <p v-else class="muted mt-6">Այս կենսագրությունը չի գտնվել։</p>
  </main>
</template>

<style scoped>
.person-biography { border: 1px solid #dfc38f44; border-radius: 12px; padding: 16px; }
.biography-toggle { display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; list-style: none; font-weight: 600; border-radius: 4px; }
.biography-toggle::-webkit-details-marker { display: none; }
.biography-toggle:hover { color: #fff; }
.biography-toggle:focus-visible { outline: 2px solid currentColor; outline-offset: 6px; }
.biography-close-label, .person-biography[open] .biography-open-label { display: none; }
.person-biography[open] .biography-close-label { display: inline; }

.biography-timeline { border-inline-start: 2px solid #dfc38f44; padding-inline-start: 20px; }
.person-biography-intro { display: grid; grid-template-columns: minmax(0,320px) minmax(0,1fr); gap: 32px; align-items: start; }
.person-biography-photo { width: 100%; }
@media (max-width: 767px) {
  .person-biography-intro { grid-template-columns: 1fr; gap: 24px; }
  .person-biography-photo { max-width: 360px; margin-inline: auto; }
}
</style>
