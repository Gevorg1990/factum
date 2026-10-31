# Interesting facts

The shared catalog is `data/facts.ts`. `data/content.ts` re-exports it so the
homepage, search API and saved items use the same IDs and content.

The initial catalog contains 100 Armenian facts across 20 topics. Each item
includes a direct source link. Sources include NASA, NOAA, NIH, USGS, NPS,
CERN, UNESCO and museum publications. Review the linked source when changing
an item; do not publish generated claims without checking their source.

To add a fact, provide a unique stable ID, an existing category ID, an Armenian
title and explanation, and the source's name and HTTPS URL. Images are optional;
only use an image that matches the fact. The fact JPEGs were generated
with AI and are illustrative, rather than documentary photographs.

Do not rename published IDs: bookmarks use them. In particular, retain `f1`,
`f2`, and `f3`. Saved links use `/facts?fact=<id>`; navigating to one clears filters
and expands the list enough to reveal the requested card.

The page interleaves topics in a stable order, showing one fact from each topic
per round. It initially renders 24 cards, then adds 24 at a time. Search checks the
title, explanation and category name and combines with the category filter.
Changing a filter resets the visible count. This is client-side pagination;
the full catalog is currently bundled. For a much larger catalog, move filtering
and pagination to a database-backed endpoint while retaining the same IDs and
bookmark behavior.

Run `npm run test:facts` to check catalog integrity, filters, pagination, and
bookmarks. Run `npm run build` to check production compilation.

The homepage uses one fixed knowledge-themed image (`public/images/Earth_floating_with_digital_netw…_f11676c3.jpg`)
and selects five facts from the entire catalog on mount and every 60 seconds.
It prefers entries outside the previous five, whose IDs are stored in
sessionStorage. Facts do not need an individual image to appear on the homepage.
The facts list remains text-only.
