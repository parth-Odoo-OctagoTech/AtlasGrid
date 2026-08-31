"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, FuelType, StationStatus } from "@/lib/types/power-plant";
import { InfrastructureType, PriceFilter } from "@/lib/types/filters";
import { OPERATOR_COLORS } from "@/lib/types/data-center";
import {
  SlidersHorizontal,
  Filter,
  Flame,
  Zap,
  Globe,
  RotateCcw,
  Check,
  ChevronDown,
  Server,
  Cpu,
  Layers,
} from "lucide-react";
import { useState } from "react";

const REGIONS = [
  { id: "GLOBAL", label: "Global (All Regions)", coords: [10.0, 30.0], zoom: 2.2 },
  { id: "GUJARAT", label: "India - Gujarat State Grid", coords: [71.8, 22.8], zoom: 7.2 },
  { id: "INDIA_NREB", label: "India - National Grid", coords: [78.5, 22.5], zoom: 4.8 },
  { id: "CAISO", label: "US - CAISO (California)", coords: [-119.5, 36.5], zoom: 6.0 },
  { id: "ERCOT", label: "US - ERCOT (Texas)", coords: [-99.5, 31.5], zoom: 6.0 },
  { id: "PJM", label: "US - PJM (Mid-Atlantic)", coords: [-79.5, 40.0], zoom: 5.5 },
  { id: "MISO", label: "US - MISO (Midwest)", coords: [-90.5, 41.5], zoom: 5.2 },
  { id: "NYISO", label: "US - NYISO & NE", coords: [-74.5, 42.8], zoom: 6.2 },
  { id: "ENTSOE_FR", label: "Europe - France (RTE)", coords: [2.5, 46.8], zoom: 5.5 },
  { id: "ENTSOE_DE", label: "Europe - Germany (TenneT)", coords: [10.2, 51.2], zoom: 5.8 },
  { id: "ENTSOE_GB", label: "Europe - UK (National Grid)", coords: [-1.8, 54.0], zoom: 5.5 },
  { id: "ENTSOE_ES", label: "Europe - Spain (REE)", coords: [-3.8, 40.0], zoom: 5.5 },
  { id: "NORDPOOL", label: "Europe - Nordics (Statnett)", coords: [14.5, 62.0], zoom: 4.5 },
  { id: "CHINA_STATE_GRID", label: "Asia - China (State Grid)", coords: [105.0, 32.0], zoom: 4.2 },
  { id: "JAPAN_TEPCO", label: "Asia - Japan (TEPCO)", coords: [138.5, 36.5], zoom: 5.5 },
  { id: "NEM_AUSTRALIA", label: "Oceania - Australia (NEM)", coords: [145.0, -34.0], zoom: 4.8 },
  { id: "BRAZIL_ONS", label: "Latin America - Brazil (ONS)", coords: [-50.0, -15.0], zoom: 4.2 },
];

const DC_OPERATORS = [
  "Amazon Web Services (AWS)",
  "Microsoft Azure",
  "Google Cloud (GCP)",
  "Meta Hyperscale",
  "Equinix IBX",
  "Digital Realty",
  "Oracle Cloud (OCI)",
  "NTT Global Data Centers",
  "Reliance Jio Data Centers",
  "AdaniConnex",
  "STT GDC India",
  "CtrlS Datacenters",
  "Yotta Infrastructure",
  "Nxtra by Airtel",
  "Sify Technologies",
  "CyrusOne",
  "QTS Data Centers",
];

const DC_CATEGORIES = [
  { id: "hyperscale", label: "Hyperscale" },
  { id: "colocation", label: "Colocation" },
  { id: "enterprise", label: "Enterprise" },
  { id: "telecom", label: "Telecom" },
];

