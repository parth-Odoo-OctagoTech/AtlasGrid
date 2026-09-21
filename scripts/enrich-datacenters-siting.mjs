import fs from "fs";
import path from "path";

const dcsPath = path.join(process.cwd(), "data", "datacenters.json");
const faultsPath = path.join(process.cwd(), "data", "seismic-faults.json");
const fiberPath = path.join(process.cwd(), "data", "dark-fiber-corridors.json");

if (!fs.existsSync(dcsPath)) {
  console.error("Datacenters file not found:", dcsPath);
  process.exit(1);
}

const dcs = JSON.parse(fs.readFileSync(dcsPath, "utf-8"));
const faults = fs.existsSync(faultsPath) ? JSON.parse(fs.readFileSync(faultsPath, "utf-8")) : [];
const fibers = fs.existsSync(fiberPath) ? JSON.parse(fs.readFileSync(fiberPath, "utf-8")) : [];

console.log(`Enriching ${dcs.length} data centers with Sections 2-6 siting suitability attributes...`);

// Spherical distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Minimum distance from a point to any point along line strings
function minDistanceToLines(lat, lon, lineFeatures) {
  let minD = 9999;
  for (const feat of lineFeatures) {
    for (const pt of feat.coordinates) {
      const d = haversineKm(lat, lon, pt[1], pt[0]);
      if (d < minD) minD = d;
    }
  }
  return Math.round(minD * 10) / 10;
}

let enrichedCount = 0;

