import { FuelType, PowerPlant } from "../types/power-plant";

export interface CarbonMetric {
  fuelType: FuelType;
  gCo2PerKwh: number;
  isCarbonFree: boolean;
  cfeFactor: number; // 0.0 to 1.0
  color: [number, number, number];
  hex: string;
  label: string;
}

// IPCC / National Renewable Energy Laboratory (NREL) Lifecycle Grid Carbon Intensity Factors
export const FUEL_CARBON_FACTORS: Record<FuelType, CarbonMetric> = {
  nuclear: {
    fuelType: "nuclear",
    gCo2PerKwh: 0,
    isCarbonFree: true,
    cfeFactor: 1.0,
    color: [16, 185, 129], // Emerald
    hex: "#10b981",
    label: "100% Carbon-Free Baseload (Nuclear)",
  },
  hydro: {
    fuelType: "hydro",
    gCo2PerKwh: 4,
    isCarbonFree: true,
    cfeFactor: 1.0,
    color: [16, 185, 129], // Emerald
    hex: "#10b981",
    label: "100% Carbon-Free Baseload (Hydro)",
  },
  wind: {
    fuelType: "wind",
    gCo2PerKwh: 0,
    isCarbonFree: true,
    cfeFactor: 1.0,
    color: [52, 211, 153], // Mint
    hex: "#34d399",
    label: "Zero-Carbon Intermittent (Wind)",
  },
  solar: {
    fuelType: "solar",
    gCo2PerKwh: 0,
    isCarbonFree: true,
    cfeFactor: 1.0,
    color: [250, 204, 21], // Solar Gold
    hex: "#facc15",
    label: "Zero-Carbon Intermittent (Solar)",
  },
  geothermal: {
    fuelType: "geothermal",
    gCo2PerKwh: 15,
    isCarbonFree: true,
    cfeFactor: 1.0,
    color: [6, 182, 212], // Cyan
    hex: "#06b6d4",
    label: "100% Carbon-Free Baseload (Geothermal)",
  },
  biomass: {
    fuelType: "biomass",
    gCo2PerKwh: 180,
    isCarbonFree: false,
    cfeFactor: 0.5,
    color: [245, 158, 11], // Amber
    hex: "#f59e0b",
    label: "Low-Carbon Biomass",
  },
  gas: {
    fuelType: "gas",
    gCo2PerKwh: 420,
    isCarbonFree: false,
    cfeFactor: 0.0,
    color: [249, 115, 22], // Orange
    hex: "#f97316",
    label: "Thermal Natural Gas (CCGT / Peaker)",
  },
  oil: {
    fuelType: "oil",
    gCo2PerKwh: 720,
    isCarbonFree: false,
    cfeFactor: 0.0,
    color: [239, 68, 68], // Red
    hex: "#ef4444",
    label: "High-Emission Petroleum / Heavy Fuel",
  },
  coal: {
    fuelType: "coal",
    gCo2PerKwh: 940,
    isCarbonFree: false,
    cfeFactor: 0.0,
    color: [185, 28, 28], // Dark Crimson
    hex: "#b91c1c",
    label: "Ultra-High Emission Baseload (Coal)",
  },
  storage: {
    fuelType: "storage",
    gCo2PerKwh: 10,
    isCarbonFree: true,
    cfeFactor: 1.0,
    color: [147, 51, 234], // Violet
    hex: "#9333ea",
    label: "Grid-Scale Battery Storage / BESS",
  },
  other: {
    fuelType: "other",
    gCo2PerKwh: 450,
    isCarbonFree: false,
    cfeFactor: 0.0,
    color: [148, 163, 184],
    hex: "#94a3b8",
    label: "Mixed Grid Resource",
  },
};

/**
 * Returns color representation for a given carbon intensity in gCO2/kWh
 */
export function getCarbonIntensityColor(gCo2PerKwh: number): {
  rgb: [number, number, number];
  hex: string;
  rating: "Zero Carbon" | "Low Carbon" | "Moderate" | "High Carbon" | "Extreme Carbon";
} {
  if (gCo2PerKwh <= 25) {
    return { rgb: [16, 185, 129], hex: "#10b981", rating: "Zero Carbon" }; // Emerald
  }
  if (gCo2PerKwh <= 120) {
    return { rgb: [6, 182, 212], hex: "#06b6d4", rating: "Low Carbon" }; // Cyan
  }
  if (gCo2PerKwh <= 300) {
    return { rgb: [234, 179, 8], hex: "#eab308", rating: "Moderate" }; // Amber
  }
  if (gCo2PerKwh <= 550) {
    return { rgb: [249, 115, 22], hex: "#f97316", rating: "High Carbon" }; // Orange
  }
  return { rgb: [225, 29, 72], hex: "#e11d48", rating: "Extreme Carbon" }; // Crimson Rose
}

/**
 * Computes regional 24/7 Carbon-Free Energy (CFE %) and weighted carbon intensity for a geographic point
 */
export function calculateRegionalCarbonProfile(
  lat: number,
  lng: number,
  plants: PowerPlant[],
  radiusKm = 100
): {
  cfePercentage: number;
  weightedGCo2PerKwh: number;
  totalCapacityMw: number;
  cleanCapacityMw: number;
  fossilCapacityMw: number;
  dominantFuel: FuelType;
} {
  let totalCap = 0;
  let cleanCap = 0;
  let fossilCap = 0;
  let weightedCo2Sum = 0;
  const fuelTotals: Record<string, number> = {};

  for (const plant of plants) {
    const dLat = (plant.latitude - lat) * 111;
    const dLng = (plant.longitude - lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.hypot(dLat, dLng);

    if (dist <= radiusKm) {
      const cap = plant.capacityMw || plant.currentOutputMw || 10;
      totalCap += cap;
      const meta = FUEL_CARBON_FACTORS[plant.fuelType] || FUEL_CARBON_FACTORS.other;

      if (meta.isCarbonFree) {
        cleanCap += cap;
      } else {
        fossilCap += cap;
      }

      weightedCo2Sum += cap * meta.gCo2PerKwh;
      fuelTotals[plant.fuelType] = (fuelTotals[plant.fuelType] || 0) + cap;
    }
  }

  let dominantFuel: FuelType = "gas";
  let maxFuelCap = 0;
  for (const [fuel, cap] of Object.entries(fuelTotals)) {
    if (cap > maxFuelCap) {
      maxFuelCap = cap;
      dominantFuel = fuel as FuelType;
    }
  }

  const cfePercentage = totalCap > 0 ? Math.round((cleanCap / totalCap) * 100) : 50;
  const weightedGCo2PerKwh = totalCap > 0 ? Math.round(weightedCo2Sum / totalCap) : 380;

  return {
    cfePercentage,
    weightedGCo2PerKwh,
    totalCapacityMw: Math.round(totalCap),
    cleanCapacityMw: Math.round(cleanCap),
    fossilCapacityMw: Math.round(fossilCap),
    dominantFuel,
  };
}
