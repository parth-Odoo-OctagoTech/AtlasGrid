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
    <aside className="fixed right-0 top-12 bottom-0 z-40 w-full sm:w-[440px] overflow-y-auto bg-[#182026] text-[#f5f8fa] shadow-2xl animate-in slide-in-from-right duration-200 border-l border-[#293742] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#293742] p-4 bg-[#101418]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#202b33] border border-[#293742]">
            <ShieldAlert className="h-4 w-4 text-[#db3737]" />
          </div>
          <div>
            <span className="font-mono font-bold text-xs tracking-wider text-[#f5f8fa] uppercase">
              Alerts // Telemetry Events
            </span>
            <span className="block text-[10px] text-[#8a9ba8] font-mono">
              {liveAlerts.length} Active Anomaly Signals
            </span>
          </div>
        </div>
        <button
          onClick={() => setAlertsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Alert Feed */}
      <div className="p-4 space-y-2.5 font-mono">
        {liveAlerts.length === 0 ? (
          <div className="rounded border border-[#293742] bg-[#101418] p-6 text-center text-xs text-[#8a9ba8]">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-[#15b371]" />
            <span className="font-semibold text-[#f5f8fa] block mb-1 font-mono uppercase text-xs">Nominal Grid Operations</span>
            <span className="text-[11px] text-[#8a9ba8] font-sans">All monitored balancing authorities operating within standard frequency and reserve thresholds.</span>
          </div>
        ) : (
          liveAlerts.map((alert) => {
            const isCritical = alert.severity === "critical";
            const isWarning = alert.severity === "warning";

            return (
              <div
                key={alert.id}
                className={`rounded border p-3 shadow-sm transition-colors ${
                  isCritical
                    ? "border-[#db3737]/40 bg-[#db3737]/10 text-[#db3737]"
                    : isWarning
                    ? "border-[#d9822b]/40 bg-[#d9822b]/10 text-[#d9822b]"
                    : "border-[#2b95d6]/40 bg-[#2b95d6]/10 text-[#2b95d6]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isCritical
                          ? "bg-[#db3737]"
                          : isWarning
                          ? "bg-[#d9822b]"
                          : "bg-[#2b95d6]"
                      }`}
                    />
                    <h4 className="font-bold text-xs text-[#f5f8fa] font-mono">
                      {alert.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss alert"
                    className="text-[#8a9ba8] hover:text-[#f5f8fa] p-0.5 rounded hover:bg-[#202b33] transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <p className="mt-1.5 text-[11px] text-[#8a9ba8] leading-relaxed font-sans">
                  {alert.message}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-[#293742] pt-2 text-[10px]">
                  <span className="text-[#5c7080]">
                    {alert.region} • {formatAlertTime(alert.timestamp)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {alert.coordinates && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${alert.coordinates[1]},${alert.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View anomaly coordinates on Google Maps"
                        className="p-1 rounded border border-[#293742] bg-[#202b33] text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {alert.coordinates && (
                      <button
                        onClick={() => handleLocateAlert(alert)}
                        className="flex items-center gap-1 font-semibold text-[#2b95d6] hover:text-white px-2 py-0.5 rounded bg-[#202b33] border border-[#293742] transition-colors"
                      >
                        <span>LOCATE</span>
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
