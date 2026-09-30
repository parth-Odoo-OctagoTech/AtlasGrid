import { BtmColocationSite } from "@/lib/types/btm-colocation";
import rawBtmSites from "@/data/btm-colocation-sites.json";

const cachedBtmSites: BtmColocationSite[] = rawBtmSites as BtmColocationSite[];

export function getBtmColocationSites(): BtmColocationSite[] {
  return cachedBtmSites || [];
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

export interface NearestBtmAnalysis {
  site: BtmColocationSite;
  distanceKm: number;
  isDirectColocationViable: boolean; // Within 15km direct bus/feeder distance
  annualTransmissionTariffSavingsMillionDollars: number; // e.g. for 250MW load
  cleanEnergyOfftakeMatchPct: number;
}

export function findNearestBtmColocation(
  lat: number,
  lng: number,
  targetLoadMw: number = 250
): NearestBtmAnalysis | null {
  const sites = getBtmColocationSites();
  if (!sites.length) return null;

  let nearest: BtmColocationSite | null = null;
  let minDistance = Infinity;

  for (const s of sites) {
    const d = haversineDistanceKm(lat, lng, s.latitude, s.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = s;
    }
  }

  if (!nearest) return null;

  const isDirectColocationViable = minDistance <= 25.0; // Within 25km direct connection corridor
  const hoursPerYear = 8760;
  const annualMwh = targetLoadMw * hoursPerYear * 0.95; // 95% capacity factor
  const tariffSavingsDollar = annualMwh * nearest.rtoTariffBypassSavingsDollarPerMwh;
  const annualSavingsMillion = Math.round((tariffSavingsDollar / 1_000_000) * 10) / 10;
  const cleanMatchPct = Math.min(100, Math.round((nearest.availableDirectBtmCapacityMw / targetLoadMw) * 100));

  return {
    site: nearest,
    distanceKm: Math.round(minDistance * 10) / 10,
    isDirectColocationViable,
    annualTransmissionTariffSavingsMillionDollars: annualSavingsMillion,
    cleanEnergyOfftakeMatchPct: cleanMatchPct,
  };
}
