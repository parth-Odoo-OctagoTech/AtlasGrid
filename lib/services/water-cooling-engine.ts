export type CoolingArchitecture =
  | "evaporative_cooling"
  | "hybrid_trim_chillers"
  | "closed_loop_dry_chillers"
  | "direct_to_chip_liquid"
  | "immersion_cooling";

export interface WaterCoolingAnalysisInput {
  dcLoadMw: number;
  designWetBulbC?: number; // e.g. 21°C in Ashburn, 24°C in Phoenix, 18°C in Santa Clara
  freeCoolingHoursPct?: number; // e.g. 74%
  localElectricityCostPerMwh?: number; // e.g. $85/MWh
  waterUtilityCostPerThousandGallons?: number; // e.g. $4.50 / 1,000 gallons
}

export interface CoolingArchitectureMetrics {
  name: string;
  architecture: CoolingArchitecture;
  pueBaseline: number;
  wueLitersPerKwh: number; // Water Usage Effectiveness
  annualWaterConsumptionMgy: number; // Million Gallons per Year
  peakDailyWaterWithdrawalMgd: number; // Million Gallons per Day
  coolingPowerPenaltyMw: number; // Extra MW required for heat rejection
  annualWaterUtilityCost: number; // $
  annualCoolingElectricityCost: number; // $
  totalAnnualCoolingOperatingCost: number; // $
  waterStressRegulatoryRisk: "Low" | "Moderate" | "High" | "Severe (Moratorium Risk)";
}

export interface WaterCoolingComparisonReport {
  dcLoadMw: number;
  designWetBulbC: number;
  freeCoolingHoursPct: number;
  architectures: CoolingArchitectureMetrics[];
  dryCoolingPenaltyVsEvaporative: {
    pueDelta: number;
    extraPeakMwRequired: number;
    annualExtraPowerCostMillionDollars: number;
    annualWaterSavedMillionGallons: number;
    netAnnualCostDeltaMillionDollars: number;
  };
}

