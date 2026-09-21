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
  GitFork,
  ShieldAlert,
  Network,
  Waves,
  ThermometerSnowflake,
} from "lucide-react";
import { useState } from "react";

const REGIONS = [
  { id: "GLOBAL", label: "Global (All Regions)", coords: [10.0, 30.0], zoom: 2.2 },
  { id: "NEPAL_NEA", label: "Nepal - National Grid (NEA)", coords: [84.8, 28.0], zoom: 7.0 },
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
  { id: "KOREA_KPX", label: "South Korea - National Grid (KPX / KEPCO)", coords: [127.5, 36.5], zoom: 6.8 },
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
  "kt cloud / KT IDC",
  "LG Uplus",
  "SK Broadband",
  "KINX",
  "Naver Cloud",
  "Kakao Corp",
  "Samsung SDS",
  "Ncell",
  "DataWorld / WorldLink",
  "National Information Technology Center (NITC)",
  "Data Hub Nepal",
  "DishHome (Datalaya)",
  "Nepal Telecom",
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
  const [isOpen, setIsOpen] = useState(false);
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
  const showSubstations = filters.infrastructureType === "all" || filters.infrastructureType === "substations";

  const isFiltered =
    filters.infrastructureType !== "all" ||
    filters.fuelTypes.length > 0 ||
    filters.dcOperators.length > 0 ||
    filters.dcCategories.length > 0 ||
    filters.minCapacityMw > 0 ||
    filters.statuses.length > 0 ||
    filters.region !== "GLOBAL" ||
    filters.priceFilter !== "all" ||
    (filters.minSitingScore != null && filters.minSitingScore > 0) ||
    !!filters.carrierNeutralOnly ||
    (filters.maxIxpLatencyMs != null && filters.maxIxpLatencyMs > 0) ||
    (filters.floodRiskFilter != null && filters.floodRiskFilter !== "all") ||
    (filters.minFreeCoolingPct != null && filters.minFreeCoolingPct > 0) ||
    !!filters.excludeHazardZones;

  return (
    <div className="absolute left-4 top-14 z-20 transition-all duration-200">
      <div className="rounded border border-[#293742] bg-[#182026]/95 backdrop-blur-md p-2.5 shadow-2xl text-[#f5f8fa] text-xs max-w-sm sm:max-w-md font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left hover:text-white transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#202b33] border border-[#293742]">
              <SlidersHorizontal className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <span className="font-mono text-xs font-semibold text-[#f5f8fa] uppercase tracking-wider">
              Ontology Facets
            </span>
            {isFiltered && (
              <span className="rounded px-1.5 py-0.2 text-[9px] font-mono text-[#2b95d6] bg-[#2b95d6]/15 border border-[#2b95d6]/30 font-semibold">
                FILTERED
              </span>
            )}
          </button>
          <div className="flex items-center gap-1">
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[10px] font-mono text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors px-1.5 py-0.5 rounded hover:bg-[#202b33]"
                title="Reset all filters"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>RESET</span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#8a9ba8] hover:text-[#f5f8fa] p-1 rounded hover:bg-[#202b33] transition-colors"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="pt-3 space-y-3 border-t border-[#293742] mt-2">
            {/* 1. Primary Infrastructure Mode Switcher */}
            <div>
              <label className="text-[10px] font-mono uppercase font-semibold text-[#8a9ba8] tracking-wider block mb-1.5">
                Infrastructure Layer Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded bg-[#101418] p-1 border border-[#293742]">
                {[
                  { id: "all", label: "All Layers", icon: Layers },
                  { id: "datacenters", label: "Data Centers", icon: Server },
                  { id: "plants", label: "Power Plants", icon: Zap },
                  { id: "substations", label: "Substations", icon: GitFork },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = filters.infrastructureType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setInfrastructureType(item.id as InfrastructureType)}
                      className={`flex items-center justify-center gap-1 rounded py-1 px-1 text-[10px] font-mono transition-all ${
                        isActive
                          ? item.id === "datacenters"
                            ? "bg-[#15b371]/20 text-[#15b371] border border-[#15b371]/50 font-semibold"
                            : item.id === "plants"
                            ? "bg-[#2b95d6]/20 text-[#2b95d6] border border-[#2b95d6]/50 font-semibold"
                            : item.id === "substations"
                            ? "bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/50 font-semibold"
                            : "bg-[#202b33] text-[#f5f8fa] border border-[#394b59] font-semibold"
                          : "text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#202b33]/60 border border-transparent"
                      }`}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Balancing Authority / Geographic Region */}
            <div>
              <label className="text-[10px] font-mono uppercase font-semibold text-[#8a9ba8] tracking-wider block mb-1.5">
                Balancing Authority / Region
              </label>
              <div className="relative">
                <select
                  value={filters.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full rounded border border-[#293742] bg-[#101418] px-2.5 py-1.5 text-xs font-mono text-[#f5f8fa] outline-none focus:border-[#2b95d6] appearance-none cursor-pointer shadow-inner transition-colors"
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#101418] text-[#f5f8fa]">
                      {r.label}
                    </option>
                  ))}
                </select>
                <Globe className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 text-[#2b95d6]" />
              </div>
            </div>

            {/* 3. Power Plants Fuel Types (Visible if All or Plants) */}
            {showPlants && (
              <div className="border-t border-[#293742] pt-2.5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase font-semibold text-[#2b95d6] tracking-wider flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Generation Fuels
                  </label>
                  <span className="text-[9px] text-[#8a9ba8] font-mono">
                    {filters.fuelTypes.length === 0
                      ? "All Fuels (11)"
                      : `${filters.fuelTypes.length} Active`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                  {(Object.keys(FUEL_CONFIG) as FuelType[]).map((fuelKey) => {
                    const meta = FUEL_CONFIG[fuelKey];
                    const isSelected =
                      filters.fuelTypes.length === 0 ||
                      filters.fuelTypes.includes(fuelKey);

                    return (
                      <button
                        key={fuelKey}
                        onClick={() => toggleFuelType(fuelKey)}
                        className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono transition-all ${
                          isSelected
                            ? "bg-[#202b33] text-[#f5f8fa] border border-[#394b59]"
                            : "bg-[#101418]/60 text-[#5c7080] border border-[#293742]/40 opacity-40 hover:opacity-75"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
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
              <div className="border-t border-[#293742] pt-2.5">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase font-semibold text-[#15b371] tracking-wider flex items-center gap-1">
                    <Server className="h-3 w-3 text-[#15b371]" />
                    Data Center Operators
                  </label>
                  <span className="text-[9px] text-[#8a9ba8] font-mono">
                    {filters.dcOperators.length === 0
                      ? "All Operators (10+)"
                      : `${filters.dcOperators.length} Active`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                  {DC_OPERATORS.map((opName) => {
                    const opMeta = OPERATOR_COLORS[opName] || OPERATOR_COLORS.Other;
                    const isSelected =
                      filters.dcOperators.length === 0 ||
                      filters.dcOperators.includes(opName);

                    return (
                      <button
                        key={opName}
                        onClick={() => toggleDcOperator(opName)}
                        className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono transition-all ${
                          isSelected
                            ? "bg-[#202b33] text-[#f5f8fa] border border-[#394b59]"
                            : "bg-[#101418]/60 text-[#5c7080] border border-[#293742]/40 opacity-40 hover:opacity-75"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: opMeta.hex }}
                        />
                        <span>{opName.replace(" (AWS)", "").replace(" (GCP)", "").replace(" (OCI)", "")}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Facility Category Badges */}
                <div className="mt-2 flex items-center gap-1">
                  {DC_CATEGORIES.map((cat) => {
                    const isCatSelected =
                      filters.dcCategories.length === 0 ||
                      filters.dcCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleDcCategory(cat.id)}
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase transition-all ${
                          isCatSelected
                            ? "bg-[#15b371]/15 text-[#15b371] border border-[#15b371]/40 font-semibold"
                            : "bg-[#101418]/60 text-[#5c7080] border border-[#293742]/40 opacity-40 hover:opacity-75"
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
            <div className="border-t border-[#293742] pt-2.5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono uppercase font-semibold text-[#8a9ba8] tracking-wider">
                  {filters.infrastructureType === "datacenters" ? "IT Power Load Threshold" : "Capacity / Load Scale"}
                </label>
                <span className="font-mono text-[10px] text-[#2b95d6] font-semibold">
                  &gt; {filters.minCapacityMw} MW
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: "All Sizes", min: 0 },
                  { label: "> 50 MW", min: 50 },
                  { label: "> 200 MW", min: 200 },
                  { label: "> 1,000 MW", min: 1000 },
                ].map((cap) => (
                  <button
                    key={cap.min}
                    onClick={() => setFilter("minCapacityMw", cap.min)}
                    className={`rounded px-1 py-1 text-center font-mono text-[9px] transition-all ${
                      filters.minCapacityMw === cap.min
                        ? "bg-[#2b95d6]/20 text-[#2b95d6] border border-[#2b95d6]/50 font-semibold"
                        : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                    }`}
                  >
                    {cap.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Pricing Extreme Filter (Power Plants only) */}
            {showPlants && (
              <div className="border-t border-[#293742] pt-2.5">
                <label className="text-[10px] font-mono uppercase font-semibold text-[#8a9ba8] tracking-wider block mb-1.5">
                  LMP Nodal Pricing Filter
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: "all", label: "All Prices" },
                    { id: "spikes", label: "Spikes >$150" },
                    { id: "negative", label: "Negative <$0" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFilter("priceFilter", p.id as PriceFilter)}
                      className={`rounded px-1.5 py-1 text-center font-mono text-[9px] transition-all ${
                        filters.priceFilter === p.id
                          ? p.id === "spikes"
                            ? "bg-[#db3737]/20 text-[#db3737] border border-[#db3737]/50 font-semibold"
                            : p.id === "negative"
                            ? "bg-[#15b371]/20 text-[#15b371] border border-[#15b371]/50 font-semibold"
                            : "bg-[#2b95d6]/20 text-[#2b95d6] border border-[#2b95d6]/50 font-semibold"
                          : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Site Suitability & Environmental Hazards (Sections 2 - 6) */}
            {showDatacenters && (
              <div className="border-t border-[#293742] pt-2.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-semibold text-[#10b981] tracking-wider">
                    <ShieldAlert className="h-3 w-3 text-[#10b981]" />
                    <span>Site Suitability & Hazards (Sec 2-6)</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#10b981] font-semibold">
                    {filters.minSitingScore ? `>${filters.minSitingScore} Pts` : "All Sites"}
                  </span>
                </div>

                {/* Siting Composite Score Threshold */}
                <div>
                  <div className="text-[9px] font-mono text-[#8a9ba8] mb-1">
                    Minimum Composite Siting Score (0–100)
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: "All Sites", min: 0 },
                      { label: "> 60 Viable", min: 60 },
                      { label: "> 75 Tier III", min: 75 },
                      { label: "> 85 Tier IV", min: 85 },
                    ].map((s) => (
                      <button
                        key={s.min}
                        onClick={() => setFilter("minSitingScore", s.min)}
                        className={`rounded px-1 py-1 text-center font-mono text-[9px] transition-all ${
                          (filters.minSitingScore || 0) === s.min
                            ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50 font-semibold"
                            : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telecom & Hazard Toggles */}
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <button
                    onClick={() => setFilter("carrierNeutralOnly", !filters.carrierNeutralOnly)}
                    className={`flex items-center justify-center gap-1 rounded px-1.5 py-1 text-[9px] font-mono transition-all ${
                      filters.carrierNeutralOnly
                        ? "bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/50 font-semibold"
                        : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                    }`}
                  >
                    <Network className="h-2.5 w-2.5" />
                    <span>Carrier Neutral</span>
                  </button>

                  <button
                    onClick={() => setFilter("excludeHazardZones", !filters.excludeHazardZones)}
                    className={`flex items-center justify-center gap-1 rounded px-1.5 py-1 text-[9px] font-mono transition-all ${
                      filters.excludeHazardZones
                        ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/50 font-semibold"
                        : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                    }`}
                  >
                    <ShieldAlert className="h-2.5 w-2.5" />
                    <span>Exclude Hazards</span>
                  </button>
                </div>

                {/* Flood Risk Filter */}
                <div>
                  <div className="text-[9px] font-mono text-[#8a9ba8] mb-1">
                    FEMA Flood Zone Exclusion
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: "all", label: "All Zones" },
                      { id: "no_high_flood", label: "No 100-Yr Surge" },
                      { id: "zero_flood_only", label: "Zero Flood (X)" },
                    ].map((fl) => (
                      <button
                        key={fl.id}
                        onClick={() => setFilter("floodRiskFilter", fl.id as any)}
                        className={`rounded px-1.5 py-1 text-center font-mono text-[9px] transition-all ${
                          (filters.floodRiskFilter || "all") === fl.id
                            ? "bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/50 font-semibold"
                            : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                        }`}
                      >
                        {fl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free Cooling Economizers Filter */}
                <div>
                  <div className="text-[9px] font-mono text-[#8a9ba8] mb-1">
                    Free-Cooling Economizer Potential
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { min: 0, label: "Any Climate" },
                      { min: 70, label: "> 70% Direct Air" },
                      { min: 85, label: "> 85% Nordic" },
                    ].map((c) => (
                      <button
                        key={c.min}
                        onClick={() => setFilter("minFreeCoolingPct", c.min)}
                        className={`rounded px-1.5 py-1 text-center font-mono text-[9px] transition-all ${
                          (filters.minFreeCoolingPct || 0) === c.min
                            ? "bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 font-semibold"
                            : "bg-[#101418] text-[#8a9ba8] hover:text-[#f5f8fa] border border-[#293742]"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
