import { SubstationQueueProfile } from "@/lib/types/interconnection-queue";
import rawQueues from "@/data/interconnection-queues.json";

const cachedQueues: SubstationQueueProfile[] = rawQueues as SubstationQueueProfile[];

export function getInterconnectionQueues(): SubstationQueueProfile[] {
  return cachedQueues || [];
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface NearestQueueAnalysis {
  substationQueue: SubstationQueueProfile;
  distanceKm: number;
  feasibilityRating: "Favorable (High Headroom)" | "Moderate Headroom" | "Congested Queue" | "Severely Saturated";
  estimatedEnergizationYear: number;
  networkUpgradeRequired: boolean;
}

export function findNearestInterconnectionQueue(
  lat: number,
  lng: number,
  targetLoadMw: number = 250
): NearestQueueAnalysis | null {
  const queues = getInterconnectionQueues();
  if (!queues.length) return null;

  let nearest: SubstationQueueProfile | null = null;
  let minDistance = Infinity;

  for (const q of queues) {
    const d = haversineDistanceKm(lat, lng, q.latitude, q.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = q;
    }
  }

  if (!nearest) return null;

  const currentYear = new Date().getFullYear();
  const energizationYear = Math.ceil(currentYear + nearest.estimatedEnergizationLeadTimeYears);
  const networkUpgradeRequired = targetLoadMw > nearest.availableLargeLoadHeadroomMw;

  let feasibilityRating: NearestQueueAnalysis["feasibilityRating"] = "Favorable (High Headroom)";
  if (nearest.queueSaturationIndex >= 85) {
    feasibilityRating = "Severely Saturated";
  } else if (nearest.queueSaturationIndex >= 65 || networkUpgradeRequired) {
    feasibilityRating = "Congested Queue";
  } else if (nearest.queueSaturationIndex >= 50) {
    feasibilityRating = "Moderate Headroom";
  }

  return {
    substationQueue: nearest,
    distanceKm: Math.round(minDistance * 10) / 10,
    feasibilityRating,
    estimatedEnergizationYear: energizationYear,
    networkUpgradeRequired,
  };
}
