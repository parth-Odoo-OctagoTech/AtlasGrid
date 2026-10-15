import { PowerPlant, Substation } from "../types/power-plant";
import { DataCenter } from "../types/data-center";
import { CableLandingStation } from "../types/subsea-backhaul";
import { DarkFiberCorridor, SeismicFaultLine, FloodHazardZone } from "../types/siting";
import { HistoricalEarthquake } from "../types/historical";
import { calculateRegionalCarbonProfile } from "./carbon-intensity-service";
import { getElectricityPriceForLocation } from "./electricity-price-service";

export interface SitingSonarResult {
  center: { lat: number; lng: number };
  radiusKm: number;
  overallScore: number;
  overallTier: "Tier IV (Institutional Anchor)" | "Tier III (Prime Hyperscale)" | "Tier II (Secondary Feasible)" | "Tier I (Constrained / High Risk)";
  power: {
    totalGenerationMw: number;
    plantsInRadiusCount: number;
    cleanCfePercentage: number;
    dominantFuel: string;
    nearestPlant: { name: string; capacityMw: number; fuelType: string; distanceKm: number } | null;
  };
  grid: {
    nearestSubstation: { name: string; voltageKv: number; distanceKm: number } | null;
    estimatedQueueMonths: number;
    headroomStatus: "Surplus (>250MW)" | "Adequate (100-250MW)" | "Constrained (<50MW)";
  };
  connectivity: {
    nearestCls: { name: string; distanceKm: number; latencyMs: number; peeringDbId?: number } | null;
    nearestFiberDistanceKm: number;
    carrierDiversityRating: "High" | "Moderate" | "Limited";
  };
  hazards: {
    nearestFaultDistanceKm: number;
    seismicRisk: "Low" | "Moderate" | "High";
    floodRiskLevel: "None" | "Moderate" | "High" | "Extreme";
    earthquakesInRadiusCount: number;
  };
  economics: {
    tariffUsdPerKwh: number;
    annualPowerCost100MwUsd: number;
    regionName: string;
  };
  dataCentersCount: number;
}

/**
 * Calculates a complete institutional spatial due diligence profile for any point on Earth
 */
