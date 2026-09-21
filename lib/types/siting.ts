export interface DarkFiberCorridor {
  id: string;
  name: string;
  operator: string;
  type: "long_haul" | "metro" | "railroad_corridor" | "subsea_terrestrial";
  status: "active" | "planned";
  fiberPairs?: number;
  coordinates: [number, number][]; // LineString path
}

export interface SeismicFaultLine {
  id: string;
  name: string;
  source: string; // e.g. "USGS Quaternary Faults" | "GEM GAF-DB"
  slipRateMmPerYr: number;
  slipSense: "strike_slip" | "thrust" | "normal";
  riskTier: "High" | "Moderate" | "Low";
  age: string;
  coordinates: [number, number][]; // LineString path
}

export interface FlightCorridor {
  id: string;
  airportCode: string;
  airportName: string;
  runway: string;
  corridorType: "approach_slope" | "class_b_surface" | "takeoff_climb";
  clearanceFloorMeters: number;
  polygon: [number, number][]; // Polygon coords [lon, lat]
}

export interface HazardCorridor {
  id: string;
  name: string;
  type: "gas_pipeline" | "hazmat_rail" | "chemical_plant_blast";
  operator?: string;
  nominalDiameterInches?: number;
  operatingPressurePsi?: number;
  pirBlastRadiusMeters: number; // Potential Impact Radius
  coordinates: [number, number][]; // LineString or Polygon
}

export interface SitingScoreBreakdown {
  powerGridScore: number;       // Weight: 0.25
  telecomFiberScore: number;     // Weight: 0.20
  environmentalHazardScore: number; // Weight: 0.15
  climateEconomizerScore: number;   // Weight: 0.15
  soilTopographyScore: number;   // Weight: 0.10
  waterResourceScore: number;    // Weight: 0.08
  zoningClearanceScore: number;  // Weight: 0.07
  totalCompositeScore: number;   // 0 - 100
  tierRating: "Tier IV Prime" | "Tier III Standard" | "Tier II Conditional" | "Unfavorable";
}
