import { create } from "zustand";
import { BasemapStyle, FilterState, InfrastructureType, ProjectionMode, ViewportState, VisualizationMode } from "../types/filters";
import { FuelType, Interconnector, PowerPlant, StationStatus } from "../types/power-plant";
import { DataCenter } from "../types/data-center";
import { GridAlert, GridSummary } from "../types/telemetry";

export interface LayerVisibility {
  plants: boolean;
  datacenters: boolean;
  subseaCables: boolean;
  lmpHeatmap: boolean;
  interconnectors: boolean;
  densityHex: boolean;
  labels: boolean;
}

export const INITIAL_FILTERS: FilterState = {
  infrastructureType: "all",
  fuelTypes: [],
  dcOperators: [],
  dcCategories: [],
  minCapacityMw: 0,
  maxCapacityMw: 30000,
  statuses: [],
  region: "GLOBAL",
  priceFilter: "all",
  searchQuery: "",
};

export const DEFAULT_VIEWPORT: ViewportState = {
  longitude: 10.0,
  latitude: 25.0,
  zoom: 1.8,
  pitch: 30,
  bearing: 0,
};

interface GridStoreState {
  // Selection & Inspector
  selectedStationId: string | null;
  selectedStation: PowerPlant | null;
  selectedDataCenter: DataCenter | null;
  isInspectorOpen: boolean;
  isAlertsOpen: boolean;
  isAnalyticsOpen: boolean;
  isSearchOpen: boolean;
  isDcFleetOpen: boolean;

  // Viewport & Map Config
  viewport: ViewportState;
  visualizationMode: VisualizationMode;
  basemapStyle: BasemapStyle;
  projectionMode: ProjectionMode;
  layerVisibility: LayerVisibility;

  // Hover Tooltip
  hoveredStation: PowerPlant | null;
  hoveredDataCenter: DataCenter | null;
  hoverCoordinates: { x: number; y: number } | null;

  // Filters
  filters: FilterState;

  // Data Centers
  dataCenters: DataCenter[];

  // Live Telemetry & Alerts
  telemetrySummary: GridSummary | null;
  liveAlerts: GridAlert[];
  realtimeConnected: boolean;

  // Replay Scrubber
  isReplayMode: boolean;
  replayHour: number; // 0 to 24
  isReplayPlaying: boolean;

