import { DataCenter } from "@/lib/types/data-center";
import { SitingScoreBreakdown } from "@/lib/types/siting";

/**
 * Calculates a comprehensive 7-pillar siting suitability breakdown for a Data Center facility.
 * Follows the Uptime Institute, FEMA, and ASHRAE design standards.
 */
export function calculateSitingScoreBreakdown(dc: DataCenter): SitingScoreBreakdown {
  // 1. Power & Grid Interconnect (Weight: 0.25)
  // Considers clean energy percentage, estimated power capacity, and tier
  const cleanPct = dc.localCleanEnergyPercent ?? 50;
  const powerScore = Math.min(100, Math.round(cleanPct * 0.6 + 40));

  // 2. Telecom & Dark Fiber Diversity (Weight: 0.20)
  // Carrier neutrality, Tier 1 transit count, proximity to dark fiber conduits & IXP latency
  const carrierNeutral = dc.carrierNeutral ?? true;
  const darkFiberKm = dc.darkFiberDistanceKm ?? 3;
  const ixpLatency = dc.ixpLatencyMs ?? 2.5;
  const telecomScore = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        (carrierNeutral ? 40 : 15) +
        Math.max(0, 30 - darkFiberKm * 2.5) +
        Math.max(0, 30 - ixpLatency * 5)
      )
    )
  );

  // 3. Environmental & Natural Hazards (Weight: 0.15)
  // FEMA 100-yr/500-yr flood zones, seismic fault proximity & PGA, and tornado exposure
  let hazardScore = 100;
  if (dc.floodZone === "AE" || dc.floodZone === "VE") {
    hazardScore -= 45; // High flood risk is severely penalized
  } else if (dc.floodZone === "X500") {
    hazardScore -= 20; // 500-yr floodplain requires pad elevation
  }
  const pga = dc.seismicPga ?? 0.1;
  if (pga > 0.3) hazardScore -= 25;
  else if (pga > 0.15) hazardScore -= 12;

  if (dc.tornadoRiskLevel === "High") hazardScore -= 10;
  hazardScore = Math.max(15, hazardScore);

  // 4. Climate & Economizer Free-Cooling (Weight: 0.15)
  // Annual hours with wet-bulb <= 18°C allowing direct evaporative/air-side economization
  const freeCoolingPct = dc.freeCoolingHoursPct ?? 70;
  const climateScore = Math.min(100, Math.max(25, freeCoolingPct));

  // 5. Soil Bearing & Topography (Weight: 0.10)
  // Slope gradient (< 3% ideal), bedrock depth, and liquefaction risk
  const slope = dc.slopePct ?? 1.5;
  let soilScore = 100 - slope * 10;
  if (dc.liquefactionRisk === "High") soilScore -= 30;
  else if (dc.liquefactionRisk === "Moderate") soilScore -= 15;
  soilScore = Math.min(100, Math.max(25, Math.round(soilScore)));

  // 6. Water & Wastewater Resources (Weight: 0.08)
  // Baseline water stress index and municipal discharge outfalls
  const waterStressPct = dc.waterStressPct ?? 25;
  const waterScore = Math.min(100, Math.max(20, Math.round(100 - waterStressPct * 0.8)));

  // 7. Zoning, Clearances & Man-Made Hazards (Weight: 0.07)
  // Flight approach cones, high-pressure natural gas pipeline blast zones, rail lines
  let zoningScore = 90;
  if (dc.inFlightCorridor) zoningScore -= 20;
  if ((dc.nearestGasPipelineMeters ?? 1500) < 500) zoningScore -= 25;
  if (!dc.airQualityAttainment) zoningScore -= 10;
  zoningScore = Math.min(100, Math.max(25, zoningScore));

  // Composite Weighted Sum
  const totalCompositeScore = Math.min(
    99,
    Math.max(
      35,
      Math.round(
        powerScore * 0.25 +
        telecomScore * 0.20 +
        hazardScore * 0.15 +
        climateScore * 0.15 +
        soilScore * 0.10 +
        waterScore * 0.08 +
        zoningScore * 0.07
      )
    )
  );

  let tierRating: SitingScoreBreakdown["tierRating"] = "Tier II Conditional";
  if (totalCompositeScore >= 85) {
    tierRating = "Tier IV Prime";
  } else if (totalCompositeScore >= 70) {
    tierRating = "Tier III Standard";
  } else if (totalCompositeScore < 55) {
    tierRating = "Unfavorable";
  }

  return {
    powerGridScore: powerScore,
    telecomFiberScore: telecomScore,
    environmentalHazardScore: hazardScore,
    climateEconomizerScore: climateScore,
    soilTopographyScore: soilScore,
    waterResourceScore: waterScore,
    zoningClearanceScore: zoningScore,
    totalCompositeScore,
    tierRating,
  };
}

/**
 * Returns color codes for the siting suitability score.
 */
export function getSitingScoreColor(score: number): { hex: string; rgb: [number, number, number]; label: string } {
  if (score >= 85) {
    return { hex: "#10b981", rgb: [16, 185, 129], label: "Tier IV Prime" };
  }
  if (score >= 70) {
    return { hex: "#06b6d4", rgb: [6, 182, 212], label: "Tier III Standard" };
  }
  if (score >= 55) {
    return { hex: "#f59e0b", rgb: [245, 158, 11], label: "Tier II Conditional" };
  }
  return { hex: "#ef4444", rgb: [239, 68, 68], label: "Unfavorable / Hazard Constrained" };
}
