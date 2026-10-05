export interface UAEDistrict {
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

export const EMIRATE_COLORS: Record<string, string> = {
  "Abu Dhabi": "#3b82f6",
  "Dubai": "#8b5cf6",
  "Sharjah": "#06b6d4",
  "Ajman": "#f59e0b",
  "Ras Al Khaimah": "#10b981",
  "Fujairah": "#ec4899",
  "Umm Al Quwain": "#6366f1",
};
