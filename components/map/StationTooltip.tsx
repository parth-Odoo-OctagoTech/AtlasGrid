"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, getSubstationColor } from "@/lib/types/power-plant";
import { OPERATOR_COLORS } from "@/lib/types/data-center";
import { Zap, ArrowUpRight, Server, Sparkles, Activity, Waves } from "lucide-react";

export function StationTooltip() {
  const hoveredStation = useGridStore((s) => s.hoveredStation);
  const hoveredDataCenter = useGridStore((s) => s.hoveredDataCenter);
  const hoveredSubstation = useGridStore((s) => s.hoveredSubstation);
  const hoveredFloodZone = useGridStore((s) => s.hoveredFloodZone);
  const hoverCoordinates = useGridStore((s) => s.hoverCoordinates);

  if ((!hoveredStation && !hoveredDataCenter && !hoveredSubstation && !hoveredFloodZone) || !hoverCoordinates) return null;

  if (hoveredFloodZone) {
    return (
      <div
        className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out font-sans"
        style={{
          left: `${hoverCoordinates.x}px`,
          top: `${hoverCoordinates.y}px`,
        }}
      >
        <div className="w-72 rounded border border-[#06b6d4]/50 bg-[#101418]/95 p-2.5 text-[#f5f8fa] shadow-2xl backdrop-blur-md font-sans">
          <div className="flex items-center justify-between border-b border-[#293742] pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#06b6d4]">
              <Waves className="h-3.5 w-3.5 text-[#06b6d4]" />
              <span>FLOOD HAZARD ZONE</span>
            </div>
            <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/40">
              {hoveredFloodZone.riskLevel ? hoveredFloodZone.riskLevel.toUpperCase() : "HIGH"} RISK
            </span>
          </div>

          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="text-[11px] text-[#f5f8fa] font-semibold truncate">
              {hoveredFloodZone.name}
            </div>
            <div className="text-[10px] text-[#8a9ba8]">
              {hoveredFloodZone.hazardType}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono">
            <div className="rounded bg-[#182026] p-1.5 border border-[#293742]">
              <div className="text-[#8a9ba8]">Classification</div>
              <div className="text-[#f5f8fa] font-bold mt-0.5 truncate">{hoveredFloodZone.zoneCode}</div>
            </div>
            <div className="rounded bg-[#182026] p-1.5 border border-[#293742]">
              <div className="text-[#8a9ba8]">Elevation Above MSL</div>
              <div className="text-[#06b6d4] font-bold mt-0.5">{hoveredFloodZone.elevationMeters}m</div>
            </div>
          </div>

          <div className="mt-2 border-t border-[#293742] pt-1 text-[9px] font-mono text-[#5c7080]">
            Coastal Storm Surge & 100-Yr Inundation Buffer
          </div>
        </div>
      </div>
    );
  }

  if (hoveredDataCenter) {
    const opMeta = OPERATOR_COLORS[hoveredDataCenter.operator] || OPERATOR_COLORS.Other;
    return (
      <div
        className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out font-sans"
        style={{
          left: `${hoverCoordinates.x}px`,
          top: `${hoverCoordinates.y}px`,
        }}
      >
        <div className="w-72 rounded border border-[#293742] bg-[#182026]/95 p-2.5 text-[#f5f8fa] shadow-2xl backdrop-blur-md font-sans">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-[#293742] pb-1.5">
            <div className="min-w-0">
              <h4 className="truncate text-xs font-semibold text-[#f5f8fa] flex items-center gap-1.5 font-sans">
                <Server className="h-3 w-3 text-[#15b371] shrink-0" />
                <span className="truncate">{hoveredDataCenter.name}</span>
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8a9ba8] mt-0.5">
                <span className="text-[#f5f8fa] font-medium">{hoveredDataCenter.countryName || hoveredDataCenter.country}</span>
                <span>•</span>
                <span className="text-[#2b95d6]">{hoveredDataCenter.region}</span>
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold"
              style={{
                backgroundColor: `rgba(${opMeta.rgb.join(",")}, 0.15)`,
                color: opMeta.hex,
                border: `1px solid rgba(${opMeta.rgb.join(",")}, 0.3)`,
              }}
            >
              {hoveredDataCenter.operator.replace(" (AWS)", "").replace(" (GCP)", "").replace(" (OCI)", "")}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 text-xs font-mono">
            <div className="rounded bg-[#101418] p-1.5 border border-[#293742]">
              <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8]">
                IT Load
              </div>
              <div className="font-mono font-bold text-[#f5f8fa] mt-0.5">
                {hoveredDataCenter.estimatedPowerMw} MW
              </div>
            </div>

            <div className="rounded bg-[#101418] p-1.5 border border-[#293742]">
              <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8]">
                PUE
              </div>
              <div className="font-mono font-bold text-[#15b371] mt-0.5">
                {hoveredDataCenter.pue != null ? hoveredDataCenter.pue : "—"}
              </div>
            </div>
          </div>

          {(hoveredDataCenter.coolingType || hoveredDataCenter.tier) && (
            <div className="mt-1.5 text-[10px] font-mono text-[#8a9ba8] flex items-center justify-between px-0.5">
              <span className="truncate max-w-[150px]">{hoveredDataCenter.coolingType || "—"}</span>
              <span className="text-[#f5f8fa]">{hoveredDataCenter.tier || "—"}</span>
            </div>
          )}

          {/* Quick Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-[#293742] pt-1.5 text-[10px] font-mono text-[#8a9ba8]">
            <span>
              {hoveredDataCenter.latitude.toFixed(3)}°, {hoveredDataCenter.longitude.toFixed(3)}°
            </span>
            <span className="shrink-0 text-[#2b95d6] font-semibold flex items-center gap-0.5">
              INSPECT & LINKS <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (hoveredSubstation) {
    const voltColor = getSubstationColor(hoveredSubstation.voltageKv);
    return (
      <div
        className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out font-sans"
        style={{
          left: `${hoverCoordinates.x}px`,
          top: `${hoverCoordinates.y}px`,
        }}
      >
        <div className="w-72 rounded border border-[#293742] bg-[#182026]/95 p-2.5 text-[#f5f8fa] shadow-2xl backdrop-blur-md font-sans">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-[#293742] pb-1.5">
            <div className="min-w-0">
              <h4 className="truncate text-xs font-semibold text-[#f5f8fa] flex items-center gap-1.5 font-sans">
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: voltColor.hex }} />
                <span className="truncate">{hoveredSubstation.name}</span>
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8a9ba8] mt-0.5">
                <span className="text-[#f5f8fa] font-medium">{hoveredSubstation.countryName || hoveredSubstation.country}</span>
                <span>•</span>
                <span className="text-[#2b95d6]">{hoveredSubstation.gridRegion || hoveredSubstation.region}</span>
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold"
              style={{
                backgroundColor: `rgba(${voltColor.rgb.join(",")}, 0.15)`,
                color: voltColor.hex,
                border: `1px solid rgba(${voltColor.rgb.join(",")}, 0.35)`,
              }}
            >
              {hoveredSubstation.voltageKv} kV
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 text-xs font-mono">
            <div className="rounded bg-[#101418] p-1.5 border border-[#293742]">
              <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8]">
                Grid Role
              </div>
              <div className="font-mono font-bold capitalize text-[#f5f8fa] mt-0.5 truncate">
                {hoveredSubstation.type.replace("_", " ")}
              </div>
            </div>

            <div className="rounded bg-[#101418] p-1.5 border border-[#293742]">
              <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8]">
                Capacity
              </div>
              <div className="font-mono font-bold text-[#f5f8fa] mt-0.5" style={{ color: voltColor.hex }}>
                {hoveredSubstation.connectedCapacityMw} MW
              </div>
            </div>
          </div>

          <div className="mt-1.5 text-[10px] font-mono text-[#8a9ba8] flex items-center justify-between px-0.5">
            <span className="truncate max-w-[180px]">{hoveredSubstation.operator}</span>
            <span className="text-[#f5f8fa] font-semibold">{voltColor.label}</span>
          </div>

          {/* Quick Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-[#293742] pt-1.5 text-[10px] font-mono text-[#8a9ba8]">
            <span>
              {hoveredSubstation.latitude.toFixed(3)}°, {hoveredSubstation.longitude.toFixed(3)}°
            </span>
            <span className="shrink-0 text-[#2b95d6] font-semibold flex items-center gap-0.5">
              CLICK TO INSPECT <ArrowUpRight className="h-3 w-3" />
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
      className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out font-sans"
      style={{
        left: `${hoverCoordinates.x}px`,
        top: `${hoverCoordinates.y}px`,
      }}
    >
      <div className="w-72 rounded border border-[#293742] bg-[#182026]/95 p-2.5 text-[#f5f8fa] shadow-2xl backdrop-blur-md font-sans">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[#293742] pb-1.5">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-[#f5f8fa] flex items-center gap-1.5 font-sans">
              <Zap className="h-3 w-3 text-[#2b95d6] shrink-0" />
              <span className="truncate">{hoveredStation.name}</span>
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8a9ba8] mt-0.5">
              <span className="text-[#f5f8fa] font-medium">{hoveredStation.countryName}</span>
              <span>•</span>
              <span className="text-[#2b95d6]">{hoveredStation.gridRegion}</span>
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase"
            style={{
              backgroundColor: `rgba(${fuel.rgb.join(",")}, 0.15)`,
              color: fuel.hex,
              border: `1px solid rgba(${fuel.rgb.join(",")}, 0.3)`,
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
        <div className="grid grid-cols-2 gap-1.5 pt-2 text-xs font-mono">
          <div className="rounded bg-[#101418] p-1.5 border border-[#293742]">
            <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8]">
              Dispatch
            </div>
            <div className="font-mono font-bold text-[#f5f8fa] mt-0.5">
              <span>{hoveredStation.currentOutputMw.toLocaleString()}</span>
              <span className="text-[9px] font-normal text-[#8a9ba8]">
                {" "}/ {hoveredStation.capacityMw.toLocaleString()} MW
              </span>
            </div>
          </div>

          <div className="rounded bg-[#101418] p-1.5 border border-[#293742]">
            <div className="text-[9px] uppercase tracking-wider text-[#8a9ba8]">
              Spot LMP
            </div>
            <div
              className={`font-mono font-bold mt-0.5 ${
                isSpike
                  ? "text-[#db3737]"
                  : isNegative
                  ? "text-[#15b371]"
                  : "text-[#d9822b]"
              }`}
            >
              <span>${hoveredStation.spotPriceMwh.toFixed(1)}</span>
              <span className="text-[9px] font-normal text-[#8a9ba8]">/MWh</span>
            </div>
          </div>
        </div>

        {/* Capacity Factor Bar */}
        <div className="mt-1.5 px-0.5 font-mono">
          <div className="flex justify-between text-[9px] text-[#8a9ba8]">
            <span>Capacity Factor</span>
            <span className="text-[#f5f8fa] font-semibold">
              {(hoveredStation.capacityFactor * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded bg-[#101418]">
            <div
              className="h-full rounded transition-all duration-300"
              style={{
                width: `${Math.min(100, hoveredStation.capacityFactor * 100)}%`,
                backgroundColor: fuel.hex,
              }}
            />
          </div>
        </div>

        {/* Quick Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-[#293742] pt-1.5 text-[10px] font-mono text-[#8a9ba8]">
          <span className="truncate max-w-[130px]">
            {hoveredStation.operator || "—"}
          </span>
          <span className="shrink-0 text-[#2b95d6] font-semibold flex items-center gap-0.5">
            INSPECT <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
