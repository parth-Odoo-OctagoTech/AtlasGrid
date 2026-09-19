"use client";

import { useState, useMemo } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import { DataCenter, OPERATOR_COLORS } from "@/lib/types/data-center";
import {
  X,
  Server,
  Zap,
  Gauge,
  Search,
  Filter,
  Globe,
  Compass,
  Download,
  Building,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Network,
  Radio,
  Layers,
} from "lucide-react";

interface DataCenterFleetModalProps {
  dataCenters: DataCenter[];
}

export function DataCenterFleetModal({ dataCenters }: DataCenterFleetModalProps) {
  const isDcFleetOpen = useGridStore((s) => s.isDcFleetOpen);
  const setDcFleetOpen = useGridStore((s) => s.setDcFleetOpen);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);
  const flyToStation = useGridStore((s) => s.flyToStation);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"grid" | "operators" | "countries">("grid");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedOperator, setSelectedOperator] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedScale, setSelectedScale] = useState<string>("ALL");

  // Sorting
  const [sortBy, setSortBy] = useState<
    "power_desc" | "power_asc" | "pue_asc" | "pue_desc" | "asns_desc" | "name_asc"
  >("power_desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Genuine Global Fleet Aggregates (No fabricated utilization or fake spare capacity)
  const fleetTotals = useMemo(() => {
    const totalPowerMw = dataCenters.reduce((sum, d) => sum + d.estimatedPowerMw, 0);
    const hyperscaleCount = dataCenters.filter((d) => d.category === "hyperscale").length;
    const colocationCount = dataCenters.filter((d) => d.category === "colocation").length;
    const totalAsns = dataCenters.reduce((sum, d) => sum + (d.connectedNetworksCount || 0), 0);
    const avgPue = dataCenters.length > 0
      ? (dataCenters.reduce((sum, d) => sum + d.pue, 0) / dataCenters.length).toFixed(2)
      : "1.22";

    return {
      totalPowerGw: (totalPowerMw / 1000).toFixed(1),
      avgPue,
      count: dataCenters.length,
      hyperscaleCount,
      colocationCount,
      totalAsns,
    };
  }, [dataCenters]);

  // Distinct Lists for Filter Selectors
  const countryList = useMemo(() => {
    const counts: Record<string, { count: number; totalMw: number }> = {};
    for (const d of dataCenters) {
      const c = d.countryName || d.country || "Global";
      if (!counts[c]) {
        counts[c] = { count: 0, totalMw: 0 };
      }
      counts[c].count += 1;
      counts[c].totalMw += d.estimatedPowerMw;
    }
    return Object.entries(counts)
      .map(([name, meta]) => ({ name, count: meta.count, totalMw: meta.totalMw }))
      .sort((a, b) => b.totalMw - a.totalMw);
  }, [dataCenters]);

  const operatorList = useMemo(() => {
    const counts: Record<string, { count: number; totalMw: number }> = {};
    for (const d of dataCenters) {
      if (!counts[d.operator]) {
        counts[d.operator] = { count: 0, totalMw: 0 };
      }
      counts[d.operator].count += 1;
      counts[d.operator].totalMw += d.estimatedPowerMw;
    }
    return Object.entries(counts)
      .map(([operator, meta]) => ({ operator, count: meta.count, totalMw: meta.totalMw }))
      .sort((a, b) => b.totalMw - a.totalMw);
  }, [dataCenters]);

  // Filtered & Sorted Facilities
  const filteredDataCenters = useMemo(() => {
    return dataCenters
      .filter((dc) => {
        // Text Search
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = dc.name.toLowerCase().includes(q);
          const matchOp = dc.operator.toLowerCase().includes(q);
          const matchCountry = (dc.countryName || dc.country).toLowerCase().includes(q);
          const matchCity = (dc.city || "").toLowerCase().includes(q);
          const matchAddress = (dc.address || "").toLowerCase().includes(q);
          const matchRegion = dc.region.toLowerCase().includes(q);
          if (!matchName && !matchOp && !matchCountry && !matchCity && !matchAddress && !matchRegion) {
            return false;
          }
        }

        // Country Filter
        if (selectedCountry !== "ALL") {
          const c = dc.countryName || dc.country;
          if (c !== selectedCountry) return false;
        }

        // Operator Filter
        if (selectedOperator !== "ALL") {
          if (dc.operator !== selectedOperator) return false;
        }

        // Category Filter
        if (selectedCategory !== "ALL") {
          if (dc.category !== selectedCategory) return false;
        }

        // Scale Filter
        if (selectedScale !== "ALL") {
          if (selectedScale === "mega" && dc.estimatedPowerMw < 200) return false;
          if (selectedScale === "hyper" && (dc.estimatedPowerMw < 50 || dc.estimatedPowerMw >= 200)) return false;
          if (selectedScale === "mid" && (dc.estimatedPowerMw < 15 || dc.estimatedPowerMw >= 50)) return false;
          if (selectedScale === "edge" && dc.estimatedPowerMw >= 15) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "power_desc") return b.estimatedPowerMw - a.estimatedPowerMw;
        if (sortBy === "power_asc") return a.estimatedPowerMw - b.estimatedPowerMw;
        if (sortBy === "pue_asc") return a.pue - b.pue;
        if (sortBy === "pue_desc") return b.pue - a.pue;
        if (sortBy === "asns_desc") return (b.connectedNetworksCount || 0) - (a.connectedNetworksCount || 0);
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [
    dataCenters,
    searchQuery,
    selectedCountry,
    selectedOperator,
    selectedCategory,
    selectedScale,
    sortBy,
  ]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredDataCenters.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDataCenters.slice(start, start + pageSize);
  }, [filteredDataCenters, currentPage, pageSize]);

  if (!isDcFleetOpen) return null;

  // Actions
  const handleFlyTo = (dc: DataCenter) => {
    setSelectedDataCenter(dc);
    flyToStation(dc);
    setDcFleetOpen(false);
  };

  const handleExportCsv = () => {
    const headers = [
      "Facility Name",
      "Operator",
      "Category",
      "Country",
      "Region",
      "Latitude",
      "Longitude",
      "IT Power Capacity (MW)",
      "PUE Rating",
      "Cooling Architecture",
      "Redundancy Tier",
      "Carrier ASNs",
      "IXP Interconnects",
      "PeeringDB ID",
    ];

    const rows = filteredDataCenters.map((dc) => [
      `"${dc.name.replace(/"/g, '""')}"`,
      `"${dc.operator}"`,
      `"${dc.category}"`,
      `"${dc.countryName || dc.country}"`,
      `"${dc.region}"`,
      dc.latitude,
      dc.longitude,
      dc.estimatedPowerMw,
      dc.pue,
      `"${dc.coolingType}"`,
      `"${dc.tier}"`,
      dc.connectedNetworksCount || 0,
      dc.ixpCount || 0,
      dc.peeringDbId || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `datacenter_fleet_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md transition-all animate-in fade-in duration-150 font-sans">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded border border-[#293742] bg-[#101418] shadow-2xl text-[#f5f8fa] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#293742] px-5 py-3 bg-[#182026]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#202b33] text-[#2b95d6] border border-[#293742]">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f8fa]">
                  Foundry // Object Explorer : DataCenter Fleet
                </span>
                <span className="rounded bg-[#202b33] px-2 py-0.5 text-[9px] font-mono font-semibold text-[#15b371] border border-[#293742]">
                  {fleetTotals.count.toLocaleString()} OBJECTS
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#8a9ba8]">
                Verified IT load, operational PUE metrics, and carrier interconnections across 80+ jurisdictions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded border border-[#293742] bg-[#202b33] px-3 py-1 text-xs font-mono text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
              title="Export filtered data center directory to CSV"
            >
              <Download className="h-3 w-3 text-[#2b95d6]" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={() => setDcFleetOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Hero KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 px-5 py-2.5 bg-[#101418] border-b border-[#293742]">
          {/* 1. Total IT Power Capacity */}
          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Total IT Power Load</span>
              <Zap className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[#f5f8fa]">
              {fleetTotals.totalPowerGw} <span className="text-xs font-normal text-[#8a9ba8]">GW</span>
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">Sum of IT Demand</div>
          </div>

          {/* 2. Hyperscale Facilities */}
          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Hyperscale Campuses</span>
              <Building className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[#f5f8fa]">
              {fleetTotals.hyperscaleCount.toLocaleString()}
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">AWS, Azure, GCP, Meta</div>
          </div>

          {/* 3. Colocation & Enterprise Facilities */}
          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Colocation & Retail</span>
              <Layers className="h-3 w-3 text-[#15b371]" />
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[#15b371]">
              {fleetTotals.colocationCount.toLocaleString()}
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">Equinix, Digital Realty</div>
          </div>

          {/* 4. Average PUE Efficiency */}
          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Fleet Average PUE</span>
              <Gauge className="h-3 w-3 text-[#15b371]" />
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[#15b371]">
              {fleetTotals.avgPue}
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">Efficiency Benchmark</div>
          </div>

          {/* 5. Verified Carrier ASNs */}
          <div className="rounded border border-[#293742] bg-[#182026] p-2.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a9ba8] tracking-wider">
              <span>Interconnects</span>
              <Network className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[#2b95d6]">
              {fleetTotals.totalAsns.toLocaleString()}
            </div>
            <div className="text-[9px] font-mono text-[#5c7080] mt-0.5">Carrier ASNs Linked</div>
          </div>
        </div>

        {/* View Switcher & Navigation Tabs */}
        <div className="flex items-center justify-between px-5 pt-2 pb-2 border-b border-[#293742] bg-[#101418]">
          <div className="flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs transition-colors rounded ${
                activeTab === "grid"
                  ? "bg-[#202b33] text-[#2b95d6] border border-[#293742] font-semibold"
                  : "text-[#8a9ba8] hover:text-[#f5f8fa]"
              }`}
            >
              <Server className="h-3 w-3" />
              <span>ALL FACILITIES ({filteredDataCenters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("operators")}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs transition-colors rounded ${
                activeTab === "operators"
                  ? "bg-[#202b33] text-[#2b95d6] border border-[#293742] font-semibold"
                  : "text-[#8a9ba8] hover:text-[#f5f8fa]"
              }`}
            >
              <Building className="h-3 w-3" />
              <span>OPERATOR FLEETS</span>
            </button>
            <button
              onClick={() => setActiveTab("countries")}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs transition-colors rounded ${
                activeTab === "countries"
                  ? "bg-[#202b33] text-[#2b95d6] border border-[#293742] font-semibold"
                  : "text-[#8a9ba8] hover:text-[#f5f8fa]"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>COUNTRY RANKINGS</span>
            </button>
          </div>

          <div className="text-[11px] text-[#8a9ba8] font-mono">
            Showing {paginatedData.length} of {filteredDataCenters.length.toLocaleString()} facilities
          </div>
        </div>

        {/* Multi-Dimensional Filter Controls Bar */}
        {activeTab === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 px-5 py-2 bg-[#182026] border-b border-[#293742] text-xs font-mono">
            {/* 1. Instant Text Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search facility, city, operator..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-[#293742] bg-[#101418] pl-7 pr-2.5 py-1 text-xs text-[#f5f8fa] placeholder-[#5c7080] outline-none focus:border-[#2b95d6] shadow-inner font-mono"
              />
              <Search className="pointer-events-none absolute left-2 top-2 h-3 w-3 text-[#5c7080]" />
            </div>

            {/* 2. Country / Jurisdiction */}
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-[#293742] bg-[#101418] px-2 py-1 text-xs text-[#f5f8fa] outline-none focus:border-[#2b95d6] appearance-none cursor-pointer font-mono"
              >
                <option value="ALL">All Jurisdictions ({countryList.length})</option>
                {countryList.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Cloud / Colocation Operator */}
            <div>
              <select
                value={selectedOperator}
                onChange={(e) => {
                  setSelectedOperator(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-[#293742] bg-[#101418] px-2 py-1 text-xs text-[#f5f8fa] outline-none focus:border-[#2b95d6] appearance-none cursor-pointer font-mono"
              >
                <option value="ALL">All Operators ({operatorList.length})</option>
                {operatorList.map((op) => (
                  <option key={op.operator} value={op.operator}>
                    {op.operator} ({op.count})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Capacity Scale */}
            <div>
              <select
                value={selectedScale}
                onChange={(e) => {
                  setSelectedScale(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-[#293742] bg-[#101418] px-2 py-1 text-xs text-[#f5f8fa] outline-none focus:border-[#2b95d6] appearance-none cursor-pointer font-mono"
              >
                <option value="ALL">All Power Scales</option>
                <option value="mega">Megacampus (&gt; 200 MW)</option>
                <option value="hyper">Hyperscale (50–200 MW)</option>
                <option value="mid">Mid-Tier (15–50 MW)</option>
                <option value="edge">Edge (&lt; 15 MW)</option>
              </select>
            </div>

            {/* 5. Sorting Order */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded border border-[#293742] bg-[#101418] px-2 py-1 text-xs text-[#2b95d6] outline-none focus:border-[#2b95d6] appearance-none cursor-pointer font-mono font-semibold"
              >
                <option value="power_desc">Sort: IT Power (Desc)</option>
                <option value="power_asc">Sort: IT Power (Asc)</option>
                <option value="pue_asc">Sort: PUE (Most Efficient)</option>
                <option value="pue_desc">Sort: PUE (Least Efficient)</option>
                <option value="asns_desc">Sort: Carrier ASNs (Desc)</option>
                <option value="name_asc">Sort: Facility Name (A-Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Area: TAB 1 (Facilities Directory Data Grid) */}
        {activeTab === "grid" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="overflow-x-auto rounded border border-[#293742] bg-[#101418]">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#293742] bg-[#182026] text-[10px] uppercase font-semibold text-[#8a9ba8] tracking-wider">
                    <th className="py-2.5 px-3">Facility & Location</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3 font-mono text-right text-[#2b95d6]">IT Power</th>
                    <th className="py-2.5 px-3 font-mono text-center text-[#15b371]">PUE</th>
                    <th className="py-2.5 px-3">Cooling</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3 font-mono text-center">Interconnects</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202b33]">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#5c7080]">
                        <Server className="mx-auto h-6 w-6 text-[#394b59] mb-2" />
                        No facilities match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((dc) => {
                      const opMeta = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;

                      return (
                        <tr
                          key={dc.id}
                          className="hover:bg-[#202b33]/40 transition-colors"
                        >
                          {/* Facility Name & Location */}
                          <td className="py-2 px-3">
                            <div className="font-semibold text-[#f5f8fa] text-xs flex items-center gap-1.5 font-sans">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: opMeta.hex }}
                              />
                              <span className="truncate max-w-[240px]">{dc.name}</span>
                            </div>
                            <div className="mt-0.5 text-[10px] text-[#8a9ba8] font-mono flex items-center gap-1.5">
                              <span className="text-[#f5f8fa]">{dc.countryName || dc.country}</span>
                              <span>•</span>
                              <span className="text-[#2b95d6]">{dc.region}</span>
                              {dc.city && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{dc.city}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Operator & Category */}
                          <td className="py-2 px-3">
                            <span
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-semibold"
                              style={{
                                backgroundColor: `rgba(${opMeta.rgb.join(",")}, 0.15)`,
                                color: opMeta.hex,
                                border: `1px solid rgba(${opMeta.rgb.join(",")}, 0.3)`,
                              }}
                            >
                              {dc.operator.replace(" (AWS)", "").replace(" (GCP)", "").replace(" (OCI)", "")}
                            </span>
                            <div className="mt-0.5 text-[9px] text-[#8a9ba8] font-mono">
                              <span className="capitalize">{dc.category}</span>
                            </div>
                          </td>

                          {/* IT Power Capacity */}
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#f5f8fa]">
                            {dc.estimatedPowerMw} <span className="text-[10px] font-normal text-[#8a9ba8]">MW</span>
                          </td>

                          {/* PUE */}
                          <td className="py-2 px-3 text-center font-mono font-bold text-[#15b371]">
                            {dc.pue}
                          </td>

                          {/* Cooling Architecture */}
                          <td className="py-2 px-3 text-[#8a9ba8] text-[11px]">
                            {dc.coolingType || "—"}
                          </td>

                          {/* Redundancy Tier */}
                          <td className="py-2 px-3 font-mono text-[#8a9ba8] text-[11px]">
                            {dc.tier || "—"}
                          </td>

                          {/* Interconnects */}
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-[#2b95d6]">
                            {dc.connectedNetworksCount ? (
                              <span>{dc.connectedNetworksCount} ASNs</span>
                            ) : (
                              <span className="text-[#5c7080]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 font-mono">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Google Maps Satellite View"
                                className="p-1 rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <button
                                onClick={() => handleFlyTo(dc)}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#137cbd] hover:bg-[#2b95d6] text-white transition-colors"
                                title="Locate in Foundry Canvas"
                              >
                                LOCATE
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#293742] pt-2 text-xs font-mono">
                <div className="text-[#8a9ba8] text-[10px]">
                  PAGE {currentPage} OF {totalPages} ({filteredDataCenters.length.toLocaleString()} OBJECTS)
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded border border-[#293742] bg-[#182026] px-2.5 py-1 text-[11px] text-[#8a9ba8] hover:text-[#f5f8fa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span>PREV</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-mono transition-colors ${
                            currentPage === pageNum
                              ? "bg-[#202b33] text-[#2b95d6] border border-[#293742] font-semibold"
                              : "text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#182026]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-[#5c7080] px-1">...</span>}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded border border-[#293742] bg-[#182026] px-2.5 py-1 text-[11px] text-[#8a9ba8] hover:text-[#f5f8fa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Area: TAB 2 (Operator Fleet Capacity Breakdown) */}
        {activeTab === "operators" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {operatorList.map((op) => {
                const opDcs = dataCenters.filter((d) => d.operator === op.operator);
                const totalLoad = opDcs.reduce((sum, d) => sum + d.estimatedPowerMw, 0);
                const avgPue = opDcs.length > 0
                  ? (opDcs.reduce((sum, d) => sum + d.pue, 0) / opDcs.length).toFixed(2)
                  : "1.20";
                const opMeta = OPERATOR_COLORS[op.operator] || OPERATOR_COLORS.Other;

                return (
                  <div
                    key={op.operator}
                    className="rounded border border-[#293742] bg-[#182026] p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#293742] pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: opMeta.hex }}
                        />
                        <h3 className="font-semibold text-xs text-[#f5f8fa] truncate max-w-[180px] font-sans">
                          {op.operator}
                        </h3>
                      </div>
                      <span className="font-mono text-[9px] text-[#2b95d6] bg-[#202b33] px-1.5 py-0.5 rounded border border-[#293742]">
                        {op.count} OBJECTS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded bg-[#101418] p-2 border border-[#293742]">
                        <div className="text-xs font-bold text-[#f5f8fa]">
                          {(totalLoad / 1000).toFixed(1)} GW
                        </div>
                        <div className="text-[9px] uppercase text-[#8a9ba8] mt-0.5">Total IT Load</div>
                      </div>
                      <div className="rounded bg-[#101418] p-2 border border-[#293742]">
                        <div className="text-xs font-bold text-[#15b371]">
                          {avgPue} PUE
                        </div>
                        <div className="text-[9px] uppercase text-[#8a9ba8] mt-0.5">Avg Efficiency</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOperator(op.operator);
                        setActiveTab("grid");
                        setCurrentPage(1);
                      }}
                      className="w-full text-center text-[10px] font-mono text-[#2b95d6] hover:text-[#f5f8fa] py-1 rounded bg-[#202b33] border border-[#293742] hover:bg-[#293742] transition-colors"
                    >
                      FILTER {op.count} OBJECTS →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area: TAB 3 (Country & Regional Rankings) */}
        {activeTab === "countries" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {countryList.map((c) => {
                const cDcs = dataCenters.filter((d) => (d.countryName || d.country) === c.name);
                const totalLoad = cDcs.reduce((sum, d) => sum + d.estimatedPowerMw, 0);
                const avgPue = cDcs.length > 0
                  ? (cDcs.reduce((sum, d) => sum + d.pue, 0) / cDcs.length).toFixed(2)
                  : "1.22";

                return (
                  <div
                    key={c.name}
                    className="rounded border border-[#293742] bg-[#182026] p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#293742] pb-2">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-[#2b95d6]" />
                        <h3 className="font-semibold text-xs text-[#f5f8fa] truncate max-w-[180px] font-sans">
                          {c.name}
                        </h3>
                      </div>
                      <span className="font-mono text-[9px] text-[#2b95d6] bg-[#202b33] px-1.5 py-0.5 rounded border border-[#293742]">
                        {c.count} OBJECTS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded bg-[#101418] p-2 border border-[#293742]">
                        <div className="text-xs font-bold text-[#f5f8fa]">
                          {(totalLoad / 1000).toFixed(1)} GW
                        </div>
                        <div className="text-[9px] uppercase text-[#8a9ba8] mt-0.5">Total IT Load</div>
                      </div>
                      <div className="rounded bg-[#101418] p-2 border border-[#293742]">
                        <div className="text-xs font-bold text-[#15b371]">
                          {avgPue} PUE
                        </div>
                        <div className="text-[9px] uppercase text-[#8a9ba8] mt-0.5">Avg Efficiency</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCountry(c.name);
                        setActiveTab("grid");
                        setCurrentPage(1);
                      }}
                      className="w-full text-center text-[10px] font-mono text-[#2b95d6] hover:text-[#f5f8fa] py-1 rounded bg-[#202b33] border border-[#293742] hover:bg-[#293742] transition-colors"
                    >
                      FILTER {c.name} OBJECTS →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
