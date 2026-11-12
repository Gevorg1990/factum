# Armenia village markers

© OpenStreetMap contributors. Derived database licensed under ODbL 1.0: https://opendatacommons.org/licenses/odbl/1-0/ . Attribution: https://www.openstreetmap.org/copyright . Each regional JSON includes its source, license and OSM snapshot timestamp. The published JSON files are the editable derived data; they are loaded individually only when the village layer is requested.

The extract selects `place=village` and `place=hamlet` within OpenStreetMap's Armenia administrative area. It prefers Armenian names, omits records explicitly marked abandoned/disused, and deduplicates node/area representations globally, using Wikidata identity and nearby name variants. Distinct supplied Wikidata identities are preserved. Reviewed exclusions are recorded in `data/geography/villageOverrides.json`, and each rebuild writes `data/geography/villageAudit.json`. Region membership prefers the OSM `is_in:region` tag, then point-in-polygon lookup. These community map markers are not a complete official settlement register. Population estimates are deliberately not imported.

Rebuild from an Overpass JSON export and the geoBoundaries ARM ADM1 GeoJSON:

```sh
python3 scripts/geography/prepare-armenia-villages.py /path/to/osm-export.json /path/to/regions.geojson
```

Overpass query:

```text
[out:json][timeout:90];
area["ISO3166-1"="AM"]["admin_level"="2"]->.armenia;
nwr["place"~"^(village|hamlet)$"](area.armenia);
out center tags;
```

geoBoundaries province geometry and Natural Earth Lake Sevan geometry are independent datasets with their own credits in `data/geography/armenia-map.json`.

## Village name list

The site uses this per-region catalog for the rural settlement count and an expandable, searchable name list. It does not display village point markers, settlement outlines or a village selection popup on the map. The list is loaded only when expanded and reveals 20 names at a time. Coordinates remain in the source records for provenance and audit checks, and are not plotted.
