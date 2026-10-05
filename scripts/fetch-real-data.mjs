// Fetches REAL amenity data from OpenStreetMap Overpass API for all UAE districts
// Includes both nodes AND ways (many UAE POIs are mapped as buildings/ways)
// Results saved to /public/uae_real_amenities.json

const OVERPASS_URL = "https://maps.mail.ru/osm/tools/overpass/api/interpreter";

const UAE_DISTRICTS = [
  // Abu Dhabi
  { name: "Saadiyat Island", emirate: "Abu Dhabi", lat: 24.545, lng: 54.431, population: 12000, bounds: [24.52, 54.38, 24.58, 54.47] },
  { name: "Al Maryah Island", emirate: "Abu Dhabi", lat: 24.5, lng: 54.39, population: 8000, bounds: [24.49, 54.37, 24.51, 54.41] },
  { name: "Yas Island", emirate: "Abu Dhabi", lat: 24.49, lng: 54.603, population: 18000, bounds: [24.47, 54.57, 24.52, 54.65] },
  { name: "Al Reem Island", emirate: "Abu Dhabi", lat: 24.493, lng: 54.406, population: 50000, bounds: [24.48, 54.38, 24.51, 54.42] },
  { name: "Khalifa City", emirate: "Abu Dhabi", lat: 24.42, lng: 54.58, population: 120000, bounds: [24.39, 54.55, 24.44, 54.64] },
  { name: "Mohammed Bin Zayed City", emirate: "Abu Dhabi", lat: 24.32, lng: 54.54, population: 200000, bounds: [24.29, 54.50, 24.36, 54.60] },
  { name: "Mussafah", emirate: "Abu Dhabi", lat: 24.35, lng: 54.5, population: 250000, bounds: [24.32, 54.46, 24.39, 54.55] },
  { name: "Al Shamkha", emirate: "Abu Dhabi", lat: 24.34, lng: 54.72, population: 80000, bounds: [24.31, 54.68, 24.38, 54.76] },
  { name: "Corniche", emirate: "Abu Dhabi", lat: 24.472, lng: 54.338, population: 45000, bounds: [24.45, 54.31, 24.49, 54.37] },
  { name: "Al Raha Beach", emirate: "Abu Dhabi", lat: 24.45, lng: 54.585, population: 30000, bounds: [24.44, 54.55, 24.47, 54.62] },

  // Dubai
  { name: "Dubai Marina", emirate: "Dubai", lat: 25.08, lng: 55.14, population: 45000, bounds: [25.07, 55.12, 25.10, 55.16] },
  { name: "Downtown Dubai", emirate: "Dubai", lat: 25.197, lng: 55.274, population: 32000, bounds: [25.185, 55.26, 25.21, 55.29] },
  { name: "Jumeirah Village Circle", emirate: "Dubai", lat: 25.065, lng: 55.21, population: 75000, bounds: [25.04, 55.19, 25.08, 55.23] },
  { name: "Business Bay", emirate: "Dubai", lat: 25.185, lng: 55.262, population: 38000, bounds: [25.17, 55.25, 25.20, 55.28] },
  { name: "Al Barsha", emirate: "Dubai", lat: 25.113, lng: 55.2, population: 65000, bounds: [25.09, 55.18, 25.13, 55.22] },
  { name: "Deira", emirate: "Dubai", lat: 25.27, lng: 55.33, population: 170000, bounds: [25.25, 55.30, 25.29, 55.36] },
  { name: "Bur Dubai", emirate: "Dubai", lat: 25.25, lng: 55.3, population: 140000, bounds: [25.23, 55.27, 25.27, 55.33] },
  { name: "International City", emirate: "Dubai", lat: 25.165, lng: 55.405, population: 100000, bounds: [25.14, 55.38, 25.18, 55.43] },
  { name: "Al Nahda Dubai", emirate: "Dubai", lat: 25.295, lng: 55.37, population: 85000, bounds: [25.28, 55.35, 25.31, 55.39] },
  { name: "Dubai Silicon Oasis", emirate: "Dubai", lat: 25.12, lng: 55.38, population: 55000, bounds: [25.10, 55.36, 25.14, 55.40] },
  { name: "Palm Jumeirah", emirate: "Dubai", lat: 25.112, lng: 55.138, population: 20000, bounds: [25.09, 55.11, 25.14, 55.17] },
  { name: "Dubai Hills", emirate: "Dubai", lat: 25.11, lng: 55.25, population: 40000, bounds: [25.09, 55.23, 25.13, 55.27] },

  // Sharjah
  { name: "Al Nahda Sharjah", emirate: "Sharjah", lat: 25.305, lng: 55.37, population: 95000, bounds: [25.29, 55.35, 25.32, 55.39] },
  { name: "Al Majaz", emirate: "Sharjah", lat: 25.34, lng: 55.39, population: 60000, bounds: [25.32, 55.37, 25.36, 55.41] },
  { name: "Al Qasimia", emirate: "Sharjah", lat: 25.35, lng: 55.39, population: 75000, bounds: [25.34, 55.37, 25.37, 55.41] },
  { name: "Muwaileh", emirate: "Sharjah", lat: 25.31, lng: 55.45, population: 50000, bounds: [25.29, 55.43, 25.33, 55.47] },
  { name: "Al Taawun", emirate: "Sharjah", lat: 25.32, lng: 55.38, population: 40000, bounds: [25.30, 55.36, 25.34, 55.40] },

  // Ajman
  { name: "Ajman Downtown", emirate: "Ajman", lat: 25.41, lng: 55.44, population: 80000, bounds: [25.39, 55.42, 25.43, 55.46] },
  { name: "Al Rashidiya Ajman", emirate: "Ajman", lat: 25.39, lng: 55.46, population: 55000, bounds: [25.37, 55.44, 25.41, 55.48] },

  // RAK
  { name: "RAK City", emirate: "Ras Al Khaimah", lat: 25.79, lng: 55.96, population: 100000, bounds: [25.76, 55.93, 25.82, 55.99] },
  { name: "Al Hamra RAK", emirate: "Ras Al Khaimah", lat: 25.72, lng: 55.79, population: 15000, bounds: [25.70, 55.77, 25.74, 55.81] },

  // Fujairah
  { name: "Fujairah City", emirate: "Fujairah", lat: 25.13, lng: 56.33, population: 68000, bounds: [25.10, 56.30, 25.16, 56.36] },

  // UAQ
  { name: "UAQ City", emirate: "Umm Al Quwain", lat: 25.56, lng: 55.55, population: 40000, bounds: [25.53, 55.52, 25.59, 55.58] },
];

