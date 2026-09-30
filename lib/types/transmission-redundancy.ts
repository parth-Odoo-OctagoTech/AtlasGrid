export type RedundancyArchitecture =
  | "dual_independent_substation_2n" // Two distinct transmission substations (Gold Standard)
  | "dual_bus_single_substation_n1" // Single substation with separate bus sections & breakers
  | "loop_through_transmission_line" // In-and-out loop on regional transmission line
  | "radial_single_feed_n0"; // Single radial feeder (High Outage Risk)

export interface DualFeedAnalysis {
  primarySubstationId: string;
  primarySubstationName: string;
  primaryVoltageKv: number;
  primaryDistanceKm: number;

  secondarySubstationId?: string;
  secondarySubstationName?: string;
  secondaryVoltageKv?: number;
  secondaryDistanceKm?: number;

  redundancyArchitecture: RedundancyArchitecture;
  redundancyScore: number; // 0 - 100
  independentUtilityFeederFeasible: boolean; // Within 25km separation
  rightOfWayComplexity: "Low (Existing Utility Corridor)" | "Moderate (Mixed Urban/Rural)" | "High (Dense Right-of-Way)";
  estimatedTLineIntertieCapexMillionDollars: number; // ~$2.5M - $5M per mile of 230kV/500kV line
  expectedAnnualOutageMinutes: number; // SAIDI projection
  complianceTier: "Tier IV Fault Tolerant (2N)" | "Tier III Concurrently Maintainable (N+1)" | "Tier II Redundant Components" | "Tier I Non-Redundant";
}
