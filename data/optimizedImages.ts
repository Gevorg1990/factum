// Card-size WebP variants; content hashes allow safe long-lived CDN caching.
const images: Record<string, string> = {
  "/images/chemistry-art.jpg": "/images/optimized/chemistry-art-68cb23965b.webp",
  "/images/glowing_atomic.jpg": "/images/optimized/glowing_atomic-b2b2506372.webp",
  "/images/solar_system.jpg": "/images/optimized/solar_system-2a149a2be2.webp",
  "/images/history.jpg": "/images/optimized/history-bc707c9d4b.webp",
  "/images/natural_science.jpg": "/images/optimized/natural_science-c20c5b483b.webp",
  "/images/technology-art.jpg": "/images/optimized/technology-art-1c0313cbd8.webp",
  "/images/art-art.jpg": "/images/optimized/art-art-46ce31606a.webp",
  "/images/geography-art.jpg": "/images/optimized/geography-art-0b2e092e2b.webp",
  "/images/musical.jpg": "/images/optimized/musical-81d16b4b01.webp",
  "/images/film.jpg": "/images/optimized/film-f5f6a80113.webp",
  "/images/historical_figures.jpg": "/images/optimized/historical_figures-c386436d70.webp",
  "/images/bible.jpg": "/images/optimized/bible-b846c66c03.webp",
  "/images/language.jpg": "/images/optimized/language-1ebd4747fa.webp",
  "/images/butterfly-poster.jpg": "/images/optimized/butterfly-poster-ba96016f61.webp",
  "/images/mathematics-poster.jpg": "/images/optimized/mathematics-poster-a8b4f5a4be.webp",
  "/images/space-art.jpg": "/images/optimized/space-art-2f2239150d.webp",
  "/images/million-art.jpg": "/images/optimized/million-art-d0d4634d21.webp",
  "/images/genius-art.jpg": "/images/optimized/genius-art-c410cd085a.webp",
  "/images/logic-art.jpg": "/images/optimized/logic-art-a9bd59eb1d.webp"
}

export function optimizedImage(src: string): string { return images[src] || src }
