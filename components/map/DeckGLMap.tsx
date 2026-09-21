"use client";

import React, { useCallback, useMemo, useRef, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, ColumnLayer, ArcLayer, BitmapLayer, GeoJsonLayer } from "@deck.gl/layers";
import { HeatmapLayer, HexagonLayer } from "@deck.gl/aggregation-layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { MapView, _GlobeView as GlobeView, FlyToInterpolator } from "@deck.gl/core";
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useGridStore } from "@/lib/store/useGridStore";
import { FUEL_CONFIG, FuelType, Interconnector, PowerPlant, Substation, getSubstationColor } from "@/lib/types/power-plant";
import { DataCenter, OPERATOR_COLORS } from "@/lib/types/data-center";
import {
  findLocalGridSupply,
  findSuppliedDataCenters,
} from "@/lib/services/cross-reference-service";
import { StationTooltip } from "./StationTooltip";
import { MapControls } from "./MapControls";
import { MapLegend } from "./MapLegend";

const BASEMAP_STYLES: Record<string, any> = {
  positron: {
    version: 8,
    sources: {
      "esri-light-base": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      },
      "esri-light-labels": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "esri-light-base-layer",
        type: "raster",
        source: "esri-light-base"
      },
      {
        id: "esri-light-labels-layer",
        type: "raster",
        source: "esri-light-labels"
      }
    ]
  },
  voyager: {
    version: 8,
    sources: {
      "esri-topo": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "esri-topo-layer",
        type: "raster",
        source: "esri-topo"
      }
    ]
  },
  osm: {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "osm-tiles-layer",
        type: "raster",
        source: "osm-tiles"
      }
    ]
  },
  satellite: {
    version: 8,
    sources: {
      "esri-imagery": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      },
      "esri-labels": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "esri-imagery-layer",
        type: "raster",
        source: "esri-imagery"
      },
      {
        id: "esri-labels-layer",
        type: "raster",
        source: "esri-labels"
      }
    ]
  },
  dark: {
    version: 8,
    sources: {
      "esri-dark-base": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      },
      "esri-dark-labels": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "esri-dark-base-layer",
        type: "raster",
        source: "esri-dark-base"
      },
      {
        id: "esri-dark-labels-layer",
        type: "raster",
        source: "esri-dark-labels"
      }
    ]
  },
};

interface DeckGLMapProps {
  plants: PowerPlant[];
  interconnectors: Interconnector[];
  dataCenters?: DataCenter[];
  substations?: Substation[];
  cables?: any[];
  isLoading?: boolean;
}

