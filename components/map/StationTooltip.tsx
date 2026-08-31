"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG } from "@/lib/types/power-plant";
import { OPERATOR_COLORS } from "@/lib/types/data-center";
import { Zap, ArrowUpRight, Server, Sparkles } from "lucide-react";

export function StationTooltip() {
  const hoveredStation = useGridStore((s) => s.hoveredStation);
  const hoveredDataCenter = useGridStore((s) => s.hoveredDataCenter);
  const hoverCoordinates = useGridStore((s) => s.hoverCoordinates);

  if ((!hoveredStation && !hoveredDataCenter) || !hoverCoordinates) return null;

  if (hoveredDataCenter) {
    const opMeta = OPERATOR_COLORS[hoveredDataCenter.operator] || OPERATOR_COLORS.Other;
    return (
      <div
        className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out"
        style={{
          left: `${hoverCoordinates.x}px`,
          top: `${hoverCoordinates.y}px`,
        }}
      >
        <div className="w-80 rounded-2xl glass-panel-elevated p-3.5 shadow-2xl transition-all text-white border border-purple-500/30">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
            <div className="min-w-0">
              <h4 className="truncate text-xs font-bold text-white flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{hoveredDataCenter.name}</span>
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                <span className="text-gray-300 font-medium">{hoveredDataCenter.countryName || hoveredDataCenter.country}</span>
                <span>•</span>
                <span className="font-mono text-purple-400">{hoveredDataCenter.region}</span>
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: `rgba(${opMeta.rgb.join(",")}, 0.2)`,
                color: opMeta.hex,
                border: `1px solid rgba(${opMeta.rgb.join(",")}, 0.4)`,
              }}
            >
              {hoveredDataCenter.operator}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 text-xs">
            <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                IT Power Load
              </div>
              <div className="flex items-baseline gap-1 font-mono font-bold text-purple-300 mt-0.5">
                <span>{hoveredDataCenter.estimatedPowerMw} MW</span>
                <span className="text-[9px] font-normal text-gray-400">
                  demand
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                Efficiency Rating
              </div>
              <div className="flex items-baseline gap-1 font-mono font-bold text-emerald-400 mt-0.5">
                <span>{hoveredDataCenter.pue}</span>
                <span className="text-[9px] font-normal text-gray-400">PUE</span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between px-0.5">
            <span className="truncate max-w-[150px]">{hoveredDataCenter.coolingType}</span>
            <span className="font-mono text-purple-300 font-medium">{hoveredDataCenter.tier}</span>
          </div>

          {/* Quick Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-gray-400">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${hoveredDataCenter.latitude},${hoveredDataCenter.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-purple-400 hover:text-purple-300 underline pointer-events-auto flex items-center gap-0.5"
              title="Open exact coordinates in Google Maps"
            >
              <span>{hoveredDataCenter.latitude.toFixed(3)}°, {hoveredDataCenter.longitude.toFixed(3)}°</span>
            </a>
            <span className="shrink-0 text-purple-300 font-medium flex items-center gap-0.5">
              Inspect details <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!hoveredStation) return null;

  const fuel = FUEL_CONFIG[hoveredStation.fuelType] || FUEL_CONFIG.other;
  const isSpike = hoveredStation.spotPriceMwh >= 150;
  const isNegative = hoveredStation.spotPriceMwh < 0;

  return (
    <div
      className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out"
      style={{
        left: `${hoverCoordinates.x}px`,
        top: `${hoverCoordinates.y}px`,
      }}
    >
      <div className="w-80 rounded-2xl glass-panel-elevated p-3.5 shadow-2xl transition-all text-white border border-cyan-500/30">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{hoveredStation.name}</span>
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
              <span className="text-gray-300 font-medium">{hoveredStation.countryName}</span>
              <span>•</span>
              <span className="font-mono text-cyan-400">{hoveredStation.gridRegion}</span>
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: `rgba(${fuel.rgb.join(",")}, 0.2)`,
              color: fuel.hex,
              border: `1px solid rgba(${fuel.rgb.join(",")}, 0.4)`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: fuel.hex }}
            />
            {fuel.label}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 text-xs">
          <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Live Generation
            </div>
            <div className="flex items-baseline gap-1 font-mono font-bold text-white mt-0.5">
              <span>{hoveredStation.currentOutputMw.toLocaleString()}</span>
              <span className="text-[9px] font-normal text-gray-400">
                / {hoveredStation.capacityMw.toLocaleString()} MW
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Spot LMP Price
            </div>
            <div
              className={`flex items-baseline gap-0.5 font-mono font-bold mt-0.5 ${
                isSpike
                  ? "text-red-400 animate-pulse"
                  : isNegative
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              <span>${hoveredStation.spotPriceMwh.toFixed(1)}</span>
              <span className="text-[9px] font-normal text-gray-400">/MWh</span>
            </div>
          </div>
        </div>

        {/* Capacity Factor Bar */}
        <div className="mt-2.5 px-0.5">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Capacity Factor</span>
            <span className="font-mono text-white font-semibold">
              {(hoveredStation.capacityFactor * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, hoveredStation.capacityFactor * 100)}%`,
                backgroundColor: fuel.hex,
              }}
            />
          </div>
        </div>

        {/* Quick Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-gray-400">
          <span className="truncate max-w-[130px]">Op: {hoveredStation.operator}</span>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${hoveredStation.latitude},${hoveredStation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-cyan-400 hover:text-cyan-300 underline pointer-events-auto flex items-center gap-0.5"
              title="Open exact coordinates in Google Maps"
            >
              <span>{hoveredStation.latitude.toFixed(2)}°, {hoveredStation.longitude.toFixed(2)}°</span>
            </a>
            <span className="shrink-0 text-cyan-300 font-medium flex items-center gap-0.5">
              Inspect details <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
