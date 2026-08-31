"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { GridAlert } from "@/lib/types/telemetry";
import { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  Radio,
  ArrowUpRight,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export function AlertCenterDrawer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAlertsOpen = useGridStore((s) => s.isAlertsOpen);
  const setAlertsOpen = useGridStore((s) => s.setAlertsOpen);
  const liveAlerts = useGridStore((s) => s.liveAlerts);
  const dismissAlert = useGridStore((s) => s.dismissAlert);
  const flyToCoordinates = useGridStore((s) => s.flyToCoordinates);
  const selectStationById = useGridStore((s) => s.selectStationById);

  if (!isAlertsOpen) return null;

  const handleLocateAlert = (alert: GridAlert) => {
    if (alert.coordinates && alert.coordinates.length === 2) {
      flyToCoordinates(alert.coordinates[0], alert.coordinates[1], 8, 45);
    }
    if (alert.stationId) {
      selectStationById(alert.stationId);
    }
    setAlertsOpen(false);
  };

  const formatAlertTime = (timestamp: number | string) => {
    if (!mounted) return "Just now";
    const d = new Date(timestamp);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`;
  };

  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 w-full sm:w-[420px] overflow-y-auto glass-panel-elevated p-5 shadow-2xl text-white animate-in slide-in-from-right duration-200 border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30">
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-xs tracking-wide text-white uppercase">
              Grid Anomaly & Alert Center
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {liveAlerts.length} Active Incidents
            </span>
          </div>
        </div>
        <button
          onClick={() => setAlertsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Alert Feed */}
      <div className="mt-4 space-y-3">
        {liveAlerts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center text-xs text-gray-400">
            <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-400 animate-pulse" />
            <span className="font-medium text-white block mb-1">Nominal Balancing Conditions</span>
            <span>All global power grid balancing zones operating within nominal frequency and voltage limits.</span>
          </div>
        ) : (
          liveAlerts.map((alert) => {
            const isCritical = alert.severity === "critical";
            const isWarning = alert.severity === "warning";

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-3.5 shadow-sm transition-all ${
                  isCritical
                    ? "border-red-500/40 bg-red-950/20 text-red-200 shadow-glow-red/20"
                    : isWarning
                    ? "border-amber-500/40 bg-amber-950/20 text-amber-200"
                    : "border-blue-500/40 bg-blue-950/20 text-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isCritical
                          ? "bg-red-400 animate-ping"
                          : isWarning
                          ? "bg-amber-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <h4 className="font-bold text-xs text-white">
                      {alert.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss alert"
                    className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-slate-800/60 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <p className="mt-1.5 text-[11px] text-gray-300 leading-relaxed font-sans">
                  {alert.message}
                </p>

                <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
                  <span className="font-mono text-gray-400">
                    {alert.region} • {formatAlertTime(alert.timestamp)}
                  </span>

                  <div className="flex items-center gap-2">
                    {alert.coordinates && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${alert.coordinates[1]},${alert.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View anomaly coordinates on Google Maps"
                        className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-slate-900/80 text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {alert.coordinates && (
                      <button
                        onClick={() => handleLocateAlert(alert)}
                        className="flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30"
                      >
                        <span>Locate</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
