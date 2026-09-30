import {
  HistoricalEarthquake,
  HistoricalStormEvent,
  HistoricalClimateRecord,
  HistoricalDataCenterGrowth,
  FacilityHistoricalRiskProfile,
  HistoricalPowerGenerationYear,
  HistoricalLmpYear,
  HistoricalQueueBacklogYear,
  HistoricalFloodEvent,
  HistoricalGridEmergencyEvent,
  DailySnapshotManifestItem
} from "../types/historical";
import earthquakesRaw from "@/data/historical-earthquakes.json";
import stormsRaw from "@/data/historical-storms.json";
import climateRaw from "@/data/historical-climate.json";
import growthRaw from "@/data/historical-dc-growth.json";
import generationRaw from "@/data/historical-power-generation.json";
import lmpRaw from "@/data/historical-lmp-pricing.json";
import queueRaw from "@/data/historical-queue-backlog.json";
import floodRaw from "@/data/historical-flood-events.json";
import extremeRaw from "@/data/historical-extreme-events.json";
import snapshotManifestRaw from "@/data/historical-snapshots/manifest.json";

const staticEarthquakes = earthquakesRaw as unknown as HistoricalEarthquake[];
const staticStorms = stormsRaw as unknown as HistoricalStormEvent[];
const staticClimateRecords = climateRaw as unknown as Record<string, HistoricalClimateRecord>;
const staticGrowthTimeline = growthRaw as unknown as HistoricalDataCenterGrowth[];
const staticGeneration = generationRaw as unknown as HistoricalPowerGenerationYear[];
const staticLmp = lmpRaw as unknown as HistoricalLmpYear[];
const staticQueues = queueRaw as unknown as HistoricalQueueBacklogYear[];
const staticFloods = floodRaw as unknown as HistoricalFloodEvent[];
const staticExtremes = extremeRaw as unknown as HistoricalGridEmergencyEvent[];
const staticSnapshotManifest = snapshotManifestRaw as unknown as DailySnapshotManifestItem[];

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
  return Number((R * c).toFixed(2));
}

/**
 * Get historical earthquakes with optional minimum magnitude, bounding box and limit
 */
export function getHistoricalEarthquakes(filters?: {
  minMag?: number;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  limit?: number;
}): HistoricalEarthquake[] {
  let list = staticEarthquakes;

  if (filters?.minMag !== undefined) {
    list = list.filter((eq) => eq.magnitude >= filters.minMag!);
  }

  if (filters?.bbox) {
    const [minLon, minLat, maxLon, maxLat] = filters.bbox;
    list = list.filter(
      (eq) =>
        eq.longitude >= minLon &&
        eq.longitude <= maxLon &&
        eq.latitude >= minLat &&
        eq.latitude <= maxLat
    );
  }

  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }

  return list;
}

/**
 * Get historical storms with optional filters
 */
export function getHistoricalStorms(filters?: {
  eventType?: string;
  minCategory?: number;
  bbox?: [number, number, number, number];
  limit?: number;
}): HistoricalStormEvent[] {
  let list = staticStorms;

  if (filters?.eventType) {
    list = list.filter((s) => s.eventType.toLowerCase() === filters.eventType!.toLowerCase());
  }

  if (filters?.minCategory !== undefined) {
    list = list.filter((s) => s.categoryNum >= filters.minCategory!);
  }

  if (filters?.bbox) {
    const [minLon, minLat, maxLon, maxLat] = filters.bbox;
    list = list.filter(
      (s) =>
        s.longitude >= minLon &&
        s.longitude <= maxLon &&
        s.latitude >= minLat &&
        s.latitude <= maxLat
    );
  }

  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }

  return list;
}

/**
 * Get historical climate baseline for a specific region or closest region
 */
export function getHistoricalClimate(regionCode?: string): HistoricalClimateRecord | null {
  if (!regionCode) return null;
  const normalized = regionCode.toLowerCase().replace(/[\s-]+/g, "_");
  if (staticClimateRecords[normalized]) {
    return staticClimateRecords[normalized];
  }
  // Try partial match
  for (const [key, record] of Object.entries(staticClimateRecords)) {
    if (key.includes(normalized) || record.regionName.toLowerCase().includes(normalized)) {
      return record;
    }
  }
  return null;
}

/**
 * Get all available climate market baselines
 */
export function getAllClimateRecords(): HistoricalClimateRecord[] {
  return Object.values(staticClimateRecords);
}

/**
 * Find the nearest climatological station to given coordinates
 */
export function getNearestClimateRecord(lat: number, lon: number): HistoricalClimateRecord | null {
  const records = getAllClimateRecords();
  if (!records.length) return null;

  let closest: HistoricalClimateRecord | null = null;
  let minDistance = Infinity;

  for (const r of records) {
    const d = haversineDistanceKm(lat, lon, r.latitude, r.longitude);
    if (d < minDistance) {
      minDistance = d;
      closest = r;
    }
  }

  return closest;
}

/**
 * Get the full 1998-2026 data center fleet growth timeline
 */
export function getDataCenterGrowthTimeline(): HistoricalDataCenterGrowth[] {
  return staticGrowthTimeline;
}

/**
 * Compute comprehensive historical risk profile for any given coordinate location
 */
