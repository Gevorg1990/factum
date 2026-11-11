export type ArticleVideoSource = { kind: 'file' | 'embed'; src: string }

// Only known video providers become iframes. Other HTTPS URLs must be video files.
export function articleVideoSource(value: string): ArticleVideoSource | null {
  const input = value.trim()
  if (/^\/videos\/[^?#\\]+\.(mp4|webm)$/i.test(input) && !input.split('/').includes('..')) return { kind: 'file', src: input }
  let url: URL
  try { url = new URL(input) } catch { return null }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
  const host = url.hostname.toLowerCase()
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1]
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` } : null
  }
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = url.pathname.match(/^\/(?:video\/)?(\d+)\/?$/)?.[1]
    return id ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}?autoplay=1` } : null
  }
  return /\.(mp4|webm)$/i.test(url.pathname) ? { kind: 'file', src: url.href } : null
}
