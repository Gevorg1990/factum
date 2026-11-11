<script setup lang="ts">
import { allEncyclopediaQuestions, subjects, collectionSubjects } from '~/data/content'
import { atomFacts, atomParticles, atomSections } from '~/data/atomArticle'

const route = useRoute()
let question = allEncyclopediaQuestions.find(item => item.id === route.params.id)
if (!question && typeof route.params.id === 'string' && /^literature-intro-[ab]-\d+-[ab]$/.test(route.params.id)) {
  const { legacyLiteratureQuestions } = await import('~/data/encyclopedia/literatureLegacy')
  question = legacyLiteratureQuestions.find(item => item.id === route.params.id)
}
if (!question && typeof route.params.id === 'string' && /^health-(?:heart|lungs|habits(?:-b)?|mind)-\d+-[ab]$/.test(route.params.id)) {
  const { legacyHealthQuestions } = await import('~/data/encyclopedia/healthLegacy')
  question = legacyHealthQuestions.find(item => item.id === route.params.id)
}
const published = await usePublishedContent('ARTICLE', question ? [question] : [], { key: String(route.params.id) })
question = published[0]
if (!question) throw createError({ statusCode: 404, statusMessage: 'Նյութը չի գտնվել' })
const subject = [...subjects, ...collectionSubjects].find(item => item.slug === question?.subject)
const isAtomArticle = computed(() => question?.id === 'c1')
const { saved, markRead, toggleSaved } = useProgress()

onMounted(() => {
  if (question) markRead(question.id)
})

useHead({ title: `${question?.title || 'Նյութ'} — FACTUM` })
useSavedScroll(() => route.hash === '#saved-article' ? 'saved-article' : undefined)
</script>

<template>
  <main class="shell page-with-back py-10 max-w-5xl">
    <NuxtLink :to="`/subjects/${question?.subject || ''}`" class="gold">
      ← {{ subject?.name || 'Հանրագիտարան' }}
    </NuxtLink>

    <article v-if="question" id="saved-article" tabindex="-1" class="panel mt-5 atom-article saved-destination">
      <div class="atom-article-intro">
        <div>
          <p class="gold text-sm mb-3">FACTUM · {{ subject?.name }}</p>
          <h1 class="heading">{{ question.title }}</h1>
          <p class="atom-article-lead">{{ question.answer }}</p>
          <p v-if="isAtomArticle" class="muted mt-4 leading-8">
            Բացահայտիր՝ ինչից է կազմված ատոմը, ինչպես են տարբերվում
            քիմիական տարրերը և ինչու է ատոմային աշխարհը կարևոր մեր կյանքում։
          </p>
        </div>
        <img
          v-if="question.image || isAtomArticle"
          class="atom-article-hero"
          :src="question.image || '/images/physics-art.jpg'"
          :alt="question.image ? question.title : 'Ատոմի լուսարձակող գիտական գեղարվեստական պատկեր'"
          loading="lazy"
        >
      </div>

      <section v-if="!isAtomArticle || question.video" class="atom-article-section">
        <h2>Մանրամասն</h2>
        <p>{{ question.detail }}</p>
        <ArticleVideo v-if="question.video" :src="question.video" :title="question.title" :poster="question.image" />
      </section>

      <template v-if="isAtomArticle">
        <p class="atom-image-caption">
          Պատկերը գեղարվեստական պատկերացում է․ էլեկտրոնները իրականում չեն շարժվում
          այսպիսի հստակ գծված ուղեծրերով։
        </p>

        <section v-for="(section, sectionIndex) in atomSections" :key="section.title" class="atom-article-section">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>

          <!-- Երկրորդ պատկեր՝ ատոմներից մոլեկուլների առաջացումը պատկերավոր բացատրելու համար։ -->
          <figure v-if="sectionIndex === 2" class="atom-article-illustration">
            <img
              src="/images/chemistry-art.jpg"
              alt="Միմյանց միացած ատոմների և մոլեկուլային կապերի գեղարվեստական պատկեր"
              loading="lazy"
            >
            <figcaption>
              Ատոմները միանում են քիմիական կապերով՝ առաջացնելով մոլեկուլներ։
              Պատկերը գեղարվեստական ներկայացում է, ոչ թե ատոմների իրական լուսանկար։
            </figcaption>
          </figure>
        </section>

        <section class="atom-article-section">
          <h2>Ատոմի երեք հիմնական մասնիկները</h2>
          <div class="atom-particles-grid">
            <div v-for="particle in atomParticles" :key="particle.name" class="atom-particle-card">
              <h3>{{ particle.name }}</h3>
              <p><strong>Լիցք՝</strong> {{ particle.charge }}</p>
              <p><strong>Գտնվելու վայր՝</strong> {{ particle.location }}</p>
              <p>{{ particle.detail }}</p>
            </div>
          </div>
        </section>

        <section class="atom-article-section">
          <h2>Հետաքրքիր փաստեր ատոմների մասին</h2>
          <ul class="atom-facts-list">
            <li v-for="fact in atomFacts" :key="fact">{{ fact }}</li>
          </ul>
        </section>
      </template>

      <template v-else>
        <section v-for="section in question.sections" :key="section.title" class="atom-article-section">
          <h2>{{ section.title }}</h2>
          <p>{{ section.text }}</p>
        </section>
        <section v-if="question.example" class="atom-article-section encyclopedia-example">
          <h2>Օրինակով հասկանանք</h2>
          <p>{{ question.example }}</p>
        </section>
        <section v-if="question.takeaway" class="atom-article-section">
          <h2>Հիշիր հիմնականը</h2>
          <p>{{ question.takeaway }}</p>
        </section>
      </template>

      <footer v-if="question.source" class="encyclopedia-article-source">
        <a :href="question.source.url" target="_blank" rel="noopener noreferrer">Աղբյուր՝ {{ question.source.name }} ↗<span class="sr-only"> (բացվում է նոր ներդիրում)</span></a>
      </footer>

      <div class="flex flex-wrap gap-3 mt-8">
        <button class="btn-secondary" @click="toggleSaved(question.id, $event)">
          {{ saved.includes(question.id) ? '★ Պահպանված' : '☆ Պահպանել' }}
        </button>
      </div>
    </article>
    <p v-else>Նյութը չի գտնվել։</p>
  </main>
</template>

<style scoped>
.encyclopedia-example { padding: 20px; border: 1px solid #dfc38f33; border-radius: 14px; background: #dfc38f0a; }
.encyclopedia-article-source { margin-top: 28px; padding-top: 20px; border-top: 1px solid #8997c033; font-size: 13px; line-height: 1.8; }
.encyclopedia-article-source a { color: #a8b8d4; text-decoration: underline; text-underline-offset: 4px; }
.encyclopedia-article-source a:focus-visible { outline: 2px solid #dfc38f; outline-offset: 4px; }
:global(html.factum-light) .encyclopedia-article-source a { color: #4e6481; }
</style>
