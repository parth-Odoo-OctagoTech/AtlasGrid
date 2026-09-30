export type IsoRtoRegion =
  | "PJM"
  | "ERCOT"
  | "CAISO"
  | "MISO"
  | "SPP"
  | "NYISO"
  | "ISONE"
  | "WECC"
  | "ENTSOE"
  | "OTHER";

export type ClusterStudyPhase =
  | "Phase 1 - System Impact Study"
  | "Phase 2 - Definitive Interconnection System Impact Study (DISIS)"
  | "Phase 3 - Facilities Study"
  | "Interconnection Agreement (IA) Executed"
  | "Under Construction / Pre-Energization";

export interface QueueProjectEntry {
  queueId: string;
  projectName: string;
  developer: string;
  type: "solar_pv" | "battery_storage" | "wind" | "gas_ccgt" | "nuclear_smr" | "hybrid" | "large_load_data_center";
  capacityMw: number;
  studyPhase: ClusterStudyPhase;
  queueEntryYear: number;
  projectedCodYear: number; // Commercial Operation Date
  withdrawalProbabilityPct: number; // Historical attrition probability
}

export interface SubstationQueueProfile {
  substationId: string;
  substationName: string;
  voltageKv: number;
  isoRegion: IsoRtoRegion;
  latitude: number;
  longitude: number;
  // Transmission capacity & available headroom
  firmTransformerCapacityMva: number;
  currentPeakLoadMw: number;
  availableLargeLoadHeadroomMw: number; // Estimated injection/load capacity before bulk upgrades
  // Interconnection queue congestion metrics
  activeQueuedProjectsCount: number;
  totalQueuedGenerationMw: number;
  totalQueuedStorageMw: number;
  totalQueuedLargeLoadMw: number; // Data center queue requests
  averageQueueDwellYears: number; // Mean historical years in queue
  historicalAttritionRatePct: number; // Percentage of queued projects that withdraw
  queueSaturationIndex: number; // 0 - 100 score: >80 = severely congested
  estimatedEnergizationLeadTimeYears: number; // Estimated time to energize a new 100MW+ load
  studyClusterName: string; // e.g., "PJM Transition Cluster 2024", "ERCOT Large Load Task Force 2025"
  projects: QueueProjectEntry[];
}
