<script setup lang="ts">
import { armenianPeople } from '~/data/content'
import { Search } from 'lucide-vue-next'
const search = ref('')
const category = ref('all')
const pageSize = 20
const limit = ref(pageSize)
const categories = [...new Set(armenianPeople.flatMap(person => person.category ? [person.category] : []))]
const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase('hy-AM').trim()
const filtered = computed(() => {
  const term = normalize(search.value)
  return armenianPeople.filter(person =>
    (category.value === 'all' || person.category === category.value)
    && (!term || normalize([person.name, person.role, person.bio, ...person.works, ...(person.biographySections || []).flatMap(section => [section.title, section.text])].join(' ')).includes(term)),
  )
})
const visible = computed(() => filtered.value.slice(0, limit.value))
watch([search, category], () => { limit.value = pageSize }, { flush: 'sync' })
function resetFilters() { search.value = ''; category.value = 'all' }
useHead({ title: 'Հայ հայտնիներ — FACTUM', meta: [{ name: 'description', content: `Բացահայտիր ${armenianPeople.length} հայ հայտնի գործիչների կյանքը, ստեղծագործություններն ու ձեռքբերումները՝ գրականությունից և արվեստից մինչև գիտություն ու սպորտ։` }] })
</script>

<template>
  <main class="shell py-10 people-directory">
    <h1 class="heading">Հայ հայտնիներ</h1>
    <p class="muted mb-6">{{ armenianPeople.length }} գործիչ · կենսագրություններ, հայտնի գործեր և ձեռքբերումներ։ Ընտրիր անունը կամ քեզ հետաքրքրող բնագավառը։</p>
    <label class="people-search">
      <Search :size="19" aria-hidden="true" />
      <span class="sr-only">Որոնել հայ հայտնի գործիչներին</span>
      <input v-model="search" type="search" placeholder="Որոնիր անունը, մասնագիտությունը կամ գործը…">
    </label>
    <div class="people-categories" role="group" aria-label="Գործիչների բնագավառներ">
      <button type="button" :aria-pressed="category === 'all'" @click="category = 'all'">Բոլորը</button>
      <button v-for="item in categories" :key="item" type="button" :aria-pressed="category === item" @click="category = item">{{ item }}</button>
    </div>
    <p class="muted text-sm my-5" role="status">Ցուցադրված է {{ visible.length }} / {{ filtered.length }} գործիչ</p>
    <div id="people-list" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink v-for="person in visible" :key="person.id" :to="'/people/' + person.id" class="panel card-hover overflow-hidden">
        <PersonPortrait :person="person" size="large" />
        <div class="p-4">
          <h2 class="text-lg font-bold">{{ person.name }}</h2>
          <p class="gold mt-1">{{ person.years }}</p>
          <p class="muted mt-2 text-sm">{{ person.role }}</p>
          <span class="gold text-sm block mt-3">Կարդալ կենսագրությունը →</span>
        </div>
      </NuxtLink>
    </div>
    <div v-if="visible.length < filtered.length" class="flex justify-center mt-7">
      <button type="button" class="btn-secondary" aria-controls="people-list" @click="limit += pageSize">Բեռնել ավելին · {{ Math.min(pageSize, filtered.length - visible.length) }} գործիչ</button>
    </div>
    <div v-if="!filtered.length" class="panel p-7 text-center">
      <p class="muted mb-4">Այս որոնմամբ գործիչ չի գտնվել։ Փորձիր այլ անուն կամ բնագավառ։</p>
      <button type="button" class="btn-secondary" @click="resetFilters">Մաքրել որոնումն ու զտիչները</button>
    </div>
  </main>
</template>

<style scoped>
.people-search { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid #8997c044; border-radius: 14px; margin-bottom: 18px; color: #dfc38f; }
.people-search input { flex: 1; width: 100%; min-width: 0; background: transparent; color: inherit; outline: none; }
.people-search:focus-within { outline: 2px solid #dfc38f; outline-offset: 3px; }
.people-categories { display: flex; flex-wrap: wrap; gap: 8px; }
.people-categories button { padding: 9px 13px; border: 1px solid #8997c044; border-radius: 20px; font-size: 12px; transition: background-color .18s ease, border-color .18s ease; }
.people-categories button[aria-pressed="true"] { color: #dfc38f; border-color: #dfc38f; background: #dfc38f18; }
.people-directory :is(a,button):focus-visible { outline: 2px solid #dfc38f; outline-offset: 3px; }
@media (hover: hover) { .people-categories button:hover { border-color: #dfc38f99; background: #dfc38f18; } }
:global(html.factum-light) .people-categories button[aria-pressed="true"] { color: #78501b; border-color: #a87e3a; }
@media (prefers-reduced-motion: reduce) { .people-categories button { transition: none; } }
</style>
