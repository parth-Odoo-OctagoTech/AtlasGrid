export interface GlobalElectricityPriceRecord {
  id: string;
  country: string;
  countryCode: string;
  stateOrRegion: string;
  marketHub: string;
  lat: number;
  lng: number;
  industrialTariffUsdPerKwh: number;
  commercialTariffUsdPerKwh: number;
  wholesaleDayAheadUsdPerMwh: number;
  wholesaleRealTimeUsdPerMwh: number;
  rtoWheelingTariffUsdPerMwh: number;
  renewablePpaPriceUsdPerMwh: number;
  negativePricingHoursPct: number;
  gridOperator: string;
  primaryUtilityTariffSchedule: string;
  powerMixPrimarySource: string;
  reportingSource: string;
  dataConfidence: string;
  annualKwh100Mw: number;
  annualCost100MwUsd: number;
  annualCost250MwUsd: number;
  annualWheelingCost100MwUsd: number;
  vsVirginiaBenchmarkPct: number;
  effectiveSparkSpreadUsdPerMwh: number;
  lastUpdated: string;
}

export interface ElectricityPriceLookupResult {
  record: GlobalElectricityPriceRecord;
  distanceKm: number;
  isExactJurisdictionMatch: boolean;
  estimatedFacilityAnnualCostUsd: number;
  estimatedFacilityAnnualWheelingUsd: number;
  facilityMw: number;
}
