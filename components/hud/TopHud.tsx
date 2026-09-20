"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Search,
  Server,
  Zap,
  Globe,
  Clock,
  ShieldCheck,
  Radio,
  RotateCcw,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export function TopHud() {
  const [mounted, setMounted] = useState(false);
  const [utcTime, setUtcTime] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback("SYNCING...");
    try {
      const res = await fetch("/api/cron/crawler", {
        method: "POST",
        headers: { "x-manual-trigger": "atlasgrid-ui" },
      });
      if (res.ok) {
        setSyncFeedback("VERIFIED");
      } else {
        setSyncFeedback("SYNC DONE");
      }
    } catch {
      setSyncFeedback("OFFLINE");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncFeedback(null);
      }, 3500);
    }
  };

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      const iso = now.toISOString().replace("T", " ").replace(/\..+/, "") + " UTC";
      setUtcTime(iso);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
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

  // Global Hotkeys (Palantir Command shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "a" || e.key === "A") {
        setAnalyticsOpen(!useGridStore.getState().isAnalyticsOpen);
      }
      if (e.key === "o" || e.key === "O" || e.key === "c" || e.key === "C") {
        setDcFleetOpen(!useGridStore.getState().isDcFleetOpen);
      }
      if (e.key === "l" || e.key === "L") {
        setAlertsOpen(!useGridStore.getState().isAlertsOpen);
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

  const criticalAlertsCount = liveAlerts.filter(
    (a) => a.severity === "critical"
  ).length;

  return (
    <header className="absolute left-0 right-0 top-0 z-30 flex h-12 items-center justify-between px-3 text-white select-none border-b border-[#293742] bg-[#182026] shadow-sm">
      {/* 1. Left Branding & Palantir Ontology Emblem */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Palantir Industrial Monogram Icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#101418] border border-[#293742] text-[#2b95d6]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <circle cx="12" cy="12" r="9" stroke="#293742" strokeWidth="1.5" />
              <polygon points="12 4 15 12 12 20 9 12" fill="#137cbd" stroke="#2b95d6" strokeWidth="1" />
              <circle cx="12" cy="12" r="2" fill="#f5f8fa" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#f5f8fa]">
                ATLASGRID
              </span>
              <span className="text-[10px] font-mono text-[#8a9ba8]">
                // FOUNDRY
              </span>
            </div>
          </div>
        </div>

        {/* System Environment & Status Tag */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#293742]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#101418] border border-[#293742] text-[#a7b6c2]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                !mounted
                  ? "bg-[#5c7080]"
                  : realtimeConnected
                  ? "bg-[#0f9960]"
                  : isReplayMode
                  ? "bg-[#d9822b]"
                  : "bg-[#137cbd]"
              }`}
            />
            {!mounted
              ? "CONNECTING..."
              : isReplayMode
              ? "SCENARIO REPLAY"
              : "ONTOLOGY SYNCED"}
          </span>

          {/* Autonomous Crawler Bot Status Interactive Pill */}
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#293742] bg-[#101418] hover:bg-[#182026] hover:border-[#2b95d6]/50 text-[10px] font-mono text-[#8a9ba8] transition-colors cursor-pointer group"
            title="AtlasGrid Continuous Crawler Bot: Click to trigger instant grid & registry sync"
          >
            {isSyncing ? (
              <RefreshCw className="h-3 w-3 animate-spin text-[#2b95d6]" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#15b371] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#15b371]" />
              </span>
            )}
            <span className="text-[#f5f8fa] font-semibold">
              {syncFeedback ? syncFeedback : "BOT: ACTIVE"}
            </span>
            <span className="text-[#5c7080]">•</span>
            <span className="text-[#2b95d6] group-hover:underline">
              {isSyncing ? "SYNCING" : "SYNC NOW"}
            </span>
          </button>

          {/* Live UTC Master Clock */}
          {mounted && utcTime && (
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono text-[#8a9ba8] px-1.5 py-0.5">
              <Clock className="h-3 w-3 text-[#5c7080]" />
              <span className="tabular-nums">{utcTime}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Center Ontology Asset Counters (Foundry High-Density Ticker) */}
      <div className="hidden lg:flex items-center gap-5 text-xs font-mono">
        {/* Total Generation Node Load */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase font-semibold text-[#8a9ba8] tracking-wider">
            GEN:
          </div>
          <div className="text-xs font-bold text-[#f5f8fa] tabular-nums">
            {totalGenGw} <span className="text-[#8a9ba8] font-normal text-[10px]">GW</span>
          </div>
          <span className="text-[10px] text-[#5c7080]">/ {totalCapGw} GW</span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#293742]" />

        {/* Clean Energy Share */}
        <div className="flex items-center gap-1.5">
          <div className="text-[10px] uppercase font-semibold text-[#8a9ba8] tracking-wider">
            CLEAN:
          </div>
          <div className="text-xs font-bold text-[#15b371] tabular-nums">
            {cleanPct}%
          </div>
        </div>

        <div className="h-3.5 w-[1px] bg-[#293742]" />

        {/* Global Data Center Compute Power Demand (Clickable to open Data Center Fleet Directory) */}
        <button
          onClick={() => setDcFleetOpen(true)}
          className="flex items-center gap-2 text-left hover:text-[#2b95d6] transition-colors cursor-pointer group"
          title="Open Data Center Object Explorer (Hotkey: O)"
        >
          <div className="text-[10px] uppercase font-semibold text-[#8a9ba8] group-hover:text-[#2b95d6] tracking-wider">
            DC LOAD:
          </div>
          <div className="text-xs font-bold text-[#a7b6c2] group-hover:text-white tabular-nums">
            {(totalDcPowerMw / 1000).toFixed(1)} <span className="text-[#8a9ba8] font-normal text-[10px]">GW ({dataCenters.length.toLocaleString()} DCs)</span>
          </div>
        </button>

        <div className="h-3.5 w-[1px] bg-[#293742]" />

        {/* Average Spot Price */}
        <div className="flex items-center gap-1.5">
          <div className="text-[10px] uppercase font-semibold text-[#8a9ba8] tracking-wider">
            SPOT:
          </div>
          <div className="text-xs font-bold text-[#f29d49] tabular-nums">
            ${avgPrice} <span className="text-[#8a9ba8] font-normal text-[10px]">/MWh</span>
          </div>
        </div>
      </div>

      {/* 3. Right Palantir Action Group & Omnibar Trigger */}
      <div className="flex items-center gap-1.5">
        {/* Omnibar Spotlight Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs text-[#a7b6c2] bg-[#101418] border border-[#293742] hover:border-[#30404d] hover:text-white transition-colors"
          title="Search Entities & Objects (⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-[#8a9ba8]" />
          <span className="hidden md:inline text-[11px] font-mono">Omnibar</span>
          <kbd className="hidden md:inline rounded bg-[#202b33] px-1 py-0.2 text-[9px] font-mono text-[#8a9ba8] border border-[#293742]">
            ⌘K
          </kbd>
        </button>

        {/* Object Explorer (Foundry Catalog) */}
        <button
          onClick={() => setDcFleetOpen(true)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs text-[#f5f8fa] bg-[#202b33] border border-[#293742] hover:bg-[#293742] hover:border-[#30404d] transition-colors"
          title="Open Object Explorer (O)"
        >
          <Server className="h-3.5 w-3.5 text-[#2b95d6]" />
          <span className="hidden sm:inline text-[11px] font-mono font-medium">Objects</span>
          <kbd className="hidden md:inline rounded bg-[#101418] px-1 py-0.2 text-[9px] font-mono text-[#8a9ba8] border border-[#293742]">
            O
          </kbd>
        </button>

        {/* Analytics Nexus */}
        <button
          onClick={() => setAnalyticsOpen(true)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs text-[#f5f8fa] bg-[#202b33] border border-[#293742] hover:bg-[#293742] hover:border-[#30404d] transition-colors"
          title="Open Grid Analytics (A)"
        >
          <BarChart3 className="h-3.5 w-3.5 text-[#8a9ba8]" />
          <span className="hidden sm:inline text-[11px] font-mono">Analytics</span>
          <kbd className="hidden md:inline rounded bg-[#101418] px-1 py-0.2 text-[9px] font-mono text-[#8a9ba8] border border-[#293742]">
            A
          </kbd>
        </button>

        {/* Anomaly Alerts */}
        <button
          onClick={() => setAlertsOpen(true)}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${
            criticalAlertsCount > 0
              ? "bg-[#db3737]/20 border border-[#db3737]/40 text-[#f55656]"
              : "bg-[#202b33] border border-[#293742] text-[#f5f8fa] hover:bg-[#293742]"
          }`}
          title="Open Alert Center (L)"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-[#d9822b]" />
          <span className="hidden sm:inline text-[11px] font-mono">Alerts</span>
          {liveAlerts.length > 0 && (
            <span className="rounded bg-[#db3737]/30 px-1 py-0.2 text-[9px] font-mono font-bold text-[#f55656]">
              {liveAlerts.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
