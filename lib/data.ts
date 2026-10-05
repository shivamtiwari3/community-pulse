import Papa from "papaparse";
import { withBasePath } from "./base-path";
import { Community, Amenity, District, Listing, Transaction, Investor, Parcel } from "./types";

interface RealDistrictData {
  name: string;
  emirate: string;
  lat: number;
  lng: number;
  population: number;
  bounds: [number, number, number, number];
  amenities: {
    education: number;
    healthcare: number;
    retail: number;
    mobility: number;
    community: number;
  };
  total: number;
}

interface RealDataFile {
  fetchedAt: string;
  source: string;
  districts: RealDistrictData[];
}

async function loadCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(withBasePath(url));
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  return data as T[];
}

export async function loadAllData() {
  const [realData, osmAmenities, csvCommunities, listings, transactions, investors, parcels] = await Promise.all([
    fetch(withBasePath("/uae_real_amenities.json")).then((r) => r.json()) as Promise<RealDataFile>,
    loadCSV<Amenity>("/osm_amenities.csv"),
    loadCSV<Community>("/sample_communities.csv"),
    loadCSV<Listing>("/sample_listings.csv"),
    loadCSV<Transaction>("/sample_transactions.csv"),
    loadCSV<Investor>("/sample_investors.csv"),
    loadCSV<Parcel>("/sample_parcels.csv"),
  ]);

  // Build communities and districts from real JSON + CSV enrichment
  const communities: Community[] = [];
  const amenities: Amenity[] = [];
  const districts: District[] = [];

  // Index CSV community data by district for enrichment
  const csvCommunityByDistrict: Record<string, Community[]> = {};
  for (const c of csvCommunities) {
    if (!csvCommunityByDistrict[c.district]) csvCommunityByDistrict[c.district] = [];
    csvCommunityByDistrict[c.district].push(c);
  }

  for (const d of realData.districts) {
    districts.push({
      district: d.name,
      area_type: d.population > 100000 ? "urban_dense" : "suburban",
      profile: "mixed",
      base_sale_aed_sqm: 0,
      gross_yield_pct: 0,
      infrastructure_score: 0,
      latitude: d.lat,
      longitude: d.lng,
      established_year: 0,
    });

    // Use real CSV community data if available (Abu Dhabi districts)
    const csvComms = csvCommunityByDistrict[d.name];
    if (csvComms && csvComms.length > 0) {
      for (const c of csvComms) {
        communities.push(c);
      }
    } else {
      // Derive demand from real amenity-to-population ratio
      const per10k = d.population > 0 ? (d.total / d.population) * 10000 : 0;
      const demandIndex = Math.min(95, Math.max(20, 100 - per10k * 0.8));
      const mobilityScore = d.amenities.mobility > 0
        ? Math.min(90, (d.amenities.mobility / d.population) * 10000 * 5)
        : 10;

      communities.push({
        community_id: `real_${d.name.replace(/\s/g, "_").toLowerCase()}`,
        district: d.name,
        population_estimate: d.population,
        occupancy_rate: 0.85,
        service_demand_index: Math.round(demandIndex),
        mobility_score: Math.round(mobilityScore),
        resident_experience_score: 60,
        optimization_opportunity: getWeakestCategory(d.amenities),
      });
    }

    // Create amenity records from real counts (for gap analysis)
    const cats = ["education", "healthcare", "retail", "mobility", "community"] as const;
    for (const cat of cats) {
      const count = d.amenities[cat];
      for (let i = 0; i < count; i++) {
        amenities.push({
          amenity_id: `real_${d.name}_${cat}_${i}`,
          category: cat,
          subtype: cat,
          name: `${cat} #${i + 1}`,
          latitude: d.lat + (Math.sin(i * 0.7) * 0.01),
          longitude: d.lng + (Math.cos(i * 0.7) * 0.01),
          district: d.name,
        });
      }
    }
  }

  return {
    communities,
    amenities,
    districts,
    osmAmenities,
    listings,
    transactions,
    investors,
    parcels,
  };
}

function getWeakestCategory(amenities: Record<string, number>): string {
  const cats = ["education", "healthcare", "retail", "mobility", "community"];
  let weakest = cats[0];
  let min = Infinity;
  for (const cat of cats) {
    if (amenities[cat] < min) {
      min = amenities[cat];
      weakest = cat;
    }
  }
  const labels: Record<string, string> = {
    education: "school_capacity",
    healthcare: "healthcare_access",
    retail: "retail_development",
    mobility: "transit_expansion",
    community: "park_creation",
  };
  return labels[weakest] || "services";
}
