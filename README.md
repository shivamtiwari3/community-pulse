# Community Pulse

**Which UAE neighbourhoods are short on schools, clinics, transit, shops and parks, and what to build first.**

[Live demo](https://shivamtiwari3.github.io/community-pulse/)

Community Pulse is the first prototype behind [Xpand](https://github.com/shivamtiwari3/Expand), built for the Abu Dhabi AI PropTech Challenge. It compares real amenity counts against population for 33 districts across all 7 emirates. It ranks the gaps and turns each one into a recommendation.

## What it does

- **Gap map.** Every district on a Leaflet map, coloured by how underserved it is across education, healthcare, mobility, retail, community and government services.
- **Gap engine.** Amenities per resident, by category and district (`lib/engine.ts`). Each gap becomes an action like "Open clinic or pharmacy" or "Add bus route or metro link".
- **Market and Land views.** Listings, transactions, parcels and investor fit by district, to judge whether a gap is commercially worth filling.
- **Live view.** Queries OpenStreetMap from the browser for fresh amenity counts in any district or emirate.
- **Ask AI.** A rule-based Q&A panel over the same data. It runs in the browser, with no LLM call.

## Data

| Source | What |
|---|---|
| OpenStreetMap (Overpass API) | 31,128 amenities across 33 districts, nodes and ways, snapshot June 2026 (`public/uae_real_amenities.json`, `public/osm_amenities.csv`) |
| SCAD, Dubai Statistics Center and other emirate statistics offices | District population |
| Synthetic | Listings, transactions, parcels, communities and investors (`public/sample_*.csv`) for the market views |

Amenity data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the ODbL.

## Run it

```bash
npm install
npm run dev                    # http://localhost:3000
node scripts/fetch-real-data.mjs   # refresh the OSM snapshot
```

The site is a static export, so there is no backend and you don't need any keys. GitHub Pages deploys it on every push to `main` (`.github/workflows/pages.yml`).

Built with Next.js 16, React 19, Tailwind 4, Leaflet, Recharts and Framer Motion.

## License

MIT
