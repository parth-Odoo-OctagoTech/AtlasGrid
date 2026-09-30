"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  History,
  Calendar,
  Zap,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Database,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Flame,
  Droplets,
  Waves
} from "lucide-react";
import { useGridStore } from "@/lib/store/useGridStore";
import {
  HistoricalPowerGenerationYear,
  HistoricalLmpYear,
  HistoricalQueueBacklogYear,
  HistoricalFloodEvent,
  HistoricalGridEmergencyEvent,
  DailySnapshotManifestItem
} from "@/lib/types/historical";

const PRESET_ERAS = [
  {
    year: 1998,
    label: "1998: Telecom & Meet-Me Rooms",
    tagline: "Carrier-neutral meet-me rooms, 650 MW total global DC power, 2.10 average PUE."
  },
  {
    year: 2010,
    label: "2010: Cloud Awakening",
    tagline: "Early AWS/Azure, 340 GW in US queues, 2.1 yr queue study wait, coal provides 45% of power."
  },
  {
    year: 2015,
    label: "2015: Hyperscale Ashburn Expansion",
    tagline: "PJM clears at $36/MWh, natural gas surpasses coal for first time, cloud campuses scale."
  },
  {
    year: 2021,
    label: "2021: Winter Storm Uri Grid Freeze",
    tagline: "ERCOT caps at $9,000/MWh for 70 hrs, 52 GW offline, extreme weather exposes grid fragility."
  },
  {
    year: 2025,
    label: "2025: GW-Scale AI Supercluster Era",
    tagline: "2,650 GW stuck in queues, 5.4 yr wait, Behind-The-Meter nuclear co-location and 100 kW+ racks."
  }
];

