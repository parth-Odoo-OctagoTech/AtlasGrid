"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGridStore } from "@/lib/store/useGridStore";
import { TopHud } from "@/components/hud/TopHud";
import { TimeScrubber } from "@/components/hud/TimeScrubber";
import { SearchBar } from "@/components/hud/SearchBar";
import { FloatingFilters } from "@/components/filters/FloatingFilters";
import { StationInspector } from "@/components/inspector/StationInspector";
import { GridAnalyticsModal } from "@/components/analytics/GridAnalyticsModal";
import { AlertCenterDrawer } from "@/components/analytics/AlertCenterDrawer";

const DeckGLMap = dynamic(
  () => import("@/components/map/DeckGLMap").then((mod) => mod.DeckGLMap),
  {
    ssr: false,
    loading: () => <div className="relative h-full w-full overflow-hidden bg-background" />,
  }
);

export default function PowerGridDashboard() {
  const setTelemetrySummary = useGridStore((s) => s.setTelemetrySummary);
  const setDataCenters = useGridStore((s) => s.setDataCenters);

  // 1. Fetch Global Stations Dataset
  const { data: stationsData, isLoading: isStationsLoading } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const res = await fetch("/api/stations?limit=10000");
      if (!res.ok) throw new Error("Failed to load power station nodes");
      return res.json();
    },
    staleTime: Infinity,
  });

  // 2. Fetch Transmission Interconnectors
  const { data: interconnectorsData } = useQuery({
    queryKey: ["interconnectors"],
    queryFn: async () => {
      const res = await fetch("/api/interconnectors");
      if (!res.ok) throw new Error("Failed to load interconnectors");
      return res.json();
    },
    staleTime: 60000,
  });

  // 3. Fetch Data Centers Dataset (4,351 global facilities from GE view)
  const { data: dataCentersData, isLoading: isDcLoading } = useQuery({
    queryKey: ["datacenters"],
    queryFn: async () => {
      const res = await fetch("/api/datacenters");
      if (!res.ok) throw new Error("Failed to load datacenters");
      return res.json();
    },
    staleTime: Infinity,
  });

  // 4. Fetch Submarine Cables
  const { data: cablesData } = useQuery({
    queryKey: ["cables"],
    queryFn: async () => {
      const res = await fetch("/api/cables");
      if (!res.ok) return { features: [] };
      return res.json();
    },
    staleTime: Infinity,
  });

  // 5. Fetch Initial Telemetry Summary
  const { data: summaryData } = useQuery({
    queryKey: ["telemetry-summary"],
    queryFn: async () => {
      const res = await fetch("/api/telemetry/summary");
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    },
    staleTime: 10000,
  });

  useEffect(() => {
    if (summaryData?.data) {
      setTelemetrySummary(summaryData.data);
    }
  }, [summaryData, setTelemetrySummary]);

  useEffect(() => {
    if (Array.isArray(dataCentersData)) {
      setDataCenters(dataCentersData);
    }
  }, [dataCentersData, setDataCenters]);

  const plants = stationsData?.data || [];
  const interconnectors = interconnectorsData?.data || [];
  const dataCenters = Array.isArray(dataCentersData) ? dataCentersData : [];
  const cables = cablesData?.features || [];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Top HUD Header */}
      <TopHud />

      {/* Replay Scrubber */}
      <TimeScrubber />

      {/* Floating Tactical Filter Controls */}
      <FloatingFilters />

      {/* 60fps WebGL Deck.gl & MapLibre Map Canvas */}
      <DeckGLMap
        plants={plants}
        interconnectors={interconnectors}
        dataCenters={dataCenters}
        cables={cables}
        isLoading={isStationsLoading || isDcLoading}
      />

      {/* Slide-over Side Inspector Drawer */}
      <StationInspector />

      {/* Global Search Dialog (Cmd+K) */}
      <SearchBar plants={plants} />

      {/* Global Analytics Modal */}
      <GridAnalyticsModal plants={plants} interconnectors={interconnectors} />

      {/* Grid Anomaly Alert Center Drawer */}
      <AlertCenterDrawer />
    </main>
  );
}
