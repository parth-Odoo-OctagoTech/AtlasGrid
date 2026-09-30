"use client";

import React, { useState, useMemo } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building,
  Zap,
  RadioTower,
  Atom,
  Droplets,
  Wind,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Scale,
  Plus,
  Trash2,
} from "lucide-react";
import { DataCenter } from "@/lib/types/data-center";
import { calculateSitingScoreBreakdown } from "@/lib/services/siting-suitability-service";
import { findNearestInterconnectionQueue } from "@/lib/services/interconnection-queue-service";
import { findNearestBtmColocation } from "@/lib/services/btm-colocation-service";
import { run247CfeSimulation } from "@/lib/services/cfe-simulation-engine";
import { calculateWaterCoolingMetrics } from "@/lib/services/water-cooling-engine";
import { analyzeTransmissionRedundancy } from "@/lib/services/transmission-redundancy-service";
import { findNearestCableLandingStation } from "@/lib/services/subsea-backhaul-service";

export function SitePortfolioBenchmarkModal() {
  const isPortfolioBenchmarkOpen = useGridStore((s) => s.isPortfolioBenchmarkOpen);
  const setPortfolioBenchmarkOpen = useGridStore((s) => s.setPortfolioBenchmarkOpen);
  const dataCenters = useGridStore((s) => s.dataCenters);
  const portfolioCandidateIds = useGridStore((s) => s.portfolioCandidateIds);
  const togglePortfolioCandidate = useGridStore((s) => s.togglePortfolioCandidate);
  const clearPortfolioCandidates = useGridStore((s) => s.clearPortfolioCandidates);
  const openDossierForTarget = useGridStore((s) => s.openDossierForTarget);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoadMw, setSelectedLoadMw] = useState<number>(250);

  // Fallback defaults if no sites selected: Top Tier-1 US Markets
  const activeCandidates: DataCenter[] = useMemo(() => {
    if (portfolioCandidateIds.length > 0) {
      return dataCenters.filter((dc) => portfolioCandidateIds.includes(dc.id)).slice(0, 4);
    }
    // Default 3 benchmark sites
    const ashburn = dataCenters.find((d) => d.name.toLowerCase().includes("ashburn") || d.region?.toLowerCase().includes("virginia")) || dataCenters[0];
    const dallas = dataCenters.find((d) => d.region?.toLowerCase().includes("texas") || d.name.toLowerCase().includes("dallas")) || dataCenters[1];
    const phoenix = dataCenters.find((d) => d.region?.toLowerCase().includes("arizona") || d.name.toLowerCase().includes("phoenix")) || dataCenters[2];

    const defaults = [ashburn, dallas, phoenix].filter(Boolean) as DataCenter[];
    return defaults.length > 0 ? defaults : dataCenters.slice(0, 3);
  }, [dataCenters, portfolioCandidateIds]);

  // Compute full institutional analytics for each candidate site
  const benchmarkData = useMemo(() => {
    return activeCandidates.map((dc) => {
      const siting = calculateSitingScoreBreakdown(dc);
      const queue = findNearestInterconnectionQueue(dc.latitude, dc.longitude, selectedLoadMw);
      const btm = findNearestBtmColocation(dc.latitude, dc.longitude, selectedLoadMw);
      const cfe = run247CfeSimulation({ targetDcLoadMw: selectedLoadMw });
      const cooling = calculateWaterCoolingMetrics({
        dcLoadMw: selectedLoadMw,
        designWetBulbC: dc.designWetBulbC || 21.5,
        freeCoolingHoursPct: dc.freeCoolingHoursPct || 72,
      });
      const redundancy = analyzeTransmissionRedundancy(dc.latitude, dc.longitude);
      const subsea = findNearestCableLandingStation(dc.latitude, dc.longitude);

      return {
        dc,
        siting,
        queue,
        btm,
        cfe,
        cooling,
        redundancy,
        subsea,
      };
    });
  }, [activeCandidates, selectedLoadMw]);

  // Search filtered candidates for adding
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return dataCenters
      .filter((d) => d.name.toLowerCase().includes(q) || d.operator.toLowerCase().includes(q) || d.region?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [dataCenters, searchQuery]);

  // Export to CSV handler
  const handleExportCsv = () => {
    const headers = [
      "Site Name",
      "Operator",
      "Region",
      "Latitude",
      "Longitude",
      "Composite Siting Score",
      "Nearest Substation",
      "Substation Headroom (MW)",
      "Queue Saturation Index (QSI)",
      "Queue Lead Time (Years)",
      "BTM Host Site",
      "BTM Tariff Savings ($M/yr)",
      "24/7 CFE Match %",
      "PUE Baseline",
      "Annual Water Consumption (MGY)",
      "Dry Cooling Penalty (MW)",
      "Transmission Redundancy Tier",
      "Nearest Subsea CLS",
      "Transatlantic RTT (ms)",
    ];

    const rows = benchmarkData.map(({ dc, siting, queue, btm, cfe, cooling, redundancy, subsea }) => [
      `"${dc.name}"`,
      `"${dc.operator}"`,
      `"${dc.region || dc.country}"`,
      dc.latitude,
      dc.longitude,
      siting.totalCompositeScore,
      `"${queue?.substationQueue.substationName || "N/A"}"`,
      queue?.substationQueue.availableLargeLoadHeadroomMw || 0,
      queue?.substationQueue.queueSaturationIndex || 0,
      queue?.substationQueue.estimatedEnergizationLeadTimeYears || 0,
      `"${btm?.site.facilityName || "None"}"`,
      btm?.annualTransmissionTariffSavingsMillionDollars || 0,
      cfe.twentyFourSevenCfeScorePct,
      cooling.architectures[0]?.pueBaseline || 1.2,
      cooling.architectures[0]?.annualWaterConsumptionMgy || 0,
      cooling.dryCoolingPenaltyVsEvaporative.extraPeakMwRequired,
      `"${redundancy.complianceTier}"`,
      `"${subsea?.nearestCls.name || "N/A"}"`,
      subsea?.totalTransatlanticLatencyRttMs || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AtlasGrid_Site_Portfolio_Benchmark_${selectedLoadMw}MW.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isPortfolioBenchmarkOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-7xl max-h-[94vh] bg-[#0c1014] text-[#f5f8fa] border border-[#293742] rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141a20] border-b border-[#293742]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#2b95d6]/15 text-[#2b95d6] border border-[#2b95d6]/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider text-[#f5f8fa]">
                  ATLASGRID • MULTI-SITE PORTFOLIO BENCHMARK MATRIX
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#2b95d6]/20 text-[#2b95d6] border border-[#2b95d6]/40">
                  RFP & TENDER EVALUATOR
                </span>
              </div>
              <div className="text-xs text-[#8a9ba8]">
                Comparing {benchmarkData.length} Sites Simultaneously • Underwriting Basis: <strong className="text-[#06b6d4]">{selectedLoadMw} MW</strong> Peak IT Load
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#202b33] hover:bg-[#293742] text-[#f5f8fa] text-xs font-semibold border border-[#293742] transition-all"
              title="Export side-by-side comparison to CSV"
            >
              <Download className="h-3.5 w-3.5 text-[#2b95d6]" />
              <span className="hidden sm:inline">EXPORT CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2b95d6] hover:bg-[#237bb2] text-white text-xs font-bold transition-all shadow-md"
              title="Print portfolio comparison"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PRINT MEMO</span>
            </button>
            <button
              onClick={() => setPortfolioBenchmarkOpen(false)}
              className="p-1.5 rounded hover:bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Search Candidates & Load Sizing */}
        <div className="px-6 py-3 bg-[#101418] border-b border-[#293742] flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Add Candidate Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search & add candidate site to compare (max 4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#182026] border border-[#293742] rounded text-xs text-[#f5f8fa] focus:border-[#2b95d6] focus:outline-none"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#141a20] border border-[#293742] rounded shadow-xl z-50 divide-y divide-[#202b33]">
                {searchResults.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      togglePortfolioCandidate(d.id);
                      setSearchQuery("");
                    }}
                    className="p-2 hover:bg-[#202b33] cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#f5f8fa]">{d.name}</div>
                      <div className="text-[10px] text-[#8a9ba8]">{d.operator} • {d.region}</div>
                    </div>
                    <Plus className="h-4 w-4 text-[#2b95d6]" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Load Sizing Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[#8a9ba8] text-[11px] font-semibold">Campus Load Sizing:</span>
            {[100, 250, 500, 1000].map((mw) => (
              <button
                key={mw}
                onClick={() => setSelectedLoadMw(mw)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  selectedLoadMw === mw
                    ? "bg-[#2b95d6] text-white"
                    : "bg-[#182026] text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] border border-[#293742]"
                }`}
              >
                {mw} MW
              </button>
            ))}
            {portfolioCandidateIds.length > 0 && (
              <button
                onClick={clearPortfolioCandidates}
                className="ml-2 text-[11px] text-[#ef4444] hover:underline flex items-center gap-1"
                title="Reset to default benchmark sites"
              >
                <Trash2 className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Side-by-Side Comparison Matrix Table */}
        <div className="flex-1 overflow-x-auto p-6 space-y-4 bg-[#0c1014]">
          <div className="min-w-[850px]">
            {/* Header Row: Candidate Cards */}
            <div className="grid grid-cols-5 gap-3 pb-3 border-b border-[#293742]">
              <div className="p-3 rounded bg-[#101418] border border-[#24303a] flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold text-[#5c7080] tracking-wider">Evaluation Dimension</span>
                <span className="text-sm font-bold text-[#8a9ba8] mt-1">Institutional Metrics</span>
              </div>

              {benchmarkData.map(({ dc, siting }, idx) => (
                <div key={dc.id} className="p-3 rounded bg-[#141a20] border border-[#293742] space-y-2 relative">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#202b33] text-[#2b95d6]">
                      OPTION {idx + 1}
                    </span>
                    <button
                      onClick={() => togglePortfolioCandidate(dc.id)}
                      className="text-[#5c7080] hover:text-[#ef4444] transition-colors"
                      title="Remove candidate"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#f5f8fa] text-xs truncate" title={dc.name}>
                      {dc.name}
                    </h3>
                    <div className="text-[10px] text-[#8a9ba8] truncate">{dc.operator} • {dc.region}</div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#202b33]">
                    <div className="text-[10px] text-[#5c7080]">Composite Score</div>
                    <div className="text-base font-black text-[#10b981]">{siting.totalCompositeScore}<span className="text-[10px] text-[#8a9ba8] font-normal">/100</span></div>
                  </div>
                  <button
                    onClick={() => {
                      openDossierForTarget({ dataCenter: dc });
                      setPortfolioBenchmarkOpen(false);
                    }}
                    className="w-full mt-1 py-1 rounded bg-[#202b33] hover:bg-[#2b95d6] text-[#2b95d6] hover:text-white text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <span>Full Dossier</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Matrix Data Rows */}
            <div className="divide-y divide-[#1e2730] text-xs">
              {/* Row 1: Substation Interconnection Headroom */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <RadioTower className="h-3.5 w-3.5 text-[#2b95d6]" />
                  <span>Substation POI Headroom</span>
                </div>
                {benchmarkData.map(({ queue }) => (
                  <div key={queue?.substationQueue.substationId || Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className="font-bold text-[#10b981]">{queue?.substationQueue.availableLargeLoadHeadroomMw || 0} MW Available</div>
                    <div className="text-[10px] text-[#8a9ba8] truncate">{queue?.substationQueue.substationName || "No regional hub"}</div>
                  </div>
                ))}
              </div>

              {/* Row 2: Queue Lead Time & Saturation (QSI) */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#f59e0b]" />
                  <span>Queue Lead Time & QSI</span>
                </div>
                {benchmarkData.map(({ queue }) => (
                  <div key={queue?.substationQueue.substationId || Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className="font-bold text-[#f5f8fa]">
                      {queue?.estimatedEnergizationYear || 2029} <span className="text-[10px] text-[#8a9ba8]">({queue?.substationQueue.estimatedEnergizationLeadTimeYears || 4.5}y dwell)</span>
                    </div>
                    <div className="text-[10px] text-[#f59e0b]">QSI: {queue?.substationQueue.queueSaturationIndex || 70}/100</div>
                  </div>
                ))}
              </div>

              {/* Row 3: BTM Baseload Nuclear / SMR Savings */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <Atom className="h-3.5 w-3.5 text-[#a855f7]" />
                  <span>BTM Nuclear Tariff Savings</span>
                </div>
                {benchmarkData.map(({ btm }) => (
                  <div key={btm?.site.id || Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className="font-bold text-[#10b981]">
                      +${btm?.annualTransmissionTariffSavingsMillionDollars || 0}M / yr
                    </div>
                    <div className="text-[10px] text-[#8a9ba8] truncate">
                      {btm?.site.facilityName || "No licensed reactor nearby"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 4: 24/7 Hourly Carbon-Free Match % */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#15b371]" />
                  <span>24/7 Hourly CFE Match</span>
                </div>
                {benchmarkData.map(({ cfe }) => (
                  <div key={cfe.targetDcLoadMw + Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className="font-bold text-[#15b371]">{cfe.twentyFourSevenCfeScorePct}% Match</div>
                    <div className="text-[10px] text-[#8a9ba8]">+{cfe.avoidedScope2EmissionsTonsCo2.toLocaleString()} t avoided/yr</div>
                  </div>
                ))}
              </div>

              {/* Row 5: Water Consumption & Dry Cooling Penalty */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-[#06b6d4]" />
                  <span>Cooling Water & Dry Penalty</span>
                </div>
                {benchmarkData.map(({ cooling }) => (
                  <div key={cooling.dcLoadMw + Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className="font-bold text-[#f5f8fa]">
                      {cooling.architectures[0]?.annualWaterConsumptionMgy || 180} MGY <span className="text-[10px] text-[#5c7080]">(Evaporative)</span>
                    </div>
                    <div className="text-[10px] text-[#f59e0b]">Dry Penalty: +{cooling.dryCoolingPenaltyVsEvaporative.extraPeakMwRequired} MW</div>
                  </div>
                ))}
              </div>

              {/* Row 6: Dual-Substation Redundancy & N-1 Contingency */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#2b95d6]" />
                  <span>Dual-Feed Redundancy</span>
                </div>
                {benchmarkData.map(({ redundancy }) => (
                  <div key={redundancy.primarySubstationId + Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className={`font-bold ${redundancy.redundancyArchitecture === "dual_independent_substation_2n" ? "text-[#10b981]" : "text-[#f59e0b]"}`}>
                      {redundancy.complianceTier.split(" (")[0]}
                    </div>
                    <div className="text-[10px] text-[#8a9ba8]">
                      Outage: {redundancy.expectedAnnualOutageMinutes} min/yr • ${redundancy.estimatedTLineIntertieCapexMillionDollars}M intertie
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 7: Subsea CLS Latency to London / Transatlantic */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#06b6d4]" />
                  <span>Transatlantic Latency RTT</span>
                </div>
                {benchmarkData.map(({ subsea }) => (
                  <div key={subsea?.nearestCls.id || Math.random()} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className="font-bold text-[#06b6d4]">{subsea?.totalTransatlanticLatencyRttMs || 65} ms to London</div>
                    <div className="text-[10px] text-[#8a9ba8] truncate">
                      {subsea?.nearestCls.name || "Coastal Backhaul"} ({subsea?.terrestrialDistanceKm || 0} km)
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 8: Seismic PGA & Flood Hazard */}
              <div className="grid grid-cols-5 gap-3 py-3 items-center">
                <div className="font-bold text-[#f5f8fa] flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#ef4444]" />
                  <span>Geohazard Exposure</span>
                </div>
                {benchmarkData.map(({ dc }) => (
                  <div key={dc.id} className="bg-[#101418] p-2 rounded border border-[#202b33]">
                    <div className={`font-bold ${dc.floodZone === "X" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      Flood Zone {dc.floodZone || "X"}
                    </div>
                    <div className="text-[10px] text-[#8a9ba8]">PGA {dc.seismicPga || 0.08}g • Fault {dc.nearestFaultDistanceKm || 45}km</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
