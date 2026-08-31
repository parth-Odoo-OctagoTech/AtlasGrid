import { FuelType, Interconnector, PowerPlant, StationStatus } from "../types/power-plant";
import { GridAlert, GridSummary, StationTimeSeriesPoint } from "../types/telemetry";
import { plantRepository } from "../db/plant-repository";

export class GridPhysicsEngine {
  private static instance: GridPhysicsEngine;
  private currentSimulationTime: Date = new Date();
  private alerts: GridAlert[] = [];
  private baseFrequencyUs: number = 60.00;
  private baseFrequencyEu: number = 50.00;
  private timeMultiplier: number = 1.0;
  private isReplayMode: boolean = false;
  private replayTimestamp: number = Date.now();

  private constructor() {
    this.seedInitialAlerts();
  }

  public static getInstance(): GridPhysicsEngine {
    if (!GridPhysicsEngine.instance) {
      GridPhysicsEngine.instance = new GridPhysicsEngine();
    }
    return GridPhysicsEngine.instance;
  }

  private seedInitialAlerts() {
    this.alerts = [
      {
        id: "alert-1",
        stationId: "station-anchor-1",
        stationName: "Palo Verde Nuclear Generating Station",
        region: "CAISO",
        country: "US",
        severity: "info",
        type: "high_ramp",
        title: "Baseload Stability Verified",
        message: "All 3 PWR units operating at 98.4% capacity factor under nominal thermal margins.",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        coordinates: [-112.868, 33.3965],
        metricValue: 3870,
        unit: "MW",
      },
      {
        id: "alert-2",
        stationId: "station-anchor-16",
        stationName: "Roscoe Wind Farm",
        region: "ERCOT",
        country: "US",
        severity: "warning",
        type: "negative_price",
        title: "Localized Negative LMP Event",
        message: "High wind generation causing West Texas transmission bottleneck. Local nodal price -$8.40/MWh.",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        coordinates: [-100.344, 32.265],
        metricValue: -8.4,
        unit: "$/MWh",
      },
      {
        id: "alert-3",
        stationId: "station-anchor-7",
        stationName: "W.A. Parish Generating Station",
        region: "ERCOT",
        country: "US",
        severity: "critical",
        type: "price_spike",
        title: "Peaker Dispatch & Nodal Price Spike",
        message: "Fast-start natural gas turbines dispatched. LMP spiked to $245.80/MWh on ERCOT Coast Zone.",
        timestamp: new Date(Date.now() - 450000).toISOString(),
        coordinates: [-95.632, 29.4802],
        metricValue: 245.8,
        unit: "$/MWh",
      },
      {
        id: "alert-4",
        region: "ENTSOE_DE",
        country: "DE",
        severity: "warning",
        type: "curtailment",
        title: "North Sea Wind Curtailment Order",
        message: "TenneT redispatch order issued to throttle 1,200 MW offshore wind to alleviate SuedLink delay constraints.",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        coordinates: [7.2, 54.0],
        metricValue: 1200,
        unit: "MW",
      },
    ];
  }

  public getAlerts(): GridAlert[] {
    return this.alerts;
  }

  public getFrequencies(): { frequencyUsHz: number; frequencyEuHz: number } {
    const timeSec = Date.now() / 1000;
    // Micro jitter with sinusoidal drift
    const jitterUs = Math.sin(timeSec * 0.4) * 0.015 + Math.cos(timeSec * 1.3) * 0.008 + (Math.random() - 0.5) * 0.006;
    const jitterEu = Math.cos(timeSec * 0.35) * 0.012 + Math.sin(timeSec * 1.1) * 0.006 + (Math.random() - 0.5) * 0.005;

    return {
      frequencyUsHz: Math.round((this.baseFrequencyUs + jitterUs) * 1000) / 1000,
      frequencyEuHz: Math.round((this.baseFrequencyEu + jitterEu) * 1000) / 1000,
    };
  }

