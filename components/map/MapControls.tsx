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

        {/* High-Voltage Interconnectors Toggle */}
        <button
          onClick={() => toggleLayer("interconnectors")}
          className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
            layerVisibility.interconnectors
              ? "bg-[#2b95d6]/15 text-[#2b95d6] border border-[#2b95d6]/40"
              : "text-[#5c7080] hover:bg-[#202b33] hover:text-[#8a9ba8]"
          }`}
        >
          <GitFork className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute right-10 hidden whitespace-nowrap rounded border border-[#293742] bg-[#101418] px-2 py-0.5 text-[10px] font-mono text-[#f5f8fa] shadow-xl group-hover:block backdrop-blur-md z-30">
            {layerVisibility.interconnectors ? "Layer: Hide Interties" : "Layer: Show Interties"}
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

        {/* Basemap Style Toggle */}
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
            Basemap: {basemapStyle}
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
