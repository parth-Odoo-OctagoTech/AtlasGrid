export type DataCenterCategory = "hyperscale" | "colocation" | "enterprise" | "telecom";

export interface DataCenter {
  id: string;
  osmId?: number;
  name: string;
  operator: string;
  category: DataCenterCategory;
  latitude: number;
  longitude: number;
  estimatedPowerMw: number;
  pue: number;
  country: string;
  countryName?: string;
  region: string;
  coolingType: string;
  tier: string;
  website: string | null;
  polygonCoords?: [number, number][] | null;
  // PeeringDB & Interconnect Integration
  peeringDbId?: number;
  peeringDbUrl?: string;
  officialWebsite?: string;
  address?: string;
  city?: string;
  connectedNetworksCount?: number;
  ixpCount?: number;
  // Calculated Sustainability & Grid Integration
  localCleanEnergyPercent?: number;
  estimatedAnnualCo2Tons?: number;
  commissioningYear?: number;
  // Section 2: Telecommunications & Fiber Connectivity
  carrierNeutral?: boolean;
  tier1CarriersCount?: number;
  carrierList?: string[];
  darkFiberDistanceKm?: number;
  ixpDistanceKm?: number;
  ixpLatencyMs?: number;
  hasDiversePathways?: boolean;
  // Section 3: Environmental Hazards & Climate
  floodZone?: "X" | "X500" | "A" | "AE" | "V" | "VE";
  floodRiskLevel?: "None" | "Moderate" | "High" | "Extreme";
  seismicPga?: number;
  nearestFaultDistanceKm?: number;
  tornadoRiskLevel?: "Low" | "Moderate" | "High";
  freeCoolingHoursPct?: number;
  designWetBulbC?: number;
  economizerViable?: boolean;
  // Section 4: Site Parcel, Soil & Topography
  soilBearingCapacityLbs?: number;
  bedrockDepthMeters?: number;
  liquefactionRisk?: "None" | "Low" | "Moderate" | "High";
  slopePct?: number;
  parcelAcres?: number;
  // Section 5: Water & Resource Availability
  waterStressBaseline?: "Low" | "Medium" | "High" | "Extremely High";
  waterStressPct?: number;
  nearestWastewaterKm?: number;
  wastewaterCapacitySurplusMgd?: number;
  // Section 6: Man-Made Hazards, Zoning & Security
  airportDistanceKm?: number;
  inFlightCorridor?: boolean;
  nearestGasPipelineMeters?: number;
  pipelinePirBlastMeters?: number;
  railHazmatDistanceKm?: number;
  chemicalPlantDistanceKm?: number;
  zoningStatus?: "Data Center Overlay Approved" | "Heavy Industrial" | "Re-zoning Required";
  airQualityAttainment?: boolean;
  perimeterStandoffMeters?: number;
  // Composite Site Suitability Siting Score (0 - 100)
  sitingSuitabilityScore?: number;
}

export interface DataCenterSummary {
  totalCount: number;
  totalEstimatedPowerMw: number;
  hyperscaleCount: number;
  colocationCount: number;
  averagePue: number;
  topOperators: { operator: string; count: number; totalMw: number }[];
}

export const OPERATOR_COLORS: Record<string, { hex: string; rgb: [number, number, number] }> = {
  "Amazon Web Services (AWS)": { hex: "#FF9900", rgb: [255, 153, 0] },
  "Google Cloud (GCP)": { hex: "#4285F4", rgb: [66, 133, 244] },
  "Microsoft Azure": { hex: "#0089D6", rgb: [0, 137, 214] },
  "Meta Hyperscale": { hex: "#0081FB", rgb: [0, 129, 251] },
  "Equinix IBX": { hex: "#ED1C24", rgb: [237, 28, 36] },
  "Digital Realty": { hex: "#00A3E0", rgb: [0, 163, 224] },
  "NTT Global Data Centers": { hex: "#004098", rgb: [0, 64, 152] },
  "CyrusOne": { hex: "#00C389", rgb: [0, 195, 137] },
  "QTS Data Centers": { hex: "#FF5E00", rgb: [255, 94, 0] },
  "Oracle Cloud (OCI)": { hex: "#F80000", rgb: [248, 0, 0] },
  "Switch SuperNAP": { hex: "#10B981", rgb: [16, 185, 129] },
  "Reliance Jio Data Centers": { hex: "#0F3CC9", rgb: [15, 60, 201] },
  "AdaniConnex": { hex: "#0068B5", rgb: [0, 104, 181] },
  "STT GDC India": { hex: "#FF5500", rgb: [255, 85, 0] },
  "CtrlS Datacenters": { hex: "#00A859", rgb: [0, 168, 89] },
  "Yotta Infrastructure": { hex: "#E81123", rgb: [232, 17, 35] },
  "Nxtra by Airtel": { hex: "#EA1D2C", rgb: [234, 29, 44] },
  "Sify Technologies": { hex: "#009688", rgb: [0, 150, 136] },
  "Ncell": { hex: "#782F92", rgb: [120, 47, 146] },
  "DataWorld / WorldLink": { hex: "#0088CC", rgb: [0, 136, 204] },
  "National Information Technology Center (NITC)": { hex: "#DC2626", rgb: [220, 38, 38] },
  "Data Hub Nepal": { hex: "#059669", rgb: [5, 150, 105] },
  "DishHome (Datalaya)": { hex: "#E11D48", rgb: [225, 29, 72] },
  "Nepal Telecom": { hex: "#2563EB", rgb: [37, 99, 235] },
  "kt cloud / KT IDC": { hex: "#E60012", rgb: [230, 0, 18] },
  "LG Uplus": { hex: "#E6007E", rgb: [230, 0, 126] },
  "SK Broadband": { hex: "#FF0033", rgb: [255, 0, 51] },
  "KINX": { hex: "#0072CE", rgb: [0, 114, 206] },
  "Naver Cloud": { hex: "#03C75A", rgb: [3, 199, 90] },
  "Kakao Corp": { hex: "#FEE500", rgb: [254, 229, 0] },
  "Samsung SDS": { hex: "#1428A0", rgb: [20, 40, 160] },
  "Other": { hex: "#06B6D4", rgb: [6, 182, 212] },
};