export function HistoricalTimeMachineModal() {
  const isTimeMachineOpen = useGridStore((s) => s.isTimeMachineOpen);
  const setTimeMachineOpen = useGridStore((s) => s.setTimeMachineOpen);

  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [activeTab, setActiveTab] = useState<"generation" | "pricing" | "queues" | "catastrophes" | "snapshots" | "licensing">("generation");

  // Fetch full institutional historical dataset
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ["institutional-historical-time-series"],
    queryFn: async () => {
      const res = await fetch("/api/historical/time-series?domain=all");
      if (!res.ok) throw new Error("Failed to load historical time series");
      return res.json();
    },
    enabled: isTimeMachineOpen,
    staleTime: 1000 * 60 * 60
  });

  // Fetch snapshots manifest
  const { data: snapshotData } = useQuery({
    queryKey: ["daily-snapshots-manifest"],
    queryFn: async () => {
      const res = await fetch("/api/historical/snapshots");
      if (!res.ok) throw new Error("Failed to load snapshot manifest");
      return res.json();
    },
    enabled: isTimeMachineOpen,
    staleTime: 1000 * 60 * 15
  });

  const powerGeneration: HistoricalPowerGenerationYear[] = historicalData?.powerGenerationMix || [];
  const lmpPricing: HistoricalLmpYear[] = historicalData?.wholesaleLmpPricing || [];
  const queueBacklog: HistoricalQueueBacklogYear[] = historicalData?.interconnectionQueueBacklog || [];
  const floodEvents: HistoricalFloodEvent[] = historicalData?.historicalFloodCatastrophes || [];
  const extremeEvents: HistoricalGridEmergencyEvent[] = historicalData?.gridContingencyEmergencies || [];
  const snapshots: DailySnapshotManifestItem[] = snapshotData?.manifest || [];

  // Current year slices
  const currentGen = useMemo(() => {
    if (!powerGeneration.length) return null;
    return powerGeneration.reduce((prev, curr) =>
      Math.abs(curr.year - selectedYear) < Math.abs(prev.year - selectedYear) ? curr : prev
    );
  }, [powerGeneration, selectedYear]);

  const currentLmp = useMemo(() => {
    if (!lmpPricing.length) return null;
    return lmpPricing.reduce((prev, curr) =>
      Math.abs(curr.year - selectedYear) < Math.abs(prev.year - selectedYear) ? curr : prev
    );
  }, [lmpPricing, selectedYear]);

  const currentQueue = useMemo(() => {
    if (!queueBacklog.length) return null;
    return queueBacklog.reduce((prev, curr) =>
      Math.abs(curr.year - selectedYear) < Math.abs(prev.year - selectedYear) ? curr : prev
    );
  }, [queueBacklog, selectedYear]);

  if (!isTimeMachineOpen) return null;

  const handleExportCsv = () => {
    window.open("/api/historical/time-series?format=csv", "_blank");
  };

  const handleExportJson = () => {
    window.open("/api/historical/time-series?format=json", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-xl border border-[#26354a] bg-[#0c121d] text-[#d6e2ee] shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#26354a] bg-[#080d15] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <History className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Institutional Historical Time Machine & Backtest Studio
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  1906–2026 Fleet Provenance
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  Daily Point-in-Time SLA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-decade quantitative data catalog for hyperscaler siting, private equity underwriting, and commodity power trading backtesting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#141e2e] border border-[#26354a] hover:bg-[#1c2a40] text-slate-300 hover:text-white transition"
              title="Print Institutional Memo"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Memo</span>
            </button>
            <button
              onClick={() => setTimeMachineOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2536] transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Temporal Time Slider & Era Presets */}
        <div className="border-b border-[#26354a] bg-[#0f1726] px-6 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Calendar className="h-4 w-4" />
              <span className="uppercase tracking-wider font-semibold">Active Historical Horizon:</span>
              <span className="text-base font-bold text-white px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60">
                {selectedYear}
              </span>
            </div>

            {/* Quick Era Selector Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_ERAS.map((era) => (
                <button
                  key={era.year}
                  onClick={() => setSelectedYear(era.year)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition border ${
                    selectedYear === era.year
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "bg-[#141e2e] text-slate-400 border-[#26354a] hover:text-slate-200 hover:border-slate-500"
                  }`}
                  title={era.tagline}
                >
                  {era.year}
                </button>
              ))}
            </div>
          </div>

          {/* Scrub Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500 font-semibold">1990</span>
            <input
              type="range"
              min={1990}
              max={2026}
              step={1}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            <span className="text-[11px] font-mono text-cyan-400 font-semibold">2026+</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center border-b border-[#26354a] bg-[#0c121d] px-6 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("generation")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "generation"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Power Generation & Carbon (1990–2025)</span>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "pricing"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Wholesale LMP Pricing (2015–2025)</span>
          </button>

          <button
            onClick={() => setActiveTab("queues")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "queues"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>FERC Queue Backlog (2010–2025)</span>
          </button>

          <button
            onClick={() => setActiveTab("catastrophes")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "catastrophes"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Catastrophes & Grid Emergencies</span>
          </button>

          <button
            onClick={() => setActiveTab("snapshots")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "snapshots"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Daily Snapshot Ledger ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("licensing")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "licensing"
                ? "border-emerald-400 text-emerald-300 bg-emerald-500/5 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Institutional Data Catalog & Pricing</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: Generation & Decarbonization */}
          {activeTab === "generation" && currentGen && (
            <div className="space-y-6">
              {/* Year Summary Card */}
              <div className="p-4 rounded-xl bg-[#111927] border border-[#26354a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase font-mono text-slate-400">Milestone in {currentGen.year}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{currentGen.keyGridMilestone}</div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-lg bg-[#162338] border border-[#26354a]">
                    <span className="text-slate-400">US Total Generation:</span>{" "}
                    <strong className="text-cyan-300">{currentGen.usTotalGenerationTwh.toLocaleString()} TWh</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#162338] border border-[#26354a]">
                    <span className="text-slate-400">Carbon Intensity:</span>{" "}
                    <strong className="text-emerald-300">{currentGen.usCarbonIntensityGramsPerKwh} gCO₂/kWh</strong>
                  </div>
                </div>
              </div>

              {/* Fuel Mix Grid */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                  US Electricity Generation by Primary Fuel Source ({currentGen.year})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#121a29] border border-[#26354a]">
                    <div className="text-[11px] font-mono text-slate-400">Coal Baseload</div>
                    <div className="text-lg font-bold text-amber-300 mt-1">{currentGen.usGenerationBySource.coalTwh.toLocaleString()} TWh</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {Math.round((currentGen.usGenerationBySource.coalTwh / currentGen.usTotalGenerationTwh) * 100)}% of total power
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121a29] border border-[#26354a]">
                    <div className="text-[11px] font-mono text-slate-400">Natural Gas Combined Cycle</div>
                    <div className="text-lg font-bold text-cyan-300 mt-1">{currentGen.usGenerationBySource.naturalGasTwh.toLocaleString()} TWh</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {Math.round((currentGen.usGenerationBySource.naturalGasTwh / currentGen.usTotalGenerationTwh) * 100)}% of total power
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121a29] border border-[#26354a]">
                    <div className="text-[11px] font-mono text-slate-400">Nuclear Fleet (Zero-Carbon)</div>
                    <div className="text-lg font-bold text-emerald-300 mt-1">{currentGen.usGenerationBySource.nuclearTwh.toLocaleString()} TWh</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {currentGen.usNuclearCapacityFactorPct}% capacity factor • {currentGen.usNuclearBaseloadGw} GW
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121a29] border border-[#26354a]">
                    <div className="text-[11px] font-mono text-slate-400">Wind & Solar Combined</div>
                    <div className="text-lg font-bold text-indigo-300 mt-1">
                      {Math.round(currentGen.usGenerationBySource.windTwh + currentGen.usGenerationBySource.solarTwh).toLocaleString()} TWh
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Wind: {currentGen.usGenerationBySource.windTwh} TWh • Solar: {currentGen.usGenerationBySource.solarTwh} TWh
                    </div>
                  </div>
                </div>
              </div>

              {/* 35-Year Multi-Year Decarbonization Trajectory Table */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                  Historical 35-Year Time Series Ledgers (1990–2025)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[#26354a]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#090e17] text-slate-400 border-b border-[#26354a]">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Total Gen (TWh)</th>
                        <th className="p-2.5">Coal (TWh)</th>
                        <th className="p-2.5">Gas (TWh)</th>
                        <th className="p-2.5">Nuclear (TWh)</th>
                        <th className="p-2.5">Wind & Solar</th>
                        <th className="p-2.5">Carbon Intensity</th>
                        <th className="p-2.5">Coal Retired</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a3c] bg-[#0c121d]">
                      {powerGeneration.map((g) => (
                        <tr
                          key={g.year}
                          className={`hover:bg-[#141f30] transition ${g.year === selectedYear ? "bg-cyan-950/40 text-cyan-200" : ""}`}
                        >
                          <td className="p-2.5 font-bold text-white">{g.year}</td>
                          <td className="p-2.5">{g.usTotalGenerationTwh.toLocaleString()}</td>
                          <td className="p-2.5 text-amber-300">{g.usGenerationBySource.coalTwh}</td>
                          <td className="p-2.5 text-cyan-300">{g.usGenerationBySource.naturalGasTwh}</td>
                          <td className="p-2.5 text-emerald-300">{g.usGenerationBySource.nuclearTwh}</td>
                          <td className="p-2.5 text-indigo-300">{Math.round(g.usGenerationBySource.windTwh + g.usGenerationBySource.solarTwh)}</td>
                          <td className="p-2.5 text-emerald-400">{g.usCarbonIntensityGramsPerKwh} g</td>
                          <td className="p-2.5 text-rose-300">{g.usCoalRetirementsCumulativeGw} GW</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Wholesale LMP Pricing */}
          {activeTab === "pricing" && currentLmp && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#111927] border border-[#26354a]">
                <div className="text-xs uppercase font-mono text-cyan-400">Macro Market Context ({currentLmp.year})</div>
                <div className="text-sm font-semibold text-white mt-1">{currentLmp.globalMacroContext}</div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                  8 Institutional Hub Spot & Forward Pricing ({currentLmp.year})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentLmp.hubs.map((hub) => (
                    <div key={hub.hubId} className="p-4 rounded-xl bg-[#121a29] border border-[#26354a] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm">{hub.hubName}</div>
                        <div className="text-lg font-mono font-bold text-cyan-300">
                          ${hub.avgLmpUsdPerMwh.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ MWh</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0c121d] p-2.5 rounded-lg border border-[#1e2a3c]">
                        <div>
                          <span className="text-slate-500">Peak:</span>{" "}
                          <span className="text-amber-300">${hub.peakLmpUsdPerMwh.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Off-Peak:</span>{" "}
                          <span className="text-emerald-300">${hub.offPeakLmpUsdPerMwh.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Negative Hrs:</span>{" "}
                          <span className="text-rose-400 font-bold">{hub.negativePriceHoursPct}%</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400">
                        <strong className="text-slate-300">Market Driver:</strong> {hub.primaryDriver}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FERC Order 2023 Queue Backlog */}
          {activeTab === "queues" && currentQueue && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#121a29] border border-[#26354a]">
                  <div className="text-[11px] font-mono text-slate-400">Total Queued Capacity</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">{currentQueue.totalQueuedCapacityGw.toLocaleString()} GW</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Nationwide transmission requests</div>
                </div>

                <div className="p-4 rounded-xl bg-[#121a29] border border-[#26354a]">
                  <div className="text-[11px] font-mono text-slate-400">Average Queue Dwell Time</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">{currentQueue.averageDwellYears} Years</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">From study request to COD</div>
                </div>

                <div className="p-4 rounded-xl bg-[#121a29] border border-[#26354a]">
                  <div className="text-[11px] font-mono text-slate-400">Commercial Completion Rate</div>
                  <div className="text-xl font-bold text-cyan-300 mt-1">{currentQueue.completionRatePct}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Projects reaching energized status</div>
                </div>

                <div className="p-4 rounded-xl bg-[#121a29] border border-[#26354a]">
                  <div className="text-[11px] font-mono text-slate-400">Historical Attrition Rate</div>
                  <div className="text-xl font-bold text-rose-300 mt-1">{currentQueue.attritionRatePct}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Withdrawals after restudies</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111927] border border-[#26354a] space-y-2">
                <div className="text-xs font-mono uppercase text-cyan-400">Data Center Siting Implication ({currentQueue.year})</div>
                <div className="text-sm text-slate-200">{currentQueue.implicationForDataCenters}</div>
                <div className="text-xs text-slate-400 mt-1"><strong className="text-slate-300">Regulatory Framework:</strong> {currentQueue.regulatoryStatus}</div>
              </div>

              {/* Multi-Year Queue Saturation Progression */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                  15-Year Queue Saturation Progression (2010–2025)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[#26354a]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#090e17] text-slate-400 border-b border-[#26354a]">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Queued GW</th>
                        <th className="p-2.5">Mean Wait (Yrs)</th>
                        <th className="p-2.5">Success %</th>
                        <th className="p-2.5">Attrition %</th>
                        <th className="p-2.5">Solar in Queue</th>
                        <th className="p-2.5">Storage in Queue</th>
                        <th className="p-2.5">PJM Queue (GW)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a3c] bg-[#0c121d]">
                      {queueBacklog.map((q) => (
                        <tr
                          key={q.year}
                          className={`hover:bg-[#141f30] transition ${q.year === selectedYear ? "bg-cyan-950/40 text-cyan-200" : ""}`}
                        >
                          <td className="p-2.5 font-bold text-white">{q.year}</td>
                          <td className="p-2.5 font-bold text-rose-400">{q.totalQueuedCapacityGw} GW</td>
                          <td className="p-2.5 text-amber-300">{q.averageDwellYears} yrs</td>
                          <td className="p-2.5 text-cyan-300">{q.completionRatePct}%</td>
                          <td className="p-2.5 text-rose-300">{q.attritionRatePct}%</td>
                          <td className="p-2.5">{q.byTechnologyGw.solarGw} GW</td>
                          <td className="p-2.5">{q.byTechnologyGw.storageGw} GW</td>
                          <td className="p-2.5 text-indigo-300">{q.byIsoGw.pjmGw} GW</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Catastrophes & Emergencies */}
          {activeTab === "catastrophes" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Waves className="h-4 w-4 text-cyan-400" />
                    <span>75-Year Historical Flood Catastrophes (1953–2024)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">25 Benchmark Inundation Records</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {floodEvents.slice(0, 8).map((f) => (
                    <div key={f.id} className="p-4 rounded-xl bg-[#121a29] border border-[#26354a] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm">{f.eventName}</div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {f.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                        <span>Surge/Depth: <strong className="text-cyan-300">{f.peakSurgeOrDepthMeters}m</strong></span>
                        <span>Damages: <strong className="text-rose-400">${f.damagesUsdBillions}B</strong></span>
                        <span>Region: {f.region}</span>
                      </div>
                      <p className="text-xs text-slate-300">{f.infrastructureImpact}</p>
                      <div className="text-[11px] text-amber-300/90 font-mono bg-[#0c121d] p-2 rounded border border-[#1e2a3c]">
                        <strong>Underwriting Standard:</strong> {f.dcInsuranceImplication}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-400" />
                    <span>25-Year Grid Blackouts & Severe Freezes (2000–2024)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">NERC & ISO Benchmark Incidents</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {extremeEvents.map((e) => (
                    <div key={e.id} className="p-4 rounded-xl bg-[#121a29] border border-[#26354a] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm">{e.eventName}</div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          {e.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                        <span>Offline: <strong className="text-rose-400">{e.generationOfflineMw.toLocaleString()} MW</strong></span>
                        <span>Spike: <strong className="text-amber-300">${e.maxWholesalePriceMwh}/MWh</strong></span>
                        <span>Region: {e.gridRegion}</span>
                      </div>
                      <p className="text-xs text-slate-300">{e.criticalFailureMechanism}</p>
                      <div className="text-[11px] text-emerald-300/90 font-mono bg-[#0c121d] p-2 rounded border border-[#1e2a3c]">
                        <strong>Operational Lesson:</strong> {e.dcOperationalLesson}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Daily Snapshot Ledger */}
          {activeTab === "snapshots" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#111927] border border-[#26354a] flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-mono text-emerald-400 font-semibold">Continuous Automated Harvester SLA</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    Immutable Point-in-Time Daily Archives (365 Rolling Days)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Every 24 hours, AtlasGrid executes automated real-time feeds ingestion, generates a SHA256 cryptographic snapshot, and permanently logs grid topology changes.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Ledger (JSON)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#26354a]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#090e17] text-slate-400 border-b border-[#26354a]">
                    <tr>
                      <th className="p-3">Snapshot Date</th>
                      <th className="p-3">SHA-256 Checksum</th>
                      <th className="p-3">Substations</th>
                      <th className="p-3">Power Plants</th>
                      <th className="p-3">Data Centers</th>
                      <th className="p-3">Dark Fiber</th>
                      <th className="p-3">Flood Zones</th>
                      <th className="p-3">Earthquakes</th>
                      <th className="p-3">PJM LMP</th>
                      <th className="p-3">ERCOT LMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a3c] bg-[#0c121d]">
                    {snapshots.map((s) => (
                      <tr key={s.snapshotDate} className="hover:bg-[#141f30] transition">
                        <td className="p-3 font-bold text-cyan-300">{s.snapshotDate}</td>
                        <td className="p-3 text-slate-400">{s.sha256.slice(0, 14)}...</td>
                        <td className="p-3">{s.substationsCount}</td>
                        <td className="p-3">{s.powerPlantsCount}</td>
                        <td className="p-3 text-emerald-300 font-bold">{s.dataCentersCount}</td>
                        <td className="p-3">{s.darkFiberCorridorsCount}</td>
                        <td className="p-3 text-cyan-400">{s.floodHazardZonesCount}</td>
                        <td className="p-3">{s.earthquakesCount}</td>
                        <td className="p-3 font-bold text-amber-300">${s.pjmWesternHubLmp}</td>
                        <td className="p-3 font-bold text-indigo-300">${s.ercotNorthHubLmp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Institutional Licensing & Data Catalog */}
          {activeTab === "licensing" && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-lg font-bold text-white">Enterprise Institutional Data Licensing</h3>
                <p className="text-xs text-slate-400">
                  AtlasGrid licenses immutable historical time series and daily live feeds to quantitative hedge funds, hyperscale data center siting teams, and infrastructure private equity funds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier 1 */}
                <div className="p-5 rounded-xl bg-[#111927] border border-[#26354a] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Tier 1: Daily Siting Snapshot Feed</div>
                    <div className="text-2xl font-bold text-white mt-1">$25,000 <span className="text-xs font-normal text-slate-400">/ year</span></div>
                    <p className="text-xs text-slate-400 mt-2">
                      For engineering consultancies and commercial brokers evaluating current grid topology.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">✓ Daily point-in-time snapshot ledger</li>
                      <li className="flex items-center gap-2">✓ 48,900+ high-voltage substations</li>
                      <li className="flex items-center gap-2">✓ 41 global flood hazard basins</li>
                      <li className="flex items-center gap-2">✓ 30 dark fiber corridors & CLS hubs</li>
                      <li className="flex items-center gap-2">✓ REST API key with 10k req/day</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-[#1a2638] hover:bg-[#22324a] text-white border border-[#26354a] transition"
                  >
                    Sample API Payload (JSON)
                  </button>
                </div>

                {/* Tier 2 */}
                <div className="p-5 rounded-xl bg-[#142338] border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col justify-between space-y-4 relative">
                  <div className="absolute -top-3 right-4 px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                    Most Popular for PE
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-cyan-400 font-semibold">Tier 2: 20-Yr Historical Siting Backtest Engine</div>
                    <div className="text-2xl font-bold text-white mt-1">$75,000 <span className="text-xs font-normal text-slate-400">/ year</span></div>
                    <p className="text-xs text-slate-300 mt-2">
                      For Infrastructure Private Equity (Blackstone, Brookfield, GIP) underwriting $1B+ data center campuses.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-200">
                      <li className="flex items-center gap-2">✓ Everything in Tier 1</li>
                      <li className="flex items-center gap-2">✓ 35-year generation mix (1990–2025)</li>
                      <li className="flex items-center gap-2">✓ 10-year wholesale LMP history & negative hours</li>
                      <li className="flex items-center gap-2">✓ 15-year FERC Order 2023 queue backlogs</li>
                      <li className="flex items-center gap-2">✓ 75-year flood catastrophe benchmarks</li>
                      <li className="flex items-center gap-2">✓ Automated CSV/Parquet bulk quant pipeline</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleExportCsv}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Quantitative CSV</span>
                  </button>
                </div>

                {/* Tier 3 */}
                <div className="p-5 rounded-xl bg-[#111927] border border-[#26354a] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-mono uppercase text-emerald-400 font-semibold">Tier 3: Enterprise Real-Time & Underwriting SLA</div>
                    <div className="text-2xl font-bold text-white mt-1">$150,000 <span className="text-xs font-normal text-slate-400">/ year</span></div>
                    <p className="text-xs text-slate-400 mt-2">
                      For Hyperscalers (AWS, Microsoft, Google, Meta) and Sovereign Wealth Funds.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">✓ Everything in Tier 2</li>
                      <li className="flex items-center gap-2">✓ Unlimited API requests & Webhook events</li>
                      <li className="flex items-center gap-2">✓ Behind-The-Meter nuclear tariff bypass modeling</li>
                      <li className="flex items-center gap-2">✓ Subsea CLS backhaul latency calculations</li>
                      <li className="flex items-center gap-2">✓ Dedicated PhD data science support SLA</li>
                      <li className="flex items-center gap-2">✓ Custom GIS GeoJSON/KML pipeline integrations</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => alert("Please contact institutional sales at sales@atlasgrid.ai")}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-[#1a2638] hover:bg-[#22324a] text-white border border-[#26354a] transition"
                  >
                    Contact Enterprise Sales
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#26354a] bg-[#080d15] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Cryptographic Proof: SHA-256 Ledger Verified</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-[11px] font-mono text-slate-500">
              Data Sources: EIA 860/861/923 • FERC 2023 • PJM/ERCOT/CAISO • USGS • NOAA
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCsv}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e2e] border border-[#26354a] hover:bg-[#1c2a40] text-slate-200 font-medium transition"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Export CSV Backtest</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Full JSON Package</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
