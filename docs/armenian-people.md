# Armenian people directory

The `/people` directory includes 101 Armenian figures across eight fields. The four existing Armenian IDs (`tumanyan`, `komitas`, `mashtots`, `hambardzumyan`) and all their work URLs are retained. Einstein remains in the general biography catalog for existing links and search, but does not appear in the Armenian directory.

`data/armenianPeople.ts` contains the 96 foundation biographies and additional individual profiles, dates, fields, references, and an individually written description and significance for one work or achievement each. Early historical dates and disputed attributions are qualified in the entries. Contemporary biographies use birth years and dated achievements rather than changing affiliations or current rankings. Institutional, museum, publisher and federation references override general encyclopedia references where available.

Shared fields are declared in `data/personTypes.ts`. `data/content.ts` collects the biography records and identifies Armenian entries with explicit metadata. `data/peopleWorks.ts` includes each new work in the existing work-page catalog.

The directory searches names, roles, biographies and works, combines the search with field filters, and initially renders 20 people. The homepage selects five distinct random Armenian figures on mount and rotates within that selection.

Portraits use supplied local pictures where available and Wikipedia thumbnail lookups for other people. Each new record specifies the reference language and title. Thumbnail requests happen on the client and successful API responses are cached; a missing or unavailable image leaves the existing named placeholder. No new portraits are generated.

`npm run test:people` checks a minimum of 101 people, unique IDs and names, field coverage, preservation of old biographies, complete work descriptions, full-catalog directory search and filters, pagination, and portrait reference routing. The production build and in-process Nitro SSR checks cover biography and work pages.

Vazgen Sargsyan's structured profile lives in `data/biographies/Vazgen_Sargsyan_Biography.ts` and is based on `public/biography/Vazgen_Sargsyan_kensagrutyun.docx`. Its full sections and timeline are rendered on the biography page; the original document remains downloadable. The displayed text corrects the second defense-minister appointment to 1995 and identifies Ararat as a village, following the official government and defense biographies. The original uploaded document is unchanged.

Arno Babajanyan's existing profile is extended by `data/biographies/Arno_Babajanyan_Biography.ts` from `public/biography/Arno_Babajanyan_Biography.docx`. The biography sections, timeline and document link are available on his page. The burial location is corrected to the city pantheon using Armenian National Music; the original document remains unchanged. His original Heroic Ballad work stays at index 0; six supplied works are appended.

Biography pages include `PersonMonuments` when a verified monument record is available. See `docs/person-monuments.md` for references and image credits.

Tumanyan's profile is extended from `public/biography/Hovhannes_Tumanyan_Biography.docx` by `data/biographies/Hovhannes_Tumanyan_Biography.ts`, including its full sections, timeline and document link. The original three works retain their indices; six works from the document are appended with descriptions.

All 102 profiles (101 Armenian figures and Einstein) now have individual files in `data/biographies/`, named `Name_Surname_Biography.ts`, and a matching registry in `index.ts`. The six uploaded biographies are retained; the remaining 96 have individually written sections, a chronology, a reference link and a generated DOCX in `public/biography/`. Every biography is initially collapsed on its profile page. See `data/biographies/README.md` for the editing convention.
