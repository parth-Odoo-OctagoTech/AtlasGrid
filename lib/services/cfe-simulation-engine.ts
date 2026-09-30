import { CfeHourlyDataPoint, CfeSimulationResult } from "@/lib/types/carbon-free-energy";

export interface CfeSimulationInput {
  targetDcLoadMw: number;
  solarInstalledMw?: number;
  windInstalledMw?: number;
  cleanFirmContractedMw?: number;
  bessCapacityMwh?: number;
  regionGridIntensityGPerKwh?: number; // Default 350 g/kWh
}

// Normalized 24-hour diurnal solar capacity factor curve (peak at hour 13: 0.82)
const SOLAR_DIURNAL_CURVE = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.02, 0.12, 0.32, 0.54, 0.72, 0.80, 0.82, 0.81, 0.75, 0.62, 0.44, 0.22, 0.06, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
];

// Normalized 24-hour wind capacity factor curve (higher nocturnal / late evening winds)
const WIND_DIURNAL_CURVE = [
  0.48, 0.50, 0.52, 0.51, 0.49, 0.44, 0.38, 0.32, 0.28, 0.25, 0.24, 0.23, 0.24, 0.26, 0.29, 0.33, 0.38, 0.44, 0.47, 0.50, 0.52, 0.51, 0.49, 0.48,
];

export function run247CfeSimulation(input: CfeSimulationInput): CfeSimulationResult {
  const dcLoad = Math.max(10, input.targetDcLoadMw);
  const solarMw = input.solarInstalledMw ?? Math.round(dcLoad * 1.4);
  const windMw = input.windInstalledMw ?? Math.round(dcLoad * 0.8);
  const firmMw = input.cleanFirmContractedMw ?? Math.round(dcLoad * 0.3);
  const bessMwh = input.bessCapacityMwh ?? Math.round(dcLoad * 2.5);
  const gridIntensity = input.regionGridIntensityGPerKwh ?? 350;

  const bessMaxPowerMw = bessMwh > 0 ? bessMwh / 4 : 0; // 4-hour duration battery
  const bessRoundTripEfficiency = 0.88; // 88% roundtrip efficiency

  let currentSoc = bessMwh * 0.5; // Start with 50% SoC
  const hourlyProfile: CfeHourlyDataPoint[] = [];

  let totalCleanDeliveredMw = 0;
  let totalDeficitMw = 0;
  let totalCurtailedMw = 0;

  for (let h = 0; h < 24; h++) {
    const solGen = Math.round(solarMw * SOLAR_DIURNAL_CURVE[h] * 10) / 10;
    const wndGen = Math.round(windMw * WIND_DIURNAL_CURVE[h] * 10) / 10;
    const firmGen = Math.round(firmMw * 0.95 * 10) / 10; // 95% capacity factor

    const directCleanGen = solGen + wndGen + firmGen;
    let netBalance = directCleanGen - dcLoad;

    let bessCharge = 0;
    let bessDischarge = 0;

    if (netBalance > 0 && bessMwh > 0) {
      // Charge surplus into battery
      const maxChargePossible = Math.min(
        bessMaxPowerMw,
        (bessMwh - currentSoc) / Math.sqrt(bessRoundTripEfficiency),
        netBalance
      );
      bessCharge = Math.max(0, Math.round(maxChargePossible * 10) / 10);
      currentSoc += bessCharge * Math.sqrt(bessRoundTripEfficiency);
      const remainingSurplus = netBalance - bessCharge;
      if (remainingSurplus > 0) {
        totalCurtailedMw += remainingSurplus;
      }
    } else if (netBalance < 0 && bessMwh > 0 && currentSoc > 0) {
      // Discharge battery to meet deficit
      const deficit = Math.abs(netBalance);
      const maxDischargePossible = Math.min(
        bessMaxPowerMw,
        currentSoc * Math.sqrt(bessRoundTripEfficiency),
        deficit
      );
      bessDischarge = Math.max(0, Math.round(maxDischargePossible * 10) / 10);
      currentSoc -= bessDischarge / Math.sqrt(bessRoundTripEfficiency);
      currentSoc = Math.max(0, currentSoc);
    }

    const totalCleanEffective = Math.min(dcLoad, directCleanGen - bessCharge + bessDischarge);
    const gridFossilSupply = Math.max(0, Math.round((dcLoad - totalCleanEffective) * 10) / 10);
    const hourlyCfePct = Math.min(100, Math.max(0, Math.round((totalCleanEffective / dcLoad) * 1000) / 10));

    totalCleanDeliveredMw += totalCleanEffective;
    totalDeficitMw += gridFossilSupply;

    // Marginal carbon intensity: varies inversely with solar/wind abundance
    const hourlyMarginalCo2 = Math.round(
      Math.max(50, gridIntensity * (1 - (totalCleanEffective / dcLoad) * 0.8))
    );

    hourlyProfile.push({
      hour: h,
      dcLoadMw: dcLoad,
      solarGenerationMw: solGen,
      windGenerationMw: wndGen,
      cleanFirmGenerationMw: firmGen,
      gridFossilSupplyMw: gridFossilSupply,
      bessChargeMw: bessCharge,
      bessDischargeMw: bessDischarge,
      bessStateOfChargeMwh: Math.round(currentSoc * 10) / 10,
      hourlyCfeMatchPct: hourlyCfePct,
      marginalEmissionsGCo2PerKwh: hourlyMarginalCo2,
    });
  }

  const totalLoadDay = dcLoad * 24;
  const cfeScorePct = Math.round((totalCleanDeliveredMw / totalLoadDay) * 1000) / 10;
  const annualGwh = Math.round((totalCleanDeliveredMw * 365) / 1000);
  const annualDeficitGwh = Math.round((totalDeficitMw * 365) / 1000);
  const annualCurtailedGwh = Math.round((totalCurtailedMw * 365) / 1000);

  // Scope 2 emissions: MWh * gridIntensity / 1000 (tons CO2)
  const residualScope2Tons = Math.round((annualDeficitGwh * 1000 * gridIntensity) / 1000);
  const baselineUnabatedScope2Tons = Math.round(((totalLoadDay * 365) * gridIntensity) / 1000);
  const avoidedScope2Tons = Math.max(0, baselineUnabatedScope2Tons - residualScope2Tons);

  return {
    targetDcLoadMw: dcLoad,
    solarInstalledMw: solarMw,
    windInstalledMw: windMw,
    cleanFirmContractedMw: firmMw,
    bessCapacityMwh: bessMwh,
    twentyFourSevenCfeScorePct: cfeScorePct,
    annualCleanEnergyDeliveredGwh: annualGwh,
    annualFossilGridDeficitGwh: annualDeficitGwh,
    annualCurtailedCleanGwh: annualCurtailedGwh,
    avoidedScope2EmissionsTonsCo2: avoidedScope2Tons,
    residualScope2EmissionsTonsCo2: residualScope2Tons,
    hourlyProfile,
  };
}
