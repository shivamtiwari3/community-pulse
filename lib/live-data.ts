// Client-side live amenity queries against the OpenStreetMap Overpass API.
// Runs in the browser (Overpass supports CORS), so the app can be a static export.
import { withBasePath } from "./base-path";

const OVERPASS_URL = "https://maps.mail.ru/osm/tools/overpass/api/interpreter";
const SOURCE = "OpenStreetMap Overpass API (live)";
const DELAY_BETWEEN_QUERIES_MS = 2000;

interface DistrictData {
  name: string;
  emirate: string;
  bounds: [number, number, number, number];
}

export interface LiveDistrict {
  district: string;
  emirate: string;
  education: number;
  healthcare: number;
  retail: number;
  mobility: number;
  community: number;
  total: number;
}

export interface LiveDistrictResult extends LiveDistrict {
  source: string;
  timestamp: string;
}

export interface LiveScanResult {
  results: LiveDistrict[];
  count: number;
  source: string;
  coverage: string;
  timestamp: string;
}

let districtsPromise: Promise<DistrictData[]> | null = null;

function loadDistricts(): Promise<DistrictData[]> {
  if (!districtsPromise) {
    districtsPromise = fetch(withBasePath("/uae_real_amenities.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load districts: ${r.status}`);
        return r.json();
      })
      .then((data: { districts: DistrictData[] }) =>
        data.districts.map((d) => ({ name: d.name, emirate: d.emirate, bounds: d.bounds }))
      )
      .catch(() => {
        districtsPromise = null;
        return [];
      });
  }
  return districtsPromise;
}

async function queryDistrictFast(district: string, bounds: [number, number, number, number], emirate: string): Promise<LiveDistrict> {
  const [s, w, n, e] = bounds;
  const bbox = `${s},${w},${n},${e}`;

  const query = `[out:json][timeout:15];
(node["amenity"~"school|university|kindergarten"](${bbox});way["amenity"~"school|university|kindergarten"](${bbox});)->.edu;
(node["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](${bbox});way["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](${bbox});)->.health;
(node["shop"](${bbox});way["shop"](${bbox});)->.retail;
(node["highway"="bus_stop"](${bbox});node["railway"](${bbox});node["amenity"="bus_station"](${bbox});way["railway"](${bbox});)->.transit;
(node["leisure"="park"](${bbox});way["leisure"="park"](${bbox});node["amenity"~"community_centre|library|place_of_worship"](${bbox});way["amenity"~"community_centre|library|place_of_worship"](${bbox});)->.comm;
.edu out count;
.health out count;
.retail out count;
.transit out count;
.comm out count;`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();
    const els = data.elements || [];
    const education = Number(els[0]?.tags?.total || 0);
    const healthcare = Number(els[1]?.tags?.total || 0);
    const retail = Number(els[2]?.tags?.total || 0);
    const mobility = Number(els[3]?.tags?.total || 0);
    const community = Number(els[4]?.tags?.total || 0);

    return { district, emirate, education, healthcare, retail, mobility, community, total: education + healthcare + retail + mobility + community };
  } catch {
    return { district, emirate, education: 0, healthcare: 0, retail: 0, mobility: 0, community: 0, total: 0 };
  }
}

/** Live counts for a single district. Throws if the district is unknown. */
export async function fetchLiveDistrict(district: string): Promise<LiveDistrictResult> {
  const allDistricts = await loadDistricts();
  const d = allDistricts.find((dd) => dd.name === district);
  if (!d) throw new Error("District not found");
  const result = await queryDistrictFast(d.name, d.bounds, d.emirate);
  return { ...result, source: SOURCE, timestamp: new Date().toISOString() };
}

/** Live counts for every district (optionally filtered by emirate), queried sequentially with a 2s gap. */
export async function fetchLiveByEmirate(emirate?: string | null): Promise<LiveScanResult> {
  let entries = await loadDistricts();
  if (emirate) {
    entries = entries.filter((d) => d.emirate === emirate);
  }

  const results: LiveDistrict[] = [];
  for (let i = 0; i < entries.length; i++) {
    const d = entries[i];
    const result = await queryDistrictFast(d.name, d.bounds, d.emirate);
    results.push(result);
    if (i < entries.length - 1) await new Promise((r) => setTimeout(r, DELAY_BETWEEN_QUERIES_MS));
  }

  return {
    results,
    count: results.length,
    source: SOURCE,
    coverage: emirate || "UAE-wide",
    timestamp: new Date().toISOString(),
  };
}
