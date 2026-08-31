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
    <header className="absolute left-0 right-0 top-0 z-30 flex h-14 items-center justify-between glass-panel px-4 text-white select-none">
      {/* Brand & Connection State */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 shadow-glow-sm">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-white">
                ATLAS<span className="text-cyan-400">GRID</span>
              </span>
              <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-semibold shadow-sm">
                ENTERPRISE v3.0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  !mounted
                    ? "bg-cyan-400"
                    : realtimeConnected
                    ? "bg-emerald-400 shadow-glow"
                    : isReplayMode
                    ? "bg-amber-400 shadow-glow"
                    : "bg-cyan-400"
                }`}
              />
              <span className="font-mono tracking-tight font-medium">
                {!mounted
                  ? "INITIALIZING..."
                  : isReplayMode
                  ? "HISTORICAL 24H REPLAY"
                  : realtimeConnected
                  ? "LIVE TELEMETRY STREAM (60 FPS)"
                  : "TELEMETRY SYNCHRONIZED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Real-time Metrics Ticker */}
      <div className="hidden lg:flex items-center gap-5 divide-x divide-white/10 text-xs">
        {/* Total Generation vs Capacity */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Global Grid Dispatch
            </div>
            <div className="font-mono font-bold text-white tracking-tight">
              {totalGenGw} <span className="text-[10px] font-normal text-gray-400">/ {totalCapGw} GW</span>
            </div>
          </div>
        </div>

        {/* Clean Energy Share */}
        <div className="pl-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Clean Energy Share
            </div>
            <div className="font-mono font-bold text-emerald-400 tracking-tight">
              {cleanPct}%
            </div>
          </div>
        </div>

        {/* Global Data Center Compute Power Demand (Clickable to open Data Center Fleet Directory) */}
        <button
          onClick={() => setDcFleetOpen(true)}
          className="pl-5 flex items-center gap-2.5 text-left group hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Click to open Global Data Center Fleet Directory (Hotkey: C)"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500/20 group-hover:border-purple-400/50 group-hover:shadow-glow-sm transition-all">
            <Server className="h-3.5 w-3.5 text-purple-400 group-hover:text-purple-300" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold group-hover:text-purple-300 transition-colors flex items-center gap-1">
              <span>Data Center IT Load</span>
            </div>
            <div className="font-mono font-bold text-purple-300 tracking-tight group-hover:text-white transition-colors">
              {(totalDcPowerMw / 1000).toFixed(1)} <span className="text-[10px] font-normal text-gray-400">GW ({dataCenters.length.toLocaleString()} Facilities)</span>
            </div>
          </div>
        </button>

        {/* Average Global Spot Price */}
        <div className="pl-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              Avg Spot Price
            </div>
            <div className="font-mono font-bold text-amber-400 tracking-tight">
              ${avgPrice} <span className="text-[10px] font-normal text-gray-400">/MWh</span>
            </div>
          </div>
        </div>

        {/* Frequency Monitor Pulse */}
        <div className="pl-5 flex items-center gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              US Grid (60Hz)
            </div>
            <div className="font-mono font-bold text-white tracking-tight">
              {freqUs.toFixed(3)}{" "}
              <span className="text-[9px] font-normal text-cyan-400">Hz</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
              EU Grid (50Hz)
            </div>
            <div className="font-mono font-bold text-white tracking-tight">
              {freqEu.toFixed(3)}{" "}
              <span className="text-[9px] font-normal text-purple-400">Hz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls & Action Badges */}
      <div className="flex items-center gap-2">
        {/* Replay Mode / Live Switcher */}
        <div className="hidden sm:flex items-center rounded-lg border border-white/10 bg-slate-900/70 p-0.5 text-xs">
          <button
            onClick={() => setReplayMode(false)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              !isReplayMode
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Radio className="h-3 w-3" />
            <span className="text-[11px]">Real-Time</span>
          </button>
          <button
            onClick={() => setReplayMode(true)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              isReplayMode
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-glow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            <span className="text-[11px]">24h Replay</span>
          </button>
        </div>

        {/* Quick Spotlight Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-500/40 hover:text-white transition-all shadow-sm group"
        >
          <Search className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline text-[11px] text-gray-400">
            Quick search...
          </span>
          <kbd className="hidden md:inline rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-gray-300 border border-slate-700 shadow-sm">
            ⌘K
          </kbd>
        </button>

        {/* DC Fleet Intelligence Trigger */}
        <button
          onClick={() => setDcFleetOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-400/60 transition-all shadow-sm group"
          title="Open Data Center Fleet & Capacity Dashboard (Hotkey: C)"
        >
          <Server className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-[11px] font-semibold">DC Fleet</span>
          <kbd className="hidden md:inline rounded bg-purple-950/80 px-1 py-0.5 text-[9px] font-mono text-purple-300 border border-purple-500/30">
            C
          </kbd>
        </button>

        {/* Global Analytics Modal Trigger */}
        <button
          onClick={() => setAnalyticsOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-500/40 hover:text-white transition-all shadow-sm group"
          title="Open Global Grid Analytics (Hotkey: D)"
        >
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-[11px]">Analytics</span>
          <kbd className="hidden md:inline rounded bg-slate-800 px-1 py-0.5 text-[9px] font-mono text-gray-400 border border-slate-700">
            D
          </kbd>
        </button>

        {/* Active Alerts Trigger */}
        <button
          onClick={() => setAlertsOpen(true)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all shadow-sm group ${
            criticalAlertsCount > 0
              ? "border-red-500/50 bg-red-500/20 text-red-400 shadow-glow-red animate-pulse"
              : "border-white/10 bg-slate-900/70 text-gray-300 hover:text-white hover:border-red-500/40"
          }`}
          title="Open Grid Alerts & Anomaly Center (Hotkey: A)"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px]">Alerts</span>
          {liveAlerts.length > 0 && (
            <span className="rounded-full bg-red-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-red-300 border border-red-500/40">
              {liveAlerts.length}
            </span>
          )}
          <kbd className="hidden md:inline rounded bg-slate-800 px-1 py-0.5 text-[9px] font-mono text-gray-400 border border-slate-700">
            A
          </kbd>
        </button>
      </div>
    </header>
  );
}
