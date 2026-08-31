import { DataCenter } from "../types/data-center";
import { PowerPlant, FuelType } from "../types/power-plant";

export interface SupplyingPlantInfo {
  id: string;
  name: string;
  operator: string;
  fuelType: FuelType;
  capacityMw: number;
  currentOutputMw: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  co2IntensityGPerKwh: number;
  status: string;
}

export interface LocalGridSupplyResult {
  supplyingPlants: SupplyingPlantInfo[];
  totalLocalCapacityMw: number;
  totalLocalOutputMw: number;
  cleanEnergyPercent: number;
  fossilEnergyPercent: number;
  fuelBreakdown: { fuelType: FuelType; mw: number; percent: number }[];
  localCo2IntensityGPerKwh: number;
  estimatedAnnualScope2Co2Tons: number;
}

export interface SuppliedDataCenterInfo {
  id: string;
  name: string;
  operator: string;
  category: string;
  estimatedPowerMw: number;
  pue: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

export interface LocalComputeDemandResult {
  nearbyDataCenters: SuppliedDataCenterInfo[];
  totalLocalComputeLoadMw: number;
  loadCapacityRatioPercent: number;
}

export interface GridNexusMarketSummary {
  region: string;
  country: string;
  totalGenerationCapacityMw: number;
  totalCurrentOutputMw: number;
  totalDataCenterLoadMw: number;
  cleanEnergyPercent: number;
  averagePue: number;
  computeLoadSharePercent: number;
  gridStatus: "optimal" | "balanced" | "strained";
}

/**
 * Calculates Great-Circle Distance between two coordinates in kilometers using Haversine formula
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Finds all power plants within radiusKm of a data center and computes local supply mix & carbon intensity
 */
export function findLocalGridSupply(
  dc: { latitude: number; longitude: number; estimatedPowerMw: number; pue?: number },
  plants: PowerPlant[],
  radiusKm = 100
): LocalGridSupplyResult {
  const distances: { plant: PowerPlant; dist: number }[] = [];

  for (const plant of plants) {
    const dist = haversineDistanceKm(dc.latitude, dc.longitude, plant.latitude, plant.longitude);
    if (dist <= radiusKm) {
      distances.push({ plant, dist });
    }
  }

  // If no plants found within radiusKm (e.g. isolated island/hub), expand search to top 5 nearest globally
  let selectedDistances = distances;
  if (selectedDistances.length === 0) {
    const all = plants.map((plant) => ({
      plant,
      dist: haversineDistanceKm(dc.latitude, dc.longitude, plant.latitude, plant.longitude),
    }));
    all.sort((a, b) => a.dist - b.dist);
    selectedDistances = all.slice(0, 5);
  } else {
    selectedDistances.sort((a, b) => a.dist - b.dist);
  }

  let totalCap = 0;
  let totalOut = 0;
  let cleanCap = 0;
  let weightedCo2Sum = 0;
  const fuelMap: Partial<Record<FuelType, number>> = {};

  const supplyingPlants: SupplyingPlantInfo[] = selectedDistances.slice(0, 6).map((item) => {
    const p = item.plant;
    return {
      id: p.id,
      name: p.name,
      operator: p.operator,
      fuelType: p.fuelType,
      capacityMw: p.capacityMw,
      currentOutputMw: p.currentOutputMw,
      distanceKm: item.dist,
      latitude: p.latitude,
      longitude: p.longitude,
      co2IntensityGPerKwh: p.co2IntensityGPerKwh || 0,
      status: p.status,
    };
  });

  for (const item of selectedDistances) {
    const p = item.plant;
    totalCap += p.capacityMw;
    totalOut += p.currentOutputMw;
    fuelMap[p.fuelType] = (fuelMap[p.fuelType] || 0) + p.capacityMw;

    const isClean = ["nuclear", "hydro", "solar", "wind", "geothermal", "storage"].includes(p.fuelType);
    if (isClean) {
      cleanCap += p.capacityMw;
    }
    weightedCo2Sum += (p.co2IntensityGPerKwh || 0) * p.capacityMw;
  }

  const cleanEnergyPercent = totalCap > 0 ? Math.round((cleanCap / totalCap) * 100) : 50;
  const fossilEnergyPercent = Math.max(0, 100 - cleanEnergyPercent);
  const localCo2IntensityGPerKwh = totalCap > 0 ? Math.round(weightedCo2Sum / totalCap) : 320;

  const fuelBreakdown = Object.entries(fuelMap)
    .map(([fuel, mw]) => ({
      fuelType: fuel as FuelType,
      mw: mw || 0,
      percent: totalCap > 0 ? Math.round(((mw || 0) / totalCap) * 100) : 0,
    }))
    .sort((a, b) => b.mw - a.mw);

  const pue = dc.pue || 1.25;
  // Annual Scope 2 CO2 (tons) = MW * PUE * 8760 hours * (gCO2/kWh) / 1,000,000
  const estimatedAnnualScope2Co2Tons = Math.round(
    (dc.estimatedPowerMw * pue * 8760 * localCo2IntensityGPerKwh) / 1000
  );

  return {
    supplyingPlants,
    totalLocalCapacityMw: totalCap,
    totalLocalOutputMw: totalOut,
    cleanEnergyPercent,
    fossilEnergyPercent,
    fuelBreakdown,
    localCo2IntensityGPerKwh,
    estimatedAnnualScope2Co2Tons,
  };
}

/**
 * Finds all data centers drawing power from within radiusKm of a power plant
 */
export function findSuppliedDataCenters(
  plant: { latitude: number; longitude: number; capacityMw: number },
  datacenters: DataCenter[],
  radiusKm = 100
): LocalComputeDemandResult {
  const distances: { dc: DataCenter; dist: number }[] = [];

  for (const dc of datacenters) {
    const dist = haversineDistanceKm(plant.latitude, plant.longitude, dc.latitude, dc.longitude);
    if (dist <= radiusKm) {
      distances.push({ dc, dist });
    }
  }

  distances.sort((a, b) => a.dist - b.dist);

  let totalLoad = 0;
  const nearbyDataCenters: SuppliedDataCenterInfo[] = distances.slice(0, 6).map((item) => {
    totalLoad += item.dc.estimatedPowerMw;
    return {
      id: item.dc.id,
      name: item.dc.name,
      operator: item.dc.operator,
      category: item.dc.category,
      estimatedPowerMw: item.dc.estimatedPowerMw,
      pue: item.dc.pue,
      distanceKm: item.dist,
      latitude: item.dc.latitude,
      longitude: item.dc.longitude,
    };
  });

  const loadCapacityRatioPercent =
    plant.capacityMw > 0 ? parseFloat(((totalLoad / plant.capacityMw) * 100).toFixed(1)) : 0;

  return {
    nearbyDataCenters,
    totalLocalComputeLoadMw: totalLoad,
    loadCapacityRatioPercent,
  };
}

/**
 * Generates market-by-market cross-reference nexus analytics
 */
export function getGridNexusAnalytics(
  plants: PowerPlant[],
  datacenters: DataCenter[]
): GridNexusMarketSummary[] {
  const regionMap: Record<
    string,
    {
      region: string;
      country: string;
      genCap: number;
      genOut: number;
      cleanCap: number;
      dcLoad: number;
      pueSum: number;
      dcCount: number;
    }
  > = {};

  for (const p of plants) {
    const reg = p.gridRegion || "GLOBAL_OTHER";
    if (!regionMap[reg]) {
      regionMap[reg] = {
        region: reg,
        country: p.countryName || p.country,
        genCap: 0,
        genOut: 0,
        cleanCap: 0,
        dcLoad: 0,
        pueSum: 0,
        dcCount: 0,
      };
    }
    regionMap[reg].genCap += p.capacityMw;
    regionMap[reg].genOut += p.currentOutputMw;
    if (["nuclear", "hydro", "solar", "wind", "geothermal", "storage"].includes(p.fuelType)) {
      regionMap[reg].cleanCap += p.capacityMw;
    }
  }

  for (const dc of datacenters) {
    // Map DC region to grid region
    let mappedRegion = "GLOBAL_OTHER";
    if (dc.region === "North America") mappedRegion = "PJM";
    else if (dc.region === "Europe") mappedRegion = "ENTSOE_DE";
    else if (dc.region === "India") mappedRegion = "INDIA_NREB";
    else if (dc.region === "Asia-Pacific") mappedRegion = "JAPAN_TEPCO";
    else if (dc.region === "Oceania") mappedRegion = "NEM_AUSTRALIA";
    else if (dc.region === "Latin America") mappedRegion = "BRAZIL_ONS";

    if (!regionMap[mappedRegion]) {
      regionMap[mappedRegion] = {
        region: mappedRegion,
        country: dc.countryName || dc.country,
        genCap: 50000,
        genOut: 35000,
        cleanCap: 25000,
        dcLoad: 0,
        pueSum: 0,
        dcCount: 0,
      };
    }
    regionMap[mappedRegion].dcLoad += dc.estimatedPowerMw;
    regionMap[mappedRegion].pueSum += dc.pue;
    regionMap[mappedRegion].dcCount += 1;
  }

  return Object.values(regionMap).map((m) => {
    const cleanEnergyPercent = m.genCap > 0 ? Math.round((m.cleanCap / m.genCap) * 100) : 50;
    const averagePue = m.dcCount > 0 ? parseFloat((m.pueSum / m.dcCount).toFixed(2)) : 1.25;
    const computeLoadSharePercent =
      m.genCap > 0 ? parseFloat(((m.dcLoad / m.genCap) * 100).toFixed(1)) : 0;

    let gridStatus: "optimal" | "balanced" | "strained" = "optimal";
    if (computeLoadSharePercent > 20 || m.genOut / m.genCap > 0.85) {
      gridStatus = "strained";
    } else if (computeLoadSharePercent > 10 || m.genOut / m.genCap > 0.7) {
      gridStatus = "balanced";
    }

    return {
      region: m.region,
      country: m.country,
      totalGenerationCapacityMw: m.genCap,
      totalCurrentOutputMw: m.genOut,
      totalDataCenterLoadMw: m.dcLoad,
      cleanEnergyPercent,
      averagePue,
      computeLoadSharePercent,
      gridStatus,
    };
  });
}
