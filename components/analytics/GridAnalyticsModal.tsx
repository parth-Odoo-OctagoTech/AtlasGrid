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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md transition-all animate-in fade-in duration-150 font-sans">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded border border-[#293742] bg-[#101418] shadow-2xl text-[#f5f8fa] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#293742] px-5 py-3 bg-[#182026]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#202b33] text-[#2b95d6] border border-[#293742]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f8fa]">
                  Foundry // Workshop : Grid-to-Compute Nexus
                </span>
                <span className="rounded bg-[#202b33] px-2 py-0.5 text-[9px] font-mono font-semibold text-[#15b371] border border-[#293742]">
                  LIVE 60HZ TELEMETRY
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#8a9ba8]">
                Cross-referencing {plants.length.toLocaleString()} power generation units and {dataCenters.length.toLocaleString()} AI compute facilities
              </div>
            </div>
          </div>
          <button
            onClick={() => setAnalyticsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Hero KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 py-2.5 bg-[#101418] border-b border-[#293742]">
          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Total Grid Dispatch</span>
              <Zap className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-[#f5f8fa]">
              {(totalGenMw / 1000).toFixed(1)} <span className="text-xs font-normal text-[#8a9ba8]">GW</span>
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">
              Cap: {(totalCapMw / 1000).toFixed(0)} GW ({( (totalGenMw/totalCapMw)*100 ).toFixed(0)}% util)
            </div>
          </div>

          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Global Compute Load</span>
              <Server className="h-3 w-3 text-[#15b371]" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-[#15b371]">
              {(totalDcMw / 1000).toFixed(1)} <span className="text-xs font-normal text-[#8a9ba8]">GW</span>
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">
              {dataCenters.length.toLocaleString()} Facilities mapped
            </div>
          </div>

          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Clean Energy Share</span>
              <Leaf className="h-3 w-3 text-[#15b371]" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-[#15b371]">
              {cleanSharePercent}% Clean
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">
              Nuclear + Solar + Hydro + Wind
            </div>
          </div>

          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Fleet Efficiency</span>
              <Gauge className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-[#2b95d6]">
              {avgPue} Avg PUE
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">
              Direct-to-Chip Liquid Cooling
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-[#293742] bg-[#101418] px-5 pt-1.5 gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab("pulse")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === "pulse"
                ? "border-[#2b95d6] text-[#2b95d6] font-semibold"
                : "border-transparent text-[#8a9ba8] hover:text-[#f5f8fa]"
            }`}
          >
            <Activity className="h-3 w-3" />
            <span>FUEL MIX</span>
          </button>
          <button
            onClick={() => setActiveTab("nexus")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === "nexus"
                ? "border-[#2b95d6] text-[#2b95d6] font-semibold"
                : "border-transparent text-[#8a9ba8] hover:text-[#f5f8fa]"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span>GRID-TO-COMPUTE NEXUS</span>
          </button>
          <button
            onClick={() => setActiveTab("sustainability")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === "sustainability"
                ? "border-[#15b371] text-[#15b371] font-semibold"
                : "border-transparent text-[#8a9ba8] hover:text-[#f5f8fa]"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>HYPERSCALE SUSTAINABILITY</span>
          </button>
          <button
            onClick={() => setActiveTab("plants")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === "plants"
                ? "border-[#2b95d6] text-[#2b95d6] font-semibold"
                : "border-transparent text-[#8a9ba8] hover:text-[#f5f8fa]"
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>POWER PLANTS ({plants.length.toLocaleString()})</span>
          </button>
          <button
            onClick={() => setActiveTab("datacenters")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === "datacenters"
                ? "border-[#15b371] text-[#15b371] font-semibold"
                : "border-transparent text-[#8a9ba8] hover:text-[#f5f8fa]"
            }`}
          >
            <Server className="h-3 w-3" />
            <span>DATA CENTERS ({dataCenters.length.toLocaleString()})</span>
          </button>
          <button
            onClick={() => setActiveTab("interties")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === "interties"
                ? "border-[#2b95d6] text-[#2b95d6] font-semibold"
                : "border-transparent text-[#8a9ba8] hover:text-[#f5f8fa]"
            }`}
          >
            <GitFork className="h-3 w-3" />
            <span>INTERCONNECTORS</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs">
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
                            <div className="rounded border border-[#293742] bg-[#101418] p-2 shadow-2xl text-xs text-[#f5f8fa] font-mono">
                              <div className="font-bold">{data.name}</div>
                              <div className="text-[#2b95d6] mt-0.5">
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

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {fuelMixData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded border border-[#293742] bg-[#182026] p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-[#f5f8fa] font-sans">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[#8a9ba8]">{item.currentGw} GW</span>
                      <span className="font-bold text-[#f5f8fa] w-12 text-right">
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
            <div className="overflow-x-auto rounded border border-[#293742] bg-[#101418]">
              <div className="px-3 py-2 border-b border-[#293742] bg-[#182026] text-[10px] text-[#8a9ba8]">
                Correlation analysis: Regional generation capacity vs AI data center load demand
              </div>
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#293742] bg-[#182026] text-[10px] uppercase tracking-wider text-[#8a9ba8]">
                    <th className="py-2.5 px-3">Market / ISO Region</th>
                    <th className="py-2.5 px-3">Country</th>
                    <th className="py-2.5 px-3 text-right">Grid Capacity</th>
                    <th className="py-2.5 px-3 text-right">Live Output</th>
                    <th className="py-2.5 px-3 text-right text-[#15b371]">AI Load</th>
                    <th className="py-2.5 px-3 text-right">Clean %</th>
                    <th className="py-2.5 px-3 text-right text-[#d9822b]">Compute Share</th>
                    <th className="py-2.5 px-3 text-right">Grid Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202b33]">
                  {nexusMarkets.map((m) => (
                    <tr key={m.region} className="hover:bg-[#202b33]/40 transition-colors">
                      <td className="py-2 px-3 font-sans font-semibold text-[#f5f8fa]">
                        {m.region}
                      </td>
                      <td className="py-2 px-3 font-sans text-[#8a9ba8]">
                        {m.country}
                      </td>
                      <td className="py-2 px-3 text-right text-[#8a9ba8]">
                        {(m.totalGenerationCapacityMw / 1000).toFixed(1)} GW
                      </td>
                      <td className="py-2 px-3 text-right text-[#2b95d6] font-bold">
                        {(m.totalCurrentOutputMw / 1000).toFixed(1)} GW
                      </td>
                      <td className="py-2 px-3 text-right text-[#15b371] font-bold">
                        {(m.totalDataCenterLoadMw / 1000).toFixed(2)} GW
                      </td>
                      <td className="py-2 px-3 text-right text-[#15b371]">
                        {m.cleanEnergyPercent}%
                      </td>
                      <td className="py-2 px-3 text-right text-[#d9822b] font-bold">
                        {m.computeLoadSharePercent}%
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase ${
                            m.gridStatus === "optimal"
                              ? "bg-[#15b371]/15 text-[#15b371] border border-[#15b371]/40"
                              : m.gridStatus === "balanced"
                              ? "bg-[#2b95d6]/15 text-[#2b95d6] border border-[#2b95d6]/40"
                              : "bg-[#d9822b]/15 text-[#d9822b] border border-[#d9822b]/40"
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
            <div className="overflow-x-auto rounded border border-[#293742] bg-[#101418]">
              <div className="px-3 py-2 border-b border-[#293742] bg-[#182026] text-[10px] text-[#8a9ba8]">
                Benchmarking top global cloud and colocation operators on energy demand, PUE, and carbon footprint
              </div>
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#293742] bg-[#182026] text-[10px] uppercase tracking-wider text-[#8a9ba8]">
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3 text-right">Facilities</th>
                    <th className="py-2.5 px-3 text-right text-[#15b371]">Total IT Load</th>
                    <th className="py-2.5 px-3 text-right">Fleet PUE</th>
                    <th className="py-2.5 px-3 text-right">Annual Energy</th>
                    <th className="py-2.5 px-3 text-right text-[#d9822b]">Est. Scope-2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202b33]">
                  {operatorStats.map((op) => {
                    const col = OPERATOR_COLORS[op.operator] || OPERATOR_COLORS.Other;
                    return (
                      <tr key={op.operator} className="hover:bg-[#202b33]/40 transition-colors">
                        <td className="py-2 px-3 font-sans font-semibold text-[#f5f8fa] flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{op.operator}</span>
                        </td>
                        <td className="py-2 px-3 text-right text-[#8a9ba8]">
                          {op.count}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#15b371]">
                          {op.totalMw.toLocaleString()} MW
                        </td>
                        <td className="py-2 px-3 text-right text-[#2b95d6]">
                          {op.avgPue}
                        </td>
                        <td className="py-2 px-3 text-right text-[#f5f8fa]">
                          {op.annualTwh} TWh
                        </td>
                        <td className="py-2 px-3 text-right text-[#d9822b] font-bold">
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
            <div className="overflow-x-auto rounded border border-[#293742] bg-[#101418]">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#293742] bg-[#182026] text-[10px] uppercase tracking-wider text-[#8a9ba8]">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Station Name</th>
                    <th className="py-2.5 px-3">Fuel</th>
                    <th className="py-2.5 px-3">Country / Region</th>
                    <th className="py-2.5 px-3 text-right text-[#2b95d6]">Dispatch</th>
                    <th className="py-2.5 px-3 text-right text-[#d9822b]">Spot LMP</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202b33]">
                  {topPlants.map((plant, idx) => {
                    const fuel = FUEL_CONFIG[plant.fuelType] || FUEL_CONFIG.other;
                    return (
                      <tr key={plant.id} className="hover:bg-[#202b33]/40 transition-colors">
                        <td className="py-2 px-3 text-[#5c7080]">#{idx + 1}</td>
                        <td className="py-2 px-3 font-sans font-medium text-[#f5f8fa]">
                          <div className="flex items-center gap-1.5">
                            <span>{plant.name}</span>
                            {plant.satelliteTracked && (
                              <span className="font-mono text-[8px] text-[#15b371] bg-[#15b371]/10 px-1 py-0.2 rounded border border-[#15b371]/30 shrink-0">
                                🛰️ TRACE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-semibold"
                            style={{
                              backgroundColor: `rgba(${fuel.rgb.join(",")}, 0.15)`,
                              color: fuel.hex,
                              border: `1px solid rgba(${fuel.rgb.join(",")}, 0.3)`,
                            }}
                          >
                            {fuel.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#8a9ba8] font-sans">
                          {plant.countryName} ({plant.gridRegion})
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#2b95d6]">
                          {plant.currentOutputMw.toLocaleString()} MW
                        </td>
                        <td className="py-2 px-3 text-right text-[#d9822b]">
                          ${plant.spotPriceMwh.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${plant.latitude},${plant.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on Google Maps"
                              className="p-1 rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              onClick={() => handleSelectPlant(plant)}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#137cbd] hover:bg-[#2b95d6] text-white transition-colors"
                            >
                              LOCATE
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
            <div className="overflow-x-auto rounded border border-[#293742] bg-[#101418]">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#293742] bg-[#182026] text-[10px] uppercase tracking-wider text-[#8a9ba8]">
                    <th className="py-2.5 px-3">Data Center Facility</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-right text-[#15b371]">IT Load</th>
                    <th className="py-2.5 px-3 text-right">PUE</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202b33]">
                  {topDataCenters.map((dc) => {
                    const opCol = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;
                    return (
                      <tr key={dc.id} className="hover:bg-[#202b33]/40 transition-colors">
                        <td className="py-2 px-3 font-sans font-semibold text-[#f5f8fa]">
                          <div className="flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-[#15b371] shrink-0" />
                            <span className="truncate max-w-[220px]">{dc.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-semibold"
                            style={{
                              backgroundColor: `rgba(${opCol.rgb.join(",")}, 0.15)`,
                              color: opCol.hex,
                              border: `1px solid rgba(${opCol.rgb.join(",")}, 0.3)`,
                            }}
                          >
                            {dc.operator}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#8a9ba8] font-mono">
                          {dc.countryName || dc.country} • {dc.region}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#15b371]">
                          {dc.estimatedPowerMw} MW
                        </td>
                        <td className="py-2 px-3 text-right text-[#2b95d6]">
                          {dc.pue}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View exact location on Google Maps"
                              className="p-1 rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              onClick={() => handleSelectDataCenter(dc)}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#137cbd] hover:bg-[#2b95d6] text-white transition-colors"
                            >
                              LOCATE
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interconnectors.map((ic) => {
                const utilPct = Math.round(
                  (Math.abs(ic.currentFlowMw) / ic.capacityMw) * 100
                );
                return (
                  <div
                    key={ic.id}
                    className="rounded border border-[#293742] bg-[#182026] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-[#f5f8fa] font-sans">{ic.name}</h4>
                      <span className="rounded bg-[#202b33] px-1.5 py-0.5 font-mono text-[9px] text-[#2b95d6] border border-[#293742]">
                        {ic.type} • {ic.voltageKv} kV
                      </span>
                    </div>
                    <div className="mt-1 text-[#8a9ba8] text-[10px]">
                      {ic.fromRegion} ➔ {ic.toRegion}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between font-mono">
                      <span>Flow: {ic.currentFlowMw.toLocaleString()} MW</span>
                      <span className="text-[#8a9ba8]">
                        Cap: {ic.capacityMw.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-[#101418]">
                      <div
                        className="h-full rounded bg-[#2b95d6]"
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
