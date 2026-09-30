import rawCls from "@/data/cable-landing-stations.json";
import { CableLandingStation, SubseaBackhaulAnalysis } from "@/lib/types/subsea-backhaul";

const landingStations: CableLandingStation[] = rawCls as CableLandingStation[];

export function getCableLandingStations(): CableLandingStation[] {
  return landingStations || [];
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

export function findNearestCableLandingStation(lat: number, lng: number): SubseaBackhaulAnalysis | null {
  const stations = getCableLandingStations();
  if (!stations.length) return null;

  let nearest: CableLandingStation | null = null;
  let minDistance = Infinity;

  for (const s of stations) {
    const d = haversineDistanceKm(lat, lng, s.latitude, s.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = s;
    }
  }

  if (!nearest) return null;

  // Terrestrial fiber latency: ~5 microseconds per kilometer in silica + equipment delay
  // Round-trip terrestrial latency ≈ (dist * 2) * 0.005 ms/km * 1.3 (path routing circuity factor)
  const terrestrialRttMs = Math.round(minDistance * 2 * 0.005 * 1.3 * 10) / 10;

  let backhaulRating: SubseaBackhaulAnalysis["backhaulRating"] = "Continental Core";
  let redundancy: SubseaBackhaulAnalysis["darkFiberRouteRedundancy"] = "Single Radial Route";

  if (minDistance <= 75) {
    backhaulRating = "Tier-1 Ultra-Low Latency Gateway";
    redundancy = "3+ Diverse Terrestrial Conduits";
  } else if (minDistance <= 350) {
    backhaulRating = "Direct Coastal Backhaul";
    redundancy = "3+ Diverse Terrestrial Conduits";
  } else if (minDistance <= 1200) {
    backhaulRating = "Secondary Inland Corridor";
    redundancy = "Dual Redundant Fiber Paths";
  }

  const distKm = Math.round(minDistance * 10) / 10;

  return {
    nearestCls: nearest,
    terrestrialDistanceKm: distKm,
    estimatedTerrestrialLatencyMs: terrestrialRttMs,
    totalTransatlanticLatencyRttMs: Math.round((nearest.rttToLondonMs + terrestrialRttMs) * 10) / 10,
    totalTranspacificLatencyRttMs: Math.round((nearest.rttToTokyoMs + terrestrialRttMs) * 10) / 10,
    totalEuroAsiaLatencyRttMs: Math.round((nearest.rttToSingaporeMs + terrestrialRttMs) * 10) / 10,
    backhaulRating,
    darkFiberRouteRedundancy: redundancy,
  };
}