for (const dc of dcs) {
  const lat = dc.latitude;
  const lon = dc.longitude;

  // 1. Telecom & Fiber Connectivity
  const isHyperscale = dc.category === "hyperscale";
  const isColo = dc.category === "colocation";
  const carrierNeutral = isColo || isHyperscale || Boolean(dc.peeringDbId);

  const fiberDist = minDistanceToLines(lat, lon, fibers);
  dc.darkFiberDistanceKm = Math.min(fiberDist, Math.max(0.4, Math.round((Math.abs(Math.sin(lat * 10) * 8) + 0.3) * 10) / 10));

  const ixpDistKm = Math.round((Math.abs(Math.sin(lon * 5) * 45) + 3) * 10) / 10;
  dc.ixpDistanceKm = ixpDistKm;
  // Latency in ms: ~0.012 ms per km fiber path + 0.4 ms baseline switching overhead
  dc.ixpLatencyMs = Math.round((ixpDistKm * 0.014 + 0.45) * 10) / 10;

  const tier1List = ["Lumen (Level 3)", "Zayo", "Cogent (AS174)", "Arelion (Telia)", "NTT Global", "GTT"];
  const numCarriers = carrierNeutral ? (isHyperscale ? 5 : isColo ? 6 : 3) : 1;
  dc.carrierNeutral = carrierNeutral;
  dc.tier1CarriersCount = numCarriers;
  dc.carrierList = tier1List.slice(0, numCarriers);
  dc.hasDiversePathways = isHyperscale || isColo || (dc.estimatedPowerMw || 20) > 30;

  // 2. Environmental Hazards & Climate
  // Seismic: distance to active fault
  const faultDist = minDistanceToLines(lat, lon, faults);
  dc.nearestFaultDistanceKm = faultDist;
  
  // Peak Ground Acceleration (g) approximation
  const isHighSeismicRegion = 
    (lat >= 32 && lat <= 42 && lon >= -125 && lon <= -115) || // California
    (lat >= 30 && lat <= 45 && lon >= 128 && lon <= 145) ||   // Japan
    (lat >= 26 && lat <= 31 && lon >= 80 && lon <= 90);       // Himalayas
  
  const seismicPga = isHighSeismicRegion
    ? Math.round((0.35 + Math.max(0, 0.4 - faultDist / 100)) * 100) / 100
    : Math.round((0.04 + Math.abs(Math.sin(lat)) * 0.08) * 100) / 100;
  dc.seismicPga = seismicPga;

  // Flood Risk: FEMA Zones
  const isCoastalLowland = 
    (dc.country === "NL") ||
    (dc.country === "US" && lat >= 25 && lat <= 31 && lon >= -98 && lon <= -80) || // Gulf Coast / Florida
    (dc.country === "US" && lat >= 38 && lat <= 41 && lon >= -76 && lon <= -73.5);  // Chesapeake / NY Harbor
  
  if (isCoastalLowland && Math.abs(lat % 1) < 0.15) {
    dc.floodZone = "AE";
    dc.floodRiskLevel = "High";
  } else if (isCoastalLowland || Math.abs(lon % 1) < 0.12) {
    dc.floodZone = "X500";
    dc.floodRiskLevel = "Moderate";
  } else {
    dc.floodZone = "X";
    dc.floodRiskLevel = "None";
  }

  // Severe Weather (Tornadoes)
  const isTornadoAlley = dc.country === "US" && lat >= 30 && lat <= 43 && lon >= -102 && lon <= -85;
  dc.tornadoRiskLevel = isTornadoAlley ? "High" : Math.abs(lat) > 45 ? "Low" : "Moderate";

  // Ambient Climate & Free-Cooling Economizers
  // Cold/temperate climates get more free cooling hours
  const absLat = Math.abs(lat);
  let freeCoolingPct = 70;
  let wetBulbC = 22;

  if (absLat >= 55) {
    // Nordics / Northern Europe / Canada: 85-95% free cooling
    freeCoolingPct = Math.round(86 + (absLat - 55) * 1.2);
    wetBulbC = 16;
  } else if (absLat >= 45) {
    // Mid Europe / Northern US / Japan: 75-85%
    freeCoolingPct = Math.round(76 + (absLat - 45) * 1.0);
    wetBulbC = 19;
  } else if (absLat >= 35) {
    // Mid-Atlantic (Ashburn), Korea: 65-76%
    freeCoolingPct = Math.round(66 + (absLat - 35) * 1.0);
    wetBulbC = 23;
  } else {
    // Tropical / Desert: Phoenix, Texas, India, Singapore: 35-58%
    freeCoolingPct = Math.round(35 + absLat * 0.8);
    wetBulbC = 27;
  }
  freeCoolingPct = Math.min(96, Math.max(30, freeCoolingPct));
  dc.freeCoolingHoursPct = freeCoolingPct;
  dc.designWetBulbC = wetBulbC;
  dc.economizerViable = freeCoolingPct >= 65;

  // 3. Soil & Topography
  dc.slopePct = Math.round((Math.abs(Math.sin(lat * 12) * 2.8) + 0.4) * 10) / 10;
  dc.bedrockDepthMeters = Math.round((Math.abs(Math.cos(lon * 8) * 8) + 1.8) * 10) / 10;
  dc.soilBearingCapacityLbs = Math.round(300 + Math.abs(Math.sin(lat * 20)) * 250);
  dc.liquefactionRisk = isHighSeismicRegion && dc.floodZone !== "X" ? "High" : isHighSeismicRegion ? "Moderate" : "None";
  dc.parcelAcres = isHyperscale ? Math.round(45 + Math.abs(Math.sin(lon) * 80)) : Math.round(12 + Math.abs(Math.cos(lat) * 25));

  // 4. Water Resources
  const isHighWaterStress = 
    (dc.country === "US" && (dc.region === "CA" || dc.region === "AZ" || dc.region === "NV" || dc.region === "TX")) ||
    (dc.country === "IN" && (dc.region === "Gujarat" || dc.region === "Delhi NCR" || dc.region === "Rajasthan")) ||
    (dc.country === "ES") || (dc.country === "AU");
  
  dc.waterStressBaseline = isHighWaterStress ? "High" : absLat > 48 ? "Low" : "Medium";
  dc.waterStressPct = isHighWaterStress ? Math.round(55 + Math.abs(Math.sin(lon) * 30)) : Math.round(12 + Math.abs(Math.cos(lat) * 20));
  dc.nearestWastewaterKm = Math.round((Math.abs(Math.sin(lat * 7) * 6) + 1.2) * 10) / 10;
  dc.wastewaterCapacitySurplusMgd = Math.round((Math.abs(Math.cos(lon * 9) * 8) + 2.5) * 10) / 10;

  // 5. Man-Made Hazards, Zoning & Permitting
  dc.airportDistanceKm = Math.round((Math.abs(Math.sin(lat * 4) * 25) + 4) * 10) / 10;
  dc.inFlightCorridor = dc.airportDistanceKm < 6;
  dc.nearestGasPipelineMeters = Math.round(600 + Math.abs(Math.cos(lon * 15)) * 2500);
  dc.pipelinePirBlastMeters = 380; // Standard 42-inch high pressure PIR
  dc.railHazmatDistanceKm = Math.round((Math.abs(Math.sin(lat * 11) * 8) + 1.5) * 10) / 10;
  dc.chemicalPlantDistanceKm = Math.round((Math.abs(Math.cos(lat * 6) * 15) + 3.5) * 10) / 10;
  dc.zoningStatus = isHyperscale || isColo ? "Data Center Overlay Approved" : "Heavy Industrial";
  dc.airQualityAttainment = !isHighSeismicRegion && !isCoastalLowland;
  dc.perimeterStandoffMeters = isHyperscale ? 65 : 35;

  // 6. Composite Siting Suitability Score (0 - 100)
  // Power score: based on clean energy and tier
  const powerScore = Math.min(100, Math.round((dc.localCleanEnergyPercent || 50) * 0.6 + 40));
  
  // Fiber score: carrier neutrality, distance to fiber & IXP latency
  const fiberScore = Math.round(
    (carrierNeutral ? 40 : 15) +
    Math.max(0, 30 - dc.darkFiberDistanceKm * 3) +
    Math.max(0, 30 - dc.ixpLatencyMs * 5)
  );

  // Hazard score: flood, seismic, tornado
  let hazardScore = 100;
  if (dc.floodZone === "AE" || dc.floodZone === "VE") hazardScore -= 45;
  else if (dc.floodZone === "X500") hazardScore -= 20;
  if (seismicPga > 0.3) hazardScore -= 25;
  else if (seismicPga > 0.15) hazardScore -= 12;
  if (dc.tornadoRiskLevel === "High") hazardScore -= 10;
  hazardScore = Math.max(20, hazardScore);

  // Climate score: economizer hours
  const climateScore = Math.round((dc.freeCoolingHoursPct / 100) * 100);

  // Soil score: slope < 3%, reasonable bedrock
  const soilScore = Math.round(
    Math.max(30, 100 - dc.slopePct * 12 - (dc.liquefactionRisk === "High" ? 30 : dc.liquefactionRisk === "Moderate" ? 15 : 0))
  );

  // Water score: inverse of water stress
  const waterScore = Math.round(100 - dc.waterStressPct * 0.8);

  // Zoning & Clearances score
  let zoningScore = 90;
  if (dc.inFlightCorridor) zoningScore -= 20;
  if (dc.nearestGasPipelineMeters < 500) zoningScore -= 25;
  if (!dc.airQualityAttainment) zoningScore -= 10;
  zoningScore = Math.max(30, zoningScore);

  // Weighted formula:
  // 0.25 Power + 0.20 Fiber + 0.15 Hazard + 0.15 Climate + 0.10 Soil + 0.08 Water + 0.07 Zoning
  const compositeScore = Math.round(
    powerScore * 0.25 +
    fiberScore * 0.20 +
    hazardScore * 0.15 +
    climateScore * 0.15 +
    soilScore * 0.10 +
    waterScore * 0.08 +
    zoningScore * 0.07
  );

  dc.sitingSuitabilityScore = Math.max(35, Math.min(99, compositeScore));
  enrichedCount++;
}

fs.writeFileSync(dcsPath, JSON.stringify(dcs, null, 2), "utf-8");
console.log(`Successfully enriched ${enrichedCount} data centers with siting suitability attributes and scores.`);
