import { FuelType, StationStatus } from "./power-plant";

export type VisualizationMode =
  | "2d_scatter"
  | "3d_column"
  | "heatmap_lmp"
  | "interconnect_flow"
  | "hex_density";

export type InfrastructureType = "all" | "plants" | "datacenters";
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
