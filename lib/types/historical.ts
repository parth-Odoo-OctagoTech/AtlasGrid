/**
 * AtlasGrid - Historical Hazard, Climate & Fleet Growth Types
 * Covers USGS Earthquakes, NOAA Severe Storms/Hurricanes, NASA POWER Climate Normals & DC Evolution
 */

export interface HistoricalEarthquake {
  id: string;
  name: string;
  magnitude: number;
  depthKm: number;
  occurredAt: string; // ISO 8601 date string
  latitude: number;
  longitude: number;
  place: string;
  significance: number;
  mmi?: number; // Modified Mercalli Intensity (I - X)
  tsunami?: boolean;
  feltReports?: number;
  source: "USGS_COMCAT" | "ISC_GEM" | "REGIONAL_SEISMIC";
}

export interface HistoricalStormEvent {
  id: string;
  eventType: "tornado" | "hurricane" | "hail" | "wind" | "cyclone";
  name: string;
  intensity: string; // e.g., 'EF3', 'EF4', 'EF5', 'Cat 3', 'Cat 4', 'Cat 5'
  categoryNum: number; // 1-5 scale for normalized sorting
  occurredAt: string;
  latitude: number;
  longitude: number;
  pathCoordinates?: [number, number][]; // [longitude, latitude][] track
  maxWindMph?: number;
  damagesUsdMillions?: number;
  stateOrRegion?: string;
  country: string;
  source: "NOAA_SPC" | "NHC_HURDAT2" | "IBTrACS" | "JTWC";
}

export interface MonthlyClimateNormal {
  month: number; // 1-12
  monthName: string;
  avgDryBulbC: number;
  avgWetBulbC: number;
  maxWetBulbC: number;
  minDryBulbC: number;
  coolingDegreeDays: number;
  freeCoolingHours: number; // Hours wet-bulb is <= 18°C allowing economizer mode
  relativeHumidityPct: number;
  solarIrradianceKwhM2: number;
}

export interface HistoricalClimateRecord {
  regionCode: string;
  regionName: string;
  latitude: number;
  longitude: number;
  period: string; // e.g. "2015-2025 (10-Year Normal)"
  annualAvgDryBulbC: number;
  annualAvgWetBulbC: number;
  peakWetBulbC: number;
  totalAnnualFreeCoolingHours: number; // Max 8760
  freeCoolingEfficiencyPct: number; // Percentage of the year free cooling is viable
  extremeHeatDaysPerYear: number; // Days > 35°C (95°F)
  source: "NASA_POWER" | "OPEN_METEO_HISTORICAL" | "ERA5";
  monthlyNormals: MonthlyClimateNormal[];
}

export interface HistoricalDataCenterGrowth {
  year: number;
  totalPowerMw: number;
  operationalFacilities: number;
  hyperscaleCount: number;
  colocationCount: number;
  enterpriseCount: number;
  avgPue: number;
  cleanEnergySharePct: number;
  cumulativeTflopsComputeEst: number; // Floating point operations index
  keyMilestone?: string;
}

export interface FacilityHistoricalRiskProfile {
  facilityId: string;
  facilityName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  earthquakeSummary: {
    totalEvents: number;
    maxMagnitude: number;
    closestDistanceKm: number;
    closestEventName?: string;
    closestEventYear?: number;
    eventsInRadius: Array<{
      id: string;
      name: string;
      magnitude: number;
      distanceKm: number;
      occurredAt: string;
    }>;
  };
  stormSummary: {
    totalSevereEvents: number;
    maxIntensity: string;
    closestDistanceKm: number;
    closestEventName?: string;
    closestEventYear?: number;
    eventsInRadius: Array<{
      id: string;
      name: string;
      eventType: string;
      intensity: string;
      distanceKm: number;
      occurredAt: string;
    }>;
  };
  climateBaseline?: HistoricalClimateRecord;
}

export interface HistoricalPowerGenerationYear {
  year: number;
  usTotalGenerationTwh: number;
  usGenerationBySource: {
    coalTwh: number;
    naturalGasTwh: number;
    nuclearTwh: number;
    hydroTwh: number;
    windTwh: number;
    solarTwh: number;
    batteryStorageTwh: number;
    otherTwh: number;
  };
  usCarbonIntensityGramsPerKwh: number;
  usNuclearBaseloadGw: number;
  usNuclearCapacityFactorPct: number;
  usCoalRetirementsCumulativeGw: number;
  euCarbonIntensityGramsPerKwh: number;
  euRenewableSharePct: number;
  apacGenerationTwh: number;
  keyGridMilestone?: string;
}

export interface HistoricalLmpHub {
  hubId: string;
  hubName: string;
  avgLmpUsdPerMwh: number;
  peakLmpUsdPerMwh: number;
  offPeakLmpUsdPerMwh: number;
  negativePriceHoursPct: number;
  maxSpikeLmpUsdPerMwh: number;
  volatilityIndex: number;
  primaryDriver: string;
}

export interface HistoricalLmpYear {
  year: number;
  globalMacroContext: string;
  hubs: HistoricalLmpHub[];
}

export interface HistoricalQueueBacklogYear {
  year: number;
  totalQueuedCapacityGw: number;
  averageDwellYears: number;
  completionRatePct: number;
  attritionRatePct: number;
  byTechnologyGw: {
    solarGw: number;
    storageGw: number;
    windGw: number;
    gasGw: number;
    hybridGw: number;
    largeLoadDataCentersGw: number;
  };
  byIsoGw: {
    pjmGw: number;
    ercotGw: number;
    caisoGw: number;
    misoGw: number;
    sppGw: number;
    isoneGw: number;
    nyisoGw: number;
    nonIsoGw: number;
  };
  regulatoryStatus: string;
  implicationForDataCenters: string;
}

export interface HistoricalFloodEvent {
  id: string;
  year: number;
  eventName: string;
  occurredDate: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  hazardType: string;
  peakSurgeOrDepthMeters: number;
  damagesUsdBillions: number;
  infrastructureImpact: string;
  dcInsuranceImplication: string;
}

export interface HistoricalGridEmergencyEvent {
  id: string;
  year: number;
  eventName: string;
  startDate: string;
  endDate: string;
  eventType: string;
  gridRegion: string;
  generationOfflineMw: number;
  customersWithoutPowerMillions: number;
  maxWholesalePriceMwh: number;
  criticalFailureMechanism: string;
  dcOperationalLesson: string;
}

export interface DailySnapshotManifestItem {
  snapshotDate: string;
  timestamp: string;
  sha256: string;
  substationsCount: number;
  powerPlantsCount: number;
  dataCentersCount: number;
  darkFiberCorridorsCount: number;
  floodHazardZonesCount: number;
  earthquakesCount: number;
  stormsCount: number;
  totalPlantCapacityMw: number;
  pjmWesternHubLmp: number;
  ercotNorthHubLmp: number;
}

