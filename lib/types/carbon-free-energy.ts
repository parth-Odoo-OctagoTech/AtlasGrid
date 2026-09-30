export interface CfeHourlyDataPoint {
  hour: number; // 0 - 23
  dcLoadMw: number;
  solarGenerationMw: number;
  windGenerationMw: number;
  cleanFirmGenerationMw: number; // Nuclear / Hydro / Geothermal
  gridFossilSupplyMw: number;
  bessChargeMw: number;
  bessDischargeMw: number;
  bessStateOfChargeMwh: number;
  hourlyCfeMatchPct: number; // 0 - 100%
  marginalEmissionsGCo2PerKwh: number;
}

export interface CfeSimulationResult {
  targetDcLoadMw: number;
  solarInstalledMw: number;
  windInstalledMw: number;
  cleanFirmContractedMw: number;
  bessCapacityMwh: number;
  // Summary matching metrics
  twentyFourSevenCfeScorePct: number; // 0 - 100% annual 24/7 matching
  annualCleanEnergyDeliveredGwh: number;
  annualFossilGridDeficitGwh: number;
  annualCurtailedCleanGwh: number;
  avoidedScope2EmissionsTonsCo2: number;
  residualScope2EmissionsTonsCo2: number;
  hourlyProfile: CfeHourlyDataPoint[];
}
