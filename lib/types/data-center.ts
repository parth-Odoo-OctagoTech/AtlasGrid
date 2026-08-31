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
  address?: string;
  city?: string;
  connectedNetworksCount?: number;
  ixpCount?: number;
  // Calculated Sustainability & Grid Integration
  localCleanEnergyPercent?: number;
  estimatedAnnualCo2Tons?: number;
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
  "Other": { hex: "#06B6D4", rgb: [6, 182, 212] },
};
