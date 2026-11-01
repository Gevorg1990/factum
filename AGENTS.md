# People profiles

When adding or updating any famous person's biography or portrait, also research monuments dedicated to that person and add verified records to `data/personMonuments.ts`. This is the user's standing preference; do not wait for a separate request about statues.

- Include multiple confirmed sites when found, with a photograph of each actual site, documented location, date, attribution where confirmed, image credit/license, and source link.
- Prefer official monument registers, municipal sources and museums. Distinguish construction/installation from opening. Omit uncertain exact dates or creators; do not claim a person has no monument merely because none was found.
- Preserve existing monument records, person IDs and work URL indices. Biographies remain initially collapsed.
- Keep biography files in `data/biographies/Name_Surname_Biography.ts`, using capital initials. Link supplied local portraits on profile/list cards and the homepage.
- Run the relevant existing people and monument checks after changes.

# Performance and scale

FACTUM is expected to grow substantially. Treat fast loading as a standing requirement whenever adding content, media, pages, search or interactive features.

- Keep large/archive datasets out of shared client bundles; load only what the current page needs, and paginate or progressively reveal growing lists.
- Optimize images and video previews before serving them. Use responsive/lazy images, small fast-start video previews, and never download video before the user requests or previews it.
- Prefer prerendered or CDN-cacheable output for stable content. Keep server rendering and API work for genuinely dynamic data, and cache repeatable results safely.
- Avoid page-wide work that scales with the full catalog on every request or interaction. Design search and filtering so they remain responsive as collections grow.
- When changing data volume or assets, check production build output and asset sizes; verify new media paths and ensure they are not eagerly fetched.
