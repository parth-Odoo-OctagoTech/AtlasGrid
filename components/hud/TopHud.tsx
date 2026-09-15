"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Flame,
  Radio,
  Search,
  Zap,
  RotateCcw,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";

export function TopHud() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const telemetrySummary = useGridStore((s) => s.telemetrySummary);
  const dataCenters = useGridStore((s) => s.dataCenters);
  const liveAlerts = useGridStore((s) => s.liveAlerts);
  const realtimeConnected = useGridStore((s) => s.realtimeConnected);
  const isReplayMode = useGridStore((s) => s.isReplayMode);
  const setReplayMode = useGridStore((s) => s.setReplayMode);
  const setAlertsOpen = useGridStore((s) => s.setAlertsOpen);
  const setAnalyticsOpen = useGridStore((s) => s.setAnalyticsOpen);
  const setSearchOpen = useGridStore((s) => s.setSearchOpen);
  const setDcFleetOpen = useGridStore((s) => s.setDcFleetOpen);

  // Global Hotkey listener (Cmd+K / A for Alerts / D for Analytics / C for Compute Fleet)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "a" || e.key === "A") {
        setAlertsOpen(!useGridStore.getState().isAlertsOpen);
      }
      if (e.key === "d" || e.key === "D") {
        setAnalyticsOpen(!useGridStore.getState().isAnalyticsOpen);
      }
      if (e.key === "c" || e.key === "C") {
        setDcFleetOpen(!useGridStore.getState().isDcFleetOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setAlertsOpen, setAnalyticsOpen, setDcFleetOpen]);

  const totalDcPowerMw = useMemo(
    () => dataCenters.reduce((sum, d) => sum + d.estimatedPowerMw, 0),
    [dataCenters]
  );

  const totalCapGw = telemetrySummary
    ? (telemetrySummary.totalCapacityMw / 1000).toFixed(1)
    : "1,840.5";
  const totalGenGw = telemetrySummary
    ? (telemetrySummary.totalGenerationMw / 1000).toFixed(1)
    : "1,120.8";
  const cleanPct = telemetrySummary
    ? telemetrySummary.cleanEnergySharePercent.toFixed(1)
    : "54.2";
  const avgPrice = telemetrySummary
    ? telemetrySummary.averageSpotPrice.toFixed(1)
    : "42.6";

  const freqUs = telemetrySummary?.frequencyUsHz ?? 60.002;
  const freqEu = telemetrySummary?.frequencyEuHz ?? 50.001;

  const criticalAlertsCount = liveAlerts.filter(
    (a) => a.severity === "critical"
  ).length;

  return (
    <header className="absolute left-0 right-0 top-0 z-30 flex h-14 items-center justify-between glass-panel px-4 text-white select-none border-b border-white/8 bg-slate-950/85">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                AtlasGrid
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  !mounted
                    ? "bg-gray-400"
                    : realtimeConnected
                    ? "bg-emerald-400"
                    : isReplayMode
                    ? "bg-amber-400"
                    : "bg-cyan-400"
                }`}
              />
              <span className="text-[11px] text-gray-300 font-medium">
                {!mounted
                  ? "Connecting"
                  : isReplayMode
                  ? "24H Replay"
                  : "Live Grid"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics - Clean, Spaced, Legible */}
      <div className="hidden lg:flex items-center gap-6 text-xs">
        {/* Total Generation */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-400/80" />
          <div>
            <div className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">
              Generation
            </div>
            <div className="font-mono text-xs font-semibold text-white">
              {totalGenGw} <span className="text-gray-400 font-normal">GW</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/10" />

        {/* Total Capacity */}
        <div>
          <div className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">
            Capacity
          </div>
          <div className="font-mono text-xs font-semibold text-gray-200">
            {totalCapGw} <span className="text-gray-400 font-normal">GW</span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/10" />

        {/* Clean Energy */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400/80" />
          <div>
            <div className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">
              Clean Energy
            </div>
            <div className="font-mono text-xs font-semibold text-emerald-300">
              {cleanPct}%
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/10" />

        {/* Data Centers Load */}
        <button
          onClick={() => setDcFleetOpen(true)}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
          title="Open Data Center Fleet Directory"
        >
          <Server className="h-3.5 w-3.5 text-purple-400/80" />
          <div>
            <div className="text-[10px] uppercase font-medium text-gray-400 tracking-wider flex items-center gap-1">
              <span>DC Load</span>
            </div>
            <div className="font-mono text-xs font-semibold text-purple-200">
              {(totalDcPowerMw / 1000).toFixed(1)} <span className="text-gray-400 font-normal">GW</span>
            </div>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-white/10" />

        {/* Average Spot Price */}
        <div>
          <div className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">
            Avg Price
          </div>
          <div className="font-mono text-xs font-semibold text-amber-200">
            ${avgPrice} <span className="text-gray-400 font-normal">/MWh</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Search (⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-gray-400" />
          <span className="hidden md:inline text-xs text-gray-300">Search</span>
          <kbd className="hidden md:inline rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 border border-white/10">
            ⌘K
          </kbd>
        </button>

        {/* Data Center Fleet Directory */}
        <button
          onClick={() => setDcFleetOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1.5 text-xs text-purple-200 hover:bg-purple-500/20 transition-colors"
          title="Open Data Center Directory (C)"
        >
          <Server className="h-3.5 w-3.5 text-purple-400" />
          <span className="hidden sm:inline font-medium">Data Centers</span>
        </button>

        {/* Analytics Modal */}
        <button
          onClick={() => setAnalyticsOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Analytics (D)"
        >
          <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
          <span className="hidden sm:inline">Analytics</span>
        </button>

        {/* Alerts */}
        <button
          onClick={() => setAlertsOpen(true)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            criticalAlertsCount > 0
              ? "border-red-500/30 bg-red-500/15 text-red-300"
              : "border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
          }`}
          title="Alerts (A)"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>Alerts</span>
          {liveAlerts.length > 0 && (
            <span className="rounded-full bg-red-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-red-300">
              {liveAlerts.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
