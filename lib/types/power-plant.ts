export type FuelType =
  | "nuclear"
  | "hydro"
  | "gas"
  | "coal"
  | "solar"
  | "wind"
  | "storage"
  | "geothermal"
  | "biomass"
  | "oil"
  | "other";

export type StationStatus = "online" | "ramping" | "curtailed" | "outage";

export type GridRegion =
  | "CAISO"
  | "ERCOT"
  | "PJM"
  | "MISO"
  | "NYISO"
  | "ISONE"
  | "SPP"
  | "AESO"
  | "ENTSOE_DE"
  | "ENTSOE_FR"
  | "ENTSOE_GB"
  | "ENTSOE_ES"
  | "ENTSOE_IT"
  | "NORDPOOL"
  | "CHINA_STATE_GRID"
  | "JAPAN_TEPCO"
  | "INDIA_NREB"
  | "NEM_AUSTRALIA"
  | "BRAZIL_ONS"
  | "GLOBAL_OTHER";

export interface LMPBreakdown {
  energy: number;
  congestion: number;
  loss: number;
  total: number;
}

export interface PowerPlant {
  id: string;
  name: string;
  operator: string;
  country: string;
  countryName: string;
  fuelType: FuelType;
  capacityMw: number;
  commissioningYear: number;
  latitude: number;
  longitude: number;
  gridRegion: GridRegion;
  co2IntensityGPerKwh: number;
  substationName?: string;
  coolingType?: string;
  status: StationStatus;
  currentOutputMw: number;
  capacityFactor: number;
  spotPriceMwh: number;
  lmpBreakdown: LMPBreakdown;
  lastUpdated: string;
  // Climate TRACE & WRI Satellite Intelligence
  climateTraceAssetId?: string;
  annualCo2EmissionsTons?: number;
  satelliteTracked?: boolean;
  turbineManufacturer?: string;
  waterSource?: string;
  unitCount?: number;
}

export interface Interconnector {
  id: string;
  name: string;
  source: [number, number]; // [lng, lat]
  target: [number, number]; // [lng, lat]
  fromRegion: string;
  toRegion: string;
  capacityMw: number;
  currentFlowMw: number; // positive = source->target, negative = target->source
  voltageKv: number;
  type: "HVDC" | "HVAC";
}

export interface FuelTypeMeta {
  label: string;
  color: string;
  rgb: [number, number, number];
  hex: string;
  iconName: string;
  defaultCo2: number;
}

export const FUEL_CONFIG: Record<FuelType, FuelTypeMeta> = {
  nuclear: {
    label: "Nuclear",
    color: "fuel-nuclear",
    rgb: [168, 85, 247],
    hex: "#a855f7",
    iconName: "Atom",
    defaultCo2: 12,
  },
  hydro: {
    label: "Hydroelectric",
    color: "fuel-hydro",
    rgb: [59, 130, 246],
    hex: "#3b82f6",
    iconName: "Waves",
    defaultCo2: 24,
  },
  gas: {
    label: "Natural Gas",
    color: "fuel-gas",
    rgb: [249, 115, 22],
    hex: "#f97316",
    iconName: "Flame",
    defaultCo2: 490,
  },
  coal: {
    label: "Coal",
    color: "fuel-coal",
    rgb: [100, 116, 139],
    hex: "#64748b",
    iconName: "Factory",
    defaultCo2: 820,
  },
  solar: {
    label: "Solar PV",
    color: "fuel-solar",
    rgb: [234, 179, 8],
    hex: "#eab308",
    iconName: "Sun",
    defaultCo2: 48,
  },
  wind: {
    label: "Wind Power",
    color: "fuel-wind",
    rgb: [6, 182, 212],
    hex: "#06b6d4",
    iconName: "Wind",
    defaultCo2: 11,
  },
  storage: {
    label: "Battery Storage",
    color: "fuel-storage",
    rgb: [34, 197, 94],
    hex: "#22c55e",
    iconName: "BatteryCharging",
    defaultCo2: 20,
  },
  geothermal: {
    label: "Geothermal",
    color: "fuel-geothermal",
    rgb: [16, 185, 129],
    hex: "#10b981",
    iconName: "Mountain",
    defaultCo2: 38,
  },
  biomass: {
    label: "Biomass",
    color: "fuel-biomass",
    rgb: [217, 119, 6],
    hex: "#d97706",
    iconName: "Leaf",
    defaultCo2: 230,
  },
  oil: {
    label: "Oil / Heavy Peaker",
    color: "fuel-oil",
    rgb: [239, 68, 68],
    hex: "#ef4444",
    iconName: "Droplet",
    defaultCo2: 650,
  },
  other: {
    label: "Other / Cogeneration",
    color: "fuel-other",
    rgb: [139, 92, 246],
    hex: "#8b5cf6",
    iconName: "Zap",
    defaultCo2: 300,
  },
};
