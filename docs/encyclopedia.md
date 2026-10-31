# Encyclopedia question catalog

The catalog contains 1,567 questions in 15 subjects/collections, with at least 100 unique question titles per subject. Existing article IDs are retained. The original long-form lessons and atom article remain available.

## Organization

- `data/encyclopedia/<subject>.ts`: authored foundation questions grouped by subject.
- `data/encyclopedia/bank.ts`: expands each authored pair of related questions into two separately addressable articles, using the other answer as contextual explanation. No random or synthetic factual combinations are used.
- `data/encyclopedia/index.ts`: collects subject editions.
- `data/content.ts`: combines old and new entries, giving existing IDs precedence for identical titles within a subject.

Each pipe-delimited row has four fields: first question, first answer, related question, related answer. Each question has a distinct learning target. Sources are reading references for the subject; the biography and Bible banks link to individual biographies and passages. Short foundation entries are introductory explanations; they are not replacements for the referenced textbooks or full historical studies.

## Growing to thousands

Append rows to an existing edition, or add another edition with a new permanent name. Do not reorder existing rows: the edition and row numbers form saved article IDs. Correcting text does not require changing its ID. Keep source links specific to the material being added. Additional structured `sections`, `example`, and `takeaway` fields are supported for longer articles.

Subject pages show only the short answer when a question is expanded. Explanations, related questions, examples and takeaways are reserved for the article page, so following the detailed-explanation link reveals additional content. Subject pages initially render 20 questions and load another 20 on request. Search and progress filters always cover the full subject, resetting the displayed limit when changed. The search API constructs the static search records once per server worker. The current catalog is still bundled locally; moving to server-side catalog pagination or CMS queries is the next performance step when the full catalog reaches tens of thousands of entries.

## Validation

Run `npm run test:encyclopedia` for per-subject minimum counts, distinct titles, globally unique IDs, nonempty answers/explanations, old saved IDs, pagination, full-subject search, and progress filters. Search integration remains covered by `tests/search.test.mjs` and `tests/home-search.test.mjs`. `npm run build` checks the complete Nuxt build.
