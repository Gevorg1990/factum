<script setup lang="ts">
import { Bot, X, Send, LoaderCircle, Sparkles } from 'lucide-vue-next'

interface AiResponse {
  available: boolean
  answer?: string
  message?: string
}

interface Message {
  role: 'user' | 'assistant'
  text: string
}

const isOpen = ref(false)
const question = ref('')
const isLoading = ref(false)
const messages = ref<Message[]>([])
const conversation = ref<HTMLElement | null>(null)

watch(messages, async () => {
  await nextTick()
  conversation.value?.scrollTo({ top: conversation.value.scrollHeight, behavior: 'smooth' })
}, { deep: true })

async function askQuestion() {
  const text = question.value.trim()
  if (!text || isLoading.value) return

  if (text.length > 500) {
    messages.value.push({ role: 'assistant', text: 'Հարցը պետք է լինի առավելագույնը 500 նիշ։' })
    return
  }

  messages.value.push({ role: 'user', text })
  question.value = ''
  isLoading.value = true

  try {
    const response = await $fetch<AiResponse>('/api/ai', {
      method: 'POST',
      body: { question: text }
    })
    messages.value.push({
      role: 'assistant',
      text: response.available
        ? (response.answer || 'Պատասխան չստացվեց։')
        : (response.message || 'AI ծառայությունը դեռ միացված չէ։')
    })
  } catch {
    messages.value.push({
      role: 'assistant',
      text: 'Այս պահին հնարավոր չէ ստանալ պատասխանը։ Փորձիր ավելի ուշ։'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="factum-ai-widget">
    <section v-if="isOpen" class="factum-ai-panel" aria-label="COGNITIO AI օգնական">
      <header class="factum-ai-panel-header">
        <span class="factum-ai-panel-heading"><Sparkles :size="19" /> COGNITIO AI</span>
        <button type="button" class="factum-ai-close" aria-label="Փակել AI օգնականը" @click="isOpen = false">
          <X :size="20" />
        </button>
      </header>

      <div ref="conversation" class="factum-ai-messages" role="log" aria-live="polite">
        <div v-if="messages.length === 0" class="factum-ai-welcome">
          <Bot :size="34" />
          <strong>Ի՞նչ կուզես իմանալ։</strong>
          <p>Գրիր ցանկացած հարց։ AI-ն կփորձի պատասխանել հայերեն։</p>
        </div>
        <p v-for="(message, index) in messages" :key="index"
           :class="['factum-ai-message', message.role === 'user' ? 'factum-ai-user' : 'factum-ai-answer']">
          {{ message.text }}
        </p>
        <div v-if="isLoading" class="factum-ai-loading"><LoaderCircle :size="18" class="animate-spin" /> Պատասխանում եմ…</div>
      </div>

      <form class="factum-ai-form" @submit.prevent="askQuestion">
        <label for="factum-ai-question" class="sr-only">Քո հարցը</label>
        <input id="factum-ai-question" v-model="question" type="text" maxlength="500"
               placeholder="Գրիր քո հարցը…" autocomplete="off" />
        <button type="submit" :disabled="!question.trim() || isLoading" aria-label="Ուղարկել հարցը">
          <Send :size="19" />
        </button>
      </form>
      <p class="factum-ai-disclaimer">AI-ի պատասխանները կարող են սխալներ պարունակել։</p>
    </section>

    <button v-if="!isOpen" type="button" class="factum-ai-trigger" :aria-expanded="isOpen"
            aria-label="Բացել COGNITIO AI որոնումը" @click="isOpen = !isOpen">
      <Bot :size="27" />
    </button>
  </div>
</template>