export function analyzeSitingSonar({
  lat,
  lng,
  radiusKm,
  plants,
  dataCenters,
  substations,
  cableLandingStations,
  darkFiberCorridors,
  seismicFaults,
  floodHazardZones,
  earthquakes,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
  plants: PowerPlant[];
  dataCenters: DataCenter[];
  substations: Substation[];
  cableLandingStations: CableLandingStation[];
  darkFiberCorridors: DarkFiberCorridor[];
  seismicFaults: SeismicFaultLine[];
  floodHazardZones: FloodHazardZone[];
  earthquakes: HistoricalEarthquake[];
}): SitingSonarResult {
  const cosLat = Math.cos((lat * Math.PI) / 180);

  const getDistanceKm = (targetLat: number, targetLng: number) => {
    const dLat = (targetLat - lat) * 111;
    const dLng = (targetLng - lng) * 111 * cosLat;
    return Math.hypot(dLat, dLng);
  };

  // 1. Power Analysis
  let totalGenerationMw = 0;
  let plantsInRadiusCount = 0;
  let nearestPlant: { name: string; capacityMw: number; fuelType: string; distanceKm: number } | null = null;
  let minPlantDist = Infinity;

  for (const plant of plants) {
    const dist = getDistanceKm(plant.latitude, plant.longitude);
    if (dist <= radiusKm) {
      totalGenerationMw += plant.capacityMw || plant.currentOutputMw || 0;
      plantsInRadiusCount++;
      if (dist < minPlantDist) {
        minPlantDist = dist;
        nearestPlant = {
          name: plant.name,
          capacityMw: plant.capacityMw,
          fuelType: plant.fuelType,
          distanceKm: Math.round(dist * 10) / 10,
        };
      }
    }
  }

  const carbon = calculateRegionalCarbonProfile(lat, lng, plants, radiusKm);

  // 2. Substation & Interconnection Queue
  let nearestSub: { name: string; voltageKv: number; distanceKm: number } | null = null;
  let minSubDist = Infinity;

  for (const sub of substations) {
    const dist = getDistanceKm(sub.latitude, sub.longitude);
    if (dist < minSubDist) {
      minSubDist = dist;
      nearestSub = {
        name: sub.name,
        voltageKv: sub.voltageKv,
        distanceKm: Math.round(dist * 10) / 10,
      };
    }
  }

  // Interconnection queue estimation based on distance and voltage
  let estimatedQueueMonths = 24;
  if (nearestSub) {
    if (nearestSub.voltageKv >= 500) estimatedQueueMonths = 36;
    else if (nearestSub.voltageKv >= 230) estimatedQueueMonths = 24;
    else estimatedQueueMonths = 18;
  }
  const headroomStatus: "Surplus (>250MW)" | "Adequate (100-250MW)" | "Constrained (<50MW)" =
    totalGenerationMw >= 1000 ? "Surplus (>250MW)" : totalGenerationMw >= 300 ? "Adequate (100-250MW)" : "Constrained (<50MW)";

  // 3. Connectivity (CLS & Fiber)
  let nearestCls: { name: string; distanceKm: number; latencyMs: number; peeringDbId?: number } | null = null;
  let minClsDist = Infinity;

  for (const cls of cableLandingStations) {
    const dist = getDistanceKm(cls.latitude, cls.longitude);
    if (dist < minClsDist) {
      minClsDist = dist;
      const latencyMs = Math.round(dist * 2 * 0.005 * 1.3 * 10) / 10;
      nearestCls = {
        name: cls.name,
        distanceKm: Math.round(dist * 10) / 10,
        latencyMs,
        peeringDbId: cls.peeringDbFacilityId,
      };
    }
  }

  let minFiberDist = Infinity;
  for (const fiber of darkFiberCorridors) {
    for (const [fLng, fLat] of fiber.coordinates) {
      const dist = getDistanceKm(fLat, fLng);
      if (dist < minFiberDist) {
        minFiberDist = dist;
      }
    }
  }
  const nearestFiberDistanceKm = Math.round(minFiberDist * 10) / 10;
  const carrierDiversityRating = nearestFiberDistanceKm <= 15 ? "High" : nearestFiberDistanceKm <= 50 ? "Moderate" : "Limited";

  // 4. Hazards (Seismic, Flood, Quakes)
  let minFaultDist = Infinity;
  for (const fault of seismicFaults) {
    for (const [flng, flat] of fault.coordinates) {
      const dist = getDistanceKm(flat, flng);
      if (dist < minFaultDist) {
        minFaultDist = dist;
      }
    }
  }
  const nearestFaultDistanceKm = Math.round(minFaultDist * 10) / 10;
  const seismicRisk = nearestFaultDistanceKm < 25 ? "High" : nearestFaultDistanceKm < 80 ? "Moderate" : "Low";

  let maxFloodRisk: "None" | "Moderate" | "High" | "Extreme" = "None";
  for (const zone of floodHazardZones) {
    const dist = getDistanceKm(zone.coordinates[1], zone.coordinates[0]);
    const zoneRadiusKm = (zone.radiusMeters || 16000) / 1000;
    if (dist <= zoneRadiusKm + 5) {
      if (zone.riskLevel === "Extreme") maxFloodRisk = "Extreme";
      else if (zone.riskLevel === "High" && maxFloodRisk !== "Extreme") maxFloodRisk = "High";
      else if (maxFloodRisk === "None") maxFloodRisk = "Moderate";
    }
  }

  let earthquakesInRadiusCount = 0;
  for (const eq of earthquakes) {
    const dist = getDistanceKm(eq.latitude, eq.longitude);
    if (dist <= radiusKm) {
      earthquakesInRadiusCount++;
    }
  }

  // 5. Regional Electricity Pricing
  const priceRecord = getElectricityPriceForLocation(lat, lng, "US", "Global", 100);
  const tariffUsdPerKwh = priceRecord?.record.industrialTariffUsdPerKwh || 0.075;
  const annualPowerCost100MwUsd = Math.round(tariffUsdPerKwh * 876000000 * 0.95);
  const regionName = priceRecord?.record.stateOrRegion || "Regional Grid Interconnect";

  // 6. Existing DC count in radius
  let dataCentersCount = 0;
  for (const dc of dataCenters) {
    const dist = getDistanceKm(dc.latitude, dc.longitude);
    if (dist <= radiusKm) {
      dataCentersCount++;
    }
  }

  // 7. Synthetic Score (0 to 100)
  let score = 70;
  if (totalGenerationMw >= 1000) score += 10;
  else if (totalGenerationMw < 200) score -= 10;

  if (nearestSub && nearestSub.distanceKm <= 10) score += 10;
  else if (nearestSub && nearestSub.distanceKm > 35) score -= 8;

  if (nearestFiberDistanceKm <= 15) score += 8;
  else if (nearestFiberDistanceKm > 60) score -= 8;

  if (seismicRisk === "High") score -= 14;
  if (maxFloodRisk === "Extreme") score -= 16;
  else if (maxFloodRisk === "High") score -= 10;

  if (tariffUsdPerKwh <= 0.065) score += 8;
  else if (tariffUsdPerKwh >= 0.10) score -= 10;

  score = Math.max(25, Math.min(96, score));

  const overallTier =
    score >= 85
      ? "Tier IV (Institutional Anchor)"
      : score >= 72
      ? "Tier III (Prime Hyperscale)"
      : score >= 55
      ? "Tier II (Secondary Feasible)"
      : "Tier I (Constrained / High Risk)";

  return {
    center: { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 },
    radiusKm,
    overallScore: score,
    overallTier,
    power: {
      totalGenerationMw: Math.round(totalGenerationMw),
      plantsInRadiusCount,
      cleanCfePercentage: carbon.cfePercentage,
      dominantFuel: carbon.dominantFuel,
      nearestPlant,
    },
    grid: {
      nearestSubstation: nearestSub,
      estimatedQueueMonths,
      headroomStatus,
    },
    connectivity: {
      nearestCls,
      nearestFiberDistanceKm,
      carrierDiversityRating,
    },
    hazards: {
      nearestFaultDistanceKm,
      seismicRisk,
      floodRiskLevel: maxFloodRisk,
      earthquakesInRadiusCount,
    },
    economics: {
      tariffUsdPerKwh,
      annualPowerCost100MwUsd,
      regionName,
    },
    dataCentersCount,
  };
}
