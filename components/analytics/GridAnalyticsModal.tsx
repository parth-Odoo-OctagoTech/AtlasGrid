"use client";

import { useState, useMemo } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, FuelType, Interconnector, PowerPlant } from "@/lib/types/power-plant";
import { DataCenter, OPERATOR_COLORS } from "@/lib/types/data-center";
import { getGridNexusAnalytics } from "@/lib/services/cross-reference-service";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  X,
  BarChart3,
  PieChart as PieIcon,
  GitFork,
  ArrowRight,
  Zap,
  Leaf,
  Globe,
  ExternalLink,
  Server,
  Cpu,
  Activity,
  Gauge,
  Network,
  Radio,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface GridAnalyticsModalProps {
  plants: PowerPlant[];
  interconnectors: Interconnector[];
}

export function GridAnalyticsModal({
  plants,
  interconnectors,
}: GridAnalyticsModalProps) {
  const isAnalyticsOpen = useGridStore((s) => s.isAnalyticsOpen);
  const setAnalyticsOpen = useGridStore((s) => s.setAnalyticsOpen);
  const telemetrySummary = useGridStore((s) => s.telemetrySummary);
  const dataCenters = useGridStore((s) => s.dataCenters);
  const flyToStation = useGridStore((s) => s.flyToStation);
  const setSelectedStation = useGridStore((s) => s.setSelectedStation);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);

  const [activeTab, setActiveTab] = useState<
    "pulse" | "nexus" | "sustainability" | "plants" | "datacenters" | "interties"
  >("pulse");

  // Summary KPIs
  const totalGenMw = useMemo(() => plants.reduce((sum, p) => sum + p.currentOutputMw, 0), [plants]);
  const totalCapMw = useMemo(() => plants.reduce((sum, p) => sum + p.capacityMw, 0), [plants]);
  const totalDcMw = useMemo(() => dataCenters.reduce((sum, d) => sum + d.estimatedPowerMw, 0), [dataCenters]);
  const avgPue = useMemo(() => {
    if (!dataCenters.length) return 1.25;
    return (dataCenters.reduce((sum, d) => sum + d.pue, 0) / dataCenters.length).toFixed(2);
  }, [dataCenters]);

  // Fuel Mix Data
  const fuelMixData = useMemo(() => {
    return Object.entries(telemetrySummary?.fuelMix || {}).map(([fuelKey, item]) => {
      const meta = FUEL_CONFIG[fuelKey as FuelType] || FUEL_CONFIG.other;
      return {
        name: meta.label,
        fuelKey,
        currentMw: item.currentMw,
        currentGw: Math.round((item.currentMw / 1000) * 10) / 10,
        capacityGw: Math.round((item.capacityMw / 1000) * 10) / 10,
        sharePercent: item.sharePercent,
        color: meta.hex,
      };
    });
  }, [telemetrySummary]);

  // Clean Generation Percentage
  const cleanSharePercent = useMemo(() => {
    if (!fuelMixData.length) return 48;
    const cleanKeys = new Set(["nuclear", "hydro", "solar", "wind", "geothermal", "storage"]);
    const cleanMw = fuelMixData
      .filter((d) => cleanKeys.has(d.fuelKey))
      .reduce((sum, d) => sum + d.currentMw, 0);
    const total = fuelMixData.reduce((sum, d) => sum + d.currentMw, 0);
    return total > 0 ? Math.round((cleanMw / total) * 100) : 48;
  }, [fuelMixData]);

  // Grid-to-Compute Nexus Market Summary
  const nexusMarkets = useMemo(() => {
    return getGridNexusAnalytics(plants, dataCenters);
  }, [plants, dataCenters]);

  // Operator Sustainability & Compute Leaderboard
  const operatorStats = useMemo(() => {
    const map: Record<string, { operator: string; count: number; totalMw: number; pueSum: number }> = {};
    for (const dc of dataCenters) {
      if (!map[dc.operator]) {
        map[dc.operator] = { operator: dc.operator, count: 0, totalMw: 0, pueSum: 0 };
      }
      map[dc.operator].count += 1;
      map[dc.operator].totalMw += dc.estimatedPowerMw;
      map[dc.operator].pueSum += dc.pue;
    }
    return Object.values(map)
      .map((op) => {
        const avg = parseFloat((op.pueSum / op.count).toFixed(2));
        const annualTwh = parseFloat(((op.totalMw * 8760 * 0.85) / 1000000).toFixed(2));
        const annualCo2Mt = parseFloat(((op.totalMw * avg * 8760 * 350) / 1000000000).toFixed(2));
        return {
          operator: op.operator,
          count: op.count,
          totalMw: op.totalMw,
          avgPue: avg,
          annualTwh,
          annualCo2Mt,
        };
      })
      .sort((a, b) => b.totalMw - a.totalMw);
  }, [dataCenters]);

  // Top Dispatched Stations
  const topPlants = useMemo(() => {
    return [...plants].sort((a, b) => b.currentOutputMw - a.currentOutputMw).slice(0, 15);
  }, [plants]);

  // Top Data Centers by Load
  const topDataCenters = useMemo(() => {
    return [...dataCenters].sort((a, b) => b.estimatedPowerMw - a.estimatedPowerMw).slice(0, 15);
  }, [dataCenters]);

  if (!isAnalyticsOpen) return null;

  const handleSelectPlant = (plant: PowerPlant) => {
    setSelectedStation(plant);
    flyToStation(plant);
    setAnalyticsOpen(false);
  };

  const handleSelectDataCenter = (dc: DataCenter) => {
    setSelectedDataCenter(dc);
    flyToStation(dc);
    setAnalyticsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-xl transition-all animate-in fade-in duration-150">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl glass-panel-elevated shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-150 border border-white/15">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Global Grid & Data Center Command Center
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                  LIVE TELEMETRY
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                Cross-referencing {plants.length.toLocaleString()} power stations and {dataCenters.length.toLocaleString()} AI compute facilities
              </div>
            </div>
          </div>
          <button
            onClick={() => setAnalyticsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-gray-400 hover:text-white hover:border-slate-600 transition-all hover:scale-105 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hero KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-slate-900/40 border-b border-surface-border/60">
          <div className="rounded-xl border border-surface-border bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400">
              <span>Total Grid Dispatch</span>
              <Zap className="h-3 w-3 text-cyan-400" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-cyan-300">
              {(totalGenMw / 1000).toFixed(1)} GW
            </div>
            <div className="text-[10px] text-gray-400">
              Cap: {(totalCapMw / 1000).toFixed(0)} GW ({( (totalGenMw/totalCapMw)*100 ).toFixed(0)}% util)
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400">
              <span>Global Compute Load</span>
              <Server className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-emerald-400">
              {(totalDcMw / 1000).toFixed(1)} GW
            </div>
            <div className="text-[10px] text-gray-400">
              {dataCenters.length.toLocaleString()} Facilities mapped
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400">
              <span>Clean Energy Share</span>
              <Leaf className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-emerald-300">
              {cleanSharePercent}% Clean
            </div>
            <div className="text-[10px] text-gray-400">
              Nuclear + Solar + Hydro + Wind
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400">
              <span>Fleet Efficiency</span>
              <Gauge className="h-3 w-3 text-indigo-400" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-indigo-300">
              {avgPue} Avg PUE
            </div>
            <div className="text-[10px] text-gray-400">
              Direct-to-Chip Liquid Cooling
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-surface-border/60 bg-slate-950/60 px-6 pt-2 gap-1">
          <button
            onClick={() => setActiveTab("pulse")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "pulse"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Generation Fuel Mix</span>
          </button>
          <button
            onClick={() => setActiveTab("nexus")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "nexus"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Grid-to-Compute Nexus</span>
          </button>
          <button
            onClick={() => setActiveTab("sustainability")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "sustainability"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Hyperscale Sustainability</span>
          </button>
          <button
            onClick={() => setActiveTab("plants")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "plants"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Power Plants ({plants.length.toLocaleString()})</span>
          </button>
          <button
            onClick={() => setActiveTab("datacenters")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "datacenters"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Data Centers ({dataCenters.length.toLocaleString()})</span>
          </button>
          <button
            onClick={() => setActiveTab("interties")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "interties"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>Interconnectors</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: PULSE & FUEL MIX */}
          {activeTab === "pulse" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelMixData}
                      dataKey="currentMw"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={2}
                    >
                      {fuelMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-surface-border bg-slate-950/95 p-2 shadow-2xl text-xs text-white">
                              <div className="font-bold">{data.name}</div>
                              <div className="font-mono text-cyan-400">
                                {data.currentGw} GW ({data.sharePercent}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {fuelMixData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-surface-border/60 bg-slate-900/60 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-gray-400">{item.currentGw} GW</span>
                      <span className="font-bold text-white w-12 text-right">
                        {item.sharePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GRID-TO-COMPUTE NEXUS */}
          {activeTab === "nexus" && (
            <div className="overflow-x-auto">
              <div className="mb-3 text-xs text-gray-400">
                Cross-market correlation of power generation capacity vs hyperscale AI computing demand
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border/80 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Market / ISO Region</th>
                    <th className="pb-3">Country</th>
                    <th className="pb-3 text-right">Grid Capacity (GW)</th>
                    <th className="pb-3 text-right">Live Output (GW)</th>
                    <th className="pb-3 text-right">AI Load (GW)</th>
                    <th className="pb-3 text-right">Clean %</th>
                    <th className="pb-3 text-right">Compute Share</th>
                    <th className="pb-3 text-right">Grid Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40 font-mono">
                  {nexusMarkets.map((m) => (
                    <tr key={m.region} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 font-sans font-semibold text-white">
                        {m.region}
                      </td>
                      <td className="py-3 font-sans text-gray-300">
                        {m.country}
                      </td>
                      <td className="py-3 text-right text-gray-300">
                        {(m.totalGenerationCapacityMw / 1000).toFixed(1)} GW
                      </td>
                      <td className="py-3 text-right text-cyan-300 font-bold">
                        {(m.totalCurrentOutputMw / 1000).toFixed(1)} GW
                      </td>
                      <td className="py-3 text-right text-emerald-400 font-bold">
                        {(m.totalDataCenterLoadMw / 1000).toFixed(2)} GW
                      </td>
                      <td className="py-3 text-right text-emerald-300">
                        {m.cleanEnergyPercent}%
                      </td>
                      <td className="py-3 text-right text-amber-300 font-bold">
                        {m.computeLoadSharePercent}%
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-sans font-semibold uppercase ${
                            m.gridStatus === "optimal"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : m.gridStatus === "balanced"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          }`}
                        >
                          {m.gridStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: HYPERSCALE SUSTAINABILITY */}
          {activeTab === "sustainability" && (
            <div className="overflow-x-auto">
              <div className="mb-3 text-xs text-gray-400">
                Benchmarking top global cloud and colocation operators on energy demand, PUE, and estimated carbon footprint
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border/80 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 text-right font-semibold">Facilities</th>
                    <th className="pb-3 text-right font-semibold">Total IT Load (MW)</th>
                    <th className="pb-3 text-right font-semibold">Fleet PUE</th>
                    <th className="pb-3 text-right font-semibold">Annual Energy (TWh)</th>
                    <th className="pb-3 text-right font-semibold">Est. Scope-2 (Mt CO₂)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40 font-mono">
                  {operatorStats.map((op) => {
                    const col = OPERATOR_COLORS[op.operator] || OPERATOR_COLORS.Other;
                    return (
                      <tr key={op.operator} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 font-sans font-semibold text-white flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{op.operator}</span>
                        </td>
                        <td className="py-3 text-right text-gray-300">
                          {op.count}
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-400">
                          {op.totalMw.toLocaleString()} MW
                        </td>
                        <td className="py-3 text-right text-cyan-300">
                          {op.avgPue}
                        </td>
                        <td className="py-3 text-right text-white">
                          {op.annualTwh} TWh
                        </td>
                        <td className="py-3 text-right text-amber-300 font-bold">
                          {op.annualCo2Mt} Mt
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: POWER PLANTS DIRECTORY */}
          {activeTab === "plants" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border/80 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Station Name</th>
                    <th className="pb-3">Fuel</th>
                    <th className="pb-3">Country / Region</th>
                    <th className="pb-3 text-right">Dispatch (MW)</th>
                    <th className="pb-3 text-right">Spot LMP</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40 font-mono">
                  {topPlants.map((plant, idx) => {
                    const fuel = FUEL_CONFIG[plant.fuelType] || FUEL_CONFIG.other;
                    return (
                      <tr key={plant.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 text-gray-400">#{idx + 1}</td>
                        <td className="py-3 font-sans font-medium text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{plant.name}</span>
                            {plant.satelliteTracked && (
                              <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-500/30 shrink-0">
                                🛰️ TRACE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-sans"
                            style={{
                              backgroundColor: `rgba(${fuel.rgb.join(",")}, 0.2)`,
                              color: fuel.hex,
                            }}
                          >
                            {fuel.label}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300 font-sans">
                          {plant.countryName} ({plant.gridRegion})
                        </td>
                        <td className="py-3 text-right font-bold text-cyan-400">
                          {plant.currentOutputMw.toLocaleString()} MW
                        </td>
                        <td className="py-3 text-right text-amber-400">
                          ${plant.spotPriceMwh.toFixed(1)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${plant.latitude},${plant.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on Google Maps"
                              className="inline-flex h-6 w-6 items-center justify-center rounded border border-surface-border bg-slate-900 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              onClick={() => handleSelectPlant(plant)}
                              className="inline-flex items-center gap-1 font-sans text-xs text-cyan-400 hover:text-cyan-300"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: DATA CENTERS DIRECTORY */}
          {activeTab === "datacenters" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border/80 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="pb-3 font-semibold">Data Center Facility</th>
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 text-right font-semibold">IT Load (MW)</th>
                    <th className="pb-3 text-right font-semibold">PUE</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40 font-mono">
                  {topDataCenters.map((dc) => {
                    const opCol = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;
                    return (
                      <tr key={dc.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 font-sans font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Server className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[220px]">{dc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 font-sans">
                          <span
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `rgba(${opCol.rgb.join(",")}, 0.2)`,
                              color: opCol.hex,
                            }}
                          >
                            {dc.operator}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300 font-sans">
                          {dc.countryName || dc.country} • {dc.region}
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-400">
                          {dc.estimatedPowerMw} MW
                        </td>
                        <td className="py-3 text-right text-cyan-300">
                          {dc.pue}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View exact location on Google Maps"
                              className="inline-flex h-6 w-6 items-center justify-center rounded border border-surface-border bg-slate-900 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              onClick={() => handleSelectDataCenter(dc)}
                              className="inline-flex items-center gap-1 font-sans text-xs text-cyan-400 hover:text-cyan-300"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: INTERCONNECTORS */}
          {activeTab === "interties" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interconnectors.map((ic) => {
                const utilPct = Math.round(
                  (Math.abs(ic.currentFlowMw) / ic.capacityMw) * 100
                );
                return (
                  <div
                    key={ic.id}
                    className="rounded-xl border border-surface-border bg-slate-900/60 p-4 shadow-sm text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white">{ic.name}</h4>
                      <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] text-purple-400 border border-purple-500/40">
                        {ic.type} • {ic.voltageKv} kV
                      </span>
                    </div>
                    <div className="mt-2 text-gray-400 text-[11px]">
                      {ic.fromRegion} ➔ {ic.toRegion}
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono">
                      <span>Flow: {ic.currentFlowMw.toLocaleString()} MW</span>
                      <span className="text-gray-400">
                        Rating: {ic.capacityMw.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
