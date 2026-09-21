"use client";

import { useState } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, FuelType } from "@/lib/types/power-plant";
import { ChevronDown, ChevronUp, Layers, Flame, Server, Zap } from "lucide-react";

export function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visualizationMode = useGridStore((s) => s.visualizationMode);
  const layerVisibility = useGridStore((s) => s.layerVisibility);
  const filters = useGridStore((s) => s.filters);
  const toggleFuelType = useGridStore((s) => s.toggleFuelType);

  const isLmpMode = visualizationMode === "heatmap_lmp";
  const isSitingMode = visualizationMode === "siting_score";

  return (
    <div className="absolute bottom-4 left-4 z-20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-200 font-sans">
      <div className="w-72 rounded border border-[#293742] bg-[#182026]/95 backdrop-blur-md shadow-2xl text-[#f5f8fa] text-xs overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-between px-3 py-2 font-mono text-[10px] text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors border-b border-[#293742] bg-[#101418]"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-[#202b33] border border-[#293742]">
              <Layers className="h-2.5 w-2.5 text-[#2b95d6]" />
            </div>
            <span className="font-semibold uppercase tracking-wider">
              {isSitingMode
                ? "Legend // Siting Suitability (0-100)"
                : isLmpMode
                ? "Legend // LMP Ramp"
                : "Legend // Fuel Matrix"}
            </span>
          </div>
          {isCollapsed ? (
            <ChevronUp className="h-3 w-3 text-[#8a9ba8]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[#8a9ba8]" />
          )}
        </button>

        {!isCollapsed && (
          <div className="p-2.5 space-y-2.5 font-mono text-xs">
            {isSitingMode ? (
              /* Siting Suitability Score Legend */
              <div>
                <div className="mb-1 flex justify-between text-[9px] text-[#8a9ba8]">
                  <span className="text-[#ef4444] font-semibold">&lt;55 Unfavorable</span>
                  <span className="text-[#f59e0b]">55-69 Tier II</span>
                  <span className="text-[#06b6d4]">70-84 Tier III</span>
                  <span className="text-[#10b981] font-semibold">85+ Tier IV</span>
                </div>
                <div className="h-2 w-full rounded bg-gradient-to-r from-[#ef4444] via-[#f59e0b] via-[#06b6d4] to-[#10b981] shadow-inner" />
                <div className="mt-1 text-[9px] text-[#8a9ba8] text-center">
                  Weighted: Power (25%) • Fiber (20%) • Hazards (15%) • Climate (15%)
                </div>
              </div>
            ) : isLmpMode ? (
              /* LMP Heatmap Color Legend */
              <div>
                <div className="mb-1 flex justify-between text-[9px] text-[#8a9ba8]">
                  <span>Surplus &lt;$0</span>
                  <span>Nominal</span>
                  <span className="text-[#db3737] font-semibold">Spike &gt;$150</span>
                </div>
                <div className="h-1.5 w-full rounded bg-gradient-to-r from-[#15b371] via-[#d9822b] to-[#db3737] shadow-inner" />
                <div className="mt-1 flex justify-between text-[9px] text-[#8a9ba8]">
                  <span>-$50</span>
                  <span>$45</span>
                  <span className="text-[#db3737]">&gt;$150/MWh</span>
                </div>
              </div>
            ) : (
              /* Fuel Types Grid */
              <div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(FUEL_CONFIG) as FuelType[]).slice(0, 8).map((fuelKey) => {
                    const meta = FUEL_CONFIG[fuelKey];
                    const isSelected =
                      filters.fuelTypes.length === 0 ||
                      filters.fuelTypes.includes(fuelKey);

                    return (
                      <button
                        key={fuelKey}
                        onClick={() => toggleFuelType(fuelKey)}
                        className={`flex items-center gap-1.5 rounded px-2 py-1 text-left transition-colors ${
                          isSelected
                            ? "bg-[#101418] text-[#f5f8fa] border border-[#293742]"
                            : "opacity-35 hover:opacity-75 border border-transparent"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span className="truncate text-[10px]">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Capacity Scale Size Indicator */}
                <div className="mt-2.5 border-t border-[#293742] pt-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8] mb-1">
                    Symbol Diameter Scale
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#8a9ba8]">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#15b371]" />
                      <span>Data Center</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2b95d6]" />
                      <span>1 GW Plant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2b95d6]" />
                      <span>10+ GW</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {layerVisibility.floodOverlay && (
              <div className="border-t border-[#293742] pt-2 flex items-center justify-between text-[9px] text-[#06b6d4]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[#22d3ee] bg-[#06b6d4]/40 animate-pulse" />
                  <span>Flood Hazard (100-Yr Surge)</span>
                </div>
                <span className="font-bold font-mono">ACTIVE</span>
              </div>
            )}

            {layerVisibility.fiberConduits && (
              <div className="border-t border-[#293742] pt-1.5 flex items-center justify-between text-[9px] text-[#06b6d4]">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 bg-[#06b6d4]" />
                  <span>Dark Fiber Conduits</span>
                </div>
                <span className="font-mono text-[#8a9ba8]">Zayo/Lumen</span>
              </div>
            )}

            {layerVisibility.seismicFaults && (
              <div className="border-t border-[#293742] pt-1.5 flex items-center justify-between text-[9px] text-[#ef4444]">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 bg-[#ef4444]" />
                  <span>Quaternary Faults</span>
                </div>
                <span className="font-mono text-[#8a9ba8]">USGS/GEM</span>
              </div>
            )}

            {layerVisibility.flightCorridors && (
              <div className="border-t border-[#293742] pt-1.5 flex items-center justify-between text-[9px] text-[#f43f5e]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#f43f5e]/40 border border-[#f43f5e]" />
                  <span>Flight Obstacle Cones</span>
                </div>
                <span className="font-mono text-[#8a9ba8]">FAA Part 77</span>
              </div>
            )}

            {layerVisibility.hazardBuffers && (
              <div className="border-t border-[#293742] pt-1.5 flex items-center justify-between text-[9px] text-[#e11d48]">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 bg-[#e11d48]" />
                  <span>Gas & Rail Blast Zones</span>
                </div>
                <span className="font-mono text-[#8a9ba8]">EIA/DOT</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