  /**
   * Calculates dynamic output, capacity factor, and LMP for a power plant at a given timestamp
   */
  public calculatePlantTelemetry(
    plant: PowerPlant,
    date: Date = new Date()
  ): {
    currentOutputMw: number;
    capacityFactor: number;
    status: StationStatus;
    spotPriceMwh: number;
    lmpBreakdown: { energy: number; congestion: number; loss: number; total: number };
  } {
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
    // Local solar hour based on longitude (-180 to 180)
    let localSolarHour = (utcHours + plant.longitude / 15) % 24;
    if (localSolarHour < 0) localSolarHour += 24;

    const timeSec = date.getTime() / 1000;
    // Spatial noise for wind and atmospheric conditions
    const spatialPhase = (plant.latitude * 3.7 + plant.longitude * 5.1);

    let cf = 0;
    let status: StationStatus = plant.status;

    if (plant.fuelType === "solar") {
      if (localSolarHour >= 5.5 && localSolarHour <= 18.5) {
        // Solar irradiance curve
        const sunAngle = Math.sin(((localSolarHour - 5.5) / 13) * Math.PI);
        const cloudFactor = 0.85 + 0.15 * Math.sin(timeSec * 0.05 + spatialPhase);
        cf = Math.max(0, Math.min(0.95, sunAngle * cloudFactor));
      } else {
        cf = 0;
      }
    } else if (plant.fuelType === "wind") {
      // Wind diurnal variation + gusts
      const windWave = 0.45 + 0.35 * Math.sin(timeSec * 0.08 + spatialPhase) + 0.15 * Math.cos(timeSec * 0.2 + spatialPhase * 0.5);
      cf = Math.max(0.05, Math.min(0.95, windWave));
    } else if (plant.fuelType === "nuclear") {
      // Steady baseload with slight thermal oscillations
      cf = 0.94 + 0.04 * Math.sin(timeSec * 0.01 + spatialPhase);
    } else if (plant.fuelType === "hydro") {
      // Responds to peak demand hours
      const isPeakHours = (localSolarHour >= 7 && localSolarHour <= 11) || (localSolarHour >= 17 && localSolarHour <= 22);
      cf = isPeakHours ? 0.75 + 0.15 * Math.sin(timeSec * 0.05) : 0.35 + 0.1 * Math.cos(timeSec * 0.05);
    } else if (plant.fuelType === "gas") {
      // Flexible peakers / CCGT ramping up during low solar/wind or high peak load
      const isPeakHours = (localSolarHour >= 7 && localSolarHour <= 10) || (localSolarHour >= 17 && localSolarHour <= 22);
      cf = isPeakHours ? 0.65 + 0.25 * Math.sin(timeSec * 0.03 + spatialPhase) : 0.25 + 0.15 * Math.cos(timeSec * 0.03);
    } else if (plant.fuelType === "coal") {
      cf = 0.55 + 0.15 * Math.sin(timeSec * 0.02 + spatialPhase);
    } else if (plant.fuelType === "storage") {
      // Battery charges when solar is peaking, discharges during evening peak
      if (localSolarHour >= 11 && localSolarHour <= 15) {
        cf = 0.1; // Charging / standby
      } else if (localSolarHour >= 18 && localSolarHour <= 22) {
        cf = 0.85; // Discharging peak
      } else {
        cf = 0.25;
      }
    } else {
      cf = 0.45 + 0.15 * Math.sin(timeSec * 0.03 + spatialPhase);
    }

    if (plant.status === "outage") {
      cf = 0;
    } else if (plant.status === "curtailed") {
      cf = Math.min(cf, 0.2);
    }

    const currentOutputMw = Math.round(plant.capacityMw * cf);

    // Calculate real-time LMP
    let baseEnergy = 38.0;
    if (localSolarHour >= 17 && localSolarHour <= 21) {
      baseEnergy = 68.0; // Evening peak
    } else if (localSolarHour >= 2 && localSolarHour <= 5) {
      baseEnergy = 22.0; // Overnight trough
    }

    // Congestion based on renewable surge or local bottlenecks
    let congestion = Math.sin(timeSec * 0.05 + spatialPhase) * 12;
    if ((plant.fuelType === "solar" || plant.fuelType === "wind") && cf > 0.75) {
      congestion -= 35.0; // Renewable depression / negative price
    } else if (plant.fuelType === "gas" && cf > 0.8) {
      congestion += 45.0; // Peaker high margin
    }

    let loss = baseEnergy * 0.035 * (Math.sin(spatialPhase) * 0.5 + 1.0);
    let spot = Math.round((baseEnergy + congestion + loss) * 10) / 10;

    // Spot price bounds and negative price handling
    if (spot < -20) spot = -15.5;

    return {
      currentOutputMw,
      capacityFactor: Math.round(cf * 1000) / 1000,
      status,
      spotPriceMwh: spot,
      lmpBreakdown: {
        energy: Math.round(baseEnergy * 10) / 10,
        congestion: Math.round(congestion * 10) / 10,
        loss: Math.round(loss * 10) / 10,
        total: spot,
      },
    };
  }