export function calculateWaterCoolingMetrics(input: WaterCoolingAnalysisInput): WaterCoolingComparisonReport {
  const mw = Math.max(10, input.dcLoadMw);
  const wetBulb = input.designWetBulbC ?? 21.5;
  const economizerPct = (input.freeCoolingHoursPct ?? 72) / 100;
  const powerCostMwh = input.localElectricityCostPerMwh ?? 85;
  const waterCostPerKGal = input.waterUtilityCostPerThousandGallons ?? 4.5;

  const hoursPerYear = 8760;
  const annualItMwh = mw * hoursPerYear;

  // Temperature stress multiplier: high wet-bulb increases evaporative water loss and dry chiller head pressure
  const tempStressFactor = Math.max(0.8, (wetBulb / 20.0) ** 1.3);

  // 1. Evaporative Cooling
  const evapWue = Math.round(1.8 * tempStressFactor * (1 - economizerPct * 0.5) * 100) / 100;
  const evapLiters = annualItMwh * 1000 * evapWue;
  const evapMgy = Math.round((evapLiters / 3.78541 / 1_000_000) * 10) / 10;
  const evapMgd = Math.round((evapMgy / 365) * 100) / 100;
  const evapPue = 1.16;
  const evapCoolingMw = mw * (evapPue - 1.0);
  const evapPowerCost = evapCoolingMw * hoursPerYear * powerCostMwh;
  const evapWaterCost = (evapMgy * 1000) * waterCostPerKGal;

  // 2. Hybrid Trim Chillers
  const hybridWue = Math.round(evapWue * 0.45 * 100) / 100;
  const hybridMgy = Math.round(evapMgy * 0.45 * 10) / 10;
  const hybridMgd = Math.round((hybridMgy / 365) * 100) / 100;
  const hybridPue = 1.20;
  const hybridCoolingMw = mw * (hybridPue - 1.0);
  const hybridPowerCost = hybridCoolingMw * hoursPerYear * powerCostMwh;
  const hybridWaterCost = (hybridMgy * 1000) * waterCostPerKGal;

  // 3. Closed-Loop Dry Chillers (Zero Consumptive Water)
  const dryWue = 0.02; // Closed-loop make-up only
  const dryMgy = Math.round(evapMgy * 0.01 * 10) / 10;
  const dryMgd = 0.01;
  const dryPue = 1.26 * (wetBulb > 24 ? 1.04 : 1.0); // Chiller lift penalty in hot weather
  const dryCoolingMw = mw * (dryPue - 1.0);
  const dryPowerCost = dryCoolingMw * hoursPerYear * powerCostMwh;
  const dryWaterCost = (dryMgy * 1000) * waterCostPerKGal;

  // 4. Direct-to-Chip (D2C) Liquid Cooling (Warm Water Heat Rejection)
  const d2cWue = 0.01;
  const d2cMgy = Math.round(evapMgy * 0.005 * 10) / 10;
  const d2cMgd = 0.005;
  const d2cPue = 1.12; // High efficiency direct liquid capture
  const d2cCoolingMw = mw * (d2cPue - 1.0);
  const d2cPowerCost = d2cCoolingMw * hoursPerYear * powerCostMwh;
  const d2cWaterCost = (d2cMgy * 1000) * waterCostPerKGal;

  // 5. Immersion Cooling
  const immersionWue = 0.0;
  const immersionMgy = 0.0;
  const immersionMgd = 0.0;
  const immersionPue = 1.05;
  const immersionCoolingMw = mw * (immersionPue - 1.0);
  const immersionPowerCost = immersionCoolingMw * hoursPerYear * powerCostMwh;
  const immersionWaterCost = 0;

  const architectures: CoolingArchitectureMetrics[] = [
    {
      name: "Evaporative Cooling Towers",
      architecture: "evaporative_cooling",
      pueBaseline: evapPue,
      wueLitersPerKwh: evapWue,
      annualWaterConsumptionMgy: evapMgy,
      peakDailyWaterWithdrawalMgd: evapMgd,
      coolingPowerPenaltyMw: Math.round(evapCoolingMw * 10) / 10,
      annualWaterUtilityCost: Math.round(evapWaterCost),
      annualCoolingElectricityCost: Math.round(evapPowerCost),
      totalAnnualCoolingOperatingCost: Math.round(evapWaterCost + evapPowerCost),
      waterStressRegulatoryRisk: wetBulb > 22 ? "Severe (Moratorium Risk)" : "High",
    },
    {
      name: "Hybrid Evaporative + Trim Chillers",
      architecture: "hybrid_trim_chillers",
      pueBaseline: hybridPue,
      wueLitersPerKwh: hybridWue,
      annualWaterConsumptionMgy: hybridMgy,
      peakDailyWaterWithdrawalMgd: hybridMgd,
      coolingPowerPenaltyMw: Math.round(hybridCoolingMw * 10) / 10,
      annualWaterUtilityCost: Math.round(hybridWaterCost),
      annualCoolingElectricityCost: Math.round(hybridPowerCost),
      totalAnnualCoolingOperatingCost: Math.round(hybridWaterCost + hybridPowerCost),
      waterStressRegulatoryRisk: "Moderate",
    },
    {
      name: "Closed-Loop Dry Coolers (Zero Water)",
      architecture: "closed_loop_dry_chillers",
      pueBaseline: Math.round(dryPue * 100) / 100,
      wueLitersPerKwh: dryWue,
      annualWaterConsumptionMgy: dryMgy,
      peakDailyWaterWithdrawalMgd: dryMgd,
      coolingPowerPenaltyMw: Math.round(dryCoolingMw * 10) / 10,
      annualWaterUtilityCost: Math.round(dryWaterCost),
      annualCoolingElectricityCost: Math.round(dryPowerCost),
      totalAnnualCoolingOperatingCost: Math.round(dryWaterCost + dryPowerCost),
      waterStressRegulatoryRisk: "Low",
    },
    {
      name: "Direct-to-Chip (D2C) Liquid Cooling",
      architecture: "direct_to_chip_liquid",
      pueBaseline: d2cPue,
      wueLitersPerKwh: d2cWue,
      annualWaterConsumptionMgy: d2cMgy,
      peakDailyWaterWithdrawalMgd: d2cMgd,
      coolingPowerPenaltyMw: Math.round(d2cCoolingMw * 10) / 10,
      annualWaterUtilityCost: Math.round(d2cWaterCost),
      annualCoolingElectricityCost: Math.round(d2cPowerCost),
      totalAnnualCoolingOperatingCost: Math.round(d2cWaterCost + d2cPowerCost),
      waterStressRegulatoryRisk: "Low",
    },
    {
      name: "Single-Phase Immersion Cooling",
      architecture: "immersion_cooling",
      pueBaseline: immersionPue,
      wueLitersPerKwh: immersionWue,
      annualWaterConsumptionMgy: immersionMgy,
      peakDailyWaterWithdrawalMgd: immersionMgd,
      coolingPowerPenaltyMw: Math.round(immersionCoolingMw * 10) / 10,
      annualWaterUtilityCost: 0,
      annualCoolingElectricityCost: Math.round(immersionPowerCost),
      totalAnnualCoolingOperatingCost: Math.round(immersionPowerCost),
      waterStressRegulatoryRisk: "Low",
    },
  ];

  const pueDelta = Math.round((dryPue - evapPue) * 100) / 100;
  const extraMw = Math.round((dryCoolingMw - evapCoolingMw) * 10) / 10;
  const extraPowerCostMillion = Math.round(((dryPowerCost - evapPowerCost) / 1_000_000) * 100) / 100;
  const waterSavedMgy = Math.round((evapMgy - dryMgy) * 10) / 10;
  const waterSavingsCostMillion = Math.round(((evapWaterCost - dryWaterCost) / 1_000_000) * 100) / 100;
  const netCostDeltaMillion = Math.round((extraPowerCostMillion - waterSavingsCostMillion) * 100) / 100;

  return {
    dcLoadMw: mw,
    designWetBulbC: wetBulb,
    freeCoolingHoursPct: Math.round(economizerPct * 100),
    architectures,
    dryCoolingPenaltyVsEvaporative: {
      pueDelta,
      extraPeakMwRequired: extraMw,
      annualExtraPowerCostMillionDollars: extraPowerCostMillion,
      annualWaterSavedMillionGallons: waterSavedMgy,
      netAnnualCostDeltaMillionDollars: netCostDeltaMillion,
    },
  };
}
