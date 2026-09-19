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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 backdrop-blur-md transition-all animate-in fade-in duration-150 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
        className="w-full max-w-2xl rounded border border-[#293742] bg-[#101418] overflow-hidden text-[#f5f8fa] shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-[#293742] px-4 py-2.5 bg-[#182026]">
          <Search className="h-4 w-4 text-[#2b95d6] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Omnisearch: Search 5,200+ power stations & 4,382 AI data centers..."
            className="w-full bg-transparent text-xs text-[#f5f8fa] placeholder-[#5c7080] outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[#8a9ba8] hover:text-[#f5f8fa] p-1 rounded hover:bg-[#202b33]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <kbd className="rounded bg-[#202b33] px-1.5 py-0.5 text-[9px] font-mono text-[#8a9ba8] border border-[#293742]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto p-1.5 space-y-1 font-mono"
        >
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#5c7080]">
              No ontology objects found for &ldquo;{query}&rdquo;
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
                    className={`flex w-full items-center justify-between gap-3 rounded p-2 text-left transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-[#202b33] border-[#2b95d6]/60 text-[#f5f8fa]"
                        : "hover:bg-[#182026] border-transparent text-[#8a9ba8]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: fuel.hex }}
                        />
                        <h4 className={`truncate text-xs font-semibold ${isSelected ? "text-[#f5f8fa]" : "text-[#d8e1e8]"}`}>
                          {plant.name}
                        </h4>
                        <span className="rounded border border-[#2b95d6]/40 bg-[#2b95d6]/10 px-1 py-0.2 text-[8px] font-mono text-[#2b95d6] font-semibold">
                          PLANT
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#8a9ba8]">
                        <span className="text-[#f5f8fa]">{plant.countryName}</span>
                        <span>•</span>
                        <span className="text-[#2b95d6]">{plant.gridRegion}</span>
                        <span>•</span>
                        <span className="truncate">Op: {plant.operator}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-[#f5f8fa]">
                          {plant.capacityMw.toLocaleString()} MW
                        </div>
                        <div className="font-mono text-[9px] text-[#d9822b]">
                          ${plant.spotPriceMwh.toFixed(1)}/MWh
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${plant.latitude},${plant.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in Google Maps"
                        className="p-1 rounded border border-[#293742] bg-[#182026] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#202b33] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <ArrowRight className={`h-3.5 w-3.5 transition-transform ${isSelected ? "text-[#2b95d6] translate-x-0.5" : "text-[#5c7080]"}`} />
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
                    className={`flex w-full items-center justify-between gap-3 rounded p-2 text-left transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-[#202b33] border-[#15b371]/60 text-[#f5f8fa]"
                        : "hover:bg-[#182026] border-transparent text-[#8a9ba8]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Server className="h-3 w-3 text-[#15b371] shrink-0" />
                        <h4 className={`truncate text-xs font-semibold ${isSelected ? "text-[#f5f8fa]" : "text-[#d8e1e8]"}`}>
                          {dc.name}
                        </h4>
                        <span className="rounded border border-[#15b371]/40 bg-[#15b371]/10 px-1 py-0.2 text-[8px] font-mono text-[#15b371] font-semibold">
                          DC
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#8a9ba8]">
                        <span className="text-[#f5f8fa]">{dc.countryName || dc.country}</span>
                        <span>•</span>
                        <span className="text-[#2b95d6]">{dc.region}</span>
                        <span>•</span>
                        <span style={{ color: opMeta.hex }}>{dc.operator}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-[#15b371]">
                          {dc.estimatedPowerMw} MW
                        </div>
                        <div className="font-mono text-[9px] text-[#8a9ba8]">
                          PUE {dc.pue}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in Google Maps"
                        className="p-1 rounded border border-[#293742] bg-[#182026] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#202b33] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <ArrowRight className={`h-3.5 w-3.5 transition-transform ${isSelected ? "text-[#15b371] translate-x-0.5" : "text-[#5c7080]"}`} />
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between border-t border-[#293742] bg-[#182026] px-4 py-1.5 text-[9px] font-mono text-[#8a9ba8]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[#202b33] px-1 py-0.2 text-[#f5f8fa] border border-[#293742]">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[#202b33] px-1 py-0.2 text-[#f5f8fa] border border-[#293742]">ENTER</kbd> inspect
            </span>
          </div>
          <span className="text-[#2b95d6]">
            {results.length} MATCHES
          </span>
        </div>
      </div>
    </div>
  );
}
