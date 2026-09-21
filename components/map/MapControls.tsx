"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { BasemapStyle, VisualizationMode } from "@/lib/types/filters";
import {
  Compass,
  Layers,
  Plus,
  Minus,
  Box,
  CircleDot,
  Flame,
  GitFork,
  Hexagon,
  Globe,
  Map as MapIcon,
  Sun,
  Moon,
  Server,
  Cable,
  Zap,
  Satellite,
  Waves,
  Network,
  Activity,
  Plane,
  ShieldAlert,
} from "lucide-react";

export function MapControls() {
  const viewport = useGridStore((s) => s.viewport);
  const setViewport = useGridStore((s) => s.setViewport);
  const visualizationMode = useGridStore((s) => s.visualizationMode);
  const setVisualizationMode = useGridStore((s) => s.setVisualizationMode);
  const basemapStyle = useGridStore((s) => s.basemapStyle);
  const setBasemapStyle = useGridStore((s) => s.setBasemapStyle);
  const projectionMode = useGridStore((s) => s.projectionMode);
  const toggleProjectionMode = useGridStore((s) => s.toggleProjectionMode);
  const layerVisibility = useGridStore((s) => s.layerVisibility);
  const toggleLayer = useGridStore((s) => s.toggleLayer);

  const handleZoomIn = () => {
    setViewport({
      ...viewport,
      zoom: Math.min(viewport.zoom + 1, 18),
      transitionDuration: 300,
    });
  };

  const handleZoomOut = () => {
    setViewport({
      ...viewport,
      zoom: Math.max(viewport.zoom - 1, 0),
      transitionDuration: 300,
    });
  };

  const handleResetBearing = () => {
    setViewport({
      ...viewport,
      bearing: 0,
      pitch: 0,
      transitionDuration: 500,
    });
  };

  const handleResetWorldView = () => {
    setViewport({
      longitude: 10.0,
      latitude: 25.0,
      zoom: 1.8,
      pitch: 30,
      bearing: 0,
      transitionDuration: 1000,
    });
  };

  const modes: { id: VisualizationMode; label: string; icon: any }[] = [
    { id: "2d_scatter", label: "2D Scatter (Capacity Radius)", icon: CircleDot },
    { id: "3d_column", label: "3D Extrusion (Generation MW)", icon: Box },
    { id: "heatmap_lmp", label: "LMP Nodal Price Heatmap", icon: Flame },
    { id: "hex_density", label: "Hexagon Density Aggregation", icon: Hexagon },
    { id: "siting_score", label: "Site Suitability Siting Score (0-100)", icon: ShieldAlert },
  ];

  return (
    <div className="absolute right-4 top-14 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
      {/* 2D/3D Visualization Mode Selector Dock */}
      <div className="flex flex-col rounded border border-[#293742] bg-[#182026]/95 backdrop-blur-md p-1 shadow-2xl space-y-0.5">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = visualizationMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setVisualizationMode(m.id)}
              className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
                isActive
                  ? "bg-[#202b33] text-[#2b95d6] border border-[#2b95d6]/50"
                  : "text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {/* Tooltip on left */}
              <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Layer Toggles Group */}
      <div className="flex flex-col rounded border border-[#293742] bg-[#182026]/95 backdrop-blur-md p-1 shadow-2xl space-y-0.5">
        {/* Data Centers Toggle */}
        <button
          onClick={() => toggleLayer("datacenters")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.datacenters
              ? "bg-[#15b371]/15 text-[#15b371] border border-[#15b371]/40"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.datacenters ? "Layer: Hide Data Centers" : "Layer: Show Data Centers"}
          </span>
        </button>

        {/* High-Voltage Substations Toggle */}
        <button
          onClick={() => toggleLayer("substations")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.substations
              ? "bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/40"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.substations ? "Layer: Hide Substations (765kV-154kV)" : "Layer: Show Substations"}
          </span>
        </button>

        {/* High-Voltage Grid Transmission Overlay Toggle */}
        <button
          onClick={() => toggleLayer("interconnectors")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.interconnectors
              ? "bg-[#2b95d6]/20 text-[#2b95d6] border border-[#2b95d6]/60 shadow-[0_0_8px_rgba(43,149,214,0.35)]"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
          title="Toggle Grid Transmission Overlay"
        >
          <GitFork className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.interconnectors ? "Grid Overlay: Active (Hide Transmission)" : "Grid Overlay: Show Transmission Grid"}
          </span>
        </button>

        {/* Flood Hazard Inundation Overlay Toggle */}
        <button
          onClick={() => toggleLayer("floodOverlay")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.floodOverlay
              ? "bg-[#06b6d4]/25 text-[#06b6d4] border border-[#06b6d4]/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
          title="Toggle Flood Hazard Overlay (100-Yr Coastal & Riverine Surge Risk)"
        >
          <Waves className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.floodOverlay ? "Flood Overlay: Active (100-Yr Risk Zones)" : "Flood Overlay: Show Hazard Zones"}
          </span>
        </button>

        {/* Submarine Cables Toggle */}
        <button
          onClick={() => toggleLayer("subseaCables")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.subseaCables
              ? "bg-[#2b95d6]/15 text-[#2b95d6] border border-[#2b95d6]/40"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
        >
          <Cable className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.subseaCables ? "Layer: Hide Subsea Cables" : "Layer: Show Subsea Cables"}
          </span>
        </button>

        {/* Terrestrial Dark Fiber Conduits Toggle */}
        <button
          onClick={() => toggleLayer("fiberConduits")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.fiberConduits
              ? "bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/50 shadow-[0_0_8px_rgba(6,182,212,0.35)]"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
          title="Toggle Terrestrial Dark Fiber Conduits"
        >
          <Network className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.fiberConduits ? "Fiber: Hide Dark Fiber Conduits" : "Fiber: Show Dark Fiber Conduits"}
          </span>
        </button>

        {/* Quaternary Active Seismic Fault Lines Toggle */}
        <button
          onClick={() => toggleLayer("seismicFaults")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.seismicFaults
              ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/50 shadow-[0_0_8px_rgba(239,68,68,0.35)]"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
          title="Toggle Quaternary Active Fault Lines (USGS & GEM)"
        >
          <Activity className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.seismicFaults ? "Seismic: Hide Fault Lines" : "Seismic: Show Fault Lines"}
          </span>
        </button>

        {/* Airport Runway Approach Obstacle Cones Toggle */}
        <button
          onClick={() => toggleLayer("flightCorridors")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.flightCorridors
              ? "bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/50 shadow-[0_0_8px_rgba(244,63,94,0.35)]"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
          title="Toggle Airport Flight Approach Corridors (FAA Part 77)"
        >
          <Plane className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.flightCorridors ? "Airspace: Hide Flight Cones" : "Airspace: Show Flight Cones"}
          </span>
        </button>

        {/* Gas Pipeline & Hazmat Rail Hazard Buffers Toggle */}
        <button
          onClick={() => toggleLayer("hazardBuffers")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.hazardBuffers
              ? "bg-[#e11d48]/20 text-[#e11d48] border border-[#e11d48]/50 shadow-[0_0_8px_rgba(225,29,72,0.35)]"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
          title="Toggle High-Pressure Gas Pipelines & Hazmat Rail Blast Buffers"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.hazardBuffers ? "Hazards: Hide Pipeline & Rail Buffers" : "Hazards: Show Pipeline & Rail Buffers"}
          </span>
        </button>

        {/* 3D Globe Projection Toggle */}
        <button
          onClick={toggleProjectionMode}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            projectionMode === "globe"
              ? "bg-[#2b95d6]/20 text-[#2b95d6] border border-[#2b95d6]/50"
              : "text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa]"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {projectionMode === "globe" ? "Projection: 3D Earth Globe" : "Projection: 2D Mercator"}
          </span>
        </button>

        {/* Dedicated Satellite Imagery Mode Direct Toggle */}
        <button
          onClick={() => setBasemapStyle(basemapStyle === "satellite" ? "positron" : "satellite")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            basemapStyle === "satellite"
              ? "bg-[#2b95d6]/25 text-[#2b95d6] border border-[#2b95d6]/70 shadow-[0_0_8px_rgba(43,149,214,0.45)]"
              : "text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa]"
          }`}
          title="Toggle High-Resolution Satellite View (ESRI World Imagery)"
        >
          <Satellite className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {basemapStyle === "satellite" ? "Satellite: Active (ESRI World Imagery)" : "Satellite: Enable Satellite View"}
          </span>
        </button>

        {/* Basemap Style Cycler */}
        <button
          onClick={() =>
            setBasemapStyle(
              basemapStyle === "positron"
                ? "voyager"
                : basemapStyle === "voyager"
                ? "osm"
                : basemapStyle === "osm"
                ? "satellite"
                : basemapStyle === "satellite"
                ? "dark"
                : "positron"
            )
          }
          className="group relative flex h-8 w-8 items-center justify-center rounded text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors"
        >
          <MapIcon className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            Basemap: {basemapStyle.toUpperCase()}
          </span>
        </button>
      </div>

      {/* Camera Navigation Zoom Group */}
      <div className="flex flex-col rounded border border-[#293742] bg-[#182026]/95 backdrop-blur-md p-1 shadow-2xl space-y-0.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="flex h-8 w-8 items-center justify-center rounded text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="flex h-8 w-8 items-center justify-center rounded text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handleResetBearing}
          title="Reset Bearing"
          className="flex h-8 w-8 items-center justify-center rounded text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors"
          style={{ transform: `rotate(${-viewport.bearing}deg)` }}
        >
          <Compass className="h-3.5 w-3.5 text-[#2b95d6]" />
        </button>

        <button
          onClick={handleResetWorldView}
          title="Reset Global View"
          className="flex h-8 w-8 items-center justify-center rounded text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Spatial Telemetry HUD readout */}
      <div className="rounded border border-[#293742] bg-[#101418] px-2 py-1 shadow-lg text-[9px] font-mono text-[#8a9ba8] text-right space-y-0.5">
        <div>{viewport.latitude.toFixed(2)}°N, {viewport.longitude.toFixed(2)}°E</div>
        <div>ZOOM {viewport.zoom.toFixed(1)} // {projectionMode.toUpperCase()}</div>
      </div>
    </div>
  );
}