export function DeckGLMap({
  plants,
  interconnectors,
  dataCenters = [],
  substations = [],
  cables = [],
  isLoading,
}: DeckGLMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const viewport = useGridStore((s) => s.viewport);
  const setViewport = useGridStore((s) => s.setViewport);
  const visualizationMode = useGridStore((s) => s.visualizationMode);
  const basemapStyle = useGridStore((s) => s.basemapStyle);
  const projectionMode = useGridStore((s) => s.projectionMode);
  const layerVisibility = useGridStore((s) => s.layerVisibility);
  const setSelectedStation = useGridStore((s) => s.setSelectedStation);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);
  const setSelectedSubstation = useGridStore((s) => s.setSelectedSubstation);
  const selectedStation = useGridStore((s) => s.selectedStation);
  const selectedDataCenter = useGridStore((s) => s.selectedDataCenter);
  const selectedSubstation = useGridStore((s) => s.selectedSubstation);
  const setHoveredStation = useGridStore((s) => s.setHoveredStation);
  const setHoveredDataCenter = useGridStore((s) => s.setHoveredDataCenter);
  const setHoveredSubstation = useGridStore((s) => s.setHoveredSubstation);
  const setHoveredFloodZone = useGridStore((s) => s.setHoveredFloodZone);
  const filters = useGridStore((s) => s.filters);

  const isGlobe = projectionMode === "globe";

  // Views Configuration (3D Globe vs 2D Mercator)
  const views = useMemo(() => {
    return isGlobe
      ? new GlobeView({ id: "globe", controller: true, resolution: 10 })
      : new MapView({ id: "map", controller: true, repeat: true });
  }, [isGlobe]);

  // Filter plants according to active filters in memory for instantaneous 60fps responsiveness
  const filteredPlants = useMemo(() => {
    if (
      filters.infrastructureType === "datacenters" ||
      filters.infrastructureType === "substations" ||
      !layerVisibility.plants
    ) {
      return [];
    }

    let list = plants;

    if (filters.fuelTypes.length > 0) {
      const fuelSet = new Set(filters.fuelTypes);
      list = list.filter((p) => fuelSet.has(p.fuelType));
    }

    if (filters.minCapacityMw > 0) {
      list = list.filter((p) => p.capacityMw >= filters.minCapacityMw);
    }
    if (filters.maxCapacityMw < 30000) {
      list = list.filter((p) => p.capacityMw <= filters.maxCapacityMw);
    }

    if (filters.statuses.length > 0) {
      const statusSet = new Set(filters.statuses);
      list = list.filter((p) => statusSet.has(p.status));
    }

    if (filters.region && filters.region !== "GLOBAL") {
      if (filters.region === "GUJARAT") {
        list = list.filter(
          (p) =>
            p.substationName?.toLowerCase().includes("gujarat") ||
            (p.latitude >= 20.0 && p.latitude <= 24.8 && p.longitude >= 68.0 && p.longitude <= 74.8 && p.country === "IN")
        );
      } else if (filters.region === "NEPAL_NEA") {
        list = list.filter(
          (p) => p.gridRegion === "NEPAL_NEA" || p.country === "NP" || p.countryName === "Nepal"
        );
      } else if (filters.region === "KOREA_KPX") {
        list = list.filter(
          (p) => p.gridRegion === "KOREA_KPX" || p.country === "KR" || p.countryName === "South Korea"
        );
      } else {
        list = list.filter(
          (p) => p.gridRegion === filters.region || p.country === filters.region
        );
      }
    }

    if (filters.priceFilter === "spikes") {
      list = list.filter((p) => p.spotPriceMwh >= 150);
    } else if (filters.priceFilter === "negative") {
      list = list.filter((p) => p.spotPriceMwh < 0);
    } else if (filters.priceFilter === "normal") {
      list = list.filter((p) => p.spotPriceMwh >= 0 && p.spotPriceMwh < 150);
    }

    if (filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.operator.toLowerCase().includes(q) ||
          p.countryName.toLowerCase().includes(q) ||
          p.gridRegion.toLowerCase().includes(q) ||
          p.fuelType.toLowerCase().includes(q) ||
          (p.substationName && p.substationName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [plants, filters, layerVisibility.plants]);

  // Filter data centers in memory
  const filteredDataCenters = useMemo(() => {
    if (
      filters.infrastructureType === "plants" ||
      filters.infrastructureType === "substations" ||
      !layerVisibility.datacenters
    ) {
      return [];
    }

    let list = dataCenters;

    if (filters.dcOperators && filters.dcOperators.length > 0) {
      const opSet = new Set(filters.dcOperators);
      list = list.filter((dc) => opSet.has(dc.operator));
    }

    if (filters.dcCategories && filters.dcCategories.length > 0) {
      const catSet = new Set(filters.dcCategories);
      list = list.filter((dc) => catSet.has(dc.category));
    }

    if (filters.minCapacityMw > 0) {
      list = list.filter((dc) => dc.estimatedPowerMw >= filters.minCapacityMw);
    }

    if (filters.region && filters.region !== "GLOBAL") {
      if (filters.region === "GUJARAT") {
        list = list.filter(
          (dc) =>
            dc.country === "India" ||
            (dc.latitude >= 20.0 && dc.latitude <= 24.8 && dc.longitude >= 68.0 && dc.longitude <= 74.8)
        );
      } else if (filters.region === "NEPAL_NEA") {
        list = list.filter(
          (dc) => dc.country === "NP" || dc.country === "Nepal" || dc.countryName === "Nepal"
        );
      } else if (filters.region === "KOREA_KPX") {
        list = list.filter(
          (dc) => dc.country === "KR" || dc.country === "South Korea" || dc.countryName === "South Korea" || dc.region?.includes("Korea")
        );
      } else {
        const regLow = filters.region.toLowerCase();
        list = list.filter(
          (dc) =>
            dc.region.toLowerCase().includes(regLow) ||
            dc.country.toLowerCase().includes(regLow)
        );
      }
    }

    if (filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (dc) =>
          dc.name.toLowerCase().includes(q) ||
          dc.operator.toLowerCase().includes(q) ||
          dc.country.toLowerCase().includes(q) ||
          dc.region.toLowerCase().includes(q)
      );
    }

    return list;
  }, [dataCenters, filters, layerVisibility.datacenters]);

  // Filter substations in memory according to active filters and visibility
  const filteredSubstations = useMemo(() => {
    if (
      filters.infrastructureType === "datacenters" ||
      filters.infrastructureType === "plants" ||
      !layerVisibility.substations
    ) {
      return [];
    }

    let list = substations;

    if (filters.region && filters.region !== "GLOBAL") {
      if (filters.region === "GUJARAT") {
        list = list.filter(
          (s) =>
            s.country === "IN" &&
            s.latitude >= 20.0 &&
            s.latitude <= 24.8 &&
            s.longitude >= 68.0 &&
            s.longitude <= 74.8
        );
      } else if (filters.region === "NEPAL_NEA") {
        list = list.filter(
          (s) =>
            s.gridRegion === "NEPAL_NEA" ||
            s.country === "NP" ||
            s.countryName === "Nepal"
        );
      } else if (filters.region === "KOREA_KPX") {
        list = list.filter(
          (s) =>
            s.gridRegion === "KOREA_KPX" ||
            s.country === "KR" ||
            s.countryName === "South Korea"
        );
      } else if (filters.region === "JAPAN_TEPCO") {
        list = list.filter(
          (s) =>
            s.country === "JP" ||
            s.countryName === "Japan" ||
            s.gridRegion?.includes("TEPCO")
        );
      } else {
        list = list.filter(
          (s) => s.gridRegion === filters.region || s.country === filters.region
        );
      }
    }

    if (filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q) ||
          s.countryName.toLowerCase().includes(q) ||
          s.gridRegion.toLowerCase().includes(q) ||
          String(s.voltageKv).includes(q)
      );
    }

    return list;
  }, [substations, filters, layerVisibility.substations]);

  // Memoized Flood Hazard Overlay: identifies low-elevation coastal storm surge & riverine inundation zones
  const floodHazardZones = useMemo(() => {
    if (!layerVisibility.floodOverlay) return [];

    const zones: {
      id: string;
      name: string;
      coordinates: [number, number];
      riskLevel: "High" | "Moderate";
      hazardType: string;
      elevationMeters: number;
      zoneCode: string;
    }[] = [];

    // Low-elevation coastal / tidal / riverine basin corridors for Data Centers
    for (const dc of dataCenters) {
      const isDutchLowland = dc.country === "NL";
      const isMidAtlanticCoastal =
        dc.country === "US" &&
        dc.latitude >= 38.0 &&
        dc.latitude <= 40.0 &&
        dc.longitude >= -78.0 &&
        dc.longitude <= -76.0;
      const isSfBayCoastal =
        dc.country === "US" &&
        dc.latitude >= 37.2 &&
        dc.latitude <= 37.8 &&
        dc.longitude >= -122.5 &&
        dc.longitude <= -121.8;
      const isThames =
        dc.country === "GB" &&
        dc.latitude >= 51.3 &&
        dc.latitude <= 51.7 &&
        dc.longitude >= -0.5 &&
        dc.longitude <= 0.6;
      const isTokyoBay =
        dc.country === "JP" &&
        dc.latitude >= 35.2 &&
        dc.latitude <= 35.8 &&
        dc.longitude >= 139.5 &&
        dc.longitude <= 140.2;
      const isSingaporeStrait = dc.country === "SG";
      const isMumbaiCreek =
        dc.country === "IN" &&
        dc.latitude >= 18.8 &&
        dc.latitude <= 19.3 &&
        dc.longitude >= 72.7 &&
        dc.longitude <= 73.1;
      const isBusanPort =
        dc.country === "KR" &&
        dc.latitude >= 35.0 &&
        dc.latitude <= 35.3 &&
        dc.longitude >= 128.9 &&
        dc.longitude <= 129.2;

      if (
        isDutchLowland ||
        isMidAtlanticCoastal ||
        isSfBayCoastal ||
        isThames ||
        isTokyoBay ||
        isSingaporeStrait ||
        isMumbaiCreek ||
        isBusanPort
      ) {
        zones.push({
          id: `flood-zone-dc-${dc.id}`,
          name: dc.name,
          coordinates: [dc.longitude, dc.latitude],
          riskLevel: isDutchLowland || isSingaporeStrait || isMumbaiCreek ? "High" : "Moderate",
          hazardType: isDutchLowland
            ? "Below-Sea-Level Polder Surge Inundation Zone"
            : "Coastal Storm Surge & Estuarine Overflow Basin",
          elevationMeters: isDutchLowland ? -2 : isSingaporeStrait ? 4 : isMumbaiCreek ? 5 : 12,
          zoneCode: isDutchLowland || isSingaporeStrait || isMumbaiCreek ? "FEMA Zone AE (High Risk)" : "FEMA Zone Shaded X (500-Yr Buffer)",
        });
      }
    }

    // Power stations with coastal seawater or riverine cooling
    for (const p of plants) {
      if (p.coolingType === "seawater" || p.coolingType === "river") {
        zones.push({
          id: `flood-zone-plant-${p.id}`,
          name: p.name,
          coordinates: [p.longitude, p.latitude],
          riskLevel: p.coolingType === "seawater" ? "High" : "Moderate",
          hazardType:
            p.coolingType === "seawater"
              ? "Coastal Tidal Surge & Estuarine Overflow"
              : "Riverine 100-Year Floodplain Corridor",
          elevationMeters: p.coolingType === "seawater" ? 3 : 15,
          zoneCode: "FEMA Zone AE (Riparian / Coastal)",
        });
      }
    }

    return zones;
  }, [layerVisibility.floodOverlay, dataCenters, plants]);

  // Initialize MapLibre GL Basemap (Mercator mode)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const currentStyle = BASEMAP_STYLES[basemapStyle] || BASEMAP_STYLES.dark;

    const map = new Map({
      container: mapContainerRef.current,
      style: currentStyle,
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: viewport.pitch,
      bearing: viewport.bearing,
      interactive: false,
      attributionControl: false,
    });

    map.on("load", () => {
      map.resize();
    });

    map.on("error", (e) => {
      console.warn("MapLibre map notice:", e);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [basemapStyle]);

  // Sync MapLibre viewport with Deck.gl
  const onViewStateChange = useCallback(
    ({ viewState }: { viewState: any }) => {
      setViewport({
        longitude: viewState.longitude,
        latitude: viewState.latitude,
        zoom: viewState.zoom,
        pitch: viewState.pitch ?? 0,
        bearing: viewState.bearing ?? 0,
        transitionDuration: 0,
      });

      if (mapRef.current && !isGlobe) {
        mapRef.current.jumpTo({
          center: [viewState.longitude, viewState.latitude],
          zoom: viewState.zoom,
          pitch: viewState.pitch ?? 0,
          bearing: viewState.bearing ?? 0,
        });
      }
    },
    [setViewport, isGlobe]
  );

  const isLightMode =
    basemapStyle === "positron" ||
    basemapStyle === "voyager" ||
    basemapStyle === "osm";

  // Deck.gl Layer Construction
  const layers = useMemo(() => {
    const activeLayers = [];

    // 0. 3D Globe Basemap Surface Imagery (when in Globe projection mode)
    if (isGlobe) {
      const globeTileUrl =
        basemapStyle === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : basemapStyle === "dark"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          : basemapStyle === "voyager"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          : basemapStyle === "osm"
          ? "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

      activeLayers.push(
        new TileLayer({
          id: `globe-basemap-surface-${basemapStyle}`,
          data: globeTileUrl,
          minZoom: 0,
          maxZoom: 19,
          tileSize: 256,
          renderSubLayers: (subProps: any) => {
            const bbox: any = subProps.tile.bbox;
            const west = typeof bbox.west === "number" ? bbox.west : bbox[0];
            const south = typeof bbox.south === "number" ? bbox.south : bbox[1];
            const east = typeof bbox.east === "number" ? bbox.east : bbox[2];
            const north = typeof bbox.north === "number" ? bbox.north : bbox[3];

            return new BitmapLayer(subProps, {
              data: undefined,
              image: subProps.data,
              bounds: [west, south, east, north],
            });
          },
        })
      );
    }

    // 1. 2D Scatterplot Layer
    if (visualizationMode === "2d_scatter" && layerVisibility.plants) {
      activeLayers.push(
        new ScatterplotLayer<PowerPlant>({
          id: "plants-scatter-2d",
          data: filteredPlants,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: (d) => {
            const base = Math.sqrt(d.capacityMw) * 140;
            return Math.max(1500, Math.min(base, 50000));
          },
          getFillColor: (d) => {
            const meta = FUEL_CONFIG[d.fuelType] || FUEL_CONFIG.other;
            const opacity = d.status === "outage" ? 60 : 230;
            return [...meta.rgb, opacity] as [number, number, number, number];
          },
          getLineColor: (d) => {
            if (d.spotPriceMwh >= 150) return [239, 68, 68, 255]; // Red glow
            if (d.spotPriceMwh < 0) return [34, 197, 94, 255]; // Green negative price
            return isLightMode ? [15, 23, 42, 180] : [255, 255, 255, 110];
          },
          stroked: true,
          lineWidthMinPixels: 1.5,
          radiusMinPixels: 4,
          radiusMaxPixels: 28,
          pickable: true,
          autoHighlight: true,
          highlightColor: [56, 189, 248, 220],
          updateTriggers: {
            getFillColor: [filteredPlants],
            getLineColor: [filteredPlants, isLightMode],
            getRadius: [filteredPlants],
          },
        })
      );
    }

    // 2. 3D Extruded Column Layer
    if (visualizationMode === "3d_column" && layerVisibility.plants) {
      activeLayers.push(
        new ColumnLayer<PowerPlant>({
          id: "plants-columns-3d",
          data: filteredPlants,
          getPosition: (d) => [d.longitude, d.latitude],
          getElevation: (d) => Math.min(d.currentOutputMw * 40, 750000),
          getFillColor: (d) => {
            const meta = FUEL_CONFIG[d.fuelType] || FUEL_CONFIG.other;
            return [...meta.rgb, 240] as [number, number, number, number];
          },
          getLineColor: [255, 255, 255, 140],
          radius: 5000,
          diskResolution: 16,
          extruded: true,
          pickable: true,
          autoHighlight: true,
          highlightColor: [56, 189, 248, 230],
          elevationScale: 1,
          updateTriggers: {
            getElevation: [filteredPlants],
            getFillColor: [filteredPlants],
          },
        })
      );
    }

    // 3. LMP Nodal Pricing Heatmap Layer
    if (visualizationMode === "heatmap_lmp" || layerVisibility.lmpHeatmap) {
      activeLayers.push(
        new HeatmapLayer<PowerPlant>({
          id: "lmp-pricing-heatmap",
          data: filteredPlants,
          getPosition: (d) => [d.longitude, d.latitude],
          getWeight: (d) => Math.max(5, d.spotPriceMwh + 25),
          radiusPixels: 45,
          intensity: 1.4,
          threshold: 0.05,
          colorRange: [
            [16, 185, 129, 25],   // Low / Green
            [59, 130, 246, 85],   // Normal
            [234, 179, 8, 140],   // Moderate
            [249, 115, 22, 190],  // High
            [239, 68, 68, 240],   // Extreme Spike
          ],
        })
      );
    }

    // 4. Hexagon Generation Density Aggregation Layer
    if (visualizationMode === "hex_density" || layerVisibility.densityHex) {
      activeLayers.push(
        new HexagonLayer<PowerPlant>({
          id: "grid-density-hexbins",
          data: filteredPlants,
          getPosition: (d) => [d.longitude, d.latitude],
          radius: 35000,
          elevationScale: 40,
          extruded: true,
          pickable: true,
          autoHighlight: true,
          colorRange: [
            [15, 23, 42, 180],
            [14, 116, 144, 200],
            [6, 182, 212, 220],
            [56, 189, 248, 235],
            [234, 179, 8, 245],
            [239, 68, 68, 255],
          ],
        })
      );
    }

    // 5. High-Voltage Transmission Interconnector Arcs
    if (layerVisibility.interconnectors && interconnectors.length > 0) {
      activeLayers.push(
        new ArcLayer<Interconnector>({
          id: "transmission-interties-arc",
          data: interconnectors,
          getSourcePosition: (d) => d.source,
          getTargetPosition: (d) => d.target,
          getSourceColor: (d) =>
            d.currentFlowMw >= 0 ? [168, 85, 247, 220] : [6, 182, 212, 220],
          getTargetColor: (d) =>
            d.currentFlowMw >= 0 ? [6, 182, 212, 220] : [168, 85, 247, 220],
          getWidth: (d) => Math.max(2.5, Math.sqrt(Math.abs(d.capacityMw)) * 0.08),
          getHeight: 0.35,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 255],
        })
      );
    }

    // 6. Submarine Fiber-Optic Cables Layer (TeleGeography Global Dataset from GE view)
    if (layerVisibility.subseaCables && cables && cables.length > 0) {
      activeLayers.push(
        new GeoJsonLayer({
          id: "subsea-fiber-cables",
          data: cables,
          stroked: true,
          filled: false,
          lineWidthMinPixels: 1.5,
          getLineColor: isLightMode ? [2, 132, 199, 210] : [6, 182, 212, 160],
          getLineWidth: 2,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 255],
        })
      );
    }

    // 6b. Flood Hazard Inundation Risk Overlay (Coastal Storm Surge & 100-Yr Inundation Buffers)
    if (layerVisibility.floodOverlay && floodHazardZones && floodHazardZones.length > 0) {
      activeLayers.push(
        new ScatterplotLayer({
          id: "flood-hazard-zones-outer",
          data: floodHazardZones,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => (d.riskLevel === "High" ? 24000 : 16000),
          getFillColor: (d: any) =>
            d.riskLevel === "High" ? [6, 182, 212, 65] : [14, 165, 233, 40],
          getLineColor: (d: any) =>
            d.riskLevel === "High" ? [34, 211, 238, 220] : [56, 189, 248, 180],
          stroked: true,
          lineWidthMinPixels: 1.5,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 255],
        })
      );

      activeLayers.push(
        new ScatterplotLayer({
          id: "flood-hazard-zones-core",
          data: floodHazardZones.filter((z) => z.riskLevel === "High"),
          getPosition: (d: any) => d.coordinates,
          getRadius: 8000,
          getFillColor: [6, 182, 212, 95],
          getLineColor: [255, 255, 255, 240],
          stroked: true,
          lineWidthMinPixels: 2,
          pickable: true,
        })
      );
    }

    // 7. Global Data Centers Layer (4,351 Facilities from GE view)
    if (layerVisibility.datacenters && filteredDataCenters && filteredDataCenters.length > 0) {
      activeLayers.push(
        new ScatterplotLayer<DataCenter>({
          id: "datacenters-nodes",
          data: filteredDataCenters,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: (d) => Math.max(1200, Math.sqrt(d.estimatedPowerMw) * 250),
          getFillColor: (d) => {
            const col = OPERATOR_COLORS[d.operator] || OPERATOR_COLORS.Other;
            return [...col.rgb, 230] as [number, number, number, number];
          },
          getLineColor: isLightMode ? [15, 23, 42, 220] : [255, 255, 255, 200],
          stroked: true,
          lineWidthMinPixels: 1.5,
          radiusMinPixels: 4,
          radiusMaxPixels: 24,
          pickable: true,
          autoHighlight: true,
          highlightColor: [56, 189, 248, 255],
          updateTriggers: {
            getFillColor: [filteredDataCenters],
            getLineColor: [filteredDataCenters, isLightMode],
            getRadius: [filteredDataCenters],
          },
        })
      );
    }

    // 8. Dynamic Radial Local Grid Supply Arcs Layer (Real-time Cross-Referencing)
    if (selectedDataCenter && plants.length > 0) {
      const supply = findLocalGridSupply(selectedDataCenter, plants, 120);
      const arcData = supply.supplyingPlants.map((plant) => ({
        id: `arc-supply-${plant.id}`,
        source: [plant.longitude, plant.latitude] as [number, number],
        target: [selectedDataCenter.longitude, selectedDataCenter.latitude] as [number, number],
        plant,
      }));

      activeLayers.push(
        new ArcLayer({
          id: "dynamic-local-grid-supply-arcs",
          data: arcData,
          getSourcePosition: (d: any) => d.source,
          getTargetPosition: (d: any) => d.target,
          getSourceColor: (d: any) => {
            const fuel = FUEL_CONFIG[d.plant.fuelType as FuelType] || FUEL_CONFIG.other;
            return [...fuel.rgb, 240] as [number, number, number, number];
          },
          getTargetColor: [6, 182, 212, 255],
          getWidth: (d: any) => Math.max(3, Math.sqrt(d.plant.capacityMw) * 0.08),
          getHeight: 0.35,
          pickable: false,
        })
      );
    } else if (selectedStation && dataCenters.length > 0) {
      const demand = findSuppliedDataCenters(selectedStation, dataCenters, 120);
      const arcData = demand.nearbyDataCenters.map((dc) => ({
        id: `arc-demand-${dc.id}`,
        source: [selectedStation.longitude, selectedStation.latitude] as [number, number],
        target: [dc.longitude, dc.latitude] as [number, number],
        dc,
      }));

      activeLayers.push(
        new ArcLayer({
          id: "dynamic-local-compute-demand-arcs",
          data: arcData,
          getSourcePosition: (d: any) => d.source,
          getTargetPosition: (d: any) => d.target,
          getSourceColor: [16, 185, 129, 230],
          getTargetColor: [59, 130, 246, 255],
          getWidth: (d: any) => Math.max(3, Math.sqrt(d.dc.estimatedPowerMw) * 0.25),
          getHeight: 0.35,
          pickable: false,
        })
      );
    }

    // 9. High-Voltage Substations Layer (765kV, 500kV, 400kV, 345kV, 275kV, etc.)
    if (layerVisibility.substations && filteredSubstations && filteredSubstations.length > 0) {
      activeLayers.push(
        new ScatterplotLayer<Substation>({
          id: "substations-nodes",
          data: filteredSubstations,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: (d) => Math.max(1200, Math.sqrt(d.voltageKv) * 160),
          getFillColor: (d) => {
            const col = getSubstationColor(d.voltageKv);
            return [...col.rgb, 210] as [number, number, number, number];
          },
          getLineColor: (d) => {
            const col = getSubstationColor(d.voltageKv);
            return [...col.rgb, 255] as [number, number, number, number];
          },
          stroked: true,
          lineWidthMinPixels: 2,
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 255],
          updateTriggers: {
            getFillColor: [filteredSubstations],
            getLineColor: [filteredSubstations],
            getRadius: [filteredSubstations],
          },
        })
      );
    }

    return activeLayers;
  }, [
    visualizationMode,
    layerVisibility,
    filteredPlants,
    interconnectors,
    filteredDataCenters,
    filteredSubstations,
    cables,
    isGlobe,
    basemapStyle,
    isLightMode,
    selectedStation,
    selectedDataCenter,
    selectedSubstation,
    plants,
    dataCenters,
    filters.infrastructureType,
    floodHazardZones,
  ]);

  // Click handler on map features
  const handleDeckClick = useCallback(
    (info: any) => {
      if (info.object) {
        if ("fuelType" in info.object) {
          setSelectedStation(info.object as PowerPlant);
        } else if ("estimatedPowerMw" in info.object) {
          setSelectedDataCenter(info.object as DataCenter);
        } else if ("voltageKv" in info.object) {
          setSelectedSubstation(info.object as Substation);
        }
      }
    },
    [setSelectedStation, setSelectedDataCenter, setSelectedSubstation]
  );

  // Hover handler for interactive HUD tooltip
  const handleDeckHover = useCallback(
    (info: any) => {
      if (info.object) {
        if ("hazardType" in info.object) {
          setHoveredFloodZone(info.object, { x: info.x, y: info.y });
          setHoveredStation(null, null);
          setHoveredDataCenter(null, null);
          setHoveredSubstation(null, null);
        } else if ("fuelType" in info.object) {
          setHoveredStation(info.object as PowerPlant, { x: info.x, y: info.y });
          setHoveredDataCenter(null, null);
          setHoveredSubstation(null, null);
          setHoveredFloodZone(null, null);
        } else if ("estimatedPowerMw" in info.object) {
          setHoveredDataCenter(info.object as DataCenter, { x: info.x, y: info.y });
          setHoveredStation(null, null);
          setHoveredSubstation(null, null);
          setHoveredFloodZone(null, null);
        } else if ("voltageKv" in info.object) {
          setHoveredSubstation(info.object as Substation, { x: info.x, y: info.y });
          setHoveredStation(null, null);
          setHoveredDataCenter(null, null);
          setHoveredFloodZone(null, null);
        }
      } else {
        setHoveredStation(null, null);
        setHoveredDataCenter(null, null);
        setHoveredSubstation(null, null);
        setHoveredFloodZone(null, null);
      }
    },
    [setHoveredStation, setHoveredDataCenter, setHoveredSubstation, setHoveredFloodZone]
  );

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        isGlobe
          ? isLightMode
            ? "bg-[#0b1329]"
            : "bg-[#030712]"
          : isLightMode
          ? "bg-slate-100"
          : "bg-background"
      }`}
    >
      {/* Atmosphere Background for Globe Mode */}
      {isGlobe && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isLightMode
              ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/85 to-[#050b18]"
              : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950/80 to-[#020617]"
          }`}
        />
      )}

      {/* MapLibre GL Background Container (Active in 2D Mercator Mode) */}
      <div
        ref={mapContainerRef}
        className={`absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300 ${
          isGlobe ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
      />

      {/* Deck.gl Canvas Overlay (3D Globe / 2D Mercator) */}
      <DeckGL
        views={views}
        viewState={{
          ...viewport,
          transitionInterpolator: viewport.transitionDuration ? new FlyToInterpolator() : undefined,
        }}
        onViewStateChange={onViewStateChange}
        controller={{
          dragRotate: true,
          touchRotate: true,
          keyboard: true,
          doubleClickZoom: true,
        }}
        layers={layers}
        onClick={handleDeckClick}
        onHover={handleDeckHover}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "default")}
      />

      {/* Interactive HUD Elements Overlay */}
      <StationTooltip />
      <MapControls />
      <MapLegend />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <div className="font-mono text-sm text-cyan-400">
              Loading Global Infrastructure Telemetry...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckGLMap;
