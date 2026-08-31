import { FilterState } from "../types/filters";
import { Interconnector, PowerPlant, FuelType } from "../types/power-plant";
import rawPlantsData from "@/data/power-plants.json";
import rawIcData from "@/data/interconnectors.json";

class PlantRepository {
  private plants: PowerPlant[] = (rawPlantsData as unknown as PowerPlant[]) || [];
  private plantsMap: Map<string, PowerPlant> = new Map();
  private interconnectors: Interconnector[] = (rawIcData as unknown as Interconnector[]) || [];
  private isLoaded: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isLoaded) return;
    this.plantsMap.clear();
    for (const p of this.plants) {
      this.plantsMap.set(p.id, p);
    }
    this.isLoaded = true;
  }

  public getAllPlants(): PowerPlant[] {
    this.init();
    return this.plants;
  }

  public getPlantById(id: string): PowerPlant | undefined {
    this.init();
    return this.plantsMap.get(id);
  }

  public getInterconnectors(): Interconnector[] {
    this.init();
    return this.interconnectors;
  }

  public updatePlant(id: string, updates: Partial<PowerPlant>): PowerPlant | undefined {
    this.init();
    const existing = this.plantsMap.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
    this.plantsMap.set(id, updated);
    
    // Also update in list
    const idx = this.plants.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.plants[idx] = updated;
    }

    return updated;
  }

  public queryPlants(options: {
    filters?: Partial<FilterState>;
    bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
    limit?: number;
    offset?: number;
  }): { plants: PowerPlant[]; total: number } {
    this.init();

    let result = this.plants;
    const { filters, bbox, limit = 10000, offset = 0 } = options;

    // Filter by bounding box if provided
    if (bbox && bbox.length === 4) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      result = result.filter(
        (p) =>
          p.longitude >= minLng &&
          p.longitude <= maxLng &&
          p.latitude >= minLat &&
          p.latitude <= maxLat
      );
    }

    if (filters) {
      // Fuel types filter
      if (filters.fuelTypes && filters.fuelTypes.length > 0) {
        const fuelSet = new Set(filters.fuelTypes);
        result = result.filter((p) => fuelSet.has(p.fuelType));
      }

      // Capacity filters
      if (filters.minCapacityMw !== undefined && filters.minCapacityMw > 0) {
        result = result.filter((p) => p.capacityMw >= filters.minCapacityMw!);
      }
      if (filters.maxCapacityMw !== undefined && filters.maxCapacityMw < 50000) {
        result = result.filter((p) => p.capacityMw <= filters.maxCapacityMw!);
      }

      // Status filter
      if (filters.statuses && filters.statuses.length > 0) {
        const statusSet = new Set(filters.statuses);
        result = result.filter((p) => statusSet.has(p.status));
      }

      // Region filter
      if (filters.region && filters.region !== "GLOBAL") {
        if (filters.region === "GUJARAT") {
          result = result.filter(
            (p) =>
              p.substationName?.toLowerCase().includes("gujarat") ||
              (p.latitude >= 20.0 && p.latitude <= 24.8 && p.longitude >= 68.0 && p.longitude <= 74.8 && p.country === "IN")
          );
        } else {
          result = result.filter(
            (p) => p.gridRegion === filters.region || p.country === filters.region
          );
        }
      }

      // Price filter
      if (filters.priceFilter === "spikes") {
        result = result.filter((p) => p.spotPriceMwh >= 150);
      } else if (filters.priceFilter === "negative") {
        result = result.filter((p) => p.spotPriceMwh < 0);
      } else if (filters.priceFilter === "normal") {
        result = result.filter((p) => p.spotPriceMwh >= 0 && p.spotPriceMwh < 150);
      }

      // Search Query filter
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const q = filters.searchQuery.toLowerCase().trim();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.operator.toLowerCase().includes(q) ||
            p.countryName.toLowerCase().includes(q) ||
            p.gridRegion.toLowerCase().includes(q) ||
            p.fuelType.toLowerCase().includes(q) ||
            (p.substationName && p.substationName.toLowerCase().includes(q))
        );
      }
    }

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return {
      plants: paginated,
      total,
    };
  }

  public getGlobalSummary() {
    this.init();
    let totalCapacityMw = 0;
    let totalGenerationMw = 0;
    let cleanGenerationMw = 0;
    let totalPrice = 0;
    let activePlantsCount = 0;

    const fuelMix: Record<
      FuelType,
      { fuelType: FuelType; capacityMw: number; currentMw: number; sharePercent: number; co2RateGPerKwh: number }
    > = {
      nuclear: { fuelType: "nuclear", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 12 },
      hydro: { fuelType: "hydro", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 24 },
      gas: { fuelType: "gas", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 490 },
      coal: { fuelType: "coal", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 820 },
      solar: { fuelType: "solar", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 48 },
      wind: { fuelType: "wind", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 11 },
      storage: { fuelType: "storage", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 20 },
      geothermal: { fuelType: "geothermal", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 38 },
      biomass: { fuelType: "biomass", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 230 },
      oil: { fuelType: "oil", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 650 },
      other: { fuelType: "other", capacityMw: 0, currentMw: 0, sharePercent: 0, co2RateGPerKwh: 300 },
    };

    const cleanFuels = new Set(["nuclear", "hydro", "solar", "wind", "geothermal", "storage", "biomass"]);

    for (const p of this.plants) {
      totalCapacityMw += p.capacityMw;
      totalGenerationMw += p.currentOutputMw;
      totalPrice += p.spotPriceMwh;
      if (p.status !== "outage" && p.currentOutputMw > 0) {
        activePlantsCount++;
      }

      if (cleanFuels.has(p.fuelType)) {
        cleanGenerationMw += p.currentOutputMw;
      }

      if (fuelMix[p.fuelType]) {
        fuelMix[p.fuelType].capacityMw += p.capacityMw;
        fuelMix[p.fuelType].currentMw += p.currentOutputMw;
      }
    }

    // Calculate shares
    if (totalGenerationMw > 0) {
      for (const key of Object.keys(fuelMix) as FuelType[]) {
        fuelMix[key].sharePercent =
          Math.round((fuelMix[key].currentMw / totalGenerationMw) * 1000) / 10;
      }
    }

    const avgSpotPrice =
      this.plants.length > 0
        ? Math.round((totalPrice / this.plants.length) * 10) / 10
        : 45.0;

    const cleanEnergySharePercent =
      totalGenerationMw > 0
        ? Math.round((cleanGenerationMw / totalGenerationMw) * 1000) / 10
        : 50.0;

    const capacityFactor =
      totalCapacityMw > 0
        ? Math.round((totalGenerationMw / totalCapacityMw) * 1000) / 1000
        : 0.55;

    return {
      totalCapacityMw,
      totalGenerationMw,
      capacityFactor,
      cleanEnergySharePercent,
      averageSpotPrice: avgSpotPrice,
      activePlantsCount,
      fuelMix,
    };
  }
}

// Global Singleton
export const plantRepository = new PlantRepository();
