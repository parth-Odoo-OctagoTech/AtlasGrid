import { GlobalElectricityPriceRecord, ElectricityPriceLookupResult } from "@/lib/types/electricity-price";
import rawPrices from "@/data/global-electricity-prices.json";

const cachedPrices: GlobalElectricityPriceRecord[] = rawPrices as GlobalElectricityPriceRecord[];

export function getGlobalElectricityPrices(): GlobalElectricityPriceRecord[] {
  return cachedPrices || [];
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

export function calculateAnnualCampusPowerOpEx(
  mw: number,
  industrialTariffUsdPerKwh: number,
  capacityFactor: number = 0.95
): {
  annualKwh: number;
  annualOpExUsd: number;
  monthlyOpExUsd: number;
  costPerMegawattHour: number;
} {
  const hoursPerYear = 8760;
  const annualKwh = Math.round(mw * 1000 * hoursPerYear * capacityFactor);
  const annualOpExUsd = Math.round(annualKwh * industrialTariffUsdPerKwh);
  const monthlyOpExUsd = Math.round(annualOpExUsd / 12);
  const costPerMegawattHour = Math.round(industrialTariffUsdPerKwh * 1000 * 100) / 100;

  return {
    annualKwh,
    annualOpExUsd,
    monthlyOpExUsd,
    costPerMegawattHour,
  };
}

export function getElectricityPriceForLocation(
  lat: number,
  lng: number,
  country?: string,
  state?: string,
  facilityMw: number = 100
): ElectricityPriceLookupResult | null {
  const prices = getGlobalElectricityPrices();
  if (!prices || prices.length === 0) return null;

  // 1. Try finding a jurisdiction match if state or country is provided
  if (state || country) {
    const normState = (state || "").toLowerCase().trim();
    const normCountry = (country || "").toLowerCase().trim();

    // Direct match on state/region
    const stateMatch = prices.find((p) => {
      const pRegion = p.stateOrRegion.toLowerCase();
      const pCountry = p.country.toLowerCase();
      if (normState && (pRegion.includes(normState) || normState.includes(pRegion.split(" ")[0]))) {
        return true;
      }
      return false;
    });

    if (stateMatch) {
      const d = haversineDistanceKm(lat, lng, stateMatch.lat, stateMatch.lng);
      const opex = calculateAnnualCampusPowerOpEx(facilityMw, stateMatch.industrialTariffUsdPerKwh);
      const wheeling = Math.round(facilityMw * 8760 * 0.95 * stateMatch.rtoWheelingTariffUsdPerMwh);
      return {
        record: stateMatch,
        distanceKm: Math.round(d),
        isExactJurisdictionMatch: true,
        estimatedFacilityAnnualCostUsd: opex.annualOpExUsd,
        estimatedFacilityAnnualWheelingUsd: wheeling,
        facilityMw,
      };
    }

    // Match on country
    if (normCountry) {
      const countryMatches = prices.filter(
        (p) =>
          p.country.toLowerCase().includes(normCountry) ||
          normCountry.includes(p.country.toLowerCase()) ||
          p.countryCode.toLowerCase() === normCountry
      );

      if (countryMatches.length > 0) {
        // Find closest within country
        let closest = countryMatches[0];
        let minD = Infinity;
        for (const p of countryMatches) {
          const d = haversineDistanceKm(lat, lng, p.lat, p.lng);
          if (d < minD) {
            minD = d;
            closest = p;
          }
        }
        const opex = calculateAnnualCampusPowerOpEx(facilityMw, closest.industrialTariffUsdPerKwh);
        const wheeling = Math.round(facilityMw * 8760 * 0.95 * closest.rtoWheelingTariffUsdPerMwh);
        return {
          record: closest,
          distanceKm: Math.round(minD),
          isExactJurisdictionMatch: true,
          estimatedFacilityAnnualCostUsd: opex.annualOpExUsd,
          estimatedFacilityAnnualWheelingUsd: wheeling,
          facilityMw,
        };
      }
    }
  }

  // 2. Spatial nearest neighbor lookup
  let nearest = prices[0];
  let minDistance = Infinity;

  for (const p of prices) {
    const d = haversineDistanceKm(lat, lng, p.lat, p.lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = p;
    }
  }

  const opex = calculateAnnualCampusPowerOpEx(facilityMw, nearest.industrialTariffUsdPerKwh);
  const wheeling = Math.round(facilityMw * 8760 * 0.95 * nearest.rtoWheelingTariffUsdPerMwh);

  return {
    record: nearest,
    distanceKm: Math.round(minDistance),
    isExactJurisdictionMatch: minDistance < 500,
    estimatedFacilityAnnualCostUsd: opex.annualOpExUsd,
    estimatedFacilityAnnualWheelingUsd: wheeling,
    facilityMw,
  };
}

export function getElectricityPriceSummaryStats() {
  const prices = getGlobalElectricityPrices();
  if (!prices || prices.length === 0) return null;

  const sortedByTariff = [...prices].sort((a, b) => a.industrialTariffUsdPerKwh - b.industrialTariffUsdPerKwh);
  const cheapest = sortedByTariff.slice(0, 5);
  const mostExpensive = [...sortedByTariff].reverse().slice(0, 5);

  const avgTariff = prices.reduce((acc, p) => acc + p.industrialTariffUsdPerKwh, 0) / prices.length;
  const avgWholesaleLmp = prices.reduce((acc, p) => acc + p.wholesaleDayAheadUsdPerMwh, 0) / prices.length;

  return {
    totalHubs: prices.length,
    averageIndustrialTariffUsdPerKwh: Math.round(avgTariff * 1000) / 1000,
    averageWholesaleLmpUsdPerMwh: Math.round(avgWholesaleLmp * 10) / 10,
    cheapestHubs: cheapest.map((p) => ({
      hub: p.marketHub,
      region: p.stateOrRegion,
      country: p.country,
      tariffKwh: p.industrialTariffUsdPerKwh,
      annual100MwUsd: p.annualCost100MwUsd,
    })),
    mostExpensiveHubs: mostExpensive.map((p) => ({
      hub: p.marketHub,
      region: p.stateOrRegion,
      country: p.country,
      tariffKwh: p.industrialTariffUsdPerKwh,
      annual100MwUsd: p.annualCost100MwUsd,
    })),
  };
}
