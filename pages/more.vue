<script setup lang="ts">
const cards = [
  { to: '/periodic-table', name: '⚛ Մենդելեևի աղյուսակ', description: 'Բացահայտիր բոլոր 118 քիմիական տարրերի հատկությունները' },
  { to: '/about', name: 'ℹ️ Մեր մասին', description: 'FACTUM-ի մասին տեղեկություններ (պատրաստման փուլում)' },
  { to: '/facts', name: '✨ Հետաքրքիր փաստեր', description: 'Հետաքրքիր փաստեր և բացահայտումներ' },
  { to: '/videos', name: '🎬 Տեսանյութեր', description: 'Կրթական տեսանյութերի բաժին' },
  { to: '/support', name: '❤️ Աջակցիր FACTUM-ին', description: 'Կամավոր աջակցություն' },
  { to: '/library', name: '📚 Գրադարան', description: 'Պահպանիր սիրելի գրքերը' },
]
</script>

<template>
  <main class="shell py-10">
    <h1 class="heading">Բացահայտիր ավելին</h1>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink v-for="card in cards" :key="card.to" :to="card.to" class="panel card-hover p-6">
        <h2 class="font-bold text-lg">{{ card.name }}</h2>
        <p class="muted text-sm mt-3">{{ card.description }}</p>
      </NuxtLink>
    </div>
  </main>
</template>
