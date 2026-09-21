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
