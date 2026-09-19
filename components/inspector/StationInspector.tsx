"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, PowerPlant } from "@/lib/types/power-plant";
import { DispatchChart } from "./DispatchChart";
import { OPERATOR_COLORS, DataCenter } from "@/lib/types/data-center";
import {
  findLocalGridSupply,
  findSuppliedDataCenters,
} from "@/lib/services/cross-reference-service";
import {
  X,
  Zap,
  Flame,
  Activity,
  Compass,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  Leaf,
  Share2,
  Maximize2,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  Cpu,
  Globe,
  Gauge,
  Radio,
  Network,
  RadioTower,
  ArrowRight,
  Sparkles,
  MapPin,
  Database,
  Search,
} from "lucide-react";
import {
  getGoogleMapsUrl,
  getOfficialWebsite,
  getPrimarySourceReference,
  getPeeringDbReference,
  getOsmReference,
  getWebSearchUrl,
} from "@/lib/utils/datacenter-links";

export function StationInspector() {
  const isInspectorOpen = useGridStore((s) => s.isInspectorOpen);
  const setInspectorOpen = useGridStore((s) => s.setInspectorOpen);
  const selectedStation = useGridStore((s) => s.selectedStation);
  const selectedDataCenter = useGridStore((s) => s.selectedDataCenter);
  const setSelectedStation = useGridStore((s) => s.setSelectedStation);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);
  const flyToStation = useGridStore((s) => s.flyToStation);

  // Fetch stations for cross-referencing
  const { data: allStationsData } = useQuery({
    queryKey: ["all-stations-inspector"],
    queryFn: async () => {
      const res = await fetch("/api/stations?limit=10000");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 60000,
  });

  // Fetch data centers for cross-referencing
  const { data: allDataCentersData } = useQuery({
    queryKey: ["all-datacenters-inspector"],
    queryFn: async () => {
      const res = await fetch("/api/datacenters");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  // Fetch detailed station history & alerts (for power stations)
  const { data: detailData } = useQuery({
    queryKey: ["station-detail", selectedStation?.id],
    queryFn: async () => {
      if (!selectedStation?.id) return null;
      const res = await fetch(`/api/stations/${selectedStation.id}`);
      if (!res.ok) throw new Error("Failed to fetch station details");
      return res.json();
    },
    enabled: !!selectedStation?.id && isInspectorOpen,
    staleTime: 10000,
  });

  // Compute local grid supply for active data center
  const localGridSupply = useMemo(() => {
    if (!selectedDataCenter || !allStationsData?.length) return null;
    return findLocalGridSupply(selectedDataCenter, allStationsData, 100);
  }, [selectedDataCenter, allStationsData]);

  // Compute nearby compute demand for active power station
  const localComputeDemand = useMemo(() => {
    if (!selectedStation || !allDataCentersData?.length) return null;
    return findSuppliedDataCenters(selectedStation, allDataCentersData, 100);
  }, [selectedStation, allDataCentersData]);

  if (!isInspectorOpen || (!selectedStation && !selectedDataCenter)) return null;

  // 1. DATA CENTER INSPECTOR VIEW (Palantir Foundry Object Sheet)
  if (selectedDataCenter) {
    const opMeta = OPERATOR_COLORS[selectedDataCenter.operator] || OPERATOR_COLORS.Other;
    const gMapsUrl = getGoogleMapsUrl(selectedDataCenter);
    const officialWeb = getOfficialWebsite(selectedDataCenter);
    const sourceRef = getPrimarySourceReference(selectedDataCenter);
    const peeringDbRef = getPeeringDbReference(selectedDataCenter);
    const osmRef = getOsmReference(selectedDataCenter);
    const webSearchUrl = getWebSearchUrl(selectedDataCenter);

    return (
      <aside className="absolute right-0 top-12 bottom-0 z-30 w-full sm:w-[480px] overflow-y-auto bg-[#182026] border-l border-[#293742] text-[#f5f8fa] shadow-2xl transition-all animate-in slide-in-from-right duration-200 font-sans">
        {/* Foundry Breadcrumb & Header */}
        <div className="p-4 border-b border-[#293742] bg-[#101418]">
          <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-mono text-[#8a9ba8]">
            <div className="flex items-center gap-1.5">
              <span>ONTOLOGY</span>
              <span>/</span>
              <span>OBJECT EXPLORER</span>
              <span>/</span>
              <span className="text-[#2b95d6]">DataCenter:v3</span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-[#202b33] border border-[#293742] text-[9px] text-[#15b371] font-semibold">
              SYNCHRONIZED
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 mt-2">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#f5f8fa] leading-tight font-sans">
                {selectedDataCenter.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-[#8a9ba8]">
                <span className="text-[#f5f8fa]">
                  {selectedDataCenter.countryName || selectedDataCenter.country}
                </span>
                <span>•</span>
                <span className="text-[#2b95d6]">
                  {selectedDataCenter.region}
                </span>
                <span>•</span>
                <a
                  href={gMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#2b95d6] hover:underline"
                  title="Open exact coordinates on Google Maps"
                >
                  <span>{selectedDataCenter.latitude.toFixed(4)}°N, {selectedDataCenter.longitude.toFixed(4)}°E</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              {/* Quick Jump Action Chips */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-mono">
                <a
                  href={gMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#202b33] border border-[#293742] text-[10px] text-[#2b95d6] hover:bg-[#2b95d6] hover:text-white transition-colors"
                  title="Open exact coordinates on Google Maps"
                >
                  <MapPin className="h-2.5 w-2.5 text-[#2b95d6]" />
                  <span>Google Maps</span>
                  <ExternalLink className="h-2 w-2 opacity-70" />
                </a>
                <a
                  href={officialWeb.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#202b33] border border-[#293742] text-[10px] text-[#15b371] hover:bg-[#15b371] hover:text-white transition-colors"
                  title={`Official Website: ${officialWeb.domain}`}
                >
                  <Globe className="h-2.5 w-2.5 text-[#15b371]" />
                  <span>Website</span>
                  <ExternalLink className="h-2 w-2 opacity-70" />
                </a>
                <a
                  href={sourceRef.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#202b33] border border-[#293742] text-[10px] text-[#d9822b] hover:bg-[#d9822b] hover:text-white transition-colors"
                  title={`${sourceRef.sourceName}: ${sourceRef.label}`}
                >
                  <Database className="h-2.5 w-2.5 text-[#d9822b]" />
                  <span>{sourceRef.badge}</span>
                  <ExternalLink className="h-2 w-2 opacity-70" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => flyToStation(selectedDataCenter)}
                title="Acquire Spatial Target"
                className="flex h-7 w-7 items-center justify-center rounded bg-[#202b33] border border-[#293742] text-[#8a9ba8] hover:text-[#2b95d6] hover:border-[#30404d] transition-colors"
              >
                <Compass className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setInspectorOpen(false)}
                title="Close Object Sheet"
                className="flex h-7 w-7 items-center justify-center rounded bg-[#202b33] border border-[#293742] text-[#8a9ba8] hover:text-[#f5f8fa] hover:border-[#30404d] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Primary KPI Metrics Bento */}
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-[#293742] bg-[#182026]">
          {/* IT Power Load */}
          <div className="rounded bg-[#202b33] border border-[#293742] p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8a9ba8] font-mono font-semibold">
              <span>IT Power Demand</span>
              <Zap className="h-3.5 w-3.5 text-[#2b95d6]" />
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-[#f5f8fa] tabular-nums">
              {selectedDataCenter.estimatedPowerMw}{" "}
              <span className="text-xs font-normal text-[#8a9ba8]">MW</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-[#8a9ba8]">
              Status: Verified Peak IT Load
            </div>
          </div>

          {/* Efficiency PUE */}
          <div className="rounded bg-[#202b33] border border-[#293742] p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8a9ba8] font-mono font-semibold">
              <span>Efficiency Rating</span>
              <Gauge className="h-3.5 w-3.5 text-[#15b371]" />
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-[#15b371] tabular-nums">
              {selectedDataCenter.pue != null ? selectedDataCenter.pue : "—"}
              <span className="text-xs font-normal text-[#8a9ba8]"> PUE</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-[#8a9ba8]">
              {selectedDataCenter.pue && selectedDataCenter.pue < 1.2 ? "Hyperscale Standard" : "Enterprise Standard"}
            </div>
          </div>
        </div>

        {/* Structured Object Properties Sheet (Palantir Blueprint Property Table) */}
        <div className="p-4 border-b border-[#293742]">
          <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[#8a9ba8] mb-2 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-[#2b95d6]" />
            <span>Ontology Object Properties</span>
          </div>

          <div className="rounded bg-[#101418] border border-[#293742] divide-y divide-[#293742] text-xs font-mono">
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">operator</span>
              <span className="text-[#f5f8fa] font-medium">{selectedDataCenter.operator}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">classification</span>
              <span className="text-[#f5f8fa] capitalize">{selectedDataCenter.category} Facility</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">redundancy_tier</span>
              <span className="text-[#f5f8fa]">{selectedDataCenter.tier || "—"}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">cooling_system</span>
              <span className="text-[#f5f8fa]">{selectedDataCenter.coolingType || "—"}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">carrier_asns</span>
              <span className="text-[#2b95d6]">
                {selectedDataCenter.connectedNetworksCount != null ? `${selectedDataCenter.connectedNetworksCount} ASNs` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">internet_exchanges</span>
              <span className="text-[#f5f8fa]">
                {selectedDataCenter.ixpCount != null ? `${selectedDataCenter.ixpCount} IXPs` : "—"}
              </span>
            </div>
            {osmRef && (
              <div className="flex items-center justify-between p-2">
                <span className="text-[#8a9ba8] text-[11px]">osm_geometry</span>
                <a
                  href={osmRef.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2b95d6] hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  {osmRef.label} ↗
                </a>
              </div>
            )}
            <div className="flex items-center justify-between p-2">
              <span className="text-[#8a9ba8] text-[11px]">peeringdb_ref</span>
              <a
                href={peeringDbRef.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#15b371] hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                {peeringDbRef.label} ↗
              </a>
            </div>
            {selectedDataCenter.address && (
              <div className="flex items-center justify-between p-2">
                <span className="text-[#8a9ba8] text-[11px]">facility_address</span>
                <span className="text-[#f5f8fa] truncate max-w-[220px]">
                  {selectedDataCenter.address}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* External References & Online Intelligence (Google Maps, Official Website, Primary Source) */}
        <div className="p-4 border-b border-[#293742] bg-[#141c22]">
          <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[#8a9ba8] mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#2b95d6]">
              <Globe className="h-3.5 w-3.5 text-[#2b95d6]" />
              <span>Online Details & Authoritative References</span>
            </div>
            <span className="text-[9px] font-mono text-[#15b371] bg-[#101418] px-1.5 py-0.5 rounded border border-[#293742]">
              VERIFIED LINKS
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Google Maps Link */}
            <a
              href={gMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between rounded border border-[#293742] bg-[#101418] p-2.5 hover:border-[#2b95d6] hover:bg-[#182026] transition-all group"
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#202b33] text-[#2b95d6] group-hover:bg-[#2b95d6] group-hover:text-white transition-colors">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#f5f8fa] group-hover:text-[#2b95d6] transition-colors">
                    <span>Google Maps (Exact Pin)</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  </div>
                  <div className="mt-0.5 text-[10px] font-mono text-[#8a9ba8]">
                    {selectedDataCenter.latitude.toFixed(5)}°, {selectedDataCenter.longitude.toFixed(5)}° • Satellite & Street View
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-[#2b95d6] bg-[#202b33] px-1.5 py-0.5 rounded border border-[#293742] group-hover:border-[#2b95d6]">
                OPEN MAPS ↗
              </span>
            </a>

            {/* 2. Official Facility / Operator Website */}
            <a
              href={officialWeb.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between rounded border border-[#293742] bg-[#101418] p-2.5 hover:border-[#15b371] hover:bg-[#182026] transition-all group"
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#202b33] text-[#15b371] group-hover:bg-[#15b371] group-hover:text-white transition-colors">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#f5f8fa] group-hover:text-[#15b371] transition-colors">
                    <span className="truncate max-w-[190px]">{officialWeb.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  </div>
                  <div className="mt-0.5 text-[10px] font-mono text-[#8a9ba8] truncate max-w-[220px]">
                    {officialWeb.domain}
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-[#15b371] bg-[#202b33] px-1.5 py-0.5 rounded border border-[#293742] group-hover:border-[#15b371]">
                {officialWeb.isDirect ? "OFFICIAL" : "PORTAL"} ↗
              </span>
            </a>

            {/* 3. OpenStreetMap Physical Footprint (if available) */}
            {osmRef && (
              <a
                href={osmRef.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between rounded border border-[#293742] bg-[#101418] p-2.5 hover:border-[#2b95d6] hover:bg-[#182026] transition-all group"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#202b33] text-[#2b95d6] group-hover:bg-[#2b95d6] group-hover:text-white transition-colors">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#f5f8fa] group-hover:text-[#2b95d6] transition-colors">
                      <span className="truncate max-w-[190px]">OpenStreetMap Footprint</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-[#8a9ba8] truncate max-w-[220px]">
                      {osmRef.label} • Physical building geometry & perimeter
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-mono text-[#2b95d6] bg-[#202b33] px-1.5 py-0.5 rounded border border-[#293742] group-hover:border-[#2b95d6]">
                  OSM ↗
                </span>
              </a>
            )}

            {/* 4. PeeringDB Directory & Interconnect Registry */}
            <a
              href={peeringDbRef.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between rounded border border-[#293742] bg-[#101418] p-2.5 hover:border-[#d9822b] hover:bg-[#182026] transition-all group"
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#202b33] text-[#d9822b] group-hover:bg-[#d9822b] group-hover:text-white transition-colors">
                  <Database className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#f5f8fa] group-hover:text-[#d9822b] transition-colors">
                    <span className="truncate max-w-[190px]">{peeringDbRef.sourceName}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  </div>
                  <div className="mt-0.5 text-[10px] font-mono text-[#8a9ba8] truncate max-w-[220px]">
                    {peeringDbRef.label} • Public directory specs & exchange points
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-[#d9822b] bg-[#202b33] px-1.5 py-0.5 rounded border border-[#293742] group-hover:border-[#d9822b]">
                {peeringDbRef.badge.toUpperCase()} ↗
              </span>
            </a>

            {/* 4. Google Specs & Web Intelligence Search */}
            <a
              href={webSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded border border-[#293742] bg-[#101418] px-2.5 py-2 hover:border-[#8a9ba8] hover:bg-[#182026] transition-all group text-xs font-mono"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="h-3.5 w-3.5 text-[#8a9ba8] group-hover:text-[#f5f8fa] shrink-0" />
                <span className="text-[11px] text-[#8a9ba8] group-hover:text-[#f5f8fa] truncate">
                  Search online specs & whitepapers for this campus
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-[#5c7080] group-hover:text-[#f5f8fa] shrink-0 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Local Grid Power Supply Cross-Reference Module (Palantir Object Graph Nexus) */}
        {localGridSupply && (
          <div className="p-4 border-b border-[#293742]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#2b95d6] flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#2b95d6]" />
                Linked Generation Nexus (100km)
              </h3>
              <span className="font-mono text-[10px] font-bold text-[#15b371] bg-[#101418] px-2 py-0.5 rounded border border-[#293742]">
                {localGridSupply.cleanEnergyPercent}% Clean
              </span>
            </div>

            {/* Clean vs Fossil Mix Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] font-mono text-[#8a9ba8] mb-1">
                <span>Clean: {localGridSupply.cleanEnergyPercent}%</span>
                <span>Fossil: {localGridSupply.fossilEnergyPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-[#101418] flex border border-[#293742]">
                <div
                  className="h-full bg-[#15b371]"
                  style={{ width: `${localGridSupply.cleanEnergyPercent}%` }}
                />
                <div
                  className="h-full bg-[#5c7080]"
                  style={{ width: `${localGridSupply.fossilEnergyPercent}%` }}
                />
              </div>
            </div>

            {/* Top Supplying Power Plants List */}
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-mono uppercase font-semibold text-[#8a9ba8] tracking-wider">
                Upstream Generation Assets ({localGridSupply.supplyingPlants.length})
              </div>
              {localGridSupply.supplyingPlants.slice(0, 4).map((plant) => {
                const plantFuel = FUEL_CONFIG[plant.fuelType] || FUEL_CONFIG.other;
                return (
                  <div
                    key={plant.id}
                    className="flex items-center justify-between rounded border border-[#293742] bg-[#101418] p-2 text-xs hover:border-[#30404d] transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: plantFuel.hex }}
                        />
                        <span className="font-medium text-[#f5f8fa] truncate max-w-[180px]">
                          {plant.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#8a9ba8] font-mono">
                        <span style={{ color: plantFuel.hex }}>{plantFuel.label}</span>
                        <span>•</span>
                        <span>{plant.capacityMw} MW</span>
                        <span>•</span>
                        <span className="text-[#2b95d6]">{plant.distanceKm} km</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const target = allStationsData?.find((s: PowerPlant) => s.id === plant.id);
                        if (target) {
                          setSelectedDataCenter(null);
                          setSelectedStation(target);
                          flyToStation(target);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded bg-[#202b33] px-2 py-1 text-[10px] font-mono font-medium text-[#2b95d6] border border-[#293742] hover:bg-[#293742] hover:text-white transition-colors shrink-0"
                      title="Fly camera to this power station"
                    >
                      <span>Fly</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Scope 2 Carbon Emissions */}
            <div className="mt-3 pt-2 border-t border-[#293742] flex items-center justify-between text-xs font-mono">
              <div className="text-[#8a9ba8] text-[11px] flex items-center gap-1">
                <Leaf className="h-3 w-3 text-[#15b371]" />
                <span>Est. Scope-2 Footprint:</span>
              </div>
              <span className="font-bold text-[#f29d49]">
                {localGridSupply.estimatedAnnualScope2Co2Tons.toLocaleString()} t CO₂/yr
              </span>
            </div>
          </div>
        )}

        {/* Action Tray */}
        <div className="p-3 bg-[#101418] border-t border-[#293742] flex items-center gap-2">
          <button
            onClick={() => flyToStation(selectedDataCenter)}
            className="flex-1 py-1.5 rounded text-xs font-mono font-semibold bg-[#137cbd] hover:bg-[#2b95d6] text-white transition-colors flex items-center justify-center gap-1.5"
            title="Inspect in 3D Foundry Canvas"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Canvas</span>
          </button>
          <a
            href={gMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 rounded text-xs font-mono font-semibold bg-[#202b33] hover:bg-[#2b95d6] text-[#f5f8fa] hover:text-white border border-[#293742] transition-colors flex items-center justify-center gap-1.5"
            title="Open exact coordinates on Google Maps"
          >
            <MapPin className="h-3.5 w-3.5 text-[#2b95d6]" />
            <span>Google Maps</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>
          <a
            href={officialWeb.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 rounded text-xs font-mono font-semibold bg-[#202b33] hover:bg-[#15b371] text-[#f5f8fa] hover:text-white border border-[#293742] transition-colors flex items-center justify-center gap-1.5"
            title={`Open website: ${officialWeb.domain}`}
          >
            <Globe className="h-3.5 w-3.5 text-[#15b371]" />
            <span>Website</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>
          <a
            href={sourceRef.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded text-xs font-mono text-[#8a9ba8] bg-[#202b33] hover:bg-[#293742] border border-[#293742] hover:text-white transition-colors flex items-center gap-1"
            title={`${sourceRef.sourceName}: ${sourceRef.label}`}
          >
            <Database className="h-3 w-3 text-[#d9822b]" />
            <span>Source</span>
          </a>
        </div>
      </aside>
    );
  }

  // 2. POWER PLANT INSPECTOR VIEW (Palantir Foundry Object Sheet)
  if (!selectedStation) return null;

  const fuel = FUEL_CONFIG[selectedStation.fuelType] || FUEL_CONFIG.other;
  const isSpike = selectedStation.spotPriceMwh >= 150;
  const isNegative = selectedStation.spotPriceMwh < 0;

  const history = detailData?.data?.history24h || [];
  const alerts = detailData?.data?.recentAlerts || [];

  const hourlyCo2Tons = (
    (selectedStation.currentOutputMw * 1000 * selectedStation.co2IntensityGPerKwh) /
    1_000_000
  ).toFixed(1);

  return (
    <aside className="absolute right-0 top-12 bottom-0 z-30 w-full sm:w-[480px] overflow-y-auto bg-[#182026] border-l border-[#293742] text-[#f5f8fa] shadow-2xl transition-all animate-in slide-in-from-right duration-200 font-sans">
      {/* Foundry Breadcrumb & Header */}
      <div className="p-4 border-b border-[#293742] bg-[#101418]">
        <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-mono text-[#8a9ba8]">
          <div className="flex items-center gap-1.5">
            <span>ONTOLOGY</span>
            <span>/</span>
            <span>OBJECT EXPLORER</span>
            <span>/</span>
            <span className="text-[#2b95d6]">PowerPlant:v3</span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-[#202b33] border border-[#293742] text-[9px] text-[#15b371] font-semibold">
            SYNCHRONIZED
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 mt-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#f5f8fa] leading-tight font-sans">
              {selectedStation.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-[#8a9ba8]">
              <span className="text-[#f5f8fa]">{selectedStation.countryName}</span>
              <span>•</span>
              <span className="text-[#2b95d6]">{selectedStation.gridRegion}</span>
              <span>•</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedStation.latitude},${selectedStation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#2b95d6] hover:underline"
                title="Open exact coordinates on Google Maps"
              >
                <span>{selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => flyToStation(selectedStation)}
              title="Locate in Canvas"
              className="p-1.5 rounded bg-[#202b33] border border-[#293742] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setInspectorOpen(false)}
              title="Close Panel"
              className="p-1.5 rounded bg-[#202b33] border border-[#293742] text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#293742] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-[#101418] border border-[#293742] rounded">
            <div className="text-[10px] font-mono text-[#8a9ba8] uppercase tracking-wider flex items-center justify-between">
              <span>Active Dispatch</span>
              <Activity className="h-3 w-3 text-[#2b95d6]" />
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-[#f5f8fa]">
              {selectedStation.currentOutputMw.toLocaleString()}{" "}
              <span className="text-xs text-[#8a9ba8] font-normal">MW</span>
            </div>
            <div className="mt-1.5 text-[10px] font-mono text-[#8a9ba8] flex items-center justify-between">
              <span>Cap: {selectedStation.capacityMw.toLocaleString()} MW</span>
              <span className="text-[#f5f8fa] font-semibold">{(selectedStation.capacityFactor * 100).toFixed(0)}%</span>
            </div>
            <div className="mt-1 h-1 w-full bg-[#202b33] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min(100, selectedStation.capacityFactor * 100)}%`,
                  backgroundColor: fuel.hex,
                }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#101418] border border-[#293742] rounded">
            <div className="text-[10px] font-mono text-[#8a9ba8] uppercase tracking-wider flex items-center justify-between">
              <span>Nodal Spot LMP</span>
              <Flame className={`h-3 w-3 ${isSpike ? "text-[#db3737]" : isNegative ? "text-[#15b371]" : "text-[#d9822b]"}`} />
            </div>
            <div className={`mt-1 font-mono text-xl font-bold ${isSpike ? "text-[#db3737]" : isNegative ? "text-[#15b371]" : "text-[#d9822b]"}`}>
              ${selectedStation.spotPriceMwh.toFixed(2)}{" "}
              <span className="text-xs text-[#8a9ba8] font-normal">/MWh</span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1 text-[9px] font-mono text-[#8a9ba8] border-t border-[#293742] pt-1">
              <div>E: <span className="text-[#f5f8fa]">${selectedStation.lmpBreakdown.energy}</span></div>
              <div>C: <span className={selectedStation.lmpBreakdown.congestion > 10 ? "text-[#db3737] font-semibold" : "text-[#f5f8fa]"}>${selectedStation.lmpBreakdown.congestion}</span></div>
              <div>L: <span className="text-[#f5f8fa]">${selectedStation.lmpBreakdown.loss}</span></div>
            </div>
          </div>
        </div>

        {/* 24-Hour Dispatch Profile */}
        <div className="p-3 bg-[#101418] border border-[#293742] rounded">
          <div className="text-[10px] font-mono text-[#8a9ba8] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>24h Dispatch Profile</span>
            <span className="text-[9px] text-[#5c7080]">UTC TELEMETRY</span>
          </div>
          <DispatchChart data={history} fuelHex={fuel.hex} />
        </div>

        {/* Structured Ontology Properties Table */}
        <div className="bg-[#101418] border border-[#293742] rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-[#293742] flex items-center justify-between bg-[#182026]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a9ba8]">
              Ontology Properties
            </span>
            <span className="text-[9px] font-mono text-[#5c7080]">
              SCHEMA // PowerPlant.v3
            </span>
          </div>
          <table className="w-full text-left text-xs font-mono border-collapse">
            <tbody className="divide-y divide-[#202b33]">
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60 w-36">Status</td>
                <td className="px-3 py-1.5 text-[#f5f8fa] flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selectedStation.status === "online"
                        ? "bg-[#15b371]"
                        : selectedStation.status === "ramping"
                        ? "bg-[#2b95d6]"
                        : selectedStation.status === "curtailed"
                        ? "bg-[#d9822b]"
                        : "bg-[#db3737]"
                    }`}
                  />
                  <span className="uppercase font-semibold text-[11px]">{selectedStation.status}</span>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Primary Fuel</td>
                <td className="px-3 py-1.5 text-[#f5f8fa]">
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
                    style={{
                      backgroundColor: `rgba(${fuel.rgb.join(",")}, 0.2)`,
                      color: fuel.hex,
                      border: `1px solid rgba(${fuel.rgb.join(",")}, 0.4)`,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: fuel.hex }} />
                    {fuel.label}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Operator</td>
                <td className="px-3 py-1.5 text-[#f5f8fa] font-sans font-medium">{selectedStation.operator || "—"}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Grid Region</td>
                <td className="px-3 py-1.5 text-[#2b95d6]">{selectedStation.gridRegion || "—"}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Substation Link</td>
                <td className="px-3 py-1.5 text-[#f5f8fa]">{selectedStation.substationName || "—"}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Hardware / Turbine</td>
                <td className="px-3 py-1.5 text-[#f5f8fa]">{selectedStation.turbineManufacturer || "—"}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Cooling System</td>
                <td className="px-3 py-1.5 text-[#f5f8fa]">{selectedStation.coolingType || "—"}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">CO₂ Intensity</td>
                <td className="px-3 py-1.5">
                  <span
                    className={`font-semibold ${
                      selectedStation.co2IntensityGPerKwh < 50
                        ? "text-[#15b371]"
                        : selectedStation.co2IntensityGPerKwh < 400
                        ? "text-[#d9822b]"
                        : "text-[#db3737]"
                    }`}
                  >
                    {selectedStation.co2IntensityGPerKwh} g CO₂/kWh
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Hourly Emissions</td>
                <td className="px-3 py-1.5 text-[#f5f8fa]">{hourlyCo2Tons} t CO₂/hr</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Annual Footprint</td>
                <td className="px-3 py-1.5 text-[#d9822b]">
                  {selectedStation.annualCo2EmissionsTons
                    ? `${selectedStation.annualCo2EmissionsTons.toLocaleString()} t CO₂/yr`
                    : "—"}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-[#8a9ba8] bg-[#101418]/60">Climate TRACE ID</td>
                <td className="px-3 py-1.5 text-[#15b371]">
                  {selectedStation.climateTraceAssetId ? `🛰️ ${selectedStation.climateTraceAssetId}` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Linked Data Center Nexus (Upstream Demand) */}
        {localComputeDemand && localComputeDemand.nearbyDataCenters.length > 0 && (
          <div className="p-3 bg-[#101418] border border-[#293742] rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#8a9ba8] uppercase tracking-wider flex items-center gap-1.5">
                <Server className="h-3 w-3 text-[#15b371]" />
                Connected Data Centers (100km radius)
              </span>
              <span className="font-mono text-[10px] font-bold text-[#15b371] bg-[#15b371]/10 px-1.5 py-0.5 rounded border border-[#15b371]/30">
                {localComputeDemand.totalLocalComputeLoadMw} MW Load ({localComputeDemand.loadCapacityRatioPercent}%)
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              {localComputeDemand.nearbyDataCenters.slice(0, 4).map((dc) => {
                const dcOp = OPERATOR_COLORS[dc.operator] || OPERATOR_COLORS.Other;
                return (
                  <div
                    key={dc.id}
                    className="flex items-center justify-between p-2 rounded bg-[#182026] border border-[#293742] hover:border-[#394b59] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: dcOp.hex }}
                        />
                        <span className="font-medium text-xs text-[#f5f8fa] truncate max-w-[200px]">
                          {dc.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#8a9ba8] flex items-center gap-1.5 mt-0.5">
                        <span style={{ color: dcOp.hex }}>{dc.operator}</span>
                        <span>•</span>
                        <span>{dc.estimatedPowerMw} MW</span>
                        <span>•</span>
                        <span>{dc.distanceKm} km</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const target = allDataCentersData?.find((d: DataCenter) => d.id === dc.id);
                        if (target) {
                          setSelectedStation(null);
                          setSelectedDataCenter(target);
                          flyToStation(target);
                        }
                      }}
                      className="px-2 py-1 rounded text-[10px] font-mono text-[#2b95d6] bg-[#202b33] border border-[#293742] hover:bg-[#293742] hover:text-white transition-colors"
                    >
                      Locate
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Telemetry & Event Log */}
        <div className="p-3 bg-[#101418] border border-[#293742] rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#8a9ba8] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3 text-[#d9822b]" />
              Telemetry Event Log ({alerts.length})
            </span>
          </div>
          {alerts.length === 0 ? (
            <div className="text-[11px] font-mono text-[#5c7080] p-2 bg-[#182026] rounded border border-[#293742] text-center">
              No anomalies recorded for this facility
            </div>
          ) : (
            <div className="space-y-1.5">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-2 rounded border text-xs font-mono ${
                    alert.severity === "critical"
                      ? "border-[#db3737]/40 bg-[#db3737]/10 text-[#db3737]"
                      : alert.severity === "warning"
                      ? "border-[#d9822b]/40 bg-[#d9822b]/10 text-[#d9822b]"
                      : "border-[#2b95d6]/40 bg-[#2b95d6]/10 text-[#2b95d6]"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{alert.title}</span>
                    <span className="text-[9px] text-[#8a9ba8]">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] text-[#8a9ba8] mt-0.5">{alert.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blueprint Sticky Actions Bar */}
      <div className="sticky bottom-0 p-3 bg-[#101418] border-t border-[#293742] flex items-center gap-2">
        <button
          onClick={() => flyToStation(selectedStation)}
          className="flex-1 py-1.5 rounded text-xs font-mono font-semibold bg-[#137cbd] hover:bg-[#2b95d6] text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Inspect in Canvas</span>
        </button>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${selectedStation.latitude},${selectedStation.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded text-xs font-mono text-[#a7b6c2] bg-[#202b33] hover:bg-[#293742] border border-[#293742] hover:text-white transition-colors flex items-center gap-1"
        >
          <span>Satellite</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}
