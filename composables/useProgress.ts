import { effectScope, onMounted, ref, watch } from 'vue'
import { requestSaveAnimation } from '../utils/saveAnimation'

// Shared state for all pages in the current browser tab.
const read = ref<string[]>([])
const saved = ref<string[]>([])
const library = ref<string[]>([])

let initialized = false
let listenersInstalled = false

function loadList(key: string): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function initializeProgress() {
  if (initialized || !import.meta.client) return

  // Load saved values BEFORE installing persistence watchers, so an empty
  // initial state cannot overwrite bookmarks during a page refresh.
  saved.value = loadList('factum-saved')
  library.value = loadList('factum-library')
  read.value = loadList('factum-read')
  initialized = true

  if (!listenersInstalled) {
    listenersInstalled = true
    // Persistence belongs to the browser tab, not the first mounted page.
    // A detached scope keeps these watchers alive after that page unmounts.
    effectScope(true).run(() => {
      watch(saved, value => window.localStorage.setItem('factum-saved', JSON.stringify(value)), { flush: 'sync' })
      watch(library, value => window.localStorage.setItem('factum-library', JSON.stringify(value)), { flush: 'sync' })
      watch(read, value => window.localStorage.setItem('factum-read', JSON.stringify(value)), { flush: 'sync' })
    })

    // Keep multiple tabs consistent without a server-side account.
    window.addEventListener('storage', event => {
      if (event.key === 'factum-saved') saved.value = loadList('factum-saved')
      if (event.key === 'factum-library') library.value = loadList('factum-library')
      if (event.key === 'factum-read') read.value = loadList('factum-read')
    })
  }
}

function toggle(list: typeof saved, id: string) {
  list.value = list.value.includes(id)
    ? list.value.filter(item => item !== id)
    : [...list.value, id]
}

export function useProgress() {
  // During SSR do not access window/localStorage. On the client restore
  // the saved data when the page mounts (including after a hard refresh).
  onMounted(initializeProgress)

  return {
    read,
    saved,
    library,
    markRead: (id: string) => {
      if (!read.value.includes(id)) read.value = [...read.value, id]
    },
    removeRead: (id: string) => { read.value = read.value.filter(item => item !== id) },
    removeSaved: (id: string) => { saved.value = saved.value.filter(item => item !== id) },
    removeBook: (id: string) => { library.value = library.value.filter(item => item !== id) },
    toggleSaved: (id: string, event?: Event) => {
      const adding = !saved.value.includes(id)
      toggle(saved, id)
      if (adding) requestSaveAnimation(event)
    },
    toggleBook: (id: string) => toggle(library, id),
  }
}
