export type BtmGenerationTechnology =
  | "nuclear_pwr"
  | "nuclear_bwr"
  | "smr_advanced_fission"
  | "gas_ccgt_ccs"
  | "geothermal_closed_loop"
  | "hydro_pumped_storage";

export type BtmReadinessTier =
  | "Tier 1 - Commercial Shovel-Ready"
  | "Tier 2 - Feasibility & NRC Permitting"
  | "Tier 3 - Long-Term Strategic Reserve";

export interface BtmColocationSite {
  id: string;
  facilityName: string;
  operator: string;
  technology: BtmGenerationTechnology;
  country: string;
  stateOrRegion: string;
  latitude: number;
  longitude: number;
  // Generation & Bus capacity
  totalGenerationCapacityMw: number;
  availableDirectBtmCapacityMw: number; // Offtake capacity directly from generator busbar
  operatingStatus: "active_operating" | "relicense_restart" | "smr_licensed_demo" | "under_construction";
  reactorsCount: number;
  reactorTypeDescription: string;
  // Physical land & security envelope
  contiguousAcreageAvailable: number; // Available acres on secure reservation
  nrcSecurityStandoffMeters: number; // Distance from reactor containment to security perimeter
  switchyardDistanceMeters: number; // Distance from plant switchyard to data center pad
  waterSourceRights: string; // e.g. "Susquehanna River 40MGD allocation", "Lake Michigan Once-Through"
  // Financial & Transmission Arbitrage
  rtoTariffBypassSavingsDollarPerMwh: number; // Estimated savings by avoiding retail transmission network fees ($/MWh)
  annualCleanOfftakePotentialGwh: number;
  co2IntensityGPerKwh: number; // Clean baseload carbon intensity (typically 0-12 g/kWh)
  // Feasibility Scoring
  btmFeasibilityScore: number; // 0 - 100 composite score
  readinessTier: BtmReadinessTier;
  knownHyperscalePartnerships?: string; // e.g. "AWS Talen Susquehanna 960MW Campus", "Microsoft Constellation TMI 835MW"
  regulatoryPrecedentNotes: string;
}