export function getFacilityHistoricalRisk(
  facilityId: string,
  facilityName: string,
  lat: number,
  lon: number,
  radiusKm: number = 100
): FacilityHistoricalRiskProfile {
  // 1. Earthquakes within radius
  const nearbyEqs: Array<{
    id: string;
    name: string;
    magnitude: number;
    distanceKm: number;
    occurredAt: string;
  }> = [];

  let maxEqMag = 0;
  let closestEqDist = Infinity;
  let closestEqName: string | undefined = undefined;
  let closestEqYear: number | undefined = undefined;

  for (const eq of staticEarthquakes) {
    const dist = haversineDistanceKm(lat, lon, eq.latitude, eq.longitude);
    if (dist <= radiusKm) {
      nearbyEqs.push({
        id: eq.id,
        name: eq.name,
        magnitude: eq.magnitude,
        distanceKm: dist,
        occurredAt: eq.occurredAt
      });

      if (eq.magnitude > maxEqMag) {
        maxEqMag = eq.magnitude;
      }
      if (dist < closestEqDist) {
        closestEqDist = dist;
        closestEqName = eq.name;
        closestEqYear = new Date(eq.occurredAt).getFullYear();
      }
    }
  }

  // Sort nearby earthquakes by magnitude descending
  nearbyEqs.sort((a, b) => b.magnitude - a.magnitude);

  // 2. Storms within radius
  const nearbyStorms: Array<{
    id: string;
    name: string;
    eventType: string;
    intensity: string;
    distanceKm: number;
    occurredAt: string;
  }> = [];

  let maxStormIntensity = "None";
  let maxStormCat = 0;
  let closestStormDist = Infinity;
  let closestStormName: string | undefined = undefined;
  let closestStormYear: number | undefined = undefined;

  for (const storm of staticStorms) {
    const dist = haversineDistanceKm(lat, lon, storm.latitude, storm.longitude);
    if (dist <= radiusKm) {
      nearbyStorms.push({
        id: storm.id,
        name: storm.name,
        eventType: storm.eventType,
        intensity: storm.intensity,
        distanceKm: dist,
        occurredAt: storm.occurredAt
      });

      if (storm.categoryNum > maxStormCat) {
        maxStormCat = storm.categoryNum;
        maxStormIntensity = storm.intensity;
      }
      if (dist < closestStormDist) {
        closestStormDist = dist;
        closestStormName = storm.name;
        closestStormYear = new Date(storm.occurredAt).getFullYear();
      }
    }
  }

  // Sort nearby storms by severity descending
  nearbyStorms.sort((a, b) => a.distanceKm - b.distanceKm);

  // 3. Nearest climatological baseline
  const climateBaseline = getNearestClimateRecord(lat, lon) || undefined;

  return {
    facilityId,
    facilityName,
    latitude: lat,
    longitude: lon,
    radiusKm,
    earthquakeSummary: {
      totalEvents: nearbyEqs.length,
      maxMagnitude: maxEqMag,
      closestDistanceKm: closestEqDist === Infinity ? 0 : closestEqDist,
      closestEventName: closestEqName,
      closestEventYear: closestEqYear,
      eventsInRadius: nearbyEqs.slice(0, 5)
    },
    stormSummary: {
      totalSevereEvents: nearbyStorms.length,
      maxIntensity: maxStormIntensity,
      closestDistanceKm: closestStormDist === Infinity ? 0 : closestStormDist,
      closestEventName: closestStormName,
      closestEventYear: closestStormYear,
      eventsInRadius: nearbyStorms.slice(0, 5)
    },
    climateBaseline
  };
}

/**
 * Get multi-decade historical power generation mix and fleet carbon intensity
 */
export function getHistoricalPowerGeneration(filters?: {
  startYear?: number;
  endYear?: number;
}): HistoricalPowerGenerationYear[] {
  let list = staticGeneration;
  if (filters?.startYear !== undefined) {
    list = list.filter((g) => g.year >= filters.startYear!);
  }
  if (filters?.endYear !== undefined) {
    list = list.filter((g) => g.year <= filters.endYear!);
  }
  return list;
}

/**
 * Get 10-year wholesale power LMP pricing history across 8 major hubs
 */
export function getHistoricalLmpPricing(filters?: {
  startYear?: number;
  endYear?: number;
}): HistoricalLmpYear[] {
  let list = staticLmp;
  if (filters?.startYear !== undefined) {
    list = list.filter((l) => l.year >= filters.startYear!);
  }
  if (filters?.endYear !== undefined) {
    list = list.filter((l) => l.year <= filters.endYear!);
  }
  return list;
}

/**
 * Get 15-year FERC Order 2023 transmission interconnection queue evolution
 */
export function getHistoricalQueueBacklog(filters?: {
  startYear?: number;
  endYear?: number;
}): HistoricalQueueBacklogYear[] {
  let list = staticQueues;
  if (filters?.startYear !== undefined) {
    list = list.filter((q) => q.year >= filters.startYear!);
  }
  if (filters?.endYear !== undefined) {
    list = list.filter((q) => q.year <= filters.endYear!);
  }
  return list;
}

/**
 * Get 75-year historical flood catastrophes and surge benchmark events
 */
export function getHistoricalFloodCatastrophes(filters?: {
  minYear?: number;
  limit?: number;
}): HistoricalFloodEvent[] {
  let list = staticFloods;
  if (filters?.minYear !== undefined) {
    list = list.filter((f) => f.year >= filters.minYear!);
  }
  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }
  return list;
}

/**
 * Get 25-year grid contingency emergencies, blackouts, and extreme climate events
 */
export function getHistoricalGridEmergencies(filters?: {
  eventType?: string;
  limit?: number;
}): HistoricalGridEmergencyEvent[] {
  let list = staticExtremes;
  if (filters?.eventType) {
    list = list.filter((e) => e.eventType.toLowerCase() === filters.eventType!.toLowerCase());
  }
  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }
  return list;
}

/**
 * Get manifest of daily point-in-time snapshots
 */
export function getDailySnapshotManifest(): DailySnapshotManifestItem[] {
  return staticSnapshotManifest;
}

