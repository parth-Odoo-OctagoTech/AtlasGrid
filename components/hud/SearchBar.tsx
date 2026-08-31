"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, PowerPlant } from "@/lib/types/power-plant";
import { DataCenter, OPERATOR_COLORS } from "@/lib/types/data-center";
import { Search, X, Zap, ArrowRight, Server, ExternalLink, Command, CornerDownLeft } from "lucide-react";

interface SearchBarProps {
  plants: PowerPlant[];
}

export function SearchBar({ plants }: SearchBarProps) {
  const isSearchOpen = useGridStore((s) => s.isSearchOpen);
  const setSearchOpen = useGridStore((s) => s.setSearchOpen);
  const setSelectedStation = useGridStore((s) => s.setSelectedStation);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);
  const dataCenters = useGridStore((s) => s.dataCenters);
  const flyToStation = useGridStore((s) => s.flyToStation);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  // Fast memoized fuzzy match across both plants and datacenters
  const results = useMemo(() => {
    if (!query || query.trim().length < 2) {
      return [
        ...plants.slice(0, 5).map((p) => ({ type: "plant" as const, data: p })),
        ...dataCenters.slice(0, 5).map((d) => ({ type: "datacenter" as const, data: d })),
      ];
    }

    const q = query.toLowerCase().trim();
    const matchedPlants = plants
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.operator.toLowerCase().includes(q) ||
          p.countryName.toLowerCase().includes(q) ||
          p.gridRegion.toLowerCase().includes(q) ||
          p.fuelType.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((p) => ({ type: "plant" as const, data: p }));

    const matchedDcs = dataCenters
      .filter(
        (dc) =>
          dc.name.toLowerCase().includes(q) ||
          dc.operator.toLowerCase().includes(q) ||
          dc.country.toLowerCase().includes(q) ||
          dc.region.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((dc) => ({ type: "datacenter" as const, data: dc }));

    return [...matchedPlants, ...matchedDcs].slice(0, 14);
  }, [plants, dataCenters, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = (item: { type: "plant"; data: PowerPlant } | { type: "datacenter"; data: DataCenter }) => {
    if (!item) return;
    if (item.type === "plant") {
      setSelectedStation(item.data);
      flyToStation(item.data);
    } else {
      setSelectedDataCenter(item.data);
      flyToStation(item.data);
    }
    setSearchOpen(false);
  };

  // Keyboard navigation inside search dialog
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div
      onClick={() => setSearchOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-20 backdrop-blur-xl transition-all animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
        className="w-full max-w-2xl rounded-2xl bg-surface-card overflow-hidden text-white shadow-2xl animate-in zoom-in-95 duration-150 border border-white/15"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 bg-slate-950/60">
          <Search className="h-4 w-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 5,200+ power stations & 4,382 AI data centers..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-400 outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-gray-400 border border-slate-700 shadow-inner">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[420px] overflow-y-auto p-2 space-y-1"
        >
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No matching power stations or data centers found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((res, index) => {
              const isSelected = index === selectedIndex;
              if (res.type === "plant") {
                const plant = res.data;
                const fuel = FUEL_CONFIG[plant.fuelType] || FUEL_CONFIG.other;
                return (
                  <div
                    key={plant.id}
                    onClick={() => handleSelect(res)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="button"
                    tabIndex={0}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/15 border border-cyan-500/40 shadow-glow-sm"
                        : "hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: fuel.hex }}
                        />
                        <h4 className={`truncate text-xs font-semibold ${isSelected ? "text-cyan-300" : "text-white"}`}>
                          {plant.name}
                        </h4>
                        <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-mono text-cyan-400 font-medium">
                          PLANT
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="text-gray-300">{plant.countryName}</span>
                        <span>•</span>
                        <span className="font-mono text-cyan-400">
                          {plant.gridRegion}
                        </span>
                        <span>•</span>
                        <span className="truncate">Op: {plant.operator}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-white">
                          {plant.capacityMw.toLocaleString()} MW
                        </div>
                        <div className="font-mono text-[10px] text-amber-400">
                          ${plant.spotPriceMwh.toFixed(1)}/MWh
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${plant.latitude},${plant.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open location in Google Maps"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <ArrowRight className={`h-4 w-4 transition-transform ${isSelected ? "text-cyan-400 translate-x-0.5" : "text-gray-600"}`} />
                    </div>
                  </div>
                );
              } else {
                const dc = res.data;
                const opMeta = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;
                return (
                  <div
                    key={dc.id}
                    onClick={() => handleSelect(res)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="button"
                    tabIndex={0}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-500/15 border border-purple-500/40 shadow-glow-sm"
                        : "hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <h4 className={`truncate text-xs font-semibold ${isSelected ? "text-purple-300" : "text-white"}`}>
                          {dc.name}
                        </h4>
                        <span className="rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.2 text-[9px] font-mono text-purple-300 font-medium">
                          DC
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="text-gray-300">{dc.countryName || dc.country}</span>
                        <span>•</span>
                        <span className="font-mono text-purple-400">
                          {dc.region}
                        </span>
                        <span>•</span>
                        <span
                          className="font-medium"
                          style={{ color: opMeta.hex }}
                        >
                          {dc.operator}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-purple-300">
                          {dc.estimatedPowerMw} MW
                        </div>
                        <div className="font-mono text-[10px] text-emerald-400">
                          PUE {dc.pue}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open location in Google Maps"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-gray-400 hover:text-purple-400 hover:border-purple-500/40 transition-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <ArrowRight className={`h-4 w-4 transition-transform ${isSelected ? "text-purple-400 translate-x-0.5" : "text-gray-600"}`} />
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/80 px-4 py-2 text-[10px] text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-gray-300">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-gray-300 flex items-center gap-0.5">
                <CornerDownLeft className="h-2.5 w-2.5" /> Enter
              </kbd> to fly to facility
            </span>
          </div>
          <span className="font-mono text-cyan-400">
            {results.length} results
          </span>
        </div>
      </div>
    </div>
  );
}
