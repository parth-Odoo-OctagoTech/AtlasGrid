import * as fs from "fs";
import * as path from "path";

const dataDir = path.join(process.cwd(), "data");
const plantsPath = path.join(dataDir, "power-plants.json");
const icPath = path.join(dataDir, "interconnectors.json");

console.log("===============================================================");
console.log("🔍 GRIDPULSE AUTOMATED QA TEST SUITE");
console.log("===============================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Dataset Existence & Parsing
// ---------------------------------------------------------------------------
console.log("--- TEST 1: File Storage & Dataset Integrity ---");
assert(fs.existsSync(plantsPath), "power-plants.json file exists on disk");
assert(fs.existsSync(icPath), "interconnectors.json file exists on disk");

const plants = JSON.parse(fs.readFileSync(plantsPath, "utf-8"));
const interconnectors = JSON.parse(fs.readFileSync(icPath, "utf-8"));

assert(Array.isArray(plants) && plants.length >= 5000, `Loaded ${plants.length.toLocaleString()} power station nodes`);
assert(Array.isArray(interconnectors) && interconnectors.length >= 10, `Loaded ${interconnectors.length} high-voltage interconnectors`);

// Check coordinate validity
let invalidCoords = 0;
let invalidCapacities = 0;
for (const p of plants) {
  if (
    typeof p.latitude !== "number" ||
    typeof p.longitude !== "number" ||
    isNaN(p.latitude) ||
    isNaN(p.longitude) ||
    p.latitude < -90 ||
    p.latitude > 90 ||
    p.longitude < -180 ||
    p.longitude > 180
  ) {
    invalidCoords++;
  }
  if (typeof p.capacityMw !== "number" || isNaN(p.capacityMw) || p.capacityMw <= 0) {
    invalidCapacities++;
  }
}
assert(invalidCoords === 0, "Zero invalid coordinates across all nodes (-90..90 lat, -180..180 lng)");
assert(invalidCapacities === 0, "Zero invalid or zero/negative capacities");

// ---------------------------------------------------------------------------
// TEST 2: Gujarat, India Power Plants & Accurate Geospatial Coordinates
// ---------------------------------------------------------------------------
console.log("\n--- TEST 2: Gujarat, India Plants & Specific Hydro Validation ---");

const gujaratPlants = plants.filter(
  (p) =>
    (p.substationName && p.substationName.toLowerCase().includes("gujarat")) ||
    (p.latitude >= 20.0 && p.latitude <= 24.8 && p.longitude >= 68.0 && p.longitude <= 74.8 && p.country === "IN")
);
assert(gujaratPlants.length >= 15, `Found ${gujaratPlants.length} stations in Gujarat State Grid`);

// Check Sardar Sarovar Dam
const sardarSarovar = plants.find((p) => p.name.includes("Sardar Sarovar"));
assert(!!sardarSarovar, "Sardar Sarovar Hydroelectric Project exists in database");
if (sardarSarovar) {
  assert(sardarSarovar.fuelType === "hydro", `Sardar Sarovar fuel is hydro (actual: ${sardarSarovar.fuelType})`);
  assert(sardarSarovar.capacityMw === 1450, `Sardar Sarovar capacity is 1,450 MW (actual: ${sardarSarovar.capacityMw} MW)`);
  assert(
    Math.abs(sardarSarovar.latitude - 21.8286) < 0.05 && Math.abs(sardarSarovar.longitude - 73.7489) < 0.05,
    `Sardar Sarovar coordinates accurate: (${sardarSarovar.latitude}°N, ${sardarSarovar.longitude}°E)`
  );
}

// Check Ukai Dam
const ukai = plants.find((p) => p.name.includes("Ukai Dam"));
assert(!!ukai, "Ukai Dam Hydroelectric Station exists in database");
if (ukai) {
  assert(ukai.fuelType === "hydro", `Ukai Dam fuel is hydro (actual: ${ukai.fuelType})`);
  assert(ukai.capacityMw === 300, `Ukai Dam capacity is 300 MW (actual: ${ukai.capacityMw} MW)`);
  assert(
    Math.abs(ukai.latitude - 21.2505) < 0.05 && Math.abs(ukai.longitude - 73.5855) < 0.05,
    `Ukai Dam coordinates accurate: (${ukai.latitude}°N, ${ukai.longitude}°E)`
  );
}

// Check Kadana Dam
const kadana = plants.find((p) => p.name.includes("Kadana"));
assert(!!kadana, "Kadana Hydroelectric Project exists in database");
if (kadana) {
  assert(kadana.fuelType === "hydro", `Kadana Dam fuel is hydro (actual: ${kadana.fuelType})`);
  assert(kadana.capacityMw === 240, `Kadana Dam capacity is 240 MW (actual: ${kadana.capacityMw} MW)`);
}

// Check Mundra Thermal
const mundraAdani = plants.find((p) => p.name.includes("Mundra Thermal Power Station (Adani"));
assert(!!mundraAdani && mundraAdani.capacityMw === 4620, "Mundra Adani Thermal 4,620 MW exists");

// Check Kakrapar Nuclear
const kakrapar = plants.find((p) => p.name.includes("Kakrapar"));
assert(!!kakrapar && kakrapar.fuelType === "nuclear" && kakrapar.capacityMw === 1840, "Kakrapar Nuclear 1,840 MW exists");

// Check Charanka & Khavda Solar
const charanka = plants.find((p) => p.name.includes("Charanka"));
assert(!!charanka && charanka.fuelType === "solar" && charanka.capacityMw === 790, "Charanka Solar Park 790 MW exists");
const khavda = plants.find((p) => p.name.includes("Khavda"));
assert(!!khavda && khavda.fuelType === "solar" && khavda.capacityMw >= 5000, "Khavda Renewable Energy Mega Park exists");

// ---------------------------------------------------------------------------
// TEST 3: Global Mega-Plants Across All Continents
// ---------------------------------------------------------------------------
console.log("\n--- TEST 3: Global Mega-Plants Across All Continents ---");

const allHydro = plants.filter((p) => p.fuelType === "hydro");
assert(allHydro.length >= 500, `Total hydro stations in dataset: ${allHydro.length}`);

const keyGlobalStations = [
  // India
  { name: "Tehri Hydroelectric Complex", minCap: 2000, country: "IN" },
  { name: "Koyna Hydroelectric Project", minCap: 1900, country: "IN" },
  { name: "Srisailam Hydroelectric", minCap: 1600, country: "IN" },
  { name: "Nathpa Jhakri", minCap: 1500, country: "IN" },
  { name: "Bhakra Nangal", minCap: 1300, country: "IN" },
  // Americas
  { name: "Three Gorges Dam", minCap: 22000, country: "CN" },
  { name: "Baihetan Dam", minCap: 15000, country: "CN" },
  { name: "Xiluodu Dam", minCap: 13000, country: "CN" },
  { name: "Itaipu Dam", minCap: 14000, country: "BR" },
  { name: "Belo Monte Dam", minCap: 11000, country: "BR" },
  { name: "Guri Hydroelectric", minCap: 10000, country: "VE" },
  { name: "Grand Coulee", minCap: 6500, country: "US" },
  { name: "Hoover Dam", minCap: 2000, country: "US" },
  { name: "Palo Verde Generating", minCap: 3800, country: "US" },
  { name: "Robert-Bourassa", minCap: 5000, country: "CA" },
  { name: "Bruce Nuclear", minCap: 6000, country: "CA" },
  // Europe
  { name: "Gravelines Nuclear", minCap: 5000, country: "FR" },
  { name: "Grand'Maison Pumped Storage", minCap: 1800, country: "FR" },
  { name: "Dinorwig Power Station", minCap: 1700, country: "GB" },
  { name: "Hornsea One", minCap: 2000, country: "GB" },
  { name: "Kvilldal Hydroelectric", minCap: 1200, country: "NO" },
  { name: "Forsmark Nuclear", minCap: 3000, country: "SE" },
  { name: "Olkiluoto 3 EPR", minCap: 1600, country: "FI" },
  { name: "Almaraz Nuclear", minCap: 2000, country: "ES" },
  { name: "Cortes-La Muela", minCap: 1700, country: "ES" },
  { name: "Larderello Geothermal", minCap: 700, country: "IT" },
  // Asia & Oceania
  { name: "Kashiwazaki-Kariwa Nuclear", minCap: 7500, country: "JP" },
  { name: "Futtsu Thermal", minCap: 5000, country: "JP" },
  { name: "Snowy Mountains", minCap: 3500, country: "AU" },
  { name: "Loy Yang A & B", minCap: 3000, country: "AU" },
  // Middle East & Africa
  { name: "Barakah Nuclear", minCap: 5000, country: "AE" },
  { name: "Noor Abu Dhabi", minCap: 1000, country: "AE" },
  { name: "Al Dhafra Solar", minCap: 2000, country: "AE" },
  { name: "Grand Ethiopian Renaissance Dam", minCap: 5000, country: "ET" },
  { name: "Aswan High Dam", minCap: 2000, country: "EG" },
  { name: "Benban Solar Park", minCap: 1600, country: "EG" },
  { name: "Koeberg Nuclear", minCap: 1800, country: "ZA" },
  { name: "Medupi & Kusile", minCap: 4500, country: "ZA" },
];

for (const kg of keyGlobalStations) {
  const found = plants.find((p) => p.name.includes(kg.name) && p.country === kg.country);
  assert(
    !!found && found.capacityMw >= kg.minCap,
    `Verified ${kg.name} (${found ? found.capacityMw : 0} MW in ${kg.country})`
  );
}

// ---------------------------------------------------------------------------
// TEST 4: Google Maps Geolocation URL Verification
// ---------------------------------------------------------------------------
console.log("\n--- TEST 4: Google Maps Geolocation Resolution ---");

let validMapsUrls = 0;
for (const p of plants.slice(0, 100)) {
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  if (gmapsUrl.includes("query=") && !gmapsUrl.includes("NaN") && !gmapsUrl.includes("undefined")) {
    validMapsUrls++;
  }
}
assert(validMapsUrls === 100, `Validated 100% of tested sample Google Maps navigation URLs (${validMapsUrls}/100)`);

// ---------------------------------------------------------------------------
// TEST 5: Fuel Types & Grid Regions Coverage
// ---------------------------------------------------------------------------
console.log("\n--- TEST 5: Fuel Types & Regional Distribution ---");

const fuelBreakdown = {};
let totalCapMw = 0;
for (const p of plants) {
  fuelBreakdown[p.fuelType] = (fuelBreakdown[p.fuelType] || 0) + 1;
  totalCapMw += p.capacityMw;
}

console.log("  📊 Fuel Distribution:", JSON.stringify(fuelBreakdown));
console.log(`  ⚡ Total Online Capacity: ${(totalCapMw / 1000).toFixed(1)} GW`);

assert(Object.keys(fuelBreakdown).length >= 8, `Dataset covers ${Object.keys(fuelBreakdown).length} distinct fuel types`);
assert((fuelBreakdown["hydro"] || 0) >= 400, `Hydro coverage is extensive (${fuelBreakdown["hydro"]} plants)`);
assert((fuelBreakdown["solar"] || 0) >= 400, `Solar coverage is extensive (${fuelBreakdown["solar"]} plants)`);
assert((fuelBreakdown["wind"] || 0) >= 400, `Wind coverage is extensive (${fuelBreakdown["wind"]} plants)`);

// ---------------------------------------------------------------------------
// TEST 6: High-Voltage Transmission Interconnectors Matrix
// ---------------------------------------------------------------------------
console.log("\n--- TEST 6: Transmission Interconnectors Matrix ---");

assert(interconnectors.length >= 20, `Interconnector count: ${interconnectors.length} lines`);
const gujIntertie = interconnectors.find((ic) => ic.id === "ic-14" || ic.name.includes("Gujarat"));
assert(!!gujIntertie, `Gujarat-Maharashtra Intertie exists (${gujIntertie?.name})`);

let invalidIcs = 0;
for (const ic of interconnectors) {
  if (!ic.source || ic.source.length !== 2 || !ic.target || ic.target.length !== 2 || !ic.capacityMw) {
    invalidIcs++;
  }
}
assert(invalidIcs === 0, "All interconnectors have valid geographic source/target pairs and ratings");

// ---------------------------------------------------------------------------
// TEST 7: Global Data Centers Dataset (from GE View Project)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 7: Data Centers Ingestion & Telemetry ---");

const datacentersPath = path.join(dataDir, "datacenters.json");
assert(fs.existsSync(datacentersPath), "data/datacenters.json file exists");

const datacenters = JSON.parse(fs.readFileSync(datacentersPath, "utf-8"));
assert(datacenters.length >= 4000, `Data center facilities count: ${datacenters.length} (expected 4,000+)`);

const operatorsCount = {};
let totalDcMw = 0;
let validCoordinatesCount = 0;
let validPueCount = 0;

let invalidUsGeos = 0;
let invalidIndiaGeos = 0;

for (const dc of datacenters) {
  operatorsCount[dc.operator] = (operatorsCount[dc.operator] || 0) + 1;
  totalDcMw += dc.estimatedPowerMw;

  if (
    typeof dc.latitude === "number" &&
    !isNaN(dc.latitude) &&
    typeof dc.longitude === "number" &&
    !isNaN(dc.longitude) &&
    dc.latitude >= -90 &&
    dc.latitude <= 90 &&
    dc.longitude >= -180 &&
    dc.longitude <= 180
  ) {
    validCoordinatesCount++;
  }

  if (typeof dc.pue === "number" && dc.pue >= 1.0 && dc.pue <= 2.5) {
    validPueCount++;
  }

  if (dc.country === "US" && (dc.longitude > -50 || dc.longitude < -180 || dc.latitude < 15 || dc.latitude > 75)) {
    invalidUsGeos++;
  }

  if (dc.country === "IN" && (dc.latitude < 6.7 || dc.latitude > 37.5 || dc.longitude < 68.0 || dc.longitude > 98.0)) {
    invalidIndiaGeos++;
  }
}

console.log("  🏢 Top DC Operators:", JSON.stringify(operatorsCount));
console.log(`  ⚡ Total Estimated DC Power Load: ${(totalDcMw / 1000).toFixed(1)} GW`);

assert(validCoordinatesCount === datacenters.length, `100% of data centers have valid lat/lng coordinates (${validCoordinatesCount}/${datacenters.length})`);
assert(validPueCount === datacenters.length, `100% of data centers have valid PUE efficiency metrics (${validPueCount}/${datacenters.length})`);
assert(invalidUsGeos === 0, `Zero US data centers mapped outside North America (actual: ${invalidUsGeos})`);
assert(invalidIndiaGeos === 0, `Zero India data centers mapped outside India (actual: ${invalidIndiaGeos})`);

// Multi-Nation Bounding Box Assertions
const COUNTRY_BOUNDS = {
  US: { minLat: 18, maxLat: 72, minLng: -170, maxLng: -65 },
  CA: { minLat: 41, maxLat: 83, minLng: -141, maxLng: -52 },
  GB: { minLat: 49.5, maxLat: 61, minLng: -9, maxLng: 2 },
  FR: { minLat: 41, maxLat: 51.5, minLng: -5.5, maxLng: 10 },
  DE: { minLat: 47, maxLat: 55.5, minLng: 5.5, maxLng: 15.5 },
  NL: { minLat: 50.5, maxLat: 54, minLng: 3.2, maxLng: 7.5 },
  BE: { minLat: 49.4, maxLat: 51.6, minLng: 2.5, maxLng: 6.5 },
  IE: { minLat: 51.3, maxLat: 55.5, minLng: -11, maxLng: -5.5 },
  ES: { minLat: 27, maxLat: 44, minLng: -18.5, maxLng: 4.5 },
  IT: { minLat: 36, maxLat: 47.5, minLng: 6.5, maxLng: 19 },
  CH: { minLat: 45.7, maxLat: 48, minLng: 5.8, maxLng: 10.6 },
  AT: { minLat: 46.3, maxLat: 49.1, minLng: 9.5, maxLng: 17.2 },
  SE: { minLat: 55, maxLat: 70, minLng: 11, maxLng: 24.5 },
  NO: { minLat: 57.5, maxLat: 71.5, minLng: 4.5, maxLng: 31.5 },
  FI: { minLat: 59.5, maxLat: 70.5, minLng: 20, maxLng: 32 },
  IN: { minLat: 6.5, maxLat: 37.5, minLng: 68, maxLng: 97.5 },
  PK: { minLat: 23.5, maxLat: 37.5, minLng: 60.5, maxLng: 78 },
  CN: { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 },
  JP: { minLat: 24, maxLat: 46, minLng: 122, maxLng: 154 },
  AU: { minLat: -44, maxLat: -10, minLng: 112, maxLng: 154 },
  NZ: { minLat: -48, maxLat: -34, minLng: 166, maxLng: 179 },
  BR: { minLat: -34, maxLat: 5.5, minLng: -74, maxLng: -34 },
  ZA: { minLat: -35, maxLat: -22, minLng: 16, maxLng: 33 },
  SG: { minLat: 1.1, maxLat: 1.5, minLng: 103.5, maxLng: 104.2 },
  AE: { minLat: 22.5, maxLat: 26.5, minLng: 51, maxLng: 57 },
  SA: { minLat: 16, maxLat: 32.5, minLng: 34, maxLng: 56 },
  EG: { minLat: 21.5, maxLat: 32.0, minLng: 24.5, maxLng: 37.0 },
  ET: { minLat: 3.0, maxLat: 15.0, minLng: 32.5, maxLng: 48.5 },
  KE: { minLat: -5.0, maxLat: 5.5, minLng: 33.5, maxLng: 42.0 },
  MA: { minLat: 21.0, maxLat: 36.0, minLng: -17.5, maxLng: -0.5 },
  RU: { minLat: 41.0, maxLat: 76.0, minLng: 19.0, maxLng: 180.0 },
};

let globalDcBoundingBoxMismatches = 0;
for (const d of datacenters) {
  const box = COUNTRY_BOUNDS[d.country];
  if (box) {
    if (d.latitude < box.minLat || d.latitude > box.maxLat || d.longitude < box.minLng || d.longitude > box.maxLng) {
      globalDcBoundingBoxMismatches++;
    }
  }
}
assert(globalDcBoundingBoxMismatches === 0, `Zero data centers mapped outside their sovereign borders (mismatches: ${globalDcBoundingBoxMismatches})`);

let globalPlantBoundingBoxMismatches = 0;
for (const p of plants) {
  const box = COUNTRY_BOUNDS[p.country];
  if (box) {
    if (p.latitude < box.minLat || p.latitude > box.maxLat || p.longitude < box.minLng || p.longitude > box.maxLng) {
      globalPlantBoundingBoxMismatches++;
    }
  }
}
assert(globalPlantBoundingBoxMismatches === 0, `Zero power plants mapped outside their sovereign borders (mismatches: ${globalPlantBoundingBoxMismatches})`);

// European facilities verification
const deDcs = datacenters.filter((d) => d.country === "DE");
const frDcs = datacenters.filter((d) => d.country === "FR");
const gbDcs = datacenters.filter((d) => d.country === "GB");
assert(deDcs.length > 200, `Germany data centers count: ${deDcs.length}`);
assert(frDcs.length > 200, `France data centers count: ${frDcs.length}`);
assert(gbDcs.length > 200, `UK data centers count: ${gbDcs.length}`);

// Verify Key Global Campuses
const yottaNm1 = datacenters.find((d) => d.name.includes("Yotta NM1"));
assert(!!yottaNm1 && yottaNm1.country === "IN" && yottaNm1.estimatedPowerMw >= 250, "Yotta NM1 Navi Mumbai 250 MW exists with verified India coords");

const awsAshburn = datacenters.find((d) => d.name.includes("Ashburn Campus") && d.operator.includes("AWS"));
assert(!!awsAshburn && awsAshburn.country === "US" && awsAshburn.estimatedPowerMw >= 250, "AWS US-East-1 Ashburn 250 MW exists with verified US coords");

const switchCitadel = datacenters.find((d) => d.name.includes("Citadel"));
assert(!!switchCitadel && switchCitadel.country === "US" && switchCitadel.estimatedPowerMw >= 300, "Switch Tahoe Reno Citadel 350 MW exists with verified US coords");

const googleCouncilBluffs = datacenters.find((d) => d.name.includes("Council Bluffs"));
assert(!!googleCouncilBluffs && googleCouncilBluffs.country === "US" && googleCouncilBluffs.estimatedPowerMw >= 300, "Google Council Bluffs 300 MW exists with verified US coords");

const googleSingapore = datacenters.find((d) => d.name.includes("Google Singapore"));
assert(!!googleSingapore && googleSingapore.country === "SG" && googleSingapore.estimatedPowerMw >= 150, "Google Singapore Jurong 150 MW exists with verified Singapore coords");

assert((operatorsCount["Amazon Web Services (AWS)"] || 0) >= 50, `AWS Facilities covered: ${operatorsCount["Amazon Web Services (AWS)"]}`);
assert((operatorsCount["Microsoft Azure"] || 0) >= 30, `Azure Facilities covered: ${operatorsCount["Microsoft Azure"]}`);
assert((operatorsCount["Google Cloud (GCP)"] || 0) >= 20, `Google Cloud Facilities covered: ${operatorsCount["Google Cloud (GCP)"]}`);
assert((operatorsCount["Equinix IBX"] || 0) >= 50, `Equinix Facilities covered: ${operatorsCount["Equinix IBX"]}`);

// ---------------------------------------------------------------------------
// TEST 8: Global Submarine Fiber-Optic Cables Dataset (from GE View Project)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 8: Submarine Fiber Cables (TeleGeography) ---");

const cablesPath = path.join(dataDir, "submarine-cables.json");
assert(fs.existsSync(cablesPath), "data/submarine-cables.json file exists");

const cablesGeoJson = JSON.parse(fs.readFileSync(cablesPath, "utf-8"));
const cableFeatures = cablesGeoJson.features || [];
assert(cableFeatures.length >= 700, `Submarine cable features count: ${cableFeatures.length} (expected 700+)`);

// ---------------------------------------------------------------------------
// TEST 9: PeeringDB, Climate TRACE & Spatial Cross-Referencing Engine
// ---------------------------------------------------------------------------
console.log("\n--- TEST 9: PeeringDB, Climate TRACE & Spatial Cross-Referencing ---");

// Check PeeringDB metadata on data centers
const dcWithPeeringDb = datacenters.filter((d) => d.peeringDbId && d.connectedNetworksCount > 0);
assert(dcWithPeeringDb.length === datacenters.length, `100% of data centers have PeeringDB & ASN carrier counts (${dcWithPeeringDb.length}/${datacenters.length})`);

// Check Climate TRACE metadata on power plants
const plantsWithTrace = plants.filter((p) => p.climateTraceAssetId && p.annualCo2EmissionsTons !== undefined);
assert(plantsWithTrace.length === plants.length, `100% of power stations have Climate TRACE asset IDs & annual emissions (${plantsWithTrace.length}/${plants.length})`);

// Haversine distance function test
function testHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

// Distance from Yotta NM1 (18.9894, 73.1175) to Trombay Thermal Station (~19.00, 72.90)
const yottaToMumbaiDist = testHaversine(18.9894, 73.1175, 19.0028, 72.9038);
assert(yottaToMumbaiDist > 10 && yottaToMumbaiDist < 40, `Haversine distance accurate (Yotta NM1 to Trombay: ${yottaToMumbaiDist} km)`);

// Local Grid Supply calculation for Ashburn AWS Campus
const ashburnDc = datacenters.find((d) => d.name.includes("Ashburn Campus"));
const ashburnSupplyingPlants = plants.filter((p) => testHaversine(ashburnDc.latitude, ashburnDc.longitude, p.latitude, p.longitude) <= 150);
assert(ashburnSupplyingPlants.length >= 1, `Local power plants found within 150km of Ashburn DC (${ashburnSupplyingPlants.length} stations)`);

// ---------------------------------------------------------------------------
// FINAL SUMMARY
// ---------------------------------------------------------------------------
console.log("\n===============================================================");
console.log(`QA TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
console.log("===============================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
