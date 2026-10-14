export interface MapCity {
  id: string;
  name: string;
  displayName: string;
  state?: string;
  country: string;
  countryName: string;
  latitude: number;
  longitude: number;
  tier: 1 | 2 | 3;
  minZoom: number;
  dcCount?: number;
  totalPowerMw?: number;
  category?: "hyperscale_core" | "financial_metro" | "regional_tech" | "subsea_gateway";
}
