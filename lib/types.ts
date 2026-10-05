export interface District {
  district: string;
  area_type: string;
  profile: string;
  base_sale_aed_sqm: number;
  gross_yield_pct: number;
  infrastructure_score: number;
  latitude: number;
  longitude: number;
  established_year: number;
}

export interface Community {
  community_id: string;
  district: string;
  population_estimate: number;
  occupancy_rate: number;
  service_demand_index: number;
  mobility_score: number;
  resident_experience_score: number;
  optimization_opportunity: string;
}

export interface Amenity {
  amenity_id: string;
  category: string;
  subtype: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;
}

export interface GapResult {
  district: string;
  population: number;
  demandIndex: number;
  mobilityScore: number;
  experienceScore: number;
  totalAmenities: number;
  amenitiesPer10k: number;
  gapScore: number;
  severity: "critical" | "significant" | "emerging" | "adequate";
  lat: number;
  lng: number;
  categories: Record<string, number>;
  topOpportunity: string;
}

export interface Recommendation {
  rank: number;
  district: string;
  gapScore: number;
  population: number;
  weakest: string;
  action: string;
  signal: string;
}

export interface Listing {
  listing_id: string;
  district: string;
  community: string;
  listing_type: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  price_aed: number;
  price_per_sqm_aed: number;
  furnished: string;
  amenities: string;
  latitude: number;
  longitude: number;
  listed_date: string;
  status: string;
  agency_type: string;
}

export interface Transaction {
  transaction_id: string;
  date: string;
  district: string;
  asset_type: string;
  transaction_value_aed: number;
  size_sqm: number;
  price_per_sqm: number;
  buyer_type: string;
}

export interface Investor {
  investor_id: string;
  investor_type: string;
  preferred_sector: string;
  preferred_district: string;
  capital_range_aed: string;
  risk_profile: string;
  investment_horizon: string;
  strategic_fit_score: number;
}

export interface Parcel {
  parcel_id: string;
  district: string;
  zone: string;
  land_use: string;
  parcel_size_sqm: number;
  current_status: string;
  infrastructure_score: number;
  development_potential_score: number;
  estimated_value_aed: number;
  recommended_use: string;
}
