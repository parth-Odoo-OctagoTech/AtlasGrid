export interface CableLandingStation {
  id: string;
  name: string;
  operator: string;
  country: string;
  countryName: string;
  region: string;
  latitude: number;
  longitude: number;
  activeSubseaSystems: string[];
  totalLitCapacityTbps: number;
  consortiumMembers: string[];
  primaryTerrestrialCorridor: string;
  tier1IxpDistanceKm: number;
  rttToLondonMs: number;
  rttToFrankfurtMs: number;
  rttToTokyoMs: number;
  rttToSingaporeMs: number;
  // Institutional Metadata
  fullAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  owner?: string;
  majorUsers?: string[];
  clientsServed?: string;
}

export interface SubseaBackhaulAnalysis {
  nearestCls: CableLandingStation;
  terrestrialDistanceKm: number; // Distance from DC to CLS
  estimatedTerrestrialLatencyMs: number; // ~0.005 ms/km speed-of-light in silica
  totalTransatlanticLatencyRttMs: number;
  totalTranspacificLatencyRttMs: number;
  totalEuroAsiaLatencyRttMs: number;
  backhaulRating: "Tier-1 Ultra-Low Latency Gateway" | "Direct Coastal Backhaul" | "Secondary Inland Corridor" | "Continental Core";
  darkFiberRouteRedundancy: "3+ Diverse Terrestrial Conduits" | "Dual Redundant Fiber Paths" | "Single Radial Route";
}
