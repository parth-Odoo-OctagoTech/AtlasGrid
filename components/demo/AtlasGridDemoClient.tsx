"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useGridStore } from "@/lib/store/useGridStore";
import { TopHud } from "@/components/hud/TopHud";
import { TimeScrubber } from "@/components/hud/TimeScrubber";
import { SearchBar } from "@/components/hud/SearchBar";
import { FloatingFilters } from "@/components/filters/FloatingFilters";
import { StationInspector } from "@/components/inspector/StationInspector";
import { GridAnalyticsModal } from "@/components/analytics/GridAnalyticsModal";
import { AlertCenterDrawer } from "@/components/analytics/AlertCenterDrawer";
import { DataCenterFleetModal } from "@/components/analytics/DataCenterFleetModal";
import { DataSourcesRegistryModal } from "@/components/analytics/DataSourcesRegistryModal";
import { InstitutionalSitingDossierModal } from "@/components/analytics/InstitutionalSitingDossierModal";
import { SitePortfolioBenchmarkModal } from "@/components/analytics/SitePortfolioBenchmarkModal";
import { HistoricalTimeMachineModal } from "@/components/analytics/HistoricalTimeMachineModal";
import { AtlasAIChatModal } from "@/components/chat/AtlasAIChatModal";
import { User, LogOut, Activity, ArrowLeft } from "lucide-react";

const DeckGLMap = dynamic(() => import("@/components/map/DeckGLMap"), {
  ssr: false,
  loading: () => <div className="relative h-full w-full overflow-hidden bg-background" />,
});

interface AtlasGridDemoClientProps {
  initialUser: {
    email: string;
    role?: string;
    company?: string;
  };
}

export function AtlasGridDemoClient({ initialUser }: AtlasGridDemoClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const setTelemetrySummary = useGridStore((s) => s.setTelemetrySummary);
  const setDataCenters = useGridStore((s) => s.setDataCenters);
  const setSubstations = useGridStore((s) => s.setSubstations);

  // 1. Fetch Global Stations Dataset (clamped to 5000 max)
  const { data: stationsData, isLoading: isStationsLoading } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const res = await fetch("/api/stations?limit=5000");
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

  // 3. Fetch Data Centers Dataset
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

  // 5. Fetch High-Voltage Substations
  const { data: substationsData } = useQuery({
    queryKey: ["substations"],
    queryFn: async () => {
      const res = await fetch("/api/substations");
      if (!res.ok) return { data: [] };
      return res.json();
    },
    staleTime: Infinity,
  });

  // 6. Fetch Telemetry Summary
  const { data: summaryData } = useQuery({
    queryKey: ["telemetry-summary"],
    queryFn: async () => {
      const res = await fetch("/api/telemetry/summary");
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    },
    staleTime: 10000,
  });

  // 7. Siting & Hazard Layers
  const { data: sitingData } = useQuery({
    queryKey: ["siting-layers"],
    queryFn: async () => {
      const res = await fetch("/api/siting");
      if (!res.ok)
        return {
          darkFiberCorridors: [],
          seismicFaults: [],
          flightCorridors: [],
          hazardCorridors: [],
          earthquakes: [],
          cableLandingStations: [],
          floodHazardZones: [],
        };
      return res.json();
    },
    staleTime: Infinity,
  });

  const setDarkFiberCorridors = useGridStore((s) => s.setDarkFiberCorridors);
  const setSeismicFaults = useGridStore((s) => s.setSeismicFaults);
  const setFlightCorridors = useGridStore((s) => s.setFlightCorridors);
  const setHazardCorridors = useGridStore((s) => s.setHazardCorridors);
  const setEarthquakes = useGridStore((s) => s.setEarthquakes);
  const setCableLandingStations = useGridStore((s) => s.setCableLandingStations);
  const setFloodHazardZones = useGridStore((s) => s.setFloodHazardZones);

  useEffect(() => {
    if (dataCentersData?.data) {
      setDataCenters(dataCentersData.data);
    }
  }, [dataCentersData, setDataCenters]);

  useEffect(() => {
    if (substationsData?.data) {
      setSubstations(substationsData.data);
    }
  }, [substationsData, setSubstations]);

  useEffect(() => {
    if (summaryData?.data) {
      setTelemetrySummary(summaryData.data);
    }
  }, [summaryData, setTelemetrySummary]);

  useEffect(() => {
    if (sitingData) {
      if (sitingData.darkFiberCorridors) setDarkFiberCorridors(sitingData.darkFiberCorridors);
      if (sitingData.seismicFaults) setSeismicFaults(sitingData.seismicFaults);
      if (sitingData.flightCorridors) setFlightCorridors(sitingData.flightCorridors);
      if (sitingData.hazardCorridors) setHazardCorridors(sitingData.hazardCorridors);
      if (sitingData.earthquakes) setEarthquakes(sitingData.earthquakes);
      if (sitingData.cableLandingStations) setCableLandingStations(sitingData.cableLandingStations);
      if (sitingData.floodHazardZones) setFloodHazardZones(sitingData.floodHazardZones);
    }
  }, [
    sitingData,
    setDarkFiberCorridors,
    setSeismicFaults,
    setFlightCorridors,
    setHazardCorridors,
    setEarthquakes,
    setCableLandingStations,
    setFloodHazardZones,
  ]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/products/atlasgrid");
      router.refresh();
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Fullscreen Deck.gl Map Canvas */}
      <DeckGLMap
        plants={stationsData?.data || []}
        interconnectors={interconnectorsData?.data || []}
        dataCenters={dataCentersData?.data || []}
        substations={substationsData?.data || []}
        cables={cablesData?.features || []}
        isLoading={isStationsLoading || isDcLoading}
      />

      {/* Floating User Context Badge */}
      <div className="absolute top-16 left-6 z-30 hidden sm:flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-1.5 backdrop-blur-md shadow-2xl text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
            <User className="h-3 w-3" />
          </div>
          <span className="text-white font-medium">{user.email}</span>
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400 border border-cyan-500/30 uppercase">
            {user.role || "Analyst"}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-800" />

        <Link
          href="/admin/health"
          className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px]"
          title="Data health & pipeline SLA"
        >
          <Activity className="h-3 w-3 text-emerald-400" />
          <span>Feeds</span>
        </Link>

        <div className="h-3.5 w-[1px] bg-slate-800" />

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors text-[11px]"
        >
          <LogOut className="h-3 w-3" />
          <span>Exit</span>
        </button>
      </div>

      {/* Top HUD */}
      <TopHud />

      {/* Search Bar */}
      <SearchBar plants={stationsData?.data || []} />

      {/* Floating Filter Controls */}
      <FloatingFilters />

      {/* Time Scrubber */}
      <TimeScrubber />

      {/* Station & DC Inspector Drawer */}
      <StationInspector />

      {/* Analytics, Fleet, Alert & Chat Modals */}
      <GridAnalyticsModal plants={stationsData?.data || []} interconnectors={interconnectorsData?.data || []} />
      <AlertCenterDrawer />
      <DataCenterFleetModal dataCenters={dataCentersData?.data || []} />
      <DataSourcesRegistryModal />
      <InstitutionalSitingDossierModal />
      <SitePortfolioBenchmarkModal />
      <HistoricalTimeMachineModal />
      <AtlasAIChatModal />
    </div>
  );
}
