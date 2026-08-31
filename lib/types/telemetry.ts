import { FuelType } from "./power-plant";

export interface FuelMixItem {
  fuelType: FuelType;
  capacityMw: number;
  currentMw: number;
  sharePercent: number;
  co2RateGPerKwh: number;
}

export interface GridSummary {
  totalCapacityMw: number;
  totalGenerationMw: number;
  capacityFactor: number;
  cleanEnergySharePercent: number;
  averageSpotPrice: number;
  activeAlertCount: number;
  frequencyUsHz: number;
  frequencyEuHz: number;
  carbonIntensityAvg: number;
  activePlantsCount: number;
  fuelMix: Record<FuelType, FuelMixItem>;
  timestamp: string;
}

export interface GridAlert {
  id: string;
  stationId?: string;
  stationName?: string;
  region: string;
  country?: string;
  severity: "critical" | "warning" | "info";
  type:
    | "price_spike"
    | "negative_price"
    | "frequency_deviation"
    | "curtailment"
    | "tripped_unit"
    | "congestion"
    | "high_ramp";
  title: string;
  message: string;
  timestamp: string;
  coordinates?: [number, number]; // [lng, lat]
  metricValue?: number;
  unit?: string;
}

export interface StationTimeSeriesPoint {
  timestamp: string;
  outputMw: number;
  capacityMw: number;
  spotPrice: number;
  curtailmentMw: number;
  co2EmissionsTonsPerHour: number;
}

export interface StationDetailResponse {
  station: import("./power-plant").PowerPlant;
  history24h: StationTimeSeriesPoint[];
  recentAlerts: GridAlert[];
  nearbyInterconnectors: import("./power-plant").Interconnector[];
}