  // Actions
  setSelectedStation: (station: PowerPlant | null) => void;
  setSelectedDataCenter: (dc: DataCenter | null) => void;
  setDataCenters: (dcs: DataCenter[]) => void;
  selectStationById: (id: string | null, plants?: PowerPlant[]) => void;
  setHoveredStation: (
    station: PowerPlant | null,
    coords?: { x: number; y: number } | null
  ) => void;
  setHoveredDataCenter: (
    dc: DataCenter | null,
    coords?: { x: number; y: number } | null
  ) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setBasemapStyle: (style: BasemapStyle) => void;
  setProjectionMode: (mode: ProjectionMode) => void;
  toggleProjectionMode: () => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setInfrastructureType: (type: InfrastructureType) => void;
  toggleFuelType: (fuel: FuelType) => void;
  toggleDcOperator: (operator: string) => void;
  toggleDcCategory: (category: string) => void;
  toggleStatus: (status: StationStatus) => void;
  resetFilters: () => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  flyToStation: (station: PowerPlant | DataCenter) => void;
  flyToCoordinates: (
    lng: number,
    lat: number,
    zoom?: number,
    pitch?: number,
    bearing?: number
  ) => void;
  setTelemetrySummary: (summary: GridSummary) => void;
  addAlert: (alert: GridAlert) => void;
  dismissAlert: (alertId: string) => void;
  setRealtimeConnected: (connected: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setAlertsOpen: (open: boolean) => void;
  setAnalyticsOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setDcFleetOpen: (open: boolean) => void;
  setReplayMode: (isReplay: boolean) => void;
  setReplayHour: (hour: number) => void;
  setReplayPlaying: (isPlaying: boolean) => void;
}

export const useGridStore = create<GridStoreState>((set, get) => ({
  selectedStationId: null,
  selectedStation: null,
  selectedDataCenter: null,
  isInspectorOpen: false,
  isAlertsOpen: false,
  isAnalyticsOpen: false,
  isSearchOpen: false,
  isDcFleetOpen: false,

  viewport: DEFAULT_VIEWPORT,
  visualizationMode: "2d_scatter",
  basemapStyle: "positron",
  projectionMode: "globe",
  layerVisibility: {
    plants: true,
    datacenters: true,
    subseaCables: false,
    lmpHeatmap: false,
    interconnectors: true,
    densityHex: false,
    labels: true,
  },

  hoveredStation: null,
  hoveredDataCenter: null,
  hoverCoordinates: null,

  filters: INITIAL_FILTERS,
  dataCenters: [],

  telemetrySummary: null,
  liveAlerts: [],
  realtimeConnected: false,

  isReplayMode: false,
  replayHour: 12,
  isReplayPlaying: false,

  setSelectedStation: (station) =>
    set({
      selectedStation: station,
      selectedDataCenter: null,
      selectedStationId: station ? station.id : null,
      isInspectorOpen: !!station,
    }),

  setSelectedDataCenter: (dc) =>
    set({
      selectedDataCenter: dc,
      selectedStation: null,
      selectedStationId: dc ? dc.id : null,
      isInspectorOpen: !!dc,
    }),

  setDataCenters: (dcs) => set({ dataCenters: dcs }),

  selectStationById: (id, plants) => {
    if (!id) {
      set({ selectedStationId: null, selectedStation: null, selectedDataCenter: null, isInspectorOpen: false });
      return;
    }
    if (plants) {
      const found = plants.find((p) => p.id === id);
      if (found) {
        set({ selectedStationId: id, selectedStation: found, selectedDataCenter: null, isInspectorOpen: true });
        get().flyToStation(found);
        return;
      }
    }
    const dcFound = get().dataCenters.find((d) => d.id === id);
    if (dcFound) {
      set({ selectedStationId: id, selectedDataCenter: dcFound, selectedStation: null, isInspectorOpen: true });
      get().flyToStation(dcFound);
      return;
    }
    set({ selectedStationId: id, isInspectorOpen: true });
  },

  setHoveredStation: (station, coords) =>
    set({
      hoveredStation: station,
      hoverCoordinates: coords || null,
    }),

  setHoveredDataCenter: (dc, coords) =>
    set({
      hoveredDataCenter: dc,
      hoverCoordinates: coords || null,
    }),

  setVisualizationMode: (mode) => {
    const is3D = mode === "3d_column";
    const isHeatmap = mode === "heatmap_lmp";
    const isHex = mode === "hex_density";

    set((state) => ({
      visualizationMode: mode,
      viewport: {
        ...state.viewport,
        pitch: is3D ? 55 : isHeatmap || isHex ? 20 : 35,
        bearing: is3D ? 20 : 0,
        transitionDuration: 1000,
      },
      layerVisibility: {
        ...state.layerVisibility,
        plants: !isHex,
        lmpHeatmap: isHeatmap,
        densityHex: isHex,
      },
    }));
  },

  setBasemapStyle: (style) => set({ basemapStyle: style }),

  setProjectionMode: (mode) => set({ projectionMode: mode }),

  toggleProjectionMode: () =>
    set((state) => ({
      projectionMode: state.projectionMode === "globe" ? "mercator" : "globe",
      viewport: {
        ...state.viewport,
        zoom: state.projectionMode === "globe" ? 2.5 : 1.8,
        transitionDuration: 800,
      },
    })),

  toggleLayer: (layer) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layer]: !state.layerVisibility[layer],
      },
    })),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),

  setInfrastructureType: (type) =>
    set((state) => ({
      filters: {
        ...state.filters,
        infrastructureType: type,
      },
      layerVisibility: {
        ...state.layerVisibility,
        plants: type === "all" || type === "plants",
        datacenters: type === "all" || type === "datacenters",
      },
    })),

  toggleFuelType: (fuel) =>
    set((state) => {
      const current = state.filters.fuelTypes;
      const exists = current.includes(fuel);
      const updated = exists ? current.filter((f) => f !== fuel) : [...current, fuel];
      return {
        filters: {
          ...state.filters,
          fuelTypes: updated,
        },
      };
    }),

  toggleDcOperator: (operator) =>
    set((state) => {
      const current = state.filters.dcOperators;
      const exists = current.includes(operator);
      const updated = exists ? current.filter((o) => o !== operator) : [...current, operator];
      return {
        filters: {
          ...state.filters,
          dcOperators: updated,
        },
      };
    }),

  toggleDcCategory: (category) =>
    set((state) => {
      const current = state.filters.dcCategories;
      const exists = current.includes(category);
      const updated = exists ? current.filter((c) => c !== category) : [...current, category];
      return {
        filters: {
          ...state.filters,
          dcCategories: updated,
        },
      };
    }),

  toggleStatus: (status) =>
    set((state) => {
      const current = state.filters.statuses;
      const exists = current.includes(status);
      const updated = exists ? current.filter((s) => s !== status) : [...current, status];
      return {
        filters: {
          ...state.filters,
          statuses: updated,
        },
      };
    }),

  resetFilters: () => set({ filters: INITIAL_FILTERS }),

  setViewport: (viewportUpdates) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewportUpdates,
      },
    })),

  flyToStation: (station) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        longitude: station.longitude,
        latitude: station.latitude,
        zoom: Math.max(state.viewport.zoom, 8.5),
        pitch: 45,
        transitionDuration: 1200,
      },
    })),

  flyToCoordinates: (lng, lat, zoom = 7.5, pitch = 45, bearing = 0) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        longitude: lng,
        latitude: lat,
        zoom,
        pitch,
        bearing,
        transitionDuration: 1200,
      },
    })),

  setTelemetrySummary: (summary) => set({ telemetrySummary: summary }),

  addAlert: (alert) =>
    set((state) => {
      const exists = state.liveAlerts.some((a) => a.id === alert.id);
      if (exists) return state;
      return {
        liveAlerts: [alert, ...state.liveAlerts].slice(0, 50),
      };
    }),

  dismissAlert: (alertId) =>
    set((state) => ({
      liveAlerts: state.liveAlerts.filter((a) => a.id !== alertId),
    })),

  setRealtimeConnected: (connected) => set({ realtimeConnected: connected }),

  setInspectorOpen: (open) =>
    set((state) => ({
      isInspectorOpen: open,
      selectedStation: open ? state.selectedStation : null,
      selectedStationId: open ? state.selectedStationId : null,
    })),

  setAlertsOpen: (open) => set({ isAlertsOpen: open }),

  setAnalyticsOpen: (open) => set({ isAnalyticsOpen: open }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),

  setDcFleetOpen: (open) => set({ isDcFleetOpen: open }),

  setReplayMode: (isReplay) => set({ isReplayMode: isReplay }),

  setReplayHour: (hour) => set({ replayHour: hour }),

  setReplayPlaying: (isPlaying) => set({ isReplayPlaying: isPlaying }),
}));