export function FloatingFilters() {
  const [isOpen, setIsOpen] = useState(true);
  const filters = useGridStore((s) => s.filters);
  const setFilter = useGridStore((s) => s.setFilter);
  const setInfrastructureType = useGridStore((s) => s.setInfrastructureType);
  const toggleFuelType = useGridStore((s) => s.toggleFuelType);
  const toggleDcOperator = useGridStore((s) => s.toggleDcOperator);
  const toggleDcCategory = useGridStore((s) => s.toggleDcCategory);
  const toggleStatus = useGridStore((s) => s.toggleStatus);
  const resetFilters = useGridStore((s) => s.resetFilters);
  const flyToCoordinates = useGridStore((s) => s.flyToCoordinates);

  const handleRegionChange = (regionId: string) => {
    setFilter("region", regionId);
    const target = REGIONS.find((r) => r.id === regionId);
    if (target && target.coords) {
      flyToCoordinates(target.coords[0], target.coords[1], target.zoom, 40);
    }
  };

  const showPlants = filters.infrastructureType === "all" || filters.infrastructureType === "plants";
  const showDatacenters = filters.infrastructureType === "all" || filters.infrastructureType === "datacenters";

  const isFiltered =
    filters.infrastructureType !== "all" ||
    filters.fuelTypes.length > 0 ||
    filters.dcOperators.length > 0 ||
    filters.dcCategories.length > 0 ||
    filters.minCapacityMw > 0 ||
    filters.statuses.length > 0 ||
    filters.region !== "GLOBAL" ||
    filters.priceFilter !== "all";

  return (
    <div className="absolute left-4 top-16 z-20 transition-all duration-300">
      <div className="rounded-2xl glass-panel p-3.5 shadow-2xl text-white text-xs max-w-sm sm:max-w-md animate-in fade-in slide-in-from-left-3 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/30">
              <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <span className="font-bold tracking-wide uppercase text-xs">
              Filters & Layers
            </span>
            {isFiltered && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm">
                FILTERED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/60"
                title="Reset all filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-slate-800/80 transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="pt-3 space-y-3">
            {/* 1. Primary Infrastructure Mode Switcher */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block mb-1.5">
                Infrastructure Layer Focus
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900/90 p-1 border border-surface-border/80">
                {[
                  { id: "all", label: "All Layers", icon: Layers },
                  { id: "plants", label: "Power Plants", icon: Zap },
                  { id: "datacenters", label: "Data Centers", icon: Server },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = filters.infrastructureType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setInfrastructureType(item.id as InfrastructureType)}
                      className={`flex items-center justify-center gap-1.5 rounded py-1.5 text-[11px] font-medium transition-all ${
                        isActive
                          ? item.id === "datacenters"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm font-semibold"
                            : item.id === "plants"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold"
                            : "bg-slate-800 text-white border border-slate-600 shadow-sm font-semibold"
                          : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Balancing Authority / Geographic Region */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block mb-1.5">
                Balancing Authority / Region
              </label>
              <div className="relative">
                <select
                  value={filters.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60 appearance-none cursor-pointer backdrop-blur-md shadow-inner transition-colors"
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-950 text-white">
                      {r.label}
                    </option>
                  ))}
                </select>
                <Globe className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-cyan-400" />
              </div>
            </div>

            {/* 3. Power Plants Fuel Types (Visible if All or Plants) */}
            {showPlants && (
              <div className="border-t border-white/10 pt-2.5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Generation Fuels
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {filters.fuelTypes.length === 0
                      ? "All Fuels (11)"
                      : `${filters.fuelTypes.length} Active`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {(Object.keys(FUEL_CONFIG) as FuelType[]).map((fuelKey) => {
                    const meta = FUEL_CONFIG[fuelKey];
                    const isSelected =
                      filters.fuelTypes.length === 0 ||
                      filters.fuelTypes.includes(fuelKey);

                    return (
                      <button
                        key={fuelKey}
                        onClick={() => toggleFuelType(fuelKey)}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                          isSelected
                            ? "bg-slate-800/90 text-white border border-white/15 shadow-sm"
                            : "bg-slate-900/40 text-gray-500 border border-white/5 opacity-35 hover:opacity-75"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Data Center Cloud Operators (Visible if All or Data Centers) */}
            {showDatacenters && (
              <div className="border-t border-white/10 pt-2.5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-semibold text-purple-300 tracking-wider flex items-center gap-1">
                    <Server className="h-3 w-3 text-purple-400" />
                    Data Center Operators
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {filters.dcOperators.length === 0
                      ? "All Operators (10+)"
                      : `${filters.dcOperators.length} Active`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {DC_OPERATORS.map((opName) => {
                    const opMeta = OPERATOR_COLORS[opName] || OPERATOR_COLORS.Other;
                    const isSelected =
                      filters.dcOperators.length === 0 ||
                      filters.dcOperators.includes(opName);

                    return (
                      <button
                        key={opName}
                        onClick={() => toggleDcOperator(opName)}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                          isSelected
                            ? "bg-slate-800/90 text-white border border-white/15 shadow-sm"
                            : "bg-slate-900/40 text-gray-500 border border-white/5 opacity-35 hover:opacity-75"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: opMeta.hex }}
                        />
                        <span>{opName.replace(" (AWS)", "").replace(" (GCP)", "").replace(" (OCI)", "")}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Facility Category Badges */}
                <div className="mt-2 flex items-center gap-1.5">
                  {DC_CATEGORIES.map((cat) => {
                    const isCatSelected =
                      filters.dcCategories.length === 0 ||
                      filters.dcCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleDcCategory(cat.id)}
                        className={`rounded-lg px-2 py-0.5 text-[9px] font-mono uppercase transition-all ${
                          isCatSelected
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-glow-sm"
                            : "bg-slate-900/60 text-gray-400 border border-white/5 opacity-40 hover:opacity-75"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Capacity / IT Power Scale */}
            <div className="border-t border-white/10 pt-2.5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                  {filters.infrastructureType === "datacenters" ? "IT Power Load Threshold" : "Capacity / Load Scale"}
                </label>
                <span className="font-mono text-[10px] text-cyan-400 font-bold">
                  &gt; {filters.minCapacityMw} MW
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "All Sizes", min: 0 },
                  { label: "> 50 MW", min: 50 },
                  { label: "> 200 MW", min: 200 },
                  { label: "> 1,000 MW", min: 1000 },
                ].map((cap) => (
                  <button
                    key={cap.min}
                    onClick={() => setFilter("minCapacityMw", cap.min)}
                    className={`rounded-lg px-1.5 py-1 text-center font-mono text-[10px] transition-all ${
                      filters.minCapacityMw === cap.min
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-glow-sm"
                        : "bg-slate-900/60 text-gray-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {cap.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Pricing Extreme Filter (Power Plants only) */}
            {showPlants && (
              <div className="border-t border-white/10 pt-2.5">
                <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block mb-1.5">
                  LMP Nodal Pricing Filter
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "all", label: "All Prices" },
                    { id: "spikes", label: "Spikes >$150" },
                    { id: "negative", label: "Negative <$0" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFilter("priceFilter", p.id as PriceFilter)}
                      className={`rounded-lg px-2 py-1 text-center text-[10px] transition-all ${
                        filters.priceFilter === p.id
                          ? p.id === "spikes"
                            ? "bg-red-500/20 text-red-300 border border-red-500/50 font-bold shadow-glow-sm"
                            : p.id === "negative"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-glow-sm"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-glow-sm"
                          : "bg-slate-900/60 text-gray-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
