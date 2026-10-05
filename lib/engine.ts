import { Community, Amenity, District, GapResult, Recommendation } from "./types";

const CATEGORIES = ["education", "healthcare", "mobility", "retail", "community", "services"] as const;

const ACTIONS: Record<string, string> = {
  education: "Build school or nursery",
  healthcare: "Open clinic or pharmacy",
  mobility: "Add bus route or metro link",
  retail: "Develop grocery and retail space",
  community: "Build park or community center",
  services: "Add government service point",
};

export function analyzeGaps(
  communities: Community[],
  amenities: Amenity[],
  districts: District[]
): GapResult[] {
  const districtLookup = Object.fromEntries(districts.map((d) => [d.district, d]));

  const grouped: Record<string, { comms: Community[]; amens: Amenity[] }> = {};
  for (const c of communities) {
    if (!grouped[c.district]) grouped[c.district] = { comms: [], amens: [] };
    grouped[c.district].comms.push(c);
  }
  for (const a of amenities) {
    if (!grouped[a.district]) grouped[a.district] = { comms: [], amens: [] };
    grouped[a.district].amens.push(a);
  }

  const results: GapResult[] = [];

  for (const [name, { comms, amens }] of Object.entries(grouped)) {
    if (comms.length === 0) continue;
    const dist = districtLookup[name];
    if (!dist) continue;

    const pop = comms.reduce((s, c) => s + c.population_estimate, 0);
    const demand = comms.reduce((s, c) => s + c.service_demand_index, 0) / comms.length;
    const mobility = comms.reduce((s, c) => s + c.mobility_score, 0) / comms.length;
    const experience = comms.reduce((s, c) => s + c.resident_experience_score, 0) / comms.length;

    const categories: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      categories[cat] = amens.filter((a) => a.category === cat).length;
    }

    const per10k = pop > 0 ? (amens.length / pop) * 10000 : 0;

    // Find mode of optimization_opportunity
    const oppCount: Record<string, number> = {};
    for (const c of comms) {
      oppCount[c.optimization_opportunity] = (oppCount[c.optimization_opportunity] || 0) + 1;
    }
    const topOpp = Object.entries(oppCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    results.push({
      district: name,
      population: pop,
      demandIndex: Math.round(demand * 10) / 10,
      mobilityScore: Math.round(mobility * 10) / 10,
      experienceScore: Math.round(experience * 10) / 10,
      totalAmenities: amens.length,
      amenitiesPer10k: Math.round(per10k * 10) / 10,
      gapScore: 0,
      severity: "adequate",
      lat: dist.latitude,
      lng: dist.longitude,
      categories,
      topOpportunity: topOpp,
    });
  }

  const maxPer10k = Math.max(...results.map((r) => r.amenitiesPer10k), 1);
  for (const r of results) {
    const demandNorm = r.demandIndex / 100;
    const supplyNorm = r.amenitiesPer10k / maxPer10k;
    r.gapScore = Math.round(Math.max(0, Math.min(100, (demandNorm - supplyNorm) * 100)) * 10) / 10;
    r.severity =
      r.gapScore >= 65 ? "critical" : r.gapScore >= 45 ? "significant" : r.gapScore >= 25 ? "emerging" : "adequate";
  }

  return results.sort((a, b) => b.gapScore - a.gapScore);
}

export function generateRecommendations(gaps: GapResult[]): Recommendation[] {
  return gaps
    .filter((g) => g.gapScore > 20)
    .slice(0, 10)
    .map((g, i) => {
      let weakest = "services";
      let lowest = Infinity;
      for (const cat of CATEGORIES) {
        const rate = g.population > 0 ? (g.categories[cat] / g.population) * 10000 : 0;
        if (rate < lowest) {
          lowest = rate;
          weakest = cat;
        }
      }
      return {
        rank: i + 1,
        district: g.district,
        gapScore: g.gapScore,
        population: g.population,
        weakest,
        action: ACTIONS[weakest] || "Expand services",
        signal: g.topOpportunity.replace(/_/g, " "),
      };
    });
}

export function getDistrictInsight(gap: GapResult): string {
  const weak = Object.entries(gap.categories).sort((a, b) => a[1] - b[1]);
  const weakest = weak[0];
  const strongest = weak[weak.length - 1];

  return `${gap.district} serves ${gap.population.toLocaleString()} residents with only ${gap.totalAmenities} amenities (${gap.amenitiesPer10k} per 10k people). The most critical gap is in ${weakest[0]} (${weakest[1]} facilities), while ${strongest[0]} is relatively well-served (${strongest[1]}). Community data signals "${gap.topOpportunity.replace(/_/g, " ")}" as the top priority.`;
}
