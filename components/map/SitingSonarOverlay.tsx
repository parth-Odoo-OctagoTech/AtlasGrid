"use client";

import { useMemo } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import { analyzeSitingSonar } from "@/lib/services/siting-sonar-service";
import { PowerPlant, Substation } from "@/lib/types/power-plant";
import { DataCenter } from "@/lib/types/data-center";
import { 
  Radar, 
  X, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  DollarSign, 
  Download, 
  MapPin, 
  Clock, 
  Activity,
  Layers,
  Sparkles,
  Waves,
  Mountain
} from "lucide-react";

interface SitingSonarOverlayProps {
  plants: PowerPlant[];
  dataCenters: DataCenter[];
  substations: Substation[];
}

export function SitingSonarOverlay({
  plants,
  dataCenters,
  substations,
}: SitingSonarOverlayProps) {
  const sitingSonar = useGridStore((s) => s.sitingSonar);
  const setSitingSonar = useGridStore((s) => s.setSitingSonar);
  const setSitingSonarRadius = useGridStore((s) => s.setSitingSonarRadius);
  const cableLandingStations = useGridStore((s) => s.cableLandingStations);
  const darkFiberCorridors = useGridStore((s) => s.darkFiberCorridors);
  const seismicFaults = useGridStore((s) => s.seismicFaults);
  const floodHazardZones = useGridStore((s) => s.floodHazardZones);
  const earthquakes = useGridStore((s) => s.earthquakes);

  const analysis = useMemo(() => {
    if (!sitingSonar) return null;
    return analyzeSitingSonar({
      lat: sitingSonar.lat,
      lng: sitingSonar.lng,
      radiusKm: sitingSonar.radiusKm,
      plants,
      dataCenters,
      substations,
      cableLandingStations,
      darkFiberCorridors,
      seismicFaults,
      floodHazardZones,
      earthquakes,
    });
  }, [
    sitingSonar,
    plants,
    dataCenters,
    substations,
    cableLandingStations,
    darkFiberCorridors,
    seismicFaults,
    floodHazardZones,
    earthquakes,
  ]);

  if (!sitingSonar || !analysis) return null;

  const handleDownloadMemo = () => {
    const memo = {
      memoType: "AtlasGrid Institutional Greenfield Siting Evaluation",
      generatedAt: new Date().toISOString(),
      centerCoordinates: analysis.center,
      searchRadiusKm: analysis.radiusKm,
      overallScore: analysis.overallScore,
      classification: analysis.overallTier,
      powerProfile: analysis.power,
      gridInterconnection: analysis.grid,
      connectivityAndFiber: analysis.connectivity,
      environmentalHazards: analysis.hazards,
      powerEconomics: analysis.economics,
      existingFacilitiesInRadius: analysis.dataCentersCount,
    };

    const blob = new Blob([JSON.stringify(memo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siting-memo-${analysis.center.lat.toFixed(2)}_${analysis.center.lng.toFixed(2)}-${analysis.radiusKm}km.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTierIV = analysis.overallScore >= 85;
  const isTierIII = analysis.overallScore >= 72 && analysis.overallScore < 85;

  return (
    <div className="absolute top-16 left-4 z-30 w-80 sm:w-96 rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl text-slate-200 animate-in fade-in slide-in-from-top-4 duration-200 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse">
            <Radar className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
              <span>Siting Sonar</span>
              <span>•</span>
              <span>{analysis.radiusKm}km Buffer</span>
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {analysis.center.lat.toFixed(4)}°, {analysis.center.lng.toFixed(4)}°
            </div>
          </div>
        </div>

        <button
          onClick={() => setSitingSonar(null)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Dismiss Sonar Probe"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Radius Selector Pills */}
      <div className="flex items-center gap-1.5 pt-3 pb-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase">Radius:</span>
        {[25, 50, 100, 150].map((r) => (
          <button
            key={r}
            onClick={() => setSitingSonarRadius(r)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
              analysis.radiusKm === r
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {r}km
          </button>
        ))}
      </div>

      {/* Score & Tier Ribbon */}
      <div className="my-2 flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800/80 p-3">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase">Siting Suitability</div>
          <div className="text-xs font-semibold text-white mt-0.5">{analysis.overallTier}</div>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-3xl font-extrabold font-mono ${
              isTierIV ? "text-emerald-400" : isTierIII ? "text-cyan-400" : "text-amber-400"
            }`}
          >
            {analysis.overallScore}
          </span>
          <span className="text-xs font-mono text-slate-500">/100</span>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
        {/* Power Headroom */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>Power Headroom</span>
          </div>
          <div className="text-sm font-bold text-white">
            {analysis.power.totalGenerationMw.toLocaleString()} MW
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            <span>{analysis.power.cleanCfePercentage}% CFE Clean Share</span>
          </div>
        </div>

        {/* Substation POI */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Activity className="h-3 w-3 text-purple-400" />
            <span>Substation POI</span>
          </div>
          <div className="text-sm font-bold text-white truncate" title={analysis.grid.nearestSubstation?.name}>
            {analysis.grid.nearestSubstation?.distanceKm != null ? `${analysis.grid.nearestSubstation.distanceKm} km` : "N/A"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {analysis.grid.nearestSubstation?.voltageKv}kV • ~{analysis.grid.estimatedQueueMonths}mo queue
          </div>
        </div>

        {/* Fiber & Landing Gateway */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Radio className="h-3 w-3 text-indigo-400" />
            <span>Fiber & Subsea</span>
          </div>
          <div className="text-sm font-bold text-white">
            {analysis.connectivity.nearestFiberDistanceKm} km Conduit
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={analysis.connectivity.nearestCls?.name}>
            CLS: {analysis.connectivity.nearestCls ? `${analysis.connectivity.nearestCls.distanceKm}km (${analysis.connectivity.nearestCls.latencyMs}ms)` : "Inland"}
          </div>
        </div>

        {/* Industrial Tariff */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <DollarSign className="h-3 w-3 text-emerald-400" />
            <span>Power OpEx</span>
          </div>
          <div className="text-sm font-bold text-emerald-400">
            ${analysis.economics.tariffUsdPerKwh.toFixed(3)} <span className="text-[10px] text-slate-400">/kWh</span>
          </div>
          <div className="text-[10px] text-slate-400">
            ~${(analysis.economics.annualPowerCost100MwUsd / 1_000_000).toFixed(1)}M/yr (100MW)
          </div>
        </div>
      </div>

      {/* Hazard Status Bar */}
      <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Mountain className="h-3 w-3 text-amber-400" />
          <span>Fault: {analysis.hazards.nearestFaultDistanceKm}km</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Waves className="h-3 w-3 text-blue-400" />
          <span>Flood: {analysis.hazards.floodRiskLevel}</span>
        </div>
        <div className="text-slate-400">
          {analysis.dataCentersCount} DCs Active
        </div>
      </div>

      {/* Export Action */}
      <button
        onClick={handleDownloadMemo}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2 text-xs font-semibold font-mono text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Export Greenfield Siting Memo (JSON)</span>
      </button>
    </div>
  );
}
