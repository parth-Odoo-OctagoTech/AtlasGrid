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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-xl transition-all animate-in fade-in duration-150">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded-3xl glass-panel-elevated shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-150 border border-white/15">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-glow-sm">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-white">
                  Global Data Center Fleet Directory
                </h2>
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300 border border-purple-500/40 shadow-sm">
                  {fleetTotals.count.toLocaleString()} FACILITIES MONITORED
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                Verified IT power capacity, efficiency ratings, and interconnection analytics across 80+ nations
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:border-purple-500/40 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Export filtered data center directory to CSV"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setDcFleetOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hero KPI Summary Bento Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 px-6 py-3.5 bg-slate-950/40 border-b border-white/10">
          {/* 1. Total IT Power Capacity */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-sm">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
              <span>Total IT Power Load</span>
              <Zap className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-purple-300">
              {fleetTotals.totalPowerGw} <span className="text-xs font-normal text-gray-400">GW</span>
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">Sum of IT Demand</div>
          </div>

          {/* 2. Hyperscale Facilities */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-sm">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
              <span>Hyperscale Campuses</span>
              <Building className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-cyan-300">
              {fleetTotals.hyperscaleCount.toLocaleString()}
            </div>
            <div className="text-[9px] text-cyan-300/80 mt-0.5">AWS, Azure, GCP, Meta</div>
          </div>

          {/* 3. Colocation & Enterprise Facilities */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-sm">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
              <span>Colocation & Retail</span>
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
              {fleetTotals.colocationCount.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/80 mt-0.5">Equinix, Digital Realty</div>
          </div>

          {/* 4. Average PUE Efficiency */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-sm">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
              <span>Fleet Average PUE</span>
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
              {fleetTotals.avgPue}
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">Efficiency Benchmark</div>
          </div>

          {/* 5. Verified Carrier ASNs */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-sm">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
              <span>PeeringDB Interconnects</span>
              <Network className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-indigo-300">
              {fleetTotals.totalAsns.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">Carrier ASNs Linked</div>
          </div>
        </div>

        {/* View Switcher & Navigation Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-white/10 bg-slate-950/30">
          <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === "grid"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>All Facilities Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("operators")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === "operators"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Operator Fleet Capacity</span>
            </button>
            <button
              onClick={() => setActiveTab("countries")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === "countries"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Country & Regional Rankings</span>
            </button>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Showing {paginatedData.length} of {filteredDataCenters.length.toLocaleString()} facilities
          </div>
        </div>

        {/* Multi-Dimensional Filter Controls Bar */}
        {activeTab === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 px-6 py-3 bg-slate-900/50 border-b border-white/10 text-xs">
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
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-400/60 shadow-inner"
              />
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>

            {/* 2. Country / Jurisdiction */}
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-400/60 appearance-none cursor-pointer"
              >
                <option value="ALL">🌍 All Countries ({countryList.length})</option>
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
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-400/60 appearance-none cursor-pointer"
              >
                <option value="ALL">🏢 All Operators ({operatorList.length})</option>
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
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-400/60 appearance-none cursor-pointer"
              >
                <option value="ALL">⚡ All Power Scales</option>
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
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-400/60 appearance-none cursor-pointer font-medium text-purple-300"
              >
                <option value="power_desc">Sort: IT Power (Highest First)</option>
                <option value="power_asc">Sort: IT Power (Lowest First)</option>
                <option value="pue_asc">Sort: PUE Rating (Most Efficient)</option>
                <option value="pue_desc">Sort: PUE Rating (Least Efficient)</option>
                <option value="asns_desc">Sort: Carrier ASNs (Most Connected)</option>
                <option value="name_asc">Sort: Facility Name (A to Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Area: TAB 1 (Facilities Directory Data Grid) */}
        {activeTab === "grid" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                    <th className="py-3 px-4">Facility & Location</th>
                    <th className="py-3 px-3">Operator & Classification</th>
                    <th className="py-3 px-3 font-mono text-right text-purple-300">IT Power Capacity</th>
                    <th className="py-3 px-3 font-mono text-center text-emerald-300">PUE</th>
                    <th className="py-3 px-3">Cooling Architecture</th>
                    <th className="py-3 px-3">Redundancy Tier</th>
                    <th className="py-3 px-3 font-mono text-center">Interconnects</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <Server className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                        No data centers match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((dc) => {
                      const opMeta = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;

                      return (
                        <tr
                          key={dc.id}
                          className="hover:bg-slate-900/60 transition-colors group"
                        >
                          {/* Facility Name & Location */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: opMeta.hex }}
                              />
                              <span className="truncate max-w-[240px]">{dc.name}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-gray-400 flex items-center gap-1.5">
                              <span className="text-gray-300">{dc.countryName || dc.country}</span>
                              <span>•</span>
                              <span className="font-mono text-purple-400">{dc.region}</span>
                              {dc.city && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{dc.city}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Operator & Category */}
                          <td className="py-3 px-3">
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: `rgba(${opMeta.rgb.join(",")}, 0.2)`,
                                color: opMeta.hex,
                                border: `1px solid rgba(${opMeta.rgb.join(",")}, 0.4)`,
                              }}
                            >
                              {dc.operator.replace(" (AWS)", "").replace(" (GCP)", "").replace(" (OCI)", "")}
                            </span>
                            <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                              <span className="capitalize">{dc.category} Facility</span>
                            </div>
                          </td>

                          {/* IT Power Capacity */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-purple-300 text-sm">
                            {dc.estimatedPowerMw} <span className="text-[10px] font-normal text-gray-400">MW</span>
                          </td>

                          {/* PUE */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-300">
                            {dc.pue}
                          </td>

                          {/* Cooling Architecture */}
                          <td className="py-3 px-3 text-gray-300 text-[11px]">
                            {dc.coolingType}
                          </td>

                          {/* Redundancy Tier */}
                          <td className="py-3 px-3 font-mono text-gray-300 text-[11px]">
                            {dc.tier}
                          </td>

                          {/* Interconnects */}
                          <td className="py-3 px-3 text-center font-mono text-[11px] text-indigo-300">
                            {dc.connectedNetworksCount ? (
                              <span>{dc.connectedNetworksCount} ASNs</span>
                            ) : (
                              <span className="text-gray-500">Standard</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Google Maps Satellite View"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <button
                                onClick={() => handleFlyTo(dc)}
                                className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                title="Fly camera to this data center on the 3D map"
                              >
                                <span>Fly</span>
                                <Compass className="h-3 w-3" />
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
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                <div className="text-gray-400 font-mono text-[11px]">
                  Page {currentPage} of {totalPages} ({filteredDataCenters.length.toLocaleString()} total facilities)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </button>

                  {/* Quick page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs transition-all ${
                            currentPage === pageNum
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                              : "text-gray-400 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-gray-500">...</span>}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Area: TAB 2 (Operator Fleet Capacity Breakdown) */}
        {activeTab === "operators" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shadow-sm"
                          style={{ backgroundColor: opMeta.hex }}
                        />
                        <h3 className="font-bold text-xs text-white truncate max-w-[180px]">
                          {op.operator}
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                        {op.count} Facilities
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-center">
                      <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/5">
                        <div className="text-sm font-bold text-purple-300">
                          {(totalLoad / 1000).toFixed(1)} GW
                        </div>
                        <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Total IT Load</div>
                      </div>
                      <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/5">
                        <div className="text-sm font-bold text-emerald-400">
                          {avgPue} PUE
                        </div>
                        <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Avg Efficiency</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOperator(op.operator);
                        setActiveTab("grid");
                        setCurrentPage(1);
                      }}
                      className="w-full text-center text-[10px] font-semibold text-purple-300 hover:text-white py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 transition-colors"
                    >
                      View All {op.count} Facilities →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area: TAB 3 (Country & Regional Rankings) */}
        {activeTab === "countries" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countryList.map((c) => {
                const cDcs = dataCenters.filter((d) => (d.countryName || d.country) === c.name);
                const totalLoad = cDcs.reduce((sum, d) => sum + d.estimatedPowerMw, 0);
                const avgPue = cDcs.length > 0
                  ? (cDcs.reduce((sum, d) => sum + d.pue, 0) / cDcs.length).toFixed(2)
                  : "1.22";

                return (
                  <div
                    key={c.name}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        <h3 className="font-bold text-xs text-white truncate max-w-[180px]">
                          {c.name}
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {c.count} Facilities
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-center">
                      <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/5">
                        <div className="text-sm font-bold text-purple-300">
                          {(totalLoad / 1000).toFixed(1)} GW
                        </div>
                        <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Total IT Power</div>
                      </div>
                      <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/5">
                        <div className="text-sm font-bold text-emerald-400">
                          {avgPue} PUE
                        </div>
                        <div className="text-[9px] uppercase text-gray-400 font-sans mt-0.5">Avg Efficiency</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCountry(c.name);
                        setActiveTab("grid");
                        setCurrentPage(1);
                      }}
                      className="w-full text-center text-[10px] font-semibold text-cyan-300 hover:text-white py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 transition-colors"
                    >
                      Filter {c.name} Data Centers →
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