async function queryDistrict(district) {
  const [s, w, n, e] = district.bounds;
  const bbox = `${s},${w},${n},${e}`;

  // Query both nodes and ways for better coverage
  const query = `[out:json][timeout:25];
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

    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${district.name}`);
      return null;
    }

    const data = await res.json();
    const els = data.elements || [];

    return {
      name: district.name,
      emirate: district.emirate,
      lat: district.lat,
      lng: district.lng,
      population: district.population,
      bounds: district.bounds,
      amenities: {
        education: Number(els[0]?.tags?.total || 0),
        healthcare: Number(els[1]?.tags?.total || 0),
        retail: Number(els[2]?.tags?.total || 0),
        mobility: Number(els[3]?.tags?.total || 0),
        community: Number(els[4]?.tags?.total || 0),
      },
      total: 0,
    };
  } catch (err) {
    console.error(`  Error for ${district.name}:`, err.message);
    return null;
  }
}

async function main() {
  console.log(`Fetching real amenity data for ${UAE_DISTRICTS.length} UAE districts from OpenStreetMap...`);
  console.log("This will take ~${Math.ceil(UAE_DISTRICTS.length * 2)}s due to rate limiting.\n");

  const results = [];

  for (let i = 0; i < UAE_DISTRICTS.length; i++) {
    const d = UAE_DISTRICTS[i];
    console.log(`[${i + 1}/${UAE_DISTRICTS.length}] Querying ${d.name} (${d.emirate})...`);

    const result = await queryDistrict(d);
    if (result) {
      result.total = Object.values(result.amenities).reduce((s, v) => s + v, 0);
      results.push(result);
      console.log(`  ✓ Found ${result.total} amenities (edu:${result.amenities.education} health:${result.amenities.healthcare} retail:${result.amenities.retail} transit:${result.amenities.mobility} comm:${result.amenities.community})`);
    } else {
      // Save with zeros so we don't lose the district
      results.push({
        name: d.name,
        emirate: d.emirate,
        lat: d.lat,
        lng: d.lng,
        population: d.population,
        bounds: d.bounds,
        amenities: { education: 0, healthcare: 0, retail: 0, mobility: 0, community: 0 },
        total: 0,
      });
      console.log(`  ✗ Failed, saved with zeros`);
    }

    // Rate limit: wait 2s between requests
    if (i < UAE_DISTRICTS.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: "OpenStreetMap Overpass API",
    description: "Real amenity counts for UAE districts — includes nodes and ways",
    totalDistricts: results.length,
    totalAmenities: results.reduce((s, r) => s + r.total, 0),
    districts: results,
  };

  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.join(process.cwd(), "public", "uae_real_amenities.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n✓ Done! Saved ${results.length} districts to public/uae_real_amenities.json`);
  console.log(`  Total amenities found: ${output.totalAmenities}`);
}

main().catch(console.error);
