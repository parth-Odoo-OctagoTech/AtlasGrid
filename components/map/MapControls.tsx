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
    <div className="absolute right-4 top-16 z-20 flex flex-col gap-2.5 animate-in fade-in slide-in-from-right-3 duration-200">
      {/* 2D/3D Visualization Mode Selector Dock */}
      <div className="flex flex-col rounded-2xl glass-panel p-1 shadow-2xl space-y-0.5">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = visualizationMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setVisualizationMode(m.id)}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-sm scale-105"
                  : "text-gray-400 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {/* Sleek Tooltip on left */}
              <span className="pointer-events-none absolute right-12 hidden whitespace-nowrap rounded-lg bg-slate-950/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block border border-white/10 backdrop-blur-md">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Layer Toggles Group */}
      <div className="flex flex-col rounded-2xl glass-panel p-1 shadow-2xl space-y-0.5">
        {/* Data Centers Toggle */}
        <button
          onClick={() => toggleLayer("datacenters")}
          className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            layerVisibility.datacenters
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm scale-105"
              : "text-gray-500 hover:bg-slate-800/80 hover:text-gray-300"
          }`}
        >
          <Server className="h-4 w-4" />
          <span className="pointer-events-none absolute right-12 hidden whitespace-nowrap rounded-lg bg-slate-950/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block border border-white/10 backdrop-blur-md">
            {layerVisibility.datacenters ? "Hide AI Data Centers" : "Show AI Data Centers (4,382)"}
          </span>
        </button>

        {/* High-Voltage Interconnectors Toggle */}
        <button
          onClick={() => toggleLayer("interconnectors")}
          className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            layerVisibility.interconnectors
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm scale-105"
              : "text-gray-500 hover:bg-slate-800/80 hover:text-gray-300"
          }`}
        >
          <GitFork className="h-4 w-4" />
          <span className="pointer-events-none absolute right-12 hidden whitespace-nowrap rounded-lg bg-slate-950/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block border border-white/10 backdrop-blur-md">
            {layerVisibility.interconnectors ? "Hide Interties" : "Show Interties"}
          </span>
        </button>

        {/* Submarine Cables Toggle */}
        <button
          onClick={() => toggleLayer("subseaCables")}
          className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            layerVisibility.subseaCables
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm scale-105"
              : "text-gray-500 hover:bg-slate-800/80 hover:text-gray-300"
          }`}
        >
          <Cable className="h-4 w-4" />
          <span className="pointer-events-none absolute right-12 hidden whitespace-nowrap rounded-lg bg-slate-950/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block border border-white/10 backdrop-blur-md">
            {layerVisibility.subseaCables ? "Hide Subsea Cables" : "Show Subsea Cables (712)"}
          </span>
        </button>

        {/* 3D Globe Projection Toggle */}
        <button
          onClick={toggleProjectionMode}
          className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            projectionMode === "globe"
              ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-glow-sm scale-105"
              : "text-gray-400 hover:bg-slate-800/80 hover:text-white"
          }`}
        >
          <Globe className={`h-4 w-4 ${projectionMode === "globe" ? "animate-pulse" : ""}`} />
          <span className="pointer-events-none absolute right-12 hidden whitespace-nowrap rounded-lg bg-slate-950/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block border border-white/10 backdrop-blur-md">
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
          className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-slate-800/80 hover:text-white transition-all"
        >
          <MapIcon className="h-4 w-4" />
          <span className="pointer-events-none absolute right-12 hidden whitespace-nowrap rounded-lg bg-slate-950/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block border border-white/10 backdrop-blur-md capitalize">
            Map Style: {basemapStyle === "positron" ? "Light Gray (Clean)" : basemapStyle === "voyager" ? "Topographic Light" : basemapStyle === "osm" ? "OpenStreetMap" : basemapStyle === "satellite" ? "Satellite" : "Dark Gray"}
          </span>
        </button>
      </div>

      {/* Camera Navigation Zoom Group */}
      <div className="flex flex-col rounded-2xl glass-panel p-1 shadow-2xl space-y-0.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 hover:bg-slate-800/80 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 hover:bg-slate-800/80 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          onClick={handleResetBearing}
          title="Reset Bearing & North"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 hover:bg-slate-800/80 hover:text-white transition-all hover:scale-105 active:scale-95"
          style={{ transform: `rotate(${-viewport.bearing}deg)` }}
        >
          <Compass className="h-4 w-4 text-cyan-400" />
        </button>

        <button
          onClick={handleResetWorldView}
          title="Reset Global View"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 hover:bg-slate-800/80 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          <Globe className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
