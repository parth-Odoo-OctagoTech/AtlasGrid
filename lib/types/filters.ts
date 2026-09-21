import { FuelType, StationStatus } from "./power-plant";

export type VisualizationMode =
  | "2d_scatter"
  | "3d_column"
  | "heatmap_lmp"
  | "interconnect_flow"
  | "hex_density"
  | "siting_score";

export type InfrastructureType = "all" | "plants" | "datacenters" | "substations";
export type PriceFilter = "all" | "spikes" | "negative" | "normal";

export interface FilterState {
  infrastructureType: InfrastructureType;
  fuelTypes: FuelType[];
  dcOperators: string[];
  dcCategories: string[];
  minCapacityMw: number;
  maxCapacityMw: number;
  statuses: StationStatus[];
  region: string;
  priceFilter: PriceFilter;
  searchQuery: string;
  minSpotPrice?: number;
  maxSpotPrice?: number;
  // Siting & Hazards Filters (Sections 2 - 6)
  minSitingScore?: number;
  carrierNeutralOnly?: boolean;
  maxIxpLatencyMs?: number;
  floodRiskFilter?: "all" | "no_high_flood" | "zero_flood_only";
  minFreeCoolingPct?: number;
  waterStressFilter?: "all" | "low_medium_only";
  excludeHazardZones?: boolean;
}

export type BasemapStyle = "positron" | "voyager" | "satellite" | "dark" | "osm";
export type ProjectionMode = "mercator" | "globe";

export interface ViewportState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
}
