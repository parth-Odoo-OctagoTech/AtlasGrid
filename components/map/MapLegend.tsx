"use client";

import { useState } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, FuelType } from "@/lib/types/power-plant";
import { ChevronDown, ChevronUp, Layers, Flame, Server, Zap } from "lucide-react";

export function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visualizationMode = useGridStore((s) => s.visualizationMode);
  const filters = useGridStore((s) => s.filters);
  const toggleFuelType = useGridStore((s) => s.toggleFuelType);

  const isLmpMode = visualizationMode === "heatmap_lmp";

  return (
    <div className="absolute bottom-4 left-4 z-20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="w-68 rounded-2xl glass-panel shadow-2xl text-white text-xs overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 font-medium text-gray-200 hover:text-white transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/30">
              <Layers className="h-3 w-3 text-cyan-400" />
            </div>
            <span className="text-[11px] font-bold tracking-wide uppercase">
              {isLmpMode ? "LMP Price Ramp" : "Fuels & Load Scale"}
            </span>
          </div>
          {isCollapsed ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>

        {!isCollapsed && (
          <div className="p-3 pt-2.5 space-y-3">
            {isLmpMode ? (
              /* LMP Heatmap Color Legend */
              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-gray-400">
                  <span>Negative / Surplus</span>
                  <span>Nominal</span>
                  <span className="text-red-400 font-semibold">Spike &gt;$150</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600 shadow-inner" />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-300">
                  <span>&lt; $0</span>
                  <span>$35 - $60</span>
                  <span className="text-red-400 font-bold">&gt; $150/MWh</span>
                </div>
              </div>
            ) : (
              /* Fuel Types Grid */
              <div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(FUEL_CONFIG) as FuelType[]).slice(0, 8).map((fuelKey) => {
                    const meta = FUEL_CONFIG[fuelKey];
                    const isSelected =
                      filters.fuelTypes.length === 0 ||
                      filters.fuelTypes.includes(fuelKey);

                    return (
                      <button
                        key={fuelKey}
                        onClick={() => toggleFuelType(fuelKey)}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-all ${
                          isSelected
                            ? "bg-slate-800/80 text-white border border-white/10 shadow-sm"
                            : "opacity-35 hover:opacity-75"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span className="truncate text-[11px] font-medium">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Capacity Scale Size Indicator */}
                <div className="mt-3 border-t border-white/10 pt-2">
                  <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Infrastructure & Load Scale
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-300">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-purple-400 border border-white/60 shadow-glow-sm" />
                      <span>Data Center</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span>1 GW Plant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-glow" />
                      <span>10+ GW</span>
                    </div>
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
