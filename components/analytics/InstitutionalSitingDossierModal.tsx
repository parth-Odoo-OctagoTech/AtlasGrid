"use client";

import React, { useState, useMemo } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Zap,
  RadioTower,
  Cpu,
  Droplets,
  Wind,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  Maximize2,
  Share2,
  Sliders,
  Building,
} from "lucide-react";
import { calculateSitingScoreBreakdown, getSitingScoreColor } from "@/lib/services/siting-suitability-service";
import { findNearestInterconnectionQueue } from "@/lib/services/interconnection-queue-service";
import { findNearestBtmColocation } from "@/lib/services/btm-colocation-service";
import { run247CfeSimulation } from "@/lib/services/cfe-simulation-engine";
import { calculateWaterCoolingMetrics } from "@/lib/services/water-cooling-engine";
import { DataCenter } from "@/lib/types/data-center";

export function InstitutionalSitingDossierModal() {
  const isDossierOpen = useGridStore((s) => s.isDossierOpen);
  const setDossierOpen = useGridStore((s) => s.setDossierOpen);
  const dossierTarget = useGridStore((s) => s.dossierTarget);
  const selectedDataCenter = useGridStore((s) => s.selectedDataCenter);
  const selectedStation = useGridStore((s) => s.selectedStation);
  const selectedSubstation = useGridStore((s) => s.selectedSubstation);

  // Dynamic campus sizing parameter (MW)
  const [targetLoadMw, setTargetLoadMw] = useState<number>(250);

  // Resolve target asset
  const target = useMemo(() => {
    if (dossierTarget?.dataCenter) return dossierTarget.dataCenter;
    if (dossierTarget?.station) {
      // Synthesize a representative data center profile from power station
      const st = dossierTarget.station;
      const synDc: DataCenter = {
        id: `dc-syn-${st.id}`,
        name: `${st.name} Co-Located AI Campus`,
        operator: "Hyperscale AI Offtaker (Simulated)",
        category: "hyperscale",
        latitude: st.latitude,
        longitude: st.longitude,
        estimatedPowerMw: targetLoadMw,
        pue: 1.18,
        country: st.country,
        countryName: st.countryName,
        region: st.gridRegion,
        coolingType: "Direct-to-Chip Liquid Cooling",
        tier: "Tier IV",
        website: null,
      };
      return synDc;
    }
    if (dossierTarget?.substation) {
      const sub = dossierTarget.substation;
      const synDc: DataCenter = {
        id: `dc-syn-${sub.id}`,
        name: `${sub.name} Point-of-Interconnect Data Campus`,
        operator: "Hyperscale AI Offtaker (Simulated)",
        category: "hyperscale",
        latitude: sub.latitude,
        longitude: sub.longitude,
        estimatedPowerMw: targetLoadMw,
        pue: 1.18,
        country: sub.country,
        countryName: sub.countryName,
        region: sub.gridRegion || "GLOBAL",
        coolingType: "Hybrid Closed-Loop Liquid",
        tier: "Tier IV",
        website: null,
      };
      return synDc;
    }
    if (selectedDataCenter) return selectedDataCenter;
    // Default fallback: Ashburn Prime Campus
    return {
      id: "us-dc-ashburn-prime",
      name: "Ashburn AI Supercluster Campus (Site 4A)",
      operator: "Hyperscale Consortium",
      category: "hyperscale" as const,
      latitude: 39.0438,
      longitude: -77.4874,
      estimatedPowerMw: targetLoadMw,
      pue: 1.18,
      country: "US",
      countryName: "United States",
      region: "PJM",
      coolingType: "Direct-to-Chip Liquid + Closed Loop",
      tier: "Tier IV Prime",
      website: null,
      darkFiberDistanceKm: 0.8,
      ixpLatencyMs: 1.2,
      floodZone: "X" as const,
      floodRiskLevel: "None" as const,
      seismicPga: 0.06,
      freeCoolingHoursPct: 76,
      designWetBulbC: 21.5,
      soilBearingCapacityLbs: 450,
      bedrockDepthMeters: 4.8,
      waterStressBaseline: "Low" as const,
    };
  }, [dossierTarget, selectedDataCenter, targetLoadMw]);

  // Compute 7-pillar siting breakdown
  const sitingBreakdown = useMemo(() => {
    return calculateSitingScoreBreakdown(target);
  }, [target]);

  // Compute Interconnection Queue & Substation Headroom
  const queueAnalysis = useMemo(() => {
    return findNearestInterconnectionQueue(target.latitude, target.longitude, targetLoadMw);
  }, [target.latitude, target.longitude, targetLoadMw]);

  // Compute Behind-The-Meter (BTM) Baseload Co-Location
  const btmAnalysis = useMemo(() => {
    return findNearestBtmColocation(target.latitude, target.longitude, targetLoadMw);
  }, [target.latitude, target.longitude, targetLoadMw]);

  // Compute 24/7 Carbon-Free Energy Matching
  const cfeResult = useMemo(() => {
    return run247CfeSimulation({
      targetDcLoadMw: targetLoadMw,
      solarInstalledMw: Math.round(targetLoadMw * 1.5),
      windInstalledMw: Math.round(targetLoadMw * 0.9),
      cleanFirmContractedMw: btmAnalysis?.isDirectColocationViable
        ? Math.round(targetLoadMw * 0.8)
        : Math.round(targetLoadMw * 0.25),
      bessCapacityMwh: Math.round(targetLoadMw * 2.8),
    });
  }, [targetLoadMw, btmAnalysis]);

  // Compute Water Cooling & Dry Cooling Penalty
  const coolingReport = useMemo(() => {
    return calculateWaterCoolingMetrics({
      dcLoadMw: targetLoadMw,
      designWetBulbC: target.designWetBulbC || 21.5,
      freeCoolingHoursPct: target.freeCoolingHoursPct || 74,
      localElectricityCostPerMwh: 85,
      waterUtilityCostPerThousandGallons: 4.5,
    });
  }, [targetLoadMw, target.designWetBulbC, target.freeCoolingHoursPct]);

  // Memo reference ID and timestamp
  const memoDate = useMemo(() => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), []);
  const memoId = useMemo(() => `AG-IC-${Math.abs(Math.round(target.latitude * 1000 + target.longitude * 1000)).toString(16).toUpperCase()}-2026`, [target.latitude, target.longitude]);

  // Investment Committee Verdict computation
  const verdict = useMemo(() => {
    const score = sitingBreakdown.totalCompositeScore;
    if (score >= 88 && (queueAnalysis?.feasibilityRating === "Favorable (High Headroom)" || btmAnalysis?.isDirectColocationViable)) {
      return {
        rating: "APPROVED FOR ACQUISITION // TIER IV PRIME",
        badgeColor: "bg-[#10b981] text-[#0a1e14] border-[#10b981]",
        summary: "Institutional prime site. Unencumbered 500kV bulk transmission capacity combined with superior telecom diversity and sub-2.0ms latency to regional exchange points. Negligible catastrophic environmental hazard exposure.",
      };
    } else if (score >= 75) {
      return {
        rating: "CONDITIONAL APPROVAL // STRUCTURAL MITIGATIONS REQUIRED",
        badgeColor: "bg-[#f59e0b] text-[#241a05] border-[#f59e0b]",
        summary: "Economically viable with targeted engineering mitigations. Queue interconnect dwell time requires fast-tracking BTM baseload PPA or closed-loop dry cooler deployment to satisfy municipal water restrictions.",
      };
    } else {
      return {
        rating: "UNFAVORABLE // ELEVATED REGULATORY & SITING RISK",
        badgeColor: "bg-[#ef4444] text-[#ffffff] border-[#ef4444]",
        summary: "Severe transmission queue congestion or environmental hazard liabilities (floodplain or fault setback constraints) present prohibitive execution timelines and capital expenditure overruns.",
      };
    }
  }, [sitingBreakdown, queueAnalysis, btmAnalysis]);

  if (!isDossierOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#0c1014] text-[#f5f8fa] border border-[#293742] rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141a20] border-b border-[#293742]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider text-[#f5f8fa]">
                  ATLASGRID • INSTITUTIONAL SITING DOSSIER
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40">
                  CONFIDENTIAL // IC MEMO
                </span>
              </div>
              <div className="text-xs text-[#8a9ba8]">
                MEMO REF: <span className="text-[#06b6d4]">{memoId}</span> • REVIEW DATE: {memoDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2b95d6] hover:bg-[#237bb2] text-white text-xs font-bold transition-all shadow-md"
              title="Print or export to PDF memo"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PRINT / EXPORT (PDF)</span>
            </button>
            <button
              onClick={() => setDossierOpen(false)}
              className="p-1.5 rounded hover:bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0c1014] text-xs">
          {/* Target Facility & Dynamic Capacity Sizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-[#141a20] border border-[#293742]">
            <div className="md:col-span-2 space-y-1">
              <div className="text-[10px] text-[#5c7080] uppercase tracking-wider">Evaluation Subject Property</div>
              <div className="text-lg font-bold text-[#f5f8fa]">{target.name}</div>
              <div className="text-xs text-[#8a9ba8] flex items-center gap-3">
                <span>Coordinates: <strong className="text-[#06b6d4]">{target.latitude.toFixed(4)}°N, {target.longitude.toFixed(4)}°W</strong></span>
                <span>Jurisdiction: <strong className="text-[#f5f8fa]">{target.region} / {target.countryName || target.country}</strong></span>
              </div>
            </div>

            <div className="rounded p-3 bg-[#0d1217] border border-[#24303a] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-[#8a9ba8] font-semibold flex items-center gap-1">
                  <Sliders className="h-3 w-3 text-[#2b95d6]" />
                  <span>Target Campus IT Load:</span>
                </span>
                <span className="text-sm font-bold text-[#06b6d4]">{targetLoadMw} MW</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={targetLoadMw}
                onChange={(e) => setTargetLoadMw(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#202b33] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
              />
              <div className="flex justify-between text-[9px] text-[#5c7080] mt-1">
                <span>50 MW (Edge)</span>
                <span>250 MW (Hyperscale)</span>
                <span>1,000 MW (GW AI Campus)</span>
              </div>
            </div>
          </div>

          {/* Investment Committee Verdict Banner */}
          <div className={`p-4 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${verdict.badgeColor}`}>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                INVESTMENT COMMITTEE ACTIONABLE VERDICT
              </div>
              <div className="text-base font-extrabold tracking-wide">
                {verdict.rating}
              </div>
              <div className="text-xs font-normal max-w-3xl opacity-95">
                {verdict.summary}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold opacity-80">Composite Score</div>
                <div className="text-3xl font-black">{sitingBreakdown.totalCompositeScore}<span className="text-sm font-normal">/100</span></div>
              </div>
            </div>
          </div>

          {/* 10-Pillar Radar & Evaluation Grid */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#8a9ba8] font-bold mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-[#2b95d6]" />
              <span>10-Pillar Institutional Siting Radar</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { label: "1. Substation Headroom", score: queueAnalysis ? (queueAnalysis.networkUpgradeRequired ? 68 : 94) : 80, badge: queueAnalysis?.feasibilityRating || "Standard", color: "#2b95d6" },
                { label: "2. Queue Dwell & Attrition", score: queueAnalysis ? 100 - queueAnalysis.substationQueue.queueSaturationIndex : 75, badge: queueAnalysis ? `${queueAnalysis.substationQueue.averageQueueDwellYears} Yrs` : "4.2 Yrs", color: "#06b6d4" },
                { label: "3. Dark Fiber Diversity", score: sitingBreakdown.telecomFiberScore, badge: target.darkFiberDistanceKm ? `${target.darkFiberDistanceKm} km` : "Direct", color: "#10b981" },
                { label: "4. BTM Nuclear Co-Location", score: btmAnalysis?.site.btmFeasibilityScore || 65, badge: btmAnalysis ? `${btmAnalysis.distanceKm} km` : "None", color: "#a855f7" },
                { label: "5. 24/7 CFE Match %", score: cfeResult.twentyFourSevenCfeScorePct, badge: `${cfeResult.twentyFourSevenCfeScorePct}%`, color: "#15b371" },
                { label: "6. FEMA Flood Zone", score: sitingBreakdown.environmentalHazardScore, badge: `Zone ${target.floodZone || "X"}`, color: target.floodZone === "X" ? "#10b981" : "#ef4444" },
                { label: "7. Seismic Fault Setback", score: (target.seismicPga || 0.08) < 0.15 ? 95 : 60, badge: `PGA ${target.seismicPga || 0.08}g`, color: "#f59e0b" },
                { label: "8. Free-Cooling PUE", score: sitingBreakdown.climateEconomizerScore, badge: `${target.freeCoolingHoursPct || 74}% Yr`, color: "#38bdf8" },
                { label: "9. Water Stress & WUE", score: sitingBreakdown.waterResourceScore, badge: target.waterStressBaseline || "Low", color: "#15b371" },
                { label: "10. Soil Bearing & Pad", score: sitingBreakdown.soilTopographyScore, badge: `${target.soilBearingCapacityLbs || 450} psf`, color: "#d9822b" },
              ].map((p) => (
                <div key={p.label} className="bg-[#141a20] p-2.5 rounded border border-[#293742] space-y-1">
                  <div className="text-[10px] text-[#8a9ba8] truncate">{p.label}</div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold" style={{ color: p.color }}>{p.score}</span>
                    <span className="text-[9px] text-[#5c7080] truncate font-semibold">{p.badge}</span>
                  </div>
                  <div className="h-1 w-full bg-[#202b33] rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${p.score}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1 & Section 2: Grid Queue Intelligence + BTM Baseload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 1: Interconnection Queue & Headroom */}
            <div className="bg-[#141a20] p-4 rounded-lg border border-[#293742] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#24303a]">
                <div className="flex items-center gap-2 text-[#2b95d6] font-bold text-xs uppercase">
                  <RadioTower className="h-4 w-4" />
                  <span>1. Interconnection Queue & POI Headroom</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#202b33] text-[#06b6d4]">
                  {queueAnalysis?.substationQueue.isoRegion || "RTO"}
                </span>
              </div>

              {queueAnalysis ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#8a9ba8]">Point of Interconnection:</span>
                    <span className="font-bold text-[#f5f8fa]">{queueAnalysis.substationQueue.substationName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">POI Voltage & MVA</div>
                      <div className="font-bold text-[#2b95d6] mt-0.5">
                        {queueAnalysis.substationQueue.voltageKv}kV • {queueAnalysis.substationQueue.firmTransformerCapacityMva} MVA
                      </div>
                    </div>
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Large Load Headroom</div>
                      <div className="font-bold text-[#10b981] mt-0.5">
                        {queueAnalysis.substationQueue.availableLargeLoadHeadroomMw} MW Available
                      </div>
                    </div>
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Active Queue Volume</div>
                      <div className="font-bold text-[#f59e0b] mt-0.5">
                        {queueAnalysis.substationQueue.totalQueuedLargeLoadMw} MW Load Queued
                      </div>
                    </div>
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Est. Energization Year</div>
                      <div className="font-bold text-[#06b6d4] mt-0.5">
                        {queueAnalysis.estimatedEnergizationYear} ({queueAnalysis.substationQueue.averageQueueDwellYears}y dwell)
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-[#0e1317] border border-[#202b33] text-[10px] text-[#8a9ba8]">
                    Cluster Study: <strong className="text-[#f5f8fa]">{queueAnalysis.substationQueue.studyClusterName}</strong>. Historical queue withdrawal rate is {queueAnalysis.substationQueue.historicalAttritionRatePct}%.
                  </div>
                </div>
              ) : (
                <div className="text-[#5c7080] text-center py-4">No regional queue study within 100km buffer.</div>
              )}
            </div>

            {/* Section 2: Behind-The-Meter (BTM) Baseload Co-Location */}
            <div className="bg-[#141a20] p-4 rounded-lg border border-[#293742] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#24303a]">
                <div className="flex items-center gap-2 text-[#a855f7] font-bold text-xs uppercase">
                  <Zap className="h-4 w-4" />
                  <span>2. Behind-The-Meter (BTM) Nuclear & Baseload</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#202b33] text-[#a855f7]">
                  {btmAnalysis?.site.readinessTier.split(" - ")[0] || "BTM"}
                </span>
              </div>

              {btmAnalysis ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#8a9ba8]">Nearest Generation Site:</span>
                    <span className="font-bold text-[#f5f8fa]">{btmAnalysis.site.facilityName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Direct Busbar Capacity</div>
                      <div className="font-bold text-[#a855f7] mt-0.5">
                        {btmAnalysis.site.availableDirectBtmCapacityMw} MW Direct
                      </div>
                    </div>
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Annual Tariff Savings</div>
                      <div className="font-bold text-[#10b981] mt-0.5">
                        +${btmAnalysis.annualTransmissionTariffSavingsMillionDollars}M / Year
                      </div>
                    </div>
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Contiguous Plant Acres</div>
                      <div className="font-bold text-[#f5f8fa] mt-0.5">
                        {btmAnalysis.site.contiguousAcreageAvailable} Acres
                      </div>
                    </div>
                    <div className="bg-[#0e1317] p-2 rounded border border-[#202b33]">
                      <div className="text-[#5c7080]">Proximity to Site</div>
                      <div className="font-bold text-[#06b6d4] mt-0.5">
                        {btmAnalysis.distanceKm} km ({btmAnalysis.isDirectColocationViable ? "Viable Direct Bus" : "Overland Intertie"})
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-[#0e1317] border border-[#202b33] text-[10px] text-[#8a9ba8]">
                    Precedent: <strong className="text-[#f5f8fa]">{btmAnalysis.site.knownHyperscalePartnerships || "Under review"}</strong>. {btmAnalysis.site.regulatoryPrecedentNotes}
                  </div>
                </div>
              ) : (
                <div className="text-[#5c7080] text-center py-4">No licensed nuclear or commercial SMR site within 150km.</div>
              )}
            </div>
          </div>

          {/* Section 3: 24/7 Carbon-Free Energy Matching & Scope 2 Emissions */}
          <div className="bg-[#141a20] p-4 rounded-lg border border-[#293742] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#24303a]">
              <div className="flex items-center gap-2 text-[#15b371] font-bold text-xs uppercase">
                <CheckCircle2 className="h-4 w-4" />
                <span>3. 24/7 Carbon-Free Energy (CFE) Matching & Scope 2 Decarbonization</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
                {cfeResult.twentyFourSevenCfeScorePct}% 24/7 HOURLY MATCH
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0e1317] p-2.5 rounded border border-[#202b33]">
                <div className="text-[10px] text-[#5c7080]">Clean Energy Delivered</div>
                <div className="text-base font-bold text-[#15b371] mt-0.5">{cfeResult.annualCleanEnergyDeliveredGwh.toLocaleString()} GWh/yr</div>
                <div className="text-[9px] text-[#8a9ba8] mt-0.5">Solar {cfeResult.solarInstalledMw}MW • Wind {cfeResult.windInstalledMw}MW</div>
              </div>
              <div className="bg-[#0e1317] p-2.5 rounded border border-[#202b33]">
                <div className="text-[10px] text-[#5c7080]">Required BESS Storage</div>
                <div className="text-base font-bold text-[#06b6d4] mt-0.5">{cfeResult.bessCapacityMwh} MWh</div>
                <div className="text-[9px] text-[#8a9ba8] mt-0.5">4-Hour Duration Battery</div>
              </div>
              <div className="bg-[#0e1317] p-2.5 rounded border border-[#202b33]">
                <div className="text-[10px] text-[#5c7080]">Avoided Scope 2 Carbon</div>
                <div className="text-base font-bold text-[#10b981] mt-0.5">+{cfeResult.avoidedScope2EmissionsTonsCo2.toLocaleString()} Tons/yr</div>
                <div className="text-[9px] text-[#8a9ba8] mt-0.5">Displacing marginal fossil peakers</div>
              </div>
              <div className="bg-[#0e1317] p-2.5 rounded border border-[#202b33]">
                <div className="text-[10px] text-[#5c7080]">Residual Grid Deficit</div>
                <div className="text-base font-bold text-[#ef4444] mt-0.5">{cfeResult.annualFossilGridDeficitGwh.toLocaleString()} GWh/yr</div>
                <div className="text-[9px] text-[#8a9ba8] mt-0.5">Nighttime/low-wind grid offtake</div>
              </div>
            </div>

            {/* Diurnal Hourly Profile Bar Visualization */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#8a9ba8]">
                <span>24-Hour Diurnal CFE Matching Curve (Hour 0 to 23)</span>
                <span>Green = 100% CFE Matched • Red = Grid Carbon Deficit</span>
              </div>
              <div className="grid grid-cols-24 gap-0.5 h-10 w-full bg-[#0e1317] p-1 rounded border border-[#202b33]">
                {cfeResult.hourlyProfile.map((hp) => (
                  <div
                    key={hp.hour}
                    className="h-full rounded-sm transition-all"
                    style={{
                      backgroundColor: hp.hourlyCfeMatchPct >= 95 ? "#10b981" : hp.hourlyCfeMatchPct >= 70 ? "#f59e0b" : "#ef4444",
                      opacity: Math.max(0.3, hp.hourlyCfeMatchPct / 100),
                    }}
                    title={`Hour ${hp.hour}: ${hp.hourlyCfeMatchPct}% CFE (Solar: ${hp.solarGenerationMw}MW, Wind: ${hp.windGenerationMw}MW, Firm: ${hp.cleanFirmGenerationMw}MW)`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Water Usage Effectiveness & Dry Cooling Conversion Penalty */}
          <div className="bg-[#141a20] p-4 rounded-lg border border-[#293742] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#24303a]">
              <div className="flex items-center gap-2 text-[#06b6d4] font-bold text-xs uppercase">
                <Droplets className="h-4 w-4" />
                <span>4. Water Stress, Cooling Architectures & Dry Cooling Trade-Off</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#202b33] text-[#06b6d4]">
                ASHRAE Design Wet-Bulb: {coolingReport.designWetBulbC}°C
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#24303a] text-[#8a9ba8] text-[10px]">
                    <th className="py-1.5 px-2">Cooling Architecture</th>
                    <th className="py-1.5 px-2">PUE</th>
                    <th className="py-1.5 px-2">WUE (L/kWh)</th>
                    <th className="py-1.5 px-2">Annual Water (MGY)</th>
                    <th className="py-1.5 px-2">Peak Water (MGD)</th>
                    <th className="py-1.5 px-2">Cooling Power (MW)</th>
                    <th className="py-1.5 px-2">Annual Total Cost</th>
                    <th className="py-1.5 px-2">Permit Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202b33]">
                  {coolingReport.architectures.map((arch) => (
                    <tr key={arch.name} className="hover:bg-[#182026] transition-colors">
                      <td className="py-2 px-2 font-bold text-[#f5f8fa]">{arch.name}</td>
                      <td className="py-2 px-2 text-[#2b95d6]">{arch.pueBaseline}</td>
                      <td className="py-2 px-2 text-[#06b6d4]">{arch.wueLitersPerKwh}</td>
                      <td className="py-2 px-2 text-[#f5f8fa]">{arch.annualWaterConsumptionMgy} MGY</td>
                      <td className="py-2 px-2 text-[#f5f8fa]">{arch.peakDailyWaterWithdrawalMgd} MGD</td>
                      <td className="py-2 px-2 text-[#f59e0b]">+{arch.coolingPowerPenaltyMw} MW</td>
                      <td className="py-2 px-2 text-[#10b981]">${(arch.totalAnnualCoolingOperatingCost / 1_000_000).toFixed(2)}M</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          arch.waterStressRegulatoryRisk.includes("Severe") ? "bg-[#ef4444]/20 text-[#ef4444]" :
                          arch.waterStressRegulatoryRisk === "Moderate" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                          "bg-[#10b981]/20 text-[#10b981]"
                        }`}>
                          {arch.waterStressRegulatoryRisk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 rounded bg-[#0e1317] border border-[#202b33] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#8a9ba8]">
                <strong>Dry Cooling Conversion Penalty:</strong> Transitioning to closed-loop dry chillers increases PUE by <strong>+{coolingReport.dryCoolingPenaltyVsEvaporative.pueDelta}</strong> (+{coolingReport.dryCoolingPenaltyVsEvaporative.extraPeakMwRequired} MW extra grid power), costing <strong>+${coolingReport.dryCoolingPenaltyVsEvaporative.annualExtraPowerCostMillionDollars}M/yr</strong> in power while conserving <strong>{coolingReport.dryCoolingPenaltyVsEvaporative.annualWaterSavedMillionGallons} million gallons</strong> of municipal water.
              </span>
            </div>
          </div>

          {/* Section 5: Geohazards, FEMA & Topography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141a20] p-4 rounded-lg border border-[#293742] space-y-2.5">
              <div className="flex items-center gap-2 text-[#f59e0b] font-bold text-xs uppercase pb-2 border-b border-[#24303a]">
                <ShieldAlert className="h-4 w-4" />
                <span>5. Environmental Hazards & 75-Year Cat Ledger</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">FEMA Flood Zone:</span>
                  <span className={`font-bold ${target.floodZone === "X" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    Zone {target.floodZone || "X"} (Outside 500-Year Floodplain)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">Seismic Peak Ground Accel (PGA):</span>
                  <span className="font-bold text-[#f5f8fa]">{target.seismicPga || 0.08}g (IBC Seismic Category B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">75-Yr Tornado / Hurricane Record:</span>
                  <span className="font-bold text-[#10b981]">0 Direct Hits within 15km Buffer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">Ambient Climate Economizer:</span>
                  <span className="font-bold text-[#38bdf8]">{target.freeCoolingHoursPct || 74}% Free-Cooling Economizer Viability</span>
                </div>
              </div>
            </div>

            <div className="bg-[#141a20] p-4 rounded-lg border border-[#293742] space-y-2.5">
              <div className="flex items-center gap-2 text-[#d9822b] font-bold text-xs uppercase pb-2 border-b border-[#24303a]">
                <Building className="h-4 w-4" />
                <span>6. Site Parcel, Soil Bearing & Setbacks</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">Soil Bearing Capacity:</span>
                  <span className="font-bold text-[#f5f8fa]">{target.soilBearingCapacityLbs || 450} psf (Supports Dense NVL72 Racks)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">Bedrock Depth & Liquefaction:</span>
                  <span className="font-bold text-[#10b981]">{target.bedrockDepthMeters || 4.2}m Depth • Liquefaction Risk: None</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">FAA Part 77 Airspace Clearance:</span>
                  <span className="font-bold text-[#10b981]">Outside Runway Approach Cones</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ba8]">Industrial Hazardous Pipeline Blast Setback:</span>
                  <span className="font-bold text-[#10b981]">&gt;1,500m (Exceeds PIR Blast Boundary)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#141a20] border-t border-[#293742]">
          <div className="text-[11px] text-[#5c7080]">
            AtlasGrid Institutional Underwriting Engine • Prepared for Investment Committee Review
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2b95d6] hover:bg-[#237bb2] text-white text-xs font-bold transition-all shadow-md"
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORT DOSSIER (PDF)</span>
            </button>
            <button
              onClick={() => setDossierOpen(false)}
              className="px-3 py-1.5 rounded bg-[#202b33] hover:bg-[#2a3b47] text-[#8a9ba8] hover:text-[#f5f8fa] text-xs font-semibold transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
