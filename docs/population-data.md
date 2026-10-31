# Country population estimates

The map and the world-facts cards share `usePopulationEstimates`. On client mount,
it requests `/api/population` once for both components, without blocking the map.

The endpoint uses the World Bank Indicators API, indicator `SP.POP.TOTL`, source 2,
with `mrnev=1` to retrieve the latest nonempty observation for each country. It
requests up to 400 records and rejects incomplete multipage responses. Successful
responses are cached for 24 hours, with stale-while-revalidate refresh.

API reference:
https://datahelpdesk.worldbank.org/knowledgebase/articles/898581

Every value retains its observation year and a source link. An observation is
never relabeled with the current year. Reviewed baseline data and the map's
Natural Earth estimate remain available while loading or if retrieval fails.
A newer baseline observation cannot be replaced by an older API observation.
The UI reports retrieval failures and continues showing the actual fallback year.

Run `node --test tests/population.test.mjs` for parsing, year selection, consistency
between the map and facts, and controlled endpoint errors.
