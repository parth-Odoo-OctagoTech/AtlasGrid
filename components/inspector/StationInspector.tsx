"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, PowerPlant } from "@/lib/types/power-plant";
import { DispatchChart } from "./DispatchChart";
import { OPERATOR_COLORS, DataCenter } from "@/lib/types/data-center";
import {
  findLocalGridSupply,
  findSuppliedDataCenters,
} from "@/lib/services/cross-reference-service";
import {
  X,
  Zap,
  Flame,
  Activity,
  Compass,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  Leaf,
  Share2,
  Maximize2,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  Cpu,
  Globe,
  Gauge,
  Radio,
  Network,
  RadioTower,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function StationInspector() {
  const isInspectorOpen = useGridStore((s) => s.isInspectorOpen);
  const setInspectorOpen = useGridStore((s) => s.setInspectorOpen);
  const selectedStation = useGridStore((s) => s.selectedStation);
  const selectedDataCenter = useGridStore((s) => s.selectedDataCenter);
  const setSelectedStation = useGridStore((s) => s.setSelectedStation);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);
  const flyToStation = useGridStore((s) => s.flyToStation);

  // Fetch stations for cross-referencing
  const { data: allStationsData } = useQuery({
    queryKey: ["all-stations-inspector"],
    queryFn: async () => {
      const res = await fetch("/api/stations?limit=10000");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 60000,
  });

  // Fetch data centers for cross-referencing
  const { data: allDataCentersData } = useQuery({
    queryKey: ["all-datacenters-inspector"],
    queryFn: async () => {
      const res = await fetch("/api/datacenters");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  // Fetch detailed station history & alerts (for power stations)
  const { data: detailData } = useQuery({
    queryKey: ["station-detail", selectedStation?.id],
    queryFn: async () => {
      if (!selectedStation?.id) return null;
      const res = await fetch(`/api/stations/${selectedStation.id}`);
      if (!res.ok) throw new Error("Failed to fetch station details");
      return res.json();
    },
    enabled: !!selectedStation?.id && isInspectorOpen,
    staleTime: 10000,
  });

  // Compute local grid supply for active data center
  const localGridSupply = useMemo(() => {
    if (!selectedDataCenter || !allStationsData?.length) return null;
    return findLocalGridSupply(selectedDataCenter, allStationsData, 100);
  }, [selectedDataCenter, allStationsData]);

  // Compute nearby compute demand for active power station
  const localComputeDemand = useMemo(() => {
    if (!selectedStation || !allDataCentersData?.length) return null;
    return findSuppliedDataCenters(selectedStation, allDataCentersData, 100);
  }, [selectedStation, allDataCentersData]);

  if (!isInspectorOpen || (!selectedStation && !selectedDataCenter)) return null;

  // 1. DATA CENTER INSPECTOR VIEW
  if (selectedDataCenter) {
    const opMeta = OPERATOR_COLORS[selectedDataCenter.operator] || OPERATOR_COLORS.Other;
    const annualGwh = ((selectedDataCenter.estimatedPowerMw * 8760 * 0.85) / 1000).toFixed(0);

    return (
      <aside className="absolute right-0 top-14 bottom-0 z-30 w-full sm:w-[470px] overflow-y-auto glass-panel-elevated p-5 shadow-2xl text-white transition-all animate-in slide-in-from-right duration-200 border-l border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide"
                style={{
                  backgroundColor: `rgba(${opMeta.rgb.join(",")}, 0.2)`,
                  color: opMeta.hex,
                  border: `1px solid rgba(${opMeta.rgb.join(",")}, 0.4)`,
                }}
              >
                <Server className="h-3 w-3" />
                {selectedDataCenter.operator}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-mono uppercase font-bold text-purple-300 border border-purple-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                {selectedDataCenter.category}
              </span>
              {selectedDataCenter.peeringDbId && (
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 border border-indigo-500/30">
                  <Network className="h-2.5 w-2.5" />
                  PeeringDB #{selectedDataCenter.peeringDbId}
                </span>
              )}
            </div>

            <h2 className="text-base font-bold tracking-tight text-white leading-tight">
              {selectedDataCenter.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="font-semibold text-slate-200">
                {selectedDataCenter.countryName || selectedDataCenter.country}
              </span>
              <span>•</span>
              <span className="font-mono text-purple-400 font-medium">
                {selectedDataCenter.region}
              </span>
              <span>•</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedDataCenter.latitude},${selectedDataCenter.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 transition-colors shadow-sm"
                title="Open exact coordinates on Google Maps"
              >
                <span>{selectedDataCenter.latitude.toFixed(4)}°N, {selectedDataCenter.longitude.toFixed(4)}°E</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => flyToStation(selectedDataCenter)}
              title="Center Camera on Facility"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all hover:scale-105 active:scale-95"
            >
              <Compass className="h-4 w-4" />
            </button>
            <button
              onClick={() => setInspectorOpen(false)}
              title="Close Inspector"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Primary KPI Metrics Bento */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* IT Power Load */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              <span>IT Power Demand</span>
              <Zap className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold text-purple-300">
              <span>{selectedDataCenter.estimatedPowerMw}</span>
              <span className="text-xs font-normal text-gray-400">MW</span>
            </div>
            <div className="mt-2 text-[10px] text-gray-400">
              Est. Energy: <span className="font-mono text-purple-300 font-medium">~{annualGwh} GWh/yr</span>
            </div>
          </div>

          {/* Efficiency PUE */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              <span>Power Efficiency</span>
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold text-emerald-400">
              <span>{selectedDataCenter.pue}</span>
              <span className="text-xs font-normal text-gray-400">PUE</span>
            </div>
            <div className="mt-2 text-[10px] text-emerald-300/80 font-medium">
              {selectedDataCenter.pue < 1.2 ? "High Efficiency Hyperscale" : "Standard Tier III Facility"}
            </div>
          </div>
        </div>

        {/* PeeringDB & Interconnect Network Card */}
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-indigo-400" />
              PeeringDB & Network Interconnect
            </span>
            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/30">
              Verified IXP Hub
            </span>
          </h3>
          <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-center">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-surface-border">
              <div className="text-sm font-bold text-indigo-300">
                {selectedDataCenter.connectedNetworksCount || 42}+
              </div>
              <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Carrier ASNs</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-surface-border">
              <div className="text-sm font-bold text-cyan-300">
                {selectedDataCenter.ixpCount || 2}
              </div>
              <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Internet Exchanges</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-surface-border">
              <div className="text-sm font-bold text-emerald-300">
                &lt; 5 ms
              </div>
              <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Core Latency</div>
            </div>
          </div>
          {selectedDataCenter.address && (
            <div className="mt-2.5 text-[11px] text-gray-300 flex items-center gap-1.5 border-t border-indigo-500/20 pt-2">
              <Building className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedDataCenter.address}, {selectedDataCenter.city || selectedDataCenter.countryName}</span>
            </div>
          )}
        </div>

        {/* Local Grid Power Supply Cross-Reference Module */}
        {localGridSupply && (
          <div className="mt-4 rounded-xl border border-cyan-500/30 bg-slate-900/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                Local Power Grid Supply (100km)
              </h3>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {localGridSupply.cleanEnergyPercent}% Clean
              </span>
            </div>

            {/* Clean vs Fossil Mix Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Clean Generation: {localGridSupply.cleanEnergyPercent}%</span>
                <span>Fossil: {localGridSupply.fossilEnergyPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${localGridSupply.cleanEnergyPercent}%` }}
                />
                <div
                  className="h-full bg-slate-600 transition-all duration-500"
                  style={{ width: `${localGridSupply.fossilEnergyPercent}%` }}
                />
              </div>
            </div>

            {/* Top Supplying Power Plants List */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                Nearest Supplying Power Stations ({localGridSupply.supplyingPlants.length})
              </div>
              {localGridSupply.supplyingPlants.slice(0, 4).map((plant) => {
                const plantFuel = FUEL_CONFIG[plant.fuelType] || FUEL_CONFIG.other;
                return (
                  <div
                    key={plant.id}
                    className="flex items-center justify-between rounded-lg border border-surface-border bg-slate-950/60 p-2 text-xs hover:border-cyan-500/40 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: plantFuel.hex }}
                        />
                        <span className="font-semibold text-white truncate max-w-[180px]">
                          {plant.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                        <span style={{ color: plantFuel.hex }}>{plantFuel.label}</span>
                        <span>•</span>
                        <span>{plant.capacityMw} MW</span>
                        <span>•</span>
                        <span className="text-cyan-300 font-sans">{plant.distanceKm} km away</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const target = allStationsData?.find((s: PowerPlant) => s.id === plant.id);
                        if (target) {
                          setSelectedDataCenter(null);
                          setSelectedStation(target);
                          flyToStation(target);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded bg-cyan-950/80 px-2 py-1 text-[10px] font-medium text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600 hover:text-white transition-all shrink-0"
                      title="Fly camera to this power station"
                    >
                      <span>Fly</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Scope 2 Carbon Emissions Card */}
            <div className="mt-3 pt-2.5 border-t border-surface-border/40 flex items-center justify-between text-xs">
              <div className="text-gray-400 text-[11px] flex items-center gap-1">
                <Leaf className="h-3 w-3 text-emerald-400" />
                <span>Est. Scope-2 Emissions:</span>
              </div>
              <span className="font-mono font-bold text-amber-300">
                {localGridSupply.estimatedAnnualScope2Co2Tons.toLocaleString()} t CO₂/yr
              </span>
            </div>
          </div>
        )}

        {/* Technical Architecture */}
        <div className="mt-4 rounded-xl border border-surface-border bg-slate-900/60 p-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-cyan-400" />
            Data Center Technical Architecture
          </h3>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Operator</span>
              <span className="font-medium text-white truncate block">
                {selectedDataCenter.operator}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Redundancy Tier</span>
              <span className="font-mono text-white">
                {selectedDataCenter.tier}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Cooling System</span>
              <span className="font-mono text-cyan-400 truncate block">
                {selectedDataCenter.coolingType}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Classification</span>
              <span className="text-white capitalize truncate block">
                {selectedDataCenter.category} Facility
              </span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 2. POWER PLANT INSPECTOR VIEW (when selectedStation is active)
  if (!selectedStation) return null;

  const fuel = FUEL_CONFIG[selectedStation.fuelType] || FUEL_CONFIG.other;
  const isSpike = selectedStation.spotPriceMwh >= 150;
  const isNegative = selectedStation.spotPriceMwh < 0;

  const history = detailData?.data?.history24h || [];
  const alerts = detailData?.data?.recentAlerts || [];

  const hourlyCo2Tons = (
    (selectedStation.currentOutputMw * 1000 * selectedStation.co2IntensityGPerKwh) /
    1_000_000
  ).toFixed(1);

  return (
    <aside className="absolute right-0 top-14 bottom-0 z-30 w-full sm:w-[470px] overflow-y-auto glass-panel-elevated p-5 shadow-2xl text-white transition-all animate-in slide-in-from-right duration-200 border-l border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: `rgba(${fuel.rgb.join(",")}, 0.2)`,
                color: fuel.hex,
                border: `1px solid rgba(${fuel.rgb.join(",")}, 0.4)`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: fuel.hex }}
              />
              {fuel.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono uppercase font-bold ${
                selectedStation.status === "online"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : selectedStation.status === "ramping"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : selectedStation.status === "curtailed"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-red-500/20 text-red-400 border border-red-500/40"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  selectedStation.status === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : selectedStation.status === "ramping"
                    ? "bg-blue-400"
                    : selectedStation.status === "curtailed"
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              {selectedStation.status}
            </span>
          </div>

          <h2 className="text-base font-bold tracking-tight text-white leading-tight">
            {selectedStation.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>{selectedStation.countryName}</span>
            <span>•</span>
            <span className="font-mono text-cyan-400">
              {selectedStation.gridRegion}
            </span>
            <span>•</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedStation.latitude},${selectedStation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 transition-colors shadow-sm"
              title="Open exact coordinates on Google Maps in new tab"
            >
              <span>{selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${selectedStation.latitude},${selectedStation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 hover:text-white hover:bg-cyan-600 transition-all shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => flyToStation(selectedStation)}
            title="Center Camera on Station"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-slate-900/80 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          >
            <Compass className="h-4 w-4" />
          </button>
          <button
            onClick={() => setInspectorOpen(false)}
            title="Close Inspector"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-slate-900/80 text-gray-400 hover:text-white hover:border-slate-600 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Output vs Capacity */}
        <div className="rounded-xl border border-surface-border bg-slate-900/60 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400">
            <span>Current Dispatch</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold text-white">
            <span>{selectedStation.currentOutputMw.toLocaleString()}</span>
            <span className="text-xs font-normal text-gray-400">MW</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Nameplate: {selectedStation.capacityMw.toLocaleString()} MW</span>
              <span className="font-mono text-white">
                {(selectedStation.capacityFactor * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, selectedStation.capacityFactor * 100)}%`,
                  backgroundColor: fuel.hex,
                }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Locational Marginal Price */}
        <div className="rounded-xl border border-surface-border bg-slate-900/60 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400">
            <span>Nodal Spot LMP</span>
            <Flame
              className={`h-3.5 w-3.5 ${
                isSpike ? "text-red-400 animate-pulse" : "text-amber-400"
              }`}
            />
          </div>
          <div
            className={`mt-1 flex items-baseline gap-1 font-mono text-xl font-bold ${
              isSpike
                ? "text-red-400"
                : isNegative
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            <span>${selectedStation.spotPriceMwh.toFixed(2)}</span>
            <span className="text-xs font-normal text-gray-400">/MWh</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 border-t border-surface-border/40 pt-1.5 text-[9px] font-mono text-gray-400">
            <div>
              <span>Energy:</span>
              <div className="text-white">${selectedStation.lmpBreakdown.energy}</div>
            </div>
            <div>
              <span>Congest:</span>
              <div className={selectedStation.lmpBreakdown.congestion > 10 ? "text-red-400 font-bold" : "text-white"}>
                ${selectedStation.lmpBreakdown.congestion}
              </div>
            </div>
            <div>
              <span>Loss:</span>
              <div className="text-white">${selectedStation.lmpBreakdown.loss}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Dispatch Chart */}
      <div className="mt-4">
        <DispatchChart data={history} fuelHex={fuel.hex} />
      </div>

      {/* Technical Specifications Section */}
      <div className="mt-4 rounded-xl border border-surface-border bg-slate-900/60 p-3.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-cyan-400" />
            Technical & Grid Interconnection
          </span>
          {selectedStation.climateTraceAssetId && (
            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              🛰️ Climate TRACE Verified
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
          <div>
            <span className="text-[10px] uppercase text-gray-400 block">Operator</span>
            <span className="font-medium text-white truncate block">
              {selectedStation.operator}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-gray-400 block">Turbine / Hardware</span>
            <span className="font-mono text-white truncate block">
              {selectedStation.turbineManufacturer || "GE Vernova / Heavy Duty"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-gray-400 block">Substation Link</span>
            <span className="font-mono text-cyan-400 truncate block">
              {selectedStation.substationName || `${selectedStation.gridRegion} 500kV Main`}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-gray-400 block">Cooling System</span>
            <span className="text-white truncate block">
              {selectedStation.coolingType || "Closed-Loop Cooling Towers"}
            </span>
          </div>
        </div>

        {/* Direct Google Maps Satellite Link */}
        <div className="mt-3 pt-2.5 border-t border-surface-border/40 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Exact Geolocation:</span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${selectedStation.latitude},${selectedStation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-white transition-all shadow-sm"
          >
            <span>View on Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Connected AI & Cloud Compute Load (Nearby Data Centers) */}
      {localComputeDemand && localComputeDemand.nearbyDataCenters.length > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              Connected Data Centers (100km)
            </h3>
            <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              {localComputeDemand.totalLocalComputeLoadMw} MW Load
            </span>
          </div>

          <div className="text-[11px] text-gray-300 mb-2">
            Local data centers draw <span className="font-mono font-bold text-emerald-400">{localComputeDemand.loadCapacityRatioPercent}%</span> of this plant&apos;s nameplate capacity.
          </div>

          <div className="space-y-2 mt-2">
            {localComputeDemand.nearbyDataCenters.slice(0, 4).map((dc) => {
              const dcOp = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;
              return (
                <div
                  key={dc.id}
                  className="flex items-center justify-between rounded-lg border border-surface-border bg-slate-950/60 p-2 text-xs hover:border-emerald-500/40 transition-all group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: dcOp.hex }}
                      />
                      <span className="font-semibold text-white truncate max-w-[180px]">
                        {dc.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                      <span style={{ color: dcOp.hex }}>{dc.operator}</span>
                      <span>•</span>
                      <span>{dc.estimatedPowerMw} MW</span>
                      <span>•</span>
                      <span className="text-emerald-300 font-sans">{dc.distanceKm} km away</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const target = allDataCentersData?.find((d: DataCenter) => d.id === dc.id);
                      if (target) {
                        setSelectedStation(null);
                        setSelectedDataCenter(target);
                        flyToStation(target);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-1 text-[10px] font-medium text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all shrink-0"
                    title="Fly camera to this data center"
                  >
                    <span>Fly</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Carbon Intensity & Emission Footprint */}
      <div className="mt-4 rounded-xl border border-surface-border bg-slate-900/60 p-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
            Emissions & Sustainability
          </h3>
          <span
            className={`font-mono text-xs font-bold ${
              selectedStation.co2IntensityGPerKwh < 50
                ? "text-emerald-400"
                : selectedStation.co2IntensityGPerKwh < 400
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {selectedStation.co2IntensityGPerKwh} g CO₂/kWh
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs border-t border-surface-border/40 pt-2 text-gray-300">
          <span>Current Hourly Emission:</span>
          <span className="font-mono font-bold text-white">
            {hourlyCo2Tons} t CO₂/hr
          </span>
        </div>
        {selectedStation.annualCo2EmissionsTons && (
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
            <span>Annual Satellite CO₂ Footprint:</span>
            <span className="font-mono text-amber-300">
              {selectedStation.annualCo2EmissionsTons.toLocaleString()} t CO₂/yr
            </span>
          </div>
        )}
      </div>

      {/* Active Station & Regional Alerts */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          Station Logs & Telemetry Events ({alerts.length})
        </h3>
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-surface-border bg-slate-900/40 p-3 text-center text-xs text-gray-400">
            No active grid anomalies recorded for this facility.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-2.5 text-xs transition-all ${
                  alert.severity === "critical"
                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                    : alert.severity === "warning"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-blue-500/40 bg-blue-500/10 text-blue-300"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{alert.title}</span>
                  <span className="font-mono text-[10px] text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-gray-300 leading-snug">
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