  /**
   * Generates a 24-hour historical & forecast time series for a station
   */
  public getStation24hTimeSeries(plant: PowerPlant, baseDate: Date = new Date()): StationTimeSeriesPoint[] {
    const points: StationTimeSeriesPoint[] = [];
    const intervalMinutes = 30; // 48 points across 24h
    const nowMs = baseDate.getTime();

    for (let i = 47; i >= 0; i--) {
      const pointTime = new Date(nowMs - i * intervalMinutes * 60 * 1000);
      const telem = this.calculatePlantTelemetry(plant, pointTime);
      const co2TonsPerHour =
        Math.round(
          ((telem.currentOutputMw * 1000 * plant.co2IntensityGPerKwh) / 1_000_000) * 100
        ) / 100;

      points.push({
        timestamp: pointTime.toISOString(),
        outputMw: telem.currentOutputMw,
        capacityMw: plant.capacityMw,
        spotPrice: telem.spotPriceMwh,
        curtailmentMw: telem.status === "curtailed" ? Math.round(plant.capacityMw * 0.4) : 0,
        co2EmissionsTonsPerHour: co2TonsPerHour,
      });
    }

    return points;
  }

  /**
   * Dynamically steps the simulation, updates changed stations, and generates random alerts
   */
  public stepSimulation(): {
    updatedPlants: Array<{ id: string; currentOutputMw: number; capacityFactor: number; spotPriceMwh: number; status: StationStatus }>;
    frequencies: { frequencyUsHz: number; frequencyEuHz: number };
    newAlerts: GridAlert[];
  } {
    const plants = plantRepository.getAllPlants();
    const now = new Date();
    const updatedPlants: Array<{ id: string; currentOutputMw: number; capacityFactor: number; spotPriceMwh: number; status: StationStatus }> = [];

    // Select a randomized subset (e.g., 250 plants) each tick for streaming efficiency
    const sampleSize = Math.min(plants.length, 300);
    const startIdx = Math.floor(Math.random() * (plants.length - sampleSize));

    for (let i = startIdx; i < startIdx + sampleSize; i++) {
      const p = plants[i];
      if (!p) continue;
      const telem = this.calculatePlantTelemetry(p, now);
      
      p.currentOutputMw = telem.currentOutputMw;
      p.capacityFactor = telem.capacityFactor;
      p.spotPriceMwh = telem.spotPriceMwh;
      p.lmpBreakdown = telem.lmpBreakdown;
      p.status = telem.status;
      p.lastUpdated = now.toISOString();

      updatedPlants.push({
        id: p.id,
        currentOutputMw: p.currentOutputMw,
        capacityFactor: p.capacityFactor,
        spotPriceMwh: p.spotPriceMwh,
        status: p.status,
      });
    }

    // Interconnector flow simulation
    const interconnectors = plantRepository.getInterconnectors();
    for (const ic of interconnectors) {
      const flowDelta = (Math.random() - 0.5) * (ic.capacityMw * 0.08);
      ic.currentFlowMw = Math.max(
        -ic.capacityMw,
        Math.min(ic.capacityMw, Math.round(ic.currentFlowMw + flowDelta))
      );
    }

    // Occasional alert generation
    const newAlerts: GridAlert[] = [];
    if (Math.random() < 0.25 && plants.length > 0) {
      const randomPlant = plants[Math.floor(Math.random() * plants.length)];
      if (randomPlant.spotPriceMwh > 180) {
        const spikeAlert: GridAlert = {
          id: `alert-gen-${Date.now()}`,
          stationId: randomPlant.id,
          stationName: randomPlant.name,
          region: randomPlant.gridRegion,
          country: randomPlant.country,
          severity: "critical",
          type: "price_spike",
          title: `LMP Spike Detected: ${randomPlant.name}`,
          message: `Nodal price surged to $${randomPlant.spotPriceMwh}/MWh due to localized line congestion.`,
          timestamp: new Date().toISOString(),
          coordinates: [randomPlant.longitude, randomPlant.latitude],
          metricValue: randomPlant.spotPriceMwh,
          unit: "$/MWh",
        };
        this.alerts.unshift(spikeAlert);
        if (this.alerts.length > 25) this.alerts.pop();
        newAlerts.push(spikeAlert);
      } else if (randomPlant.spotPriceMwh < 0) {
        const negativeAlert: GridAlert = {
          id: `alert-gen-${Date.now()}`,
          stationId: randomPlant.id,
          stationName: randomPlant.name,
          region: randomPlant.gridRegion,
          country: randomPlant.country,
          severity: "warning",
          type: "negative_price",
          title: `Negative Pricing: ${randomPlant.name}`,
          message: `Renewable generation excess caused negative nodal settlement of $${randomPlant.spotPriceMwh}/MWh.`,
          timestamp: new Date().toISOString(),
          coordinates: [randomPlant.longitude, randomPlant.latitude],
          metricValue: randomPlant.spotPriceMwh,
          unit: "$/MWh",
        };
        this.alerts.unshift(negativeAlert);
        if (this.alerts.length > 25) this.alerts.pop();
        newAlerts.push(negativeAlert);
      }
    }

    const frequencies = this.getFrequencies();

    return {
      updatedPlants,
      frequencies,
      newAlerts,
    };
  }
}

export const gridPhysicsEngine = GridPhysicsEngine.getInstance();
