# Monuments on biography pages

`data/personMonuments.ts` contains site-specific records. A person can have multiple monuments; each record must identify the actual site and use a photograph of that site.

The initial six records are Arno Babajanyan near Swan Lake, Hovhannes Tumanyan on Freedom Square, Vahan Teryan in Circular Park, Komitas near the conservatory, Mesrop Mashtots at the Matenadaran, and Vazgen Sargsyan's bust on his namesake street in Yerevan. Locations, opening dates and creators were checked against the individual pages on Visit Yerevan, the city's official tourism website. Teryan's installation in 1999 and opening on 9 February 2000 are separate fields. An exact opening day is omitted where only the year is documented.

Photographs come from the individually identified Wikimedia Commons files, with author, license and original-file-page links rendered below each image. They load remotely through Commons file redirects. Local replacement photos can be placed in `public/images/monuments/`; update `image.src` and credit information in the record. External image downloads are restricted in this development environment, so remote image delivery must also be checked in the user's browser. An unavailable image falls back to a link to the original photograph, while the location and date remain visible.

`components/PersonMonuments.vue` renders only records for the current person. Profiles without records do not show an empty section. Maps links use the monument name, city and documented location rather than guessed coordinates. The foreground photograph is fully visible with `object-fit: contain`; a blurred decorative copy fills the frame behind it. Clicking the image opens a larger version.

Run `npm run test:monuments` for person IDs, dates, photo metadata, map queries, rendered installation/opening distinctions, and profiles without monuments. Production SSR checks cover the biography integration.

Raffi's bust at Komitas Avenue 37, in front of School 36, is recorded in the official state monument list at https://www.arlis.am/hy/acts/154750 with the year 1987. Its separate opening date is unverified and is omitted. The photograph is “Raffi monument Yerevan.jpg” by Vilnius, CC BY-SA 3.0. There are now seven monument records.

Standing user preference: research dedicated statues and memorials whenever a person's biography or portrait is updated, without waiting for a separate monument request. Add all independently verified sites found; absence of a catalog record does not establish that no monument exists.

Aghayan has two verified records: the 1955 bust at Kievyan Street 9, Yerevan (School 63, sculptor Yerem Vardanyan), and the 1976 monument by the former city library in Dilijan. The sources are the Yerevan and Tavush state monument registers. Their respective photographs are credited to Kareyac (CC BY-SA 4.0) and Beko (CC BY-SA 3.0).

Aghayan’s birthplace commemoration in Bolnis-Khachen, Georgia, is included in his biography: his family home as a memorial museum, literary celebrations and a school named after him. References: https://armenpress.am/hy/article/392039 and https://armenpress.am/hy/article/415441. A separate birthplace statue and its photograph have not been verified; do not reuse the Yerevan or Dilijan photograph for that location.

The Aghayan Yerevan card now links to the Armenian Wikipedia article specifically about that bust. Its replacement photo is “ՂԱԶԱՐՈՍ ԱՂԱՅԱՆ (1).JPG” by Armineaghayan (CC BY-SA 3.0), displayed with a cover fit and upper-center focus. Other records retain full-image containment unless explicitly configured. The state register remains the historical verification reference above.

Aznavour's profile includes the Gyumri statue (2001, Samvel Petrosyan and Jim Torosyan; contemporaneous Armenpress report) and Yerevan's “La Bohème” monument (opened 18 July 2025, David Minasyan; Visit Yerevan). Photographs are individually identified Commons files by Rita Willaert (CC BY 2.0) and Armenian World (CC BY 4.0). Their attribution-only licenses are preserved separately from CC BY-SA.

Alikhanov's ITEP memorial plaque is recorded at Bolshaya Cheryomushkinskaya 25, building 1, Moscow, based on the illustrated survey at https://russia-artsakh.ru/node/3007. The inscription's 1945–1968 dates are his period of work, not an installation date. The record deliberately omits the unverified installation year and photograph. Records may omit `image`; the component then renders the location, map and reference without a photo placeholder.
