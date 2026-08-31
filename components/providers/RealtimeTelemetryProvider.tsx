"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGridStore } from "@/lib/store/useGridStore";
import { GridAlert, GridSummary } from "@/lib/types/telemetry";
import { PowerPlant } from "@/lib/types/power-plant";

export function RealtimeTelemetryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const setTelemetrySummary = useGridStore((s) => s.setTelemetrySummary);
  const addAlert = useGridStore((s) => s.addAlert);
  const setRealtimeConnected = useGridStore((s) => s.setRealtimeConnected);
  const isReplayMode = useGridStore((s) => s.isReplayMode);
  const isReplayPlaying = useGridStore((s) => s.isReplayPlaying);
  const replayHour = useGridStore((s) => s.replayHour);
  const setReplayHour = useGridStore((s) => s.setReplayHour);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Filter out noise from browser extensions (e.g. Bitdefender, Adblockers)
  useEffect(() => {
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      const stack = String(e.reason?.stack || e.reason || "");
      if (stack.includes("chrome-extension://") || stack.includes("moz-extension://")) {
        e.preventDefault();
      }
    };

    const handleError = (e: ErrorEvent) => {
      const filename = String(e.filename || "");
      const message = String(e.message || "");
      if (filename.includes("chrome-extension://") || filename.includes("moz-extension://") || message.includes("chrome-extension://")) {
        e.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  // SSE Stream Connection for Live Mode
  useEffect(() => {
    if (isReplayMode) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setRealtimeConnected(false);
      return;
    }

    let isMounted = true;
    let sse: EventSource;

    try {
      sse = new EventSource("/api/telemetry/stream");
      eventSourceRef.current = sse;

      sse.addEventListener("connected", () => {
        if (isMounted) setRealtimeConnected(true);
      });

      sse.addEventListener("tick", (e) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(e.data);
          
          if (payload.summary) {
            setTelemetrySummary(payload.summary);
          }

          if (payload.newAlerts && Array.isArray(payload.newAlerts)) {
            payload.newAlerts.forEach((alert: GridAlert) => {
              addAlert(alert);
            });
          }

          // Update stations in React Query cache
          if (payload.sampleUpdatedPlants && Array.isArray(payload.sampleUpdatedPlants)) {
            queryClient.setQueryData(
              ["stations"],
              (oldData: { data: PowerPlant[] } | undefined) => {
                if (!oldData || !oldData.data) return oldData;
                const updateMap = new Map(
                  payload.sampleUpdatedPlants.map((u: any) => [u.id, u])
                );

                const newPlants = oldData.data.map((p) => {
                  const update = updateMap.get(p.id) as any;
                  if (!update) return p;
                  return {
                    ...p,
                    currentOutputMw: update.currentOutputMw,
                    capacityFactor: update.capacityFactor,
                    spotPriceMwh: update.spotPriceMwh,
                    status: update.status,
                    lastUpdated: payload.timestamp,
                  };
                });

                return { ...oldData, data: newPlants };
              }
            );
          }
        } catch (err) {
          console.error("Failed to parse SSE tick:", err);
        }
      });

      sse.onerror = () => {
        if (isMounted) setRealtimeConnected(false);
      };
    } catch (err) {
      console.warn("SSE stream failed to initialize, relying on query polling:", err);
    }

    return () => {
      isMounted = false;
      if (sse) {
        sse.close();
      }
      eventSourceRef.current = null;
      setRealtimeConnected(false);
    };
  }, [isReplayMode, queryClient, setTelemetrySummary, addAlert, setRealtimeConnected]);

  // Replay scrubber animation loop
  useEffect(() => {
    if (!isReplayMode || !isReplayPlaying) return;

    const interval = setInterval(() => {
      setReplayHour((replayHour + 0.1) % 24);
    }, 400);

    return () => clearInterval(interval);
  }, [isReplayMode, isReplayPlaying, replayHour, setReplayHour]);

  return <>{children}</>;
}
