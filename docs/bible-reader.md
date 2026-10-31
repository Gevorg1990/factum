# In-page Armenian Bible reader

The reader uses **modern Eastern Armenian**: New Revised Ararat (Նոր վերանայված
Արարատ, ՆՎԱԱ), Bible Society of Armenia, 2018, Bible.com version 2329.
Publisher/version: https://www.bible.com/hy/versions/2329
Language background: https://www.biblesociety.am/eng/1/Main

The API `GET /api/bible/chapter?book=<catalog-id>&chapter=<number>` fetches the
selected version's chapter page. It extracts `props.pageProps.chapterInfo.content`
from `__NEXT_DATA__` (or canonical verse spans when directly present), then reads
only content spans inside matching book/chapter references. Both plain USFM
class names and rendered CSS-module class names are recognized; verse identity
comes from the `data-usfm` reference rather than a particular CSS class. Labels, notes,
headings, scripts, and navigation are excluded. Text is rendered using Vue text
bindings, never upstream HTML. Verse numbering and Armenian text are validated.

Source attribution and © Bible Society in Armenia, 2018 are displayed in the
reader. This is a copyrighted modern edition, not a public-domain edition.
No blanket redistribution license is claimed. The direct publisher-hosted reading
link remains available if the upstream page cannot be fetched or parsed.
The reader does not fall back to Western Armenian or generate a translation.

The server accepts only catalog IDs and valid chapters and uses fixed source
URLs. Successful chapters are cached for 24 hours under a separate Eastern
Armenian cache namespace so previous Western Armenian responses cannot be reused.
The client cancels obsolete requests and ignores stale responses.

The text area scrolls within a limited height. The expand button opens a
viewport-filling native dialog with the same reader state, font controls, and
chapter navigation. Escape or the collapse button closes it; background
scrolling is locked while open and restored on close or unmount. Its lower Next button marks the
loaded chapter as read before navigating. Progress keys and browser persistence
are unchanged. Book/chapter selection does not mark unread chapters as read.

## Verification

Run `npm run test:bible-reader`. Tests cover references, Eastern Armenian chapter
extraction, notes and nested text, invalid source pages, network errors, stale
responses, retry, and completion before navigation. Legacy Wordproject parser
fixtures remain covered, but that parser is no longer used by the reader API.

Live source pages were checked through the browsing tool. The execution sandbox
cannot resolve external hosts; live server retrieval must be verified in a
network-enabled runtime.

## Local loading failures

The Nuxt server, including localhost, needs outbound HTTPS access to
`www.bible.com`. Its terminal logs `[bible] Source request failed` for network
failures or `[bible] Source parsing failed` for incompatible markup. API codes
`BIBLE_SOURCE_UNAVAILABLE` and `BIBLE_SOURCE_FORMAT` distinguish these cases.
No chapter text is bundled for offline reading.
