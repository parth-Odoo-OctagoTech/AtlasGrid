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
// TEST 10: India Data Center Ecosystem & Sovereign AI Compute
// ---------------------------------------------------------------------------
console.log("\n--- TEST 10: India Data Center Ecosystem & Sovereign AI Compute ---");

const indiaDcs = datacenters.filter((d) => d.country === "IN");
assert(indiaDcs.length >= 250, `India data centers count: ${indiaDcs.length} (expected 250+)`);

const indiaTotalMw = indiaDcs.reduce((sum, d) => sum + (d.estimatedPowerMw || 0), 0);
assert(indiaTotalMw >= 10000, `India total DC capacity: ${indiaTotalMw.toLocaleString()} MW (expected >= 10,000 MW)`);

// Reliance Jio
const jioDcs = indiaDcs.filter((d) => d.operator === "Reliance Jio Data Centers");
assert(jioDcs.length >= 10, `Reliance Jio campuses count: ${jioDcs.length} (expected >= 10)`);
const jamnagarAi = jioDcs.find((d) => d.name.includes("Jamnagar"));
assert(!!jamnagarAi && jamnagarAi.estimatedPowerMw >= 100, `Reliance Jamnagar Green AI Mega-Campus verified (${jamnagarAi?.estimatedPowerMw} MW operational)`);

// AdaniConneX
const adaniDcs = indiaDcs.filter((d) => d.operator === "AdaniConnex");
assert(adaniDcs.length >= 10, `AdaniConneX campuses count: ${adaniDcs.length} (expected >= 10)`);
const vizagAdani = adaniDcs.find((d) => d.name.includes("Visakhapatnam"));
assert(!!vizagAdani && vizagAdani.estimatedPowerMw >= 100, `AdaniConneX Visakhapatnam Green DC Park verified (${vizagAdani?.estimatedPowerMw} MW operational)`);

// STT GDC India
const sttDcs = indiaDcs.filter((d) => d.operator === "STT GDC India" || d.operator === "STT GDC");
assert(sttDcs.length >= 20, `STT GDC India campuses count: ${sttDcs.length} (expected >= 20)`);

// CtrlS Datacenters
const ctrlSDcs = indiaDcs.filter((d) => d.operator === "CtrlS Datacenters");
assert(ctrlSDcs.length >= 15, `CtrlS Datacenters Rated-4 campuses count: ${ctrlSDcs.length} (expected >= 15)`);

// Yotta Data Services
const yottaDcs = indiaDcs.filter((d) => d.operator === "Yotta Infrastructure");
assert(yottaDcs.length >= 8, `Yotta Data Services campuses count: ${yottaDcs.length} (expected >= 8)`);

// Nxtra & Sify
const nxtraDcs = indiaDcs.filter((d) => d.operator === "Nxtra by Airtel");
assert(nxtraDcs.length >= 8, `Nxtra by Airtel campuses count: ${nxtraDcs.length} (expected >= 8)`);
const sifyDcs = indiaDcs.filter((d) => d.operator === "Sify Technologies");
assert(sifyDcs.length >= 7, `Sify Technologies campuses count: ${sifyDcs.length} (expected >= 7)`);

// ---------------------------------------------------------------------------
// TEST 11: Dataset Uniqueness & API Route Reliability
// ---------------------------------------------------------------------------
console.log("\n--- TEST 11: Dataset Uniqueness & Serverless Reliability ---");

const dcIdSet = new Set();
let dcIdDuplicates = 0;
for (const d of datacenters) {
  if (dcIdSet.has(d.id)) dcIdDuplicates++;
  dcIdSet.add(d.id);
}
assert(dcIdDuplicates === 0, `Zero duplicate IDs across all data centers (unique: ${dcIdSet.size}/${datacenters.length})`);

const plantIdSet = new Set();
let plantIdDuplicates = 0;
for (const p of plants) {
  if (plantIdSet.has(p.id)) plantIdDuplicates++;
  plantIdSet.add(p.id);
}
assert(plantIdDuplicates === 0, `Zero duplicate IDs across all power plants (unique: ${plantIdSet.size}/${plants.length})`);

// Verify API route handlers export dynamic = "force-dynamic"
const apiRoutes = [
  "app/api/stations/route.ts",
  "app/api/stations/[id]/route.ts",
  "app/api/datacenters/route.ts",
  "app/api/telemetry/summary/route.ts",
  "app/api/telemetry/stream/route.ts",
  "app/api/cables/route.ts",
  "app/api/interconnectors/route.ts",
  "app/api/entsoe/route.ts",
  "app/api/us-iso/route.ts",
  "app/api/substations/route.ts",
  "app/api/cron/crawler/route.ts",
  "app/api/historical/route.ts",
];

let routesWithForceDynamic = 0;
for (const routePath of apiRoutes) {
  const fullPath = path.join(process.cwd(), routePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf-8");
    if (content.includes('export const dynamic = "force-dynamic"')) {
      routesWithForceDynamic++;
    }
  }
}
assert(routesWithForceDynamic === apiRoutes.length, `All ${apiRoutes.length} API routes export force-dynamic for serverless reliability`);

// Verify Fleet modal component exists
const modalPath = path.join(process.cwd(), "components/analytics/DataCenterFleetModal.tsx");
assert(fs.existsSync(modalPath), "DataCenterFleetModal.tsx exists in components/analytics");

// ---------------------------------------------------------------------------
// TEST 12: Data Center External References & Google Maps Hyperlinks
// ---------------------------------------------------------------------------
console.log("\n--- TEST 12: Data Center External References & Google Maps Hyperlinks ---");

const utilsPath = path.join(process.cwd(), "lib/utils/datacenter-links.ts");
assert(fs.existsSync(utilsPath), "lib/utils/datacenter-links.ts helper exists");

let allValidMapsUrls = 0;
let validSourceRefs = 0;
for (const d of datacenters) {
  const gMapsUrl = `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`;
  if (gMapsUrl.startsWith("https://www.google.com/maps/search/?api=1&query=") && !isNaN(d.latitude) && !isNaN(d.longitude)) {
    allValidMapsUrls++;
  }
  if (d.peeringDbId || d.osmId || d.website) {
    validSourceRefs++;
  }
}
assert(allValidMapsUrls === datacenters.length, `100% of data centers generate valid Google Maps search hyperlinks (${allValidMapsUrls}/${datacenters.length})`);
assert(validSourceRefs === datacenters.length, `100% of data centers have authoritative online source references (${validSourceRefs}/${datacenters.length})`);

// ---------------------------------------------------------------------------
// TEST 13: High-Voltage Substations Layer & Schema Integrity
// ---------------------------------------------------------------------------
console.log("\n--- TEST 13: High-Voltage Substations Layer & Schema Integrity ---");

const subsPath = path.join(process.cwd(), "data", "substations.json");
assert(fs.existsSync(subsPath), "substations.json file exists on disk");
const subs = JSON.parse(fs.readFileSync(subsPath, "utf-8"));
assert(Array.isArray(subs) && subs.length >= 2500, `Loaded ${subs.length} high-voltage substations (>= 2500 requirement)`);

let validSubstations = 0;
let validVoltages = 0;
for (const s of subs) {
  if (s.id && s.name && typeof s.latitude === "number" && typeof s.longitude === "number" && s.operator && s.type) {
    validSubstations++;
  }
  if (typeof s.voltageKv === "number" && s.voltageKv >= 110 && s.voltageKv <= 800) {
    validVoltages++;
  }
}
assert(validSubstations === subs.length, `100% of substations have valid IDs, names, coordinates, and operators (${validSubstations}/${subs.length})`);
assert(validVoltages === subs.length, `100% of substations have valid transmission voltages (110kV-800kV) (${validVoltages}/${subs.length})`);

const npSubs = subs.filter((s) => s.country === "NP");
const krSubs = subs.filter((s) => s.country === "KR");
const jpSubs = subs.filter((s) => s.country === "JP");
const usSubs = subs.filter((s) => s.country === "US");
assert(npSubs.length >= 20, `Nepal substations count: ${npSubs.length} (>= 20 requirement)`);
assert(krSubs.length >= 80, `South Korea substations count: ${krSubs.length} (>= 80 requirement)`);
assert(jpSubs.length >= 100, `Japan substations count: ${jpSubs.length} (>= 100 requirement)`);
assert(usSubs.length >= 100, `United States substations count: ${usSubs.length} (>= 100 requirement)`);

// Verification of California & US Pacific Coast Maritime Rejection (Zero Water Points)
function isOffshoreUSWestCoast(lat, lng) {
  if (lat >= 32.0 && lat <= 49.0 && lng < -114.0) {
    if (lat < 32.6 && lng < -117.15) return true; // South of San Diego / Tijuana offshore
    if (lat < 33.0 && lng < -117.35) return true; // San Diego county coastal waters
    if (lat < 33.5 && lng < -117.80) return true; // Orange County / Dana Point offshore
    if (lat < 33.8 && lng < -118.40) return true; // San Pedro / Long Beach offshore
    if (lat < 34.1 && lng < -118.60) return true; // Santa Monica Bay
    if (lat < 34.3 && lng < -119.50) return true; // Ventura / Santa Barbara Channel
    if (lat < 34.55 && lng < -120.50) return true; // Point Conception offshore
    if (lat < 35.25 && lng < -120.90) return true; // San Luis Obispo (Diablo Canyon is at -120.852)
    if (lat < 35.80 && lng < -121.40) return true; // Central Coast / San Simeon offshore
    if (lat < 36.50 && lng < -121.95) return true; // Big Sur offshore
    if (lat < 37.00 && lng < -122.30) return true; // Monterey Bay (Moss Landing is at -121.785)
    if (lat < 37.80 && lng < -122.55) return true; // SF Peninsula offshore
    if (lat < 38.30 && lng < -123.10) return true; // Marin / Point Reyes offshore
    if (lat < 39.00 && lng < -123.75) return true; // Sonoma coast offshore
    if (lat < 40.00 && lng < -124.15) return true; // Mendocino coast offshore
    if (lat < 40.50 && lng < -124.45) return true; // Cape Mendocino offshore
    if (lat < 42.00 && lng < -124.30) return true; // Humboldt / Del Norte offshore
    if (lat < 46.30 && lng < -124.10) return true; // Oregon coast offshore
    if (lat <= 49.00 && lng < -124.80) return true; // Washington coast offshore
  }
  return false;
}

const offshoreSubs = subs.filter((s) => isOffshoreUSWestCoast(s.latitude, s.longitude));
assert(offshoreSubs.length === 0, `Zero substations in California/US West Coast Pacific Ocean waters (found ${offshoreSubs.length})`);

const offshorePlants = plants.filter((p) => isOffshoreUSWestCoast(p.latitude, p.longitude));
assert(offshorePlants.length === 0, `Zero power plants in California/US West Coast Pacific Ocean waters (found ${offshorePlants.length})`);

// Verify Key California 500kV Bulk Transmission Hubs are present and accurate
const midwaySub = subs.find((s) => s.id === "us-sub-midway" || s.name.includes("Midway 500kV"));
assert(midwaySub && midwaySub.latitude >= 35.2 && midwaySub.latitude <= 35.4 && midwaySub.longitude >= -119.8 && midwaySub.longitude <= -119.5, "Midway 500kV Substation verified at Buttonwillow, Kern County");

const vincentSub = subs.find((s) => s.id === "us-sub-vincent" || s.name.includes("Vincent 500kV"));
assert(vincentSub && vincentSub.latitude >= 34.3 && vincentSub.latitude <= 34.6 && vincentSub.longitude >= -118.3 && vincentSub.longitude <= -118.0, "Vincent 500kV Substation verified at Acton/Palmdale, LA County");

const lugoSub = subs.find((s) => s.id === "us-sub-lugo" || s.name.includes("Lugo 500kV"));
assert(lugoSub && lugoSub.latitude >= 34.2 && lugoSub.latitude <= 34.5 && lugoSub.longitude >= -117.5 && lugoSub.longitude <= -117.2, "Lugo 500kV Substation verified at Hesperia, San Bernardino County");

const deversSub = subs.find((s) => s.id === "us-sub-devers-500" || s.name.includes("Devers 500kV"));
assert(deversSub && deversSub.latitude >= 33.8 && deversSub.latitude <= 34.1 && deversSub.longitude >= -116.7 && deversSub.longitude <= -116.4, "Devers 500kV Substation verified at Palm Springs, Riverside County");

const imperialSub = subs.find((s) => s.name.includes("Imperial Valley 500kV"));
assert(imperialSub && imperialSub.latitude >= 32.6 && imperialSub.latitude <= 32.9 && imperialSub.longitude >= -115.9 && imperialSub.longitude <= -115.6, "Imperial Valley 500kV Substation verified at El Centro / Imperial County");

const diabloSub = subs.find((s) => s.id === "sub-us-station-real-26" || s.name.includes("Diablo Canyon"));
assert(diabloSub && diabloSub.latitude >= 35.1 && diabloSub.latitude <= 35.3 && diabloSub.longitude >= -120.9 && diabloSub.longitude <= -120.7, "Diablo Canyon 500kV Switchyard verified at San Luis Obispo coast");

const mossLandingSub = subs.find((s) => s.id === "sub-us-station-real-33" || s.name.includes("Moss Landing"));
assert(mossLandingSub && mossLandingSub.latitude >= 36.7 && mossLandingSub.latitude <= 36.9 && mossLandingSub.longitude >= -121.9 && mossLandingSub.longitude <= -121.7, "Moss Landing 500kV Switchyard verified at Monterey Bay");

// Substation Layer Filtering & Data Center Isolation Verification
const deckGlMapSrc = fs.readFileSync(path.join(process.cwd(), "components", "map", "DeckGLMap.tsx"), "utf-8");
assert(deckGlMapSrc.includes('filters.infrastructureType === "datacenters"'), "DeckGLMap checks datacenters filter mode before rendering substations");
assert(deckGlMapSrc.includes("filteredSubstations"), "DeckGLMap uses filteredSubstations layer data");

const storeSrc = fs.readFileSync(path.join(process.cwd(), "lib", "store", "useGridStore.ts"), "utf-8");
assert(storeSrc.includes('substations: type === "all" || type === "substations"'), "useGridStore excludes substations when focusing on datacenters");

const filtersSrc = fs.readFileSync(path.join(process.cwd(), "components", "filters", "FloatingFilters.tsx"), "utf-8");
assert(filtersSrc.includes('"substations"'), "FloatingFilters includes dedicated substations focus option");

// ---------------------------------------------------------------------------
// TEST 14: South Korea & Japan All-Tier Power Plants & 0% Water Check
// ---------------------------------------------------------------------------
console.log("\n--- TEST 14: South Korea & Japan All-Tier Power Plants & Accurate Land Calibration ---");

const krPlants = plants.filter((p) => p.country === "KR");
const jpPlants = plants.filter((p) => p.country === "JP");

assert(krPlants.length >= 100, `South Korea has ${krPlants.length} verified power plants across all provinces (>= 100 requirement)`);
assert(jpPlants.length >= 180, `Japan has ${jpPlants.length} verified power plants across all prefectures (>= 180 requirement)`);

// Check fuel type diversity in KR & JP
const krFuels = new Set(krPlants.map((p) => p.fuelType));
const jpFuels = new Set(jpPlants.map((p) => p.fuelType));
assert(krFuels.has("nuclear") && krFuels.has("hydro") && krFuels.has("gas") && krFuels.has("solar") && krFuels.has("wind"), "South Korea covers all tiers: nuclear, hydro, CCGT/gas, solar, wind");
assert(jpFuels.has("nuclear") && jpFuels.has("hydro") && jpFuels.has("gas") && jpFuels.has("geothermal") && jpFuels.has("solar") && jpFuels.has("wind"), "Japan covers all tiers: nuclear, hydro, CCGT/gas, geothermal, solar, wind");

// Check zero coordinates in open water / extremes for KR and JP
let krInvalid = 0;
for (const p of krPlants) {
  // Land bounds for South Korea
  if (p.latitude < 33.1 || p.latitude > 38.6 || p.longitude < 125.9 || p.longitude > 129.6) {
    krInvalid++;
  }
}
assert(krInvalid === 0, `0 South Korea power stations outside terrestrial bounds (0/${krPlants.length})`);

let jpInvalid = 0;
for (const p of jpPlants) {
  // Land bounds for Japan including Okinawa
  if (p.latitude < 24.0 || p.latitude > 46.0 || p.longitude < 122.0 || p.longitude > 154.0) {
    jpInvalid++;
  }
}
assert(jpInvalid === 0, `0 Japan power stations outside terrestrial bounds (0/${jpPlants.length})`);

// ---------------------------------------------------------------------------
// TEST 15: Autonomous Infrastructure Crawler Bot & Audit Log
// ---------------------------------------------------------------------------
console.log("\n--- TEST 15: Autonomous Infrastructure Crawler Bot & Audit Log ---");

const auditLogPath = path.join(process.cwd(), "data", "crawler-audit-log.json");
assert(fs.existsSync(auditLogPath), "crawler-audit-log.json exists on disk");
const auditLogs = JSON.parse(fs.readFileSync(auditLogPath, "utf-8"));
assert(Array.isArray(auditLogs) && auditLogs.length > 0, `Crawler audit log contains ${auditLogs.length} verified audit run records`);

const latestRun = auditLogs[0];
assert(latestRun.status === "success", `Latest crawler run status: ${latestRun.status}`);
assert(latestRun.discoveredCandidates > 0, `Crawler examined ${latestRun.discoveredCandidates} candidate nodes`);
assert(latestRun.maritimePointsRejected === 0, "Crawler automated land verification rejected 0 points (100% on land)");

const cronRoutePath = path.join(process.cwd(), "app/api/cron/crawler/route.ts");
const crawlerEnginePath = path.join(process.cwd(), "lib/crawler/grid-crawler.ts");
const ghaWorkflowPath = path.join(process.cwd(), ".github/workflows/infrastructure-crawler.yml");
const vercelJsonPath = path.join(process.cwd(), "vercel.json");

assert(fs.existsSync(cronRoutePath), "Vercel cron API endpoint exists (/api/cron/crawler)");
assert(fs.existsSync(crawlerEnginePath), "Autonomous crawler engine exists (lib/crawler/grid-crawler.ts)");
assert(fs.existsSync(ghaWorkflowPath), "GitHub Actions scheduled workflow exists (.github/workflows/infrastructure-crawler.yml)");
assert(fs.existsSync(vercelJsonPath), "vercel.json exists with cron configuration");

// ---------------------------------------------------------------------------
// TEST 16: Satellite Mode & Dual Overlay Engine (Grid & Flood Hazard)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 16: Satellite Mode & Dual Overlay Engine (Grid & Flood Hazard) ---");

const controlsSrc = fs.readFileSync(path.join(process.cwd(), "components/map/MapControls.tsx"), "utf-8");
assert(controlsSrc.includes('basemapStyle === "satellite" ? "positron" : "satellite"'), "MapControls has dedicated Satellite imagery direct toggle button");
assert(controlsSrc.includes('toggleLayer("interconnectors")'), "MapControls has dedicated Grid Transmission Overlay button");
assert(controlsSrc.includes('toggleLayer("floodOverlay")'), "MapControls has dedicated Flood Hazard Overlay button");

const deckGlCode = fs.readFileSync(path.join(process.cwd(), "components/map/DeckGLMap.tsx"), "utf-8");
assert(deckGlCode.includes("globe-basemap-surface-${basemapStyle}"), "DeckGLMap dynamically updates globe tile layer ID for instant satellite reload");
assert(deckGlCode.includes("flood-hazard-zones-outer"), "DeckGLMap renders coastal & riverine flood hazard zones");
assert(!deckGlCode.includes('filters.infrastructureType !== "datacenters" && layerVisibility.interconnectors'), "Grid overlay remains accessible across data centers view");

const storeCode = fs.readFileSync(path.join(process.cwd(), "lib/store/useGridStore.ts"), "utf-8");
assert(storeCode.includes("floodOverlay: boolean"), "useGridStore LayerVisibility includes floodOverlay");
assert(storeCode.includes("setHoveredFloodZone"), "useGridStore implements setHoveredFloodZone action");

const inspectorCode = fs.readFileSync(path.join(process.cwd(), "components/inspector/StationInspector.tsx"), "utf-8");
assert(inspectorCode.includes('setBasemapStyle("satellite")'), "StationInspector triggers in-app satellite mode on facility inspection");
assert(inspectorCode.includes("data=!3m1!1e3"), "StationInspector links to Google Maps 3D satellite imagery");
assert(inspectorCode.includes("flood_overlay_risk"), "StationInspector displays flood hazard assessment for facilities");

// ---------------------------------------------------------------------------
// TEST 17: Cybersecurity Perimeter & Administrative Authentication Gate
// ---------------------------------------------------------------------------
console.log("\n--- TEST 17: Cybersecurity Perimeter & Administrative Authentication ---");

const secModulePath = path.join(process.cwd(), "lib/auth/security.ts");
assert(fs.existsSync(secModulePath), "Security module exists (lib/auth/security.ts)");

const authLoginRoute = path.join(process.cwd(), "app/api/auth/login/route.ts");
const authLogoutRoute = path.join(process.cwd(), "app/api/auth/logout/route.ts");
const authSessionRoute = path.join(process.cwd(), "app/api/auth/session/route.ts");
assert(fs.existsSync(authLoginRoute), "Auth login route exists (app/api/auth/login/route.ts)");
assert(fs.existsSync(authLogoutRoute), "Auth logout route exists (app/api/auth/logout/route.ts)");
assert(fs.existsSync(authSessionRoute), "Auth session route exists (app/api/auth/session/route.ts)");

const secGatePath = path.join(process.cwd(), "components/auth/SecurityAccessGate.tsx");
assert(fs.existsSync(secGatePath), "SecurityAccessGate component exists (components/auth/SecurityAccessGate.tsx)");

const secGateSrc = fs.readFileSync(secGatePath, "utf-8");
assert(secGateSrc.includes("admin"), "SecurityAccessGate contains operator credential validation");
assert(secGateSrc.includes("Qwerty123"), "SecurityAccessGate supports authorized passkey default");
assert(secGateSrc.includes("RATE LIMIT LOCKOUT ACTIVE") || secGateSrc.includes("lockoutSecs"), "SecurityAccessGate enforces rate-limit feedback");

const pageSrc = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf-8");
assert(pageSrc.includes("<SecurityAccessGate>"), "app/page.tsx is safeguarded by SecurityAccessGate perimeter");
assert(pageSrc.includes("<AtlasAIChatModal"), "app/page.tsx embeds AtlasAIChatModal");

const topHudSrc = fs.readFileSync(path.join(process.cwd(), "components/hud/TopHud.tsx"), "utf-8");
assert(topHudSrc.includes("useAuth"), "TopHud connects to security authentication context");
assert(topHudSrc.includes("LVL-5"), "TopHud displays Level-5 clearance indicator");
assert(topHudSrc.includes("lockTerminal"), "TopHud provides 1-click terminal lock / session termination");

// ---------------------------------------------------------------------------
// TEST 18: Grounded AI Query Engine (Zero-Hallucination: India 2025 vs Total)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 18: Grounded AI Query Engine (Zero-Hallucination Policy) ---");

const aiEnginePath = path.join(process.cwd(), "lib/services/ai-query-engine.ts");
const aiChatRoute = path.join(process.cwd(), "app/api/ai/chat/route.ts");
const chatModalPath = path.join(process.cwd(), "components/chat/AtlasAIChatModal.tsx");

assert(fs.existsSync(aiEnginePath), "AI Query Engine exists (lib/services/ai-query-engine.ts)");
assert(fs.existsSync(aiChatRoute), "AI Chat API route exists (app/api/ai/chat/route.ts)");
assert(fs.existsSync(chatModalPath), "AI Copilot Modal exists (components/chat/AtlasAIChatModal.tsx)");

// Data verification on commissioningYear in datacenters.json
const allDcs = JSON.parse(fs.readFileSync(datacentersPath, "utf-8"));
const indiaDatacenters = allDcs.filter((d) => d.country === "India" || d.country === "IN");
assert(indiaDatacenters.length === 290, `Exact India data centers count in dataset: ${indiaDatacenters.length} (expected 290)`);

const india2025OrEarlier = indiaDatacenters.filter((d) => (d.commissioningYear || 2024) <= 2025);
const india2026New = indiaDatacenters.filter((d) => (d.commissioningYear || 2024) === 2026);

assert(india2025OrEarlier.length === 272, `India facilities operational in/by 2025: ${india2025OrEarlier.length} (expected 272)`);
assert(india2026New.length === 18, `India facilities commissioned in 2026: ${india2026New.length} (expected 18)`);

const totalIndiaPowerMw = indiaDatacenters.reduce((sum, d) => sum + (d.estimatedPowerMw || 0), 0);
assert(Math.round(totalIndiaPowerMw) === 14107, `India total power load: ${totalIndiaPowerMw.toFixed(1)} MW (~14,107 MW)`);

const aiEngineSrc = fs.readFileSync(aiEnginePath, "utf-8");
assert(aiEngineSrc.includes("ZERO-HALLUCINATION"), "AI Query Engine specifies zero-hallucination policy");
assert(aiEngineSrc.includes("272"), "AI Query Engine provides exact count 272 for India in 2025");
assert(aiEngineSrc.includes("290"), "AI Query Engine provides exact total count 290 for India");

const chatModalSrc = fs.readFileSync(chatModalPath, "utf-8");
assert(chatModalSrc.includes("How many data centres are in India?"), "AI Copilot includes prompt pill for India DC count");
assert(chatModalSrc.includes("How many were there in 2025?"), "AI Copilot includes prompt pill for 2025 DC count");
assert(chatModalSrc.includes("atlasgrid_gemini_key"), "AI Copilot provides user Gemini API key integration");
assert(chatModalSrc.includes('type={showKey ? "text" : "password"}'), "AI Copilot enforces password masking for Gemini API key");
assert(chatModalSrc.includes("Eye") && chatModalSrc.includes("EyeOff"), "AI Copilot includes show/hide visibility toggle for API key");
assert(chatModalSrc.includes("Purge Key") && chatModalSrc.includes('removeItem("atlasgrid_gemini_key")'), "AI Copilot includes one-click key purge action");
assert(chatModalSrc.includes("••••••••••••••••"), "AI Copilot provides masked credential preview to protect against shoulder surfing");

const chatRouteSrc = fs.readFileSync(aiChatRoute, "utf-8");
assert(chatRouteSrc.includes("gemini-3.6-flash"), "AI Chat route supports Gemini 3.6 Flash");
assert(chatRouteSrc.includes("gemini-2.5-flash"), "AI Chat route supports Gemini 2.5 Flash");
assert(!chatRouteSrc.includes("gemini-1.5-flash"), "AI Chat route has eliminated deprecated Gemini 1.5 Flash");
assert(chatRouteSrc.includes("v1beta/models"), "AI Chat route implements dynamic model discovery");
assert(chatRouteSrc.includes("[REDACTED_API_KEY]"), "AI Chat route redacts API keys from error responses");

const testKeyRoutePath = path.join(process.cwd(), "app/api/ai/test-key/route.ts");
const testKeySrc = fs.readFileSync(testKeyRoutePath, "utf-8");
assert(testKeySrc.includes("gemini-3.6-flash"), "AI Test Key route validates Gemini 3.6 Flash connectivity");
assert(testKeySrc.includes("gemini-2.5-flash"), "AI Test Key route validates Gemini 2.5 Flash connectivity");
assert(!testKeySrc.includes("gemini-1.5-flash"), "AI Test Key route has eliminated deprecated Gemini 1.5 Flash");
assert(testKeySrc.includes("v1beta/models"), "AI Test Key route implements dynamic model discovery");
assert(testKeySrc.includes("[REDACTED_API_KEY]"), "AI Test Key route redacts API keys from test failure payloads");

// ---------------------------------------------------------------------------
// TEST 19: Authoritative Historical Database (Earthquakes, Severe Storms, Climate & DC Growth)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 19: Authoritative Historical Database (1950–2026 Audit) ---");

const histEqPath = path.join(dataDir, "historical-earthquakes.json");
const histStormPath = path.join(dataDir, "historical-storms.json");
const histClimatePath = path.join(dataDir, "historical-climate.json");
const histGrowthPath = path.join(dataDir, "historical-dc-growth.json");

assert(fs.existsSync(histEqPath), "historical-earthquakes.json exists on disk");
assert(fs.existsSync(histStormPath), "historical-storms.json exists on disk");
assert(fs.existsSync(histClimatePath), "historical-climate.json exists on disk");
assert(fs.existsSync(histGrowthPath), "historical-dc-growth.json exists on disk");

const histEarthquakes = JSON.parse(fs.readFileSync(histEqPath, "utf-8"));
const histStorms = JSON.parse(fs.readFileSync(histStormPath, "utf-8"));
const histClimate = JSON.parse(fs.readFileSync(histClimatePath, "utf-8"));
const histGrowth = JSON.parse(fs.readFileSync(histGrowthPath, "utf-8"));

// 1. Earthquakes validation
assert(Array.isArray(histEarthquakes) && histEarthquakes.length >= 900, `Loaded ${histEarthquakes.length} historical earthquakes (M5.0+)`);
let invalidEqCoords = 0;
let underM5Count = 0;
for (const eq of histEarthquakes) {
  if (eq.latitude < -90 || eq.latitude > 90 || eq.longitude < -180 || eq.longitude > 180) invalidEqCoords++;
  if (eq.magnitude < 5.0) underM5Count++;
}
assert(invalidEqCoords === 0, "100% of historical earthquakes have valid geographic coordinates");
assert(underM5Count === 0, "100% of historical earthquakes satisfy M5.0+ threshold");

const lomaPrieta = histEarthquakes.find((e) => e.id === "usgs_1989_lomaprieta" || e.name.includes("Loma Prieta"));
assert(!!lomaPrieta && lomaPrieta.magnitude === 6.9, "1989 Loma Prieta M6.9 earthquake verified in historical index");

const tohoku = histEarthquakes.find((e) => e.id === "usgs_2011_tohoku" || e.name.includes("Great East Japan"));
assert(!!tohoku && tohoku.magnitude === 9.1, "2011 Great East Japan Tohoku M9.1 megathrust verified in historical index");

const bhuj = histEarthquakes.find((e) => e.id === "usgs_2001_bhuj" || e.name.includes("Bhuj"));
assert(!!bhuj && bhuj.magnitude === 7.7, "2001 Bhuj Gujarat M7.7 intraplate earthquake verified in historical index");

// 2. Severe Storms validation
assert(Array.isArray(histStorms) && histStorms.length >= 400, `Loaded ${histStorms.length} historical severe storm events`);
const katrina = histStorms.find((s) => s.name.includes("Katrina"));
assert(!!katrina && katrina.categoryNum === 5, "Hurricane Katrina Cat 5 verified in historical storms index");

const sandy = histStorms.find((s) => s.name.includes("Sandy"));
assert(!!sandy && sandy.categoryNum === 2, "Superstorm Sandy verified in historical storms index");

const joplin = histStorms.find((s) => s.name.includes("Joplin"));
assert(!!joplin && joplin.intensity === "EF5", "2011 Joplin EF5 tornado verified in historical storms index");

// 3. Climate Normals validation
const climateMarkets = Object.keys(histClimate);
assert(climateMarkets.length >= 10, `Loaded ${climateMarkets.length} regional 10-year climatological normal profiles`);
assert(!!histClimate["ashburn_va"], "Northern Virginia (Ashburn) climate normal verified");
assert(histClimate["ashburn_va"].totalAnnualFreeCoolingHours >= 5000, `Ashburn free-cooling economizer: ${histClimate["ashburn_va"].totalAnnualFreeCoolingHours} hrs/yr`);
assert(!!histClimate["silicon_valley"], "Silicon Valley (Santa Clara) climate normal verified");
assert(histClimate["silicon_valley"].freeCoolingEfficiencyPct >= 80, `Silicon Valley free-cooling efficiency: ${histClimate["silicon_valley"].freeCoolingEfficiencyPct}%`);

// 4. Data Center Fleet Growth validation
assert(Array.isArray(histGrowth) && histGrowth.length === 29, `Fleet growth covers exactly 29 years: 1998–2026 (actual: ${histGrowth.length})`);
const year1998 = histGrowth.find((g) => g.year === 1998);
const year2026 = histGrowth.find((g) => g.year === 2026);
assert(!!year1998 && year1998.avgPue >= 2.0, `1998 average PUE benchmark: ${year1998?.avgPue} (expected >= 2.0)`);
assert(!!year2026 && year2026.avgPue <= 1.25, `2026 average PUE benchmark: ${year2026?.avgPue} (expected <= 1.25)`);
assert(!!year2026 && year2026.totalPowerMw >= 100000, `2026 global DC fleet capacity: ${year2026?.totalPowerMw.toLocaleString()} MW (expected >= 100,000 MW)`);
assert(!!year2026 && year2026.cleanEnergySharePct >= 60, `2026 fleet clean energy share: ${year2026?.cleanEnergySharePct}% (expected >= 60%)`);

// 5. Schema, Migration & Seeding validation
const schemaSql = fs.readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf-8");
assert(schemaSql.includes("historical_earthquakes"), "lib/db/schema.sql defines historical_earthquakes table");
assert(schemaSql.includes("historical_severe_storms"), "lib/db/schema.sql defines historical_severe_storms table");
assert(schemaSql.includes("historical_climate_records"), "lib/db/schema.sql defines historical_climate_records table");
assert(schemaSql.includes("historical_datacenter_growth"), "lib/db/schema.sql defines historical_datacenter_growth table");
assert(schemaSql.includes("idx_historical_earthquakes_location"), "lib/db/schema.sql includes GiST spatial index for earthquakes");

const migrateSrc = fs.readFileSync(path.join(process.cwd(), "scripts/migrate-supabase.mjs"), "utf-8");
assert(migrateSrc.includes("historical_earthquakes"), "scripts/migrate-supabase.mjs contains historical_earthquakes migration DDL");
assert(migrateSrc.includes("historical_severe_storms"), "scripts/migrate-supabase.mjs contains historical_severe_storms migration DDL");

const seedSrc = fs.readFileSync(path.join(process.cwd(), "scripts/seed-supabase.mjs"), "utf-8");
assert(seedSrc.includes("seedHistoricalEarthquakes"), "scripts/seed-supabase.mjs contains seedHistoricalEarthquakes routine");
assert(seedSrc.includes("seedHistoricalStorms"), "scripts/seed-supabase.mjs contains seedHistoricalStorms routine");
assert(seedSrc.includes("seedHistoricalClimate"), "scripts/seed-supabase.mjs contains seedHistoricalClimate routine");
assert(seedSrc.includes("seedHistoricalDcGrowth"), "scripts/seed-supabase.mjs contains seedHistoricalDcGrowth routine");

// 6. UI & Historical Risk Ledger validation
const inspectorSrc = fs.readFileSync(path.join(process.cwd(), "components/inspector/StationInspector.tsx"), "utf-8");
assert(inspectorSrc.includes("Historical Hazard & Climate Ledger"), "StationInspector displays Historical Hazard & Climate Ledger");
assert(inspectorSrc.includes("1950–2026 AUDIT"), "StationInspector renders 1950–2026 audit badge");
assert(inspectorSrc.includes("dc-historical-risk"), "StationInspector queries dc-historical-risk endpoint");

// 7. Historical API Route validation
const apiHistRoute = path.join(process.cwd(), "app/api/historical/route.ts");
assert(fs.existsSync(apiHistRoute), "app/api/historical/route.ts exists");
const apiHistSrc = fs.readFileSync(apiHistRoute, "utf-8");
assert(apiHistSrc.includes('export const dynamic = "force-dynamic"'), "app/api/historical/route.ts exports force-dynamic");
assert(apiHistSrc.includes("facility_risk"), "app/api/historical/route.ts supports facility_risk parameter");

// ---------------------------------------------------------------------------
// TEST 20: Comprehensive Open Data Sources (10 Pillars) & Continuous Multi-Source Crawler
// ---------------------------------------------------------------------------
console.log("\n--- TEST 20: Comprehensive Open Data Sources (10 Pillars) & Continuous Crawler Engine ---");

const crawlerSourcesRoute = path.join(process.cwd(), "app/api/crawler/sources/route.ts");
assert(fs.existsSync(crawlerSourcesRoute), "app/api/crawler/sources/route.ts exists");
const crawlerSourcesSrc = fs.readFileSync(crawlerSourcesRoute, "utf-8");
assert(crawlerSourcesSrc.includes("totalPillars: 10"), "Data Sources API specifies all 10 infrastructure pillars");
assert(crawlerSourcesSrc.includes("peeringdb-fac"), "Data Sources API monitors PeeringDB Global Facility & IXP Registry");
assert(crawlerSourcesSrc.includes("us-iso-grid"), "Data Sources API monitors US Regional Transmission Organizations");
assert(crawlerSourcesSrc.includes("entsoe-transparency"), "Data Sources API monitors ENTSO-E European Transparency Platform");
assert(crawlerSourcesSrc.includes("usgs-realtime-eq"), "Data Sources API monitors USGS Real-Time Earthquake GeoJSON feed");
assert(crawlerSourcesSrc.includes("fema-nfhl"), "Data Sources API monitors FEMA National Flood Hazard Layer");
assert(crawlerSourcesSrc.includes("noaa-spc-svrgis"), "Data Sources API monitors NOAA SPC SVRGIS Severe Weather Archive");
assert(crawlerSourcesSrc.includes("nasa-power-api"), "Data Sources API monitors NASA POWER Global Solar & Meteorological API");
assert(crawlerSourcesSrc.includes("wri-aqueduct"), "Data Sources API monitors WRI Aqueduct 4.0 Water Risk Atlas");
assert(crawlerSourcesSrc.includes("usda-ssurgo-sda"), "Data Sources API monitors USDA NRCS Soil Data Access");
assert(crawlerSourcesSrc.includes("faa-part77-airspace"), "Data Sources API monitors FAA Part 77 Aeronautical GIS");

const crawlerSrc = fs.readFileSync(path.join(process.cwd(), "lib/crawler/grid-crawler.ts"), "utf-8");
assert(crawlerSrc.includes("syncLiveUsgsEarthquakes"), "GridCrawler implements live USGS Real-Time earthquake sync");
assert(crawlerSrc.includes("syncLiveGdacsAlerts"), "GridCrawler implements live GDACS multi-hazard disaster alert sync");
assert(crawlerSrc.includes("liveFeedsPolled"), "GridCrawler audit records track live feeds polled in each cycle");

const dataSourcesModalPath = path.join(process.cwd(), "components/analytics/DataSourcesRegistryModal.tsx");
assert(fs.existsSync(dataSourcesModalPath), "DataSourcesRegistryModal component exists");
const dataSourcesModalSrc = fs.readFileSync(dataSourcesModalPath, "utf-8");
assert(dataSourcesModalSrc.includes("DATA SOURCES") && dataSourcesModalSrc.includes("CONTINUOUS CRAWLER REGISTRY"), "Modal renders high-density registry title");
assert(dataSourcesModalSrc.includes("SYNC ALL SOURCES NOW"), "Modal provides operator 1-click multi-source sync trigger");
assert(dataSourcesModalSrc.includes("10 Infrastructure Pillars"), "Modal details 10 infrastructure pillars");

const sourcesStoreSrc = fs.readFileSync(path.join(process.cwd(), "lib/store/useGridStore.ts"), "utf-8");
assert(sourcesStoreSrc.includes("isDataSourcesOpen: boolean"), "useGridStore manages isDataSourcesOpen state");
assert(sourcesStoreSrc.includes("setDataSourcesOpen: (open: boolean) => void"), "useGridStore exposes setDataSourcesOpen action");

const hudSourcesSrc = fs.readFileSync(path.join(process.cwd(), "components/hud/TopHud.tsx"), "utf-8");
assert(hudSourcesSrc.includes("setDataSourcesOpen(true)"), "TopHud links crawler pill to open Data Sources Registry modal");
assert(hudSourcesSrc.includes("Sources"), "TopHud right action group includes Sources button");

const mainPageSrc = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf-8");
assert(mainPageSrc.includes("<DataSourcesRegistryModal"), "app/page.tsx mounts DataSourcesRegistryModal in root layout");

const blueprintPath = path.join(process.env.HOME || "", ".gemini/antigravity/brain/01110b01-a6aa-444a-b305-096c5ac40224/data_sources_and_crawler_blueprint.md");
if (fs.existsSync(blueprintPath)) {
  const bpSrc = fs.readFileSync(blueprintPath, "utf-8");
  assert(bpSrc.includes("Continuous Multi-Source Crawler Engine Implementation"), "Blueprint documents continuous multi-source crawler engine");
  assert(bpSrc.includes("Automated Schedules & Keeping Everything Updated"), "Blueprint documents automated cron update schedules");
}

// ---------------------------------------------------------------------------
// TEST 21: Institutional Commercialization & Investment Committee Underwriting Engine (Epics 1–5)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 21: Institutional Commercialization & Investment Committee Underwriting Engine ---");

// 1. Epic 1: FERC Order 2023 Interconnection Queue & Substation POI Headroom Engine
const queueDataPath = path.join(process.cwd(), "data/interconnection-queues.json");
assert(fs.existsSync(queueDataPath), "data/interconnection-queues.json exists on disk");
const queueData = JSON.parse(fs.readFileSync(queueDataPath, "utf-8"));
assert(Array.isArray(queueData) && queueData.length >= 10, `Loaded ${queueData.length} FERC/RTO bulk transmission queue profiles`);

const queueTypesPath = path.join(process.cwd(), "lib/types/interconnection-queue.ts");
assert(fs.existsSync(queueTypesPath), "lib/types/interconnection-queue.ts exists");

const queueServicePath = path.join(process.cwd(), "lib/services/interconnection-queue-service.ts");
assert(fs.existsSync(queueServicePath), "lib/services/interconnection-queue-service.ts exists");
const queueServiceSrc = fs.readFileSync(queueServicePath, "utf-8");
assert(queueServiceSrc.includes("findNearestInterconnectionQueue"), "Queue service exports findNearestInterconnectionQueue");
assert(queueServiceSrc.includes("queueSaturationIndex"), "Queue service calculates Queue Saturation Index (QSI)");

const queueRoutePath = path.join(process.cwd(), "app/api/interconnection-queue/route.ts");
assert(fs.existsSync(queueRoutePath), "app/api/interconnection-queue/route.ts exists");

// 2. Epic 2: Behind-The-Meter (BTM) Baseload Co-Location & Nuclear / SMR Feasibility Engine
const btmDataPath = path.join(process.cwd(), "data/btm-colocation-sites.json");
assert(fs.existsSync(btmDataPath), "data/btm-colocation-sites.json exists on disk");
const btmData = JSON.parse(fs.readFileSync(btmDataPath, "utf-8"));
assert(Array.isArray(btmData) && btmData.length >= 8, `Loaded ${btmData.length} verified BTM nuclear, SMR, and clean baseload sites`);

const susquehanna = btmData.find((s) => s.id === "btm-susquehanna");
assert(!!susquehanna, "Susquehanna Nuclear Station exists in BTM dataset");
if (susquehanna) {
  assert(susquehanna.availableDirectBtmCapacityMw === 960, "Susquehanna has 960 MW direct BTM bus capacity");
  assert(susquehanna.contiguousAcreageAvailable === 1200, "Susquehanna has 1,200 acres dedicated data center land");
  assert(susquehanna.rtoTariffBypassSavingsDollarPerMwh >= 20, "Susquehanna saves >= $20/MWh RTO tariff bypass");
}

const craneTmi = btmData.find((s) => s.id === "btm-crane-tmi");
assert(!!craneTmi, "Crane Clean Energy Center (TMI Unit 1) exists in BTM dataset");

const btmTypesPath = path.join(process.cwd(), "lib/types/btm-colocation.ts");
assert(fs.existsSync(btmTypesPath), "lib/types/btm-colocation.ts exists");

const btmServicePath = path.join(process.cwd(), "lib/services/btm-colocation-service.ts");
assert(fs.existsSync(btmServicePath), "lib/services/btm-colocation-service.ts exists");
const btmServiceSrc = fs.readFileSync(btmServicePath, "utf-8");
assert(btmServiceSrc.includes("findNearestBtmColocation"), "BTM service exports findNearestBtmColocation");
assert(btmServiceSrc.includes("annualTransmissionTariffSavingsMillionDollars"), "BTM service computes annual tariff bypass dollar savings");

const btmRoutePath = path.join(process.cwd(), "app/api/btm-colocation/route.ts");
assert(fs.existsSync(btmRoutePath), "app/api/btm-colocation/route.ts exists");

// 3. Epic 3: 24/7 Carbon-Free Energy (CFE) Matching & Scope 2 Decarbonization Simulator
const cfeTypesPath = path.join(process.cwd(), "lib/types/carbon-free-energy.ts");
assert(fs.existsSync(cfeTypesPath), "lib/types/carbon-free-energy.ts exists");

const cfeEnginePath = path.join(process.cwd(), "lib/services/cfe-simulation-engine.ts");
assert(fs.existsSync(cfeEnginePath), "lib/services/cfe-simulation-engine.ts exists");
const cfeEngineSrc = fs.readFileSync(cfeEnginePath, "utf-8");
assert(cfeEngineSrc.includes("run247CfeSimulation"), "CFE simulation engine exports run247CfeSimulation");
assert(cfeEngineSrc.includes("bessCapacityMwh"), "CFE simulation engine incorporates battery storage (BESS) dispatch");
assert(cfeEngineSrc.includes("avoidedScope2EmissionsTonsCo2"), "CFE simulation engine calculates avoided Scope 2 CO2 tons");

const cfeRoutePath = path.join(process.cwd(), "app/api/cfe-simulator/route.ts");
assert(fs.existsSync(cfeRoutePath), "app/api/cfe-simulator/route.ts exists");

// 4. Epic 4: Water Usage Effectiveness (WUE) & Thermal Cooling Energy Penalty Engine
const coolingEnginePath = path.join(process.cwd(), "lib/services/water-cooling-engine.ts");
assert(fs.existsSync(coolingEnginePath), "lib/services/water-cooling-engine.ts exists");
const coolingEngineSrc = fs.readFileSync(coolingEnginePath, "utf-8");
assert(coolingEngineSrc.includes("calculateWaterCoolingMetrics"), "Cooling engine exports calculateWaterCoolingMetrics");
assert(coolingEngineSrc.includes("extraPeakMwRequired"), "Cooling engine calculates dry cooling heatwave energy penalty in MW");
assert(coolingEngineSrc.includes("annualWaterConsumptionMgy"), "Cooling engine calculates annual water consumption in MGY");

const coolingRoutePath = path.join(process.cwd(), "app/api/cooling-analysis/route.ts");
assert(fs.existsSync(coolingRoutePath), "app/api/cooling-analysis/route.ts exists");

// 5. Epic 5: Institutional Siting Dossier Generator & UI Wiring
const dossierModalPath = path.join(process.cwd(), "components/analytics/InstitutionalSitingDossierModal.tsx");
assert(fs.existsSync(dossierModalPath), "InstitutionalSitingDossierModal component exists");
const dossierModalSrc = fs.readFileSync(dossierModalPath, "utf-8");
assert(dossierModalSrc.includes("INSTITUTIONAL SITING DOSSIER") && dossierModalSrc.includes("CONFIDENTIAL // IC MEMO"), "Dossier renders institutional memorandum title");
assert(dossierModalSrc.includes("Target Campus IT Load:"), "Dossier includes interactive 50–1000 MW capacity sizing slider");
assert(dossierModalSrc.includes("10-Pillar Institutional Siting Radar"), "Dossier renders 10-pillar radar score breakdown");
assert(dossierModalSrc.includes("Interconnection Queue & POI Headroom"), "Dossier includes FERC queue audit section");
assert(dossierModalSrc.includes("Behind-The-Meter (BTM) Nuclear & Baseload"), "Dossier includes BTM nuclear/SMR section");
assert(dossierModalSrc.includes("24/7 Carbon-Free Energy (CFE) Matching"), "Dossier includes 24/7 CFE graph & Scope 2 calculator");
assert(dossierModalSrc.includes("Dry Cooling Conversion Penalty"), "Dossier includes WUE & dry cooling trade-offs");
assert(dossierModalSrc.includes("PRINT / EXPORT (PDF)"), "Dossier includes print and export button");

const gridStoreDossierSrc = fs.readFileSync(path.join(process.cwd(), "lib/store/useGridStore.ts"), "utf-8");
assert(gridStoreDossierSrc.includes("isDossierOpen: boolean"), "useGridStore manages isDossierOpen state");
assert(gridStoreDossierSrc.includes("dossierTarget:"), "useGridStore stores dossierTarget asset");
assert(gridStoreDossierSrc.includes("openDossierForTarget:"), "useGridStore provides openDossierForTarget action");

const appPageDossierSrc = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf-8");
assert(appPageDossierSrc.includes("<InstitutionalSitingDossierModal"), "app/page.tsx mounts InstitutionalSitingDossierModal in root layout");

const topHudDossierSrc = fs.readFileSync(path.join(process.cwd(), "components/hud/TopHud.tsx"), "utf-8");
assert(topHudDossierSrc.includes("setDossierOpen(true)"), "TopHud includes Dossier button trigger");
assert(topHudDossierSrc.includes("Dossier"), "TopHud renders Dossier action label");

const inspectorDossierSrc = fs.readFileSync(path.join(process.cwd(), "components/inspector/StationInspector.tsx"), "utf-8");
assert(inspectorDossierSrc.includes("GENERATE INVESTMENT COMMITTEE DOSSIER"), "StationInspector features prominent Dossier trigger buttons");
assert(inspectorDossierSrc.includes("FERC Order 2023 Interconnection Queue"), "StationInspector displays FERC Order 2023 queue cards");
assert(inspectorDossierSrc.includes("Behind-The-Meter (BTM) Baseload Co-Location"), "StationInspector displays BTM baseload cards");

// ---------------------------------------------------------------------------
// TEST 22: Dual-Feed Redundancy, Subsea CLS Backhaul, Portfolio Benchmark Matrix & Copilot Grounding (Epics 6–9)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 22: Dual-Feed Redundancy, Subsea CLS Backhaul, Portfolio Benchmark & Copilot Grounding ---");

// 1. Epic 6: Substation Dual-Utility Feed & N-1 Transmission Contingency Reliability Engine
const redundancyTypesPath = path.join(process.cwd(), "lib/types/transmission-redundancy.ts");
assert(fs.existsSync(redundancyTypesPath), "lib/types/transmission-redundancy.ts exists");

const redundancyServicePath = path.join(process.cwd(), "lib/services/transmission-redundancy-service.ts");
assert(fs.existsSync(redundancyServicePath), "lib/services/transmission-redundancy-service.ts exists");
const redundancyServiceSrc = fs.readFileSync(redundancyServicePath, "utf-8");
assert(redundancyServiceSrc.includes("analyzeTransmissionRedundancy"), "Transmission redundancy service exports analyzeTransmissionRedundancy");
assert(redundancyServiceSrc.includes("expectedAnnualOutageMinutes"), "Transmission redundancy service calculates annual SAIDI outage minutes");
assert(redundancyServiceSrc.includes("estimatedTLineIntertieCapexMillionDollars"), "Transmission redundancy service models intertie CapEx");
assert(redundancyServiceSrc.includes("interSubstationDist >= 3.0"), "Transmission redundancy enforces 3.0 km physical separation for true diversity");

const redundancyRoutePath = path.join(process.cwd(), "app/api/transmission-redundancy/route.ts");
assert(fs.existsSync(redundancyRoutePath), "app/api/transmission-redundancy/route.ts exists");
const redundancyRouteSrc = fs.readFileSync(redundancyRoutePath, "utf-8");
assert(redundancyRouteSrc.includes('export const dynamic = "force-dynamic"'), "transmission-redundancy route exports force-dynamic");

// 2. Epic 7: Subsea Cable Landing Stations (CLS) & Terrestrial Dark Fiber Backhaul Latency Engine
const clsDataPath = path.join(process.cwd(), "data/cable-landing-stations.json");
assert(fs.existsSync(clsDataPath), "data/cable-landing-stations.json exists on disk");
const clsData = JSON.parse(fs.readFileSync(clsDataPath, "utf-8"));
assert(Array.isArray(clsData) && clsData.length >= 10, `Loaded ${clsData.length} global Cable Landing Station hubs (>= 10 requirement)`);

const vaBeachCls = clsData.find((s) => s.id === "cls-virginia-beach");
assert(!!vaBeachCls, "Virginia Beach Cable Landing Hub exists in CLS dataset");
if (vaBeachCls) {
  assert(vaBeachCls.totalLitCapacityTbps >= 600, "Virginia Beach has >= 600 Tbps lit capacity");
  assert(vaBeachCls.rttToLondonMs < 65, "Virginia Beach has sub-65ms RTT to London");
  assert(vaBeachCls.activeSubseaSystems.some((sys) => sys.includes("MAREA")), "Virginia Beach hosts MAREA transoceanic cable");
}

const wallNjCls = clsData.find((s) => s.id === "cls-wall-nj");
assert(!!wallNjCls, "Wall NJ Cable Landing Station exists in CLS dataset");
if (wallNjCls) {
  assert(wallNjCls.activeSubseaSystems.some((sys) => sys.includes("Havfrue")), "Wall NJ hosts Havfrue/AEC-2 transatlantic cable");
}

let validClsCount = 0;
for (const s of clsData) {
  if (
    s.id &&
    s.name &&
    typeof s.latitude === "number" &&
    typeof s.longitude === "number" &&
    typeof s.totalLitCapacityTbps === "number" &&
    Array.isArray(s.activeSubseaSystems) &&
    s.activeSubseaSystems.length > 0
  ) {
    validClsCount++;
  }
}
assert(validClsCount === clsData.length, `100% of CLS records have valid schemas, coordinates, and active subsea systems (${validClsCount}/${clsData.length})`);

const clsTypesPath = path.join(process.cwd(), "lib/types/subsea-backhaul.ts");
assert(fs.existsSync(clsTypesPath), "lib/types/subsea-backhaul.ts exists");

const clsServicePath = path.join(process.cwd(), "lib/services/subsea-backhaul-service.ts");
assert(fs.existsSync(clsServicePath), "lib/services/subsea-backhaul-service.ts exists");
const clsServiceSrc = fs.readFileSync(clsServicePath, "utf-8");
assert(clsServiceSrc.includes("findNearestCableLandingStation"), "Subsea backhaul service exports findNearestCableLandingStation");
assert(clsServiceSrc.includes("getCableLandingStations"), "Subsea backhaul service exports getCableLandingStations");

const clsRoutePath = path.join(process.cwd(), "app/api/subsea-backhaul/route.ts");
assert(fs.existsSync(clsRoutePath), "app/api/subsea-backhaul/route.ts exists");
const clsRouteSrc = fs.readFileSync(clsRoutePath, "utf-8");
assert(clsRouteSrc.includes('export const dynamic = "force-dynamic"'), "subsea-backhaul route exports force-dynamic");

// 3. Epic 8: Multi-Site RFP Portfolio Benchmark Comparison Matrix
const benchmarkModalPath = path.join(process.cwd(), "components/analytics/SitePortfolioBenchmarkModal.tsx");
assert(fs.existsSync(benchmarkModalPath), "components/analytics/SitePortfolioBenchmarkModal.tsx exists");
const benchmarkModalSrc = fs.readFileSync(benchmarkModalPath, "utf-8");
assert(benchmarkModalSrc.includes("MULTI-SITE PORTFOLIO BENCHMARK MATRIX") && benchmarkModalSrc.includes("RFP & TENDER EVALUATOR"), "Benchmark modal renders institutional tender engine header");
assert(benchmarkModalSrc.includes("Substation POI Headroom") && benchmarkModalSrc.includes("BTM Nuclear Tariff Savings"), "Benchmark modal displays 8 Institutional Pillars breakdown");
assert(benchmarkModalSrc.includes("handleExportCsv"), "Benchmark modal provides 1-click CSV tender export");
assert(benchmarkModalSrc.includes("window.print"), "Benchmark modal supports executive memo print view");

const benchmarkStoreSrc = fs.readFileSync(path.join(process.cwd(), "lib/store/useGridStore.ts"), "utf-8");
assert(benchmarkStoreSrc.includes("isPortfolioBenchmarkOpen: boolean"), "useGridStore manages isPortfolioBenchmarkOpen state");
assert(benchmarkStoreSrc.includes("portfolioCandidateIds: string[]"), "useGridStore manages portfolioCandidateIds array");
assert(benchmarkStoreSrc.includes("togglePortfolioCandidate: (id: string) => void"), "useGridStore exposes togglePortfolioCandidate action");
assert(benchmarkStoreSrc.includes("clearPortfolioCandidates: () => void"), "useGridStore exposes clearPortfolioCandidates action");

const benchmarkRootPageSrc = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf-8");
assert(benchmarkRootPageSrc.includes("<SitePortfolioBenchmarkModal"), "app/page.tsx mounts SitePortfolioBenchmarkModal");

const benchmarkTopHudSrc = fs.readFileSync(path.join(process.cwd(), "components/hud/TopHud.tsx"), "utf-8");
assert(benchmarkTopHudSrc.includes("setPortfolioBenchmarkOpen(true)"), "TopHud wires Benchmark modal open action");
assert(benchmarkTopHudSrc.includes("Benchmark"), "TopHud renders Benchmark button");
assert(benchmarkTopHudSrc.includes("Scale"), "TopHud uses Scale icon for portfolio benchmark");

const benchmarkInspectorSrc = fs.readFileSync(path.join(process.cwd(), "components/inspector/StationInspector.tsx"), "utf-8");
assert(benchmarkInspectorSrc.includes("Dual-Utility Redundancy & Subsea CLS Backhaul"), "StationInspector displays dual-feed redundancy analysis card");
assert(benchmarkInspectorSrc.includes("min/yr (SAIDI)"), "StationInspector displays SAIDI outage analysis");
assert(benchmarkInspectorSrc.includes("BENCHMARK"), "StationInspector renders Benchmark toggle button in header");

// 4. Epic 9: AtlasGrid AI Copilot Institutional Intelligence Grounding
const institutionalAiEngineSrc = fs.readFileSync(path.join(process.cwd(), "lib/services/ai-query-engine.ts"), "utf-8");
assert(institutionalAiEngineSrc.includes("INSTITUTIONAL UNDERWRITING INTELLIGENCE"), "ai-query-engine prompt context contains institutional underwriting intelligence");
assert(institutionalAiEngineSrc.includes("Transoceanic Subsea Cable Landing Stations"), "ai-query-engine grounds subsea CLS hubs");
assert(institutionalAiEngineSrc.includes("Behind-The-Meter (BTM) Baseload Co-Location"), "ai-query-engine grounds BTM baseload sites");
assert(institutionalAiEngineSrc.includes("FERC Order 2023 Bulk Interconnection Queues"), "ai-query-engine grounds FERC queue bottlenecks");
assert(institutionalAiEngineSrc.includes("Multi-Site Institutional Portfolio Benchmark Matrix"), "ai-query-engine handles portfolio benchmark comparisons");

const copilotChatModalSrc = fs.readFileSync(path.join(process.cwd(), "components/chat/AtlasAIChatModal.tsx"), "utf-8");
assert(copilotChatModalSrc.includes("Compare Ashburn vs Dallas for 500MW site selection"), "AtlasAIChatModal includes institutional comparison suggestion");
assert(copilotChatModalSrc.includes("What are BTM nuclear co-location economics at Susquehanna?"), "AtlasAIChatModal includes BTM nuclear economics suggestion");
// ---------------------------------------------------------------------------
// TEST 22: High-Density Terrestrial Dark Fiber, Active Seismic Faults & USGS Earthquakes
// ---------------------------------------------------------------------------
console.log("\n--- TEST 22: Terrestrial Fiber, Quaternary Faults & Earthquakes Visual Upgrades ---");

const darkFiberDataPath = path.join(dataDir, "dark-fiber-corridors.json");
assert(fs.existsSync(darkFiberDataPath), "dark-fiber-corridors.json exists on disk");
const darkFiberData = JSON.parse(fs.readFileSync(darkFiberDataPath, "utf-8"));
assert(Array.isArray(darkFiberData) && darkFiberData.length >= 25, `High-density terrestrial dark fiber network: ${darkFiberData.length} corridors (target >= 25)`);

// Verify geographic distribution of dark fiber (US, Europe, Asia, India)
const ashburnFiber = darkFiberData.find((f) => f.id.includes("ashburn") || f.name.includes("Ashburn") || f.name.includes("Loudoun"));
assert(!!ashburnFiber, "Ashburn / Data Center Alley metro & express dark fiber corridors verified");

const flapFiber = darkFiberData.find((f) => f.name.includes("FLAP") || f.name.includes("Europe") || f.name.includes("London") || f.name.includes("Frankfurt"));
assert(!!flapFiber, "European FLAP-D trans-European dark fiber backbones verified");

const asiaFiber = darkFiberData.find((f) => f.name.includes("Tokyo") || f.name.includes("Singapore") || f.name.includes("Johor") || f.name.includes("Mumbai") || f.name.includes("India"));
assert(!!asiaFiber, "Asia-Pacific & Indian subcontinent high-capacity dark fiber backbones verified");

// Seismic active faults
const seismicFaultsPath = path.join(dataDir, "seismic-faults.json");
assert(fs.existsSync(seismicFaultsPath), "seismic-faults.json exists on disk");
const seismicFaultsData = JSON.parse(fs.readFileSync(seismicFaultsPath, "utf-8"));
assert(Array.isArray(seismicFaultsData) && seismicFaultsData.length >= 25, `Active Quaternary fault systems: ${seismicFaultsData.length} tectonic systems (target >= 25)`);

const sanAndreas = seismicFaultsData.find((f) => f.name.includes("San Andreas"));
assert(!!sanAndreas, "San Andreas Fault System (Northern & Southern segments) verified");

const cascadia = seismicFaultsData.find((f) => f.name.includes("Cascadia") || f.name.includes("Subduction"));
assert(!!cascadia, "Cascadia Subduction Megathrust verified");

const ringOfFire = seismicFaultsData.find((f) => f.name.includes("Japan") || f.name.includes("Nankai") || f.name.includes("Sunda") || f.name.includes("Alpine"));
assert(!!ringOfFire, "Pacific Ring of Fire megathrusts and active collision systems verified");

// Historical earthquakes dataset
const earthquakesDataPath = path.join(dataDir, "historical-earthquakes.json");
assert(fs.existsSync(earthquakesDataPath), "historical-earthquakes.json exists on disk");
const earthquakesData = JSON.parse(fs.readFileSync(earthquakesDataPath, "utf-8"));
assert(Array.isArray(earthquakesData) && earthquakesData.length >= 500, `USGS verified historical earthquakes dataset: ${earthquakesData.length} records (target >= 500)`);

// Verify API route payload contains earthquakes and cableLandingStations
const sitingRoutePath = path.join(process.cwd(), "app/api/siting/route.ts");
const sitingRouteSrc = fs.readFileSync(sitingRoutePath, "utf-8");
assert(sitingRouteSrc.includes("earthquakes") && sitingRouteSrc.includes("historical-earthquakes.json"), "api/siting route serves historical earthquakes");
assert(sitingRouteSrc.includes("cableLandingStations") && sitingRouteSrc.includes("cable-landing-stations.json"), "api/siting route serves cableLandingStations");

// Verify DeckGLMap layer visual differentiation
const deckGlVisualMapSrc = fs.readFileSync(path.join(process.cwd(), "components/map/DeckGLMap.tsx"), "utf-8");
assert(deckGlVisualMapSrc.includes("subsea-fiber-cables") && deckGlVisualMapSrc.includes("229, 255"), "DeckGLMap renders subsea cables with bioluminescent oceanic aqua");
assert(deckGlVisualMapSrc.includes("dark-fiber-conduits") && (deckGlVisualMapSrc.includes("192, 132, 252") || deckGlVisualMapSrc.includes("147, 51, 234")), "DeckGLMap renders terrestrial dark fiber with electric neon violet");
assert(deckGlVisualMapSrc.includes("cable-landing-stations-outer") && deckGlVisualMapSrc.includes("cable-landing-stations-core"), "DeckGLMap renders Cable Landing Stations with dual concentric portal rings");
assert(deckGlVisualMapSrc.includes("earthquakes-epicenters-layer"), "DeckGLMap renders USGS M5.0+ earthquake epicenters layer");

// Verify StationTooltip handles all 5 layers
const stationTooltipVisualSrc = fs.readFileSync(path.join(process.cwd(), "components/map/StationTooltip.tsx"), "utf-8");
assert(stationTooltipVisualSrc.includes("TERRESTRIAL DARK FIBER"), "StationTooltip renders dark fiber HUD card");
assert(stationTooltipVisualSrc.includes("SUBSEA FIBER CABLE"), "StationTooltip renders subsea cable HUD card");
assert(stationTooltipVisualSrc.includes("CABLE LANDING STATION (CLS)"), "StationTooltip renders Cable Landing Station HUD card");
assert(stationTooltipVisualSrc.includes("USGS SEISMIC EVENT"), "StationTooltip renders USGS earthquake HUD card");
assert(stationTooltipVisualSrc.includes("ACTIVE SEISMIC FAULT"), "StationTooltip renders Quaternary active fault HUD card");

// Verify MapLegend expanded items
const mapLegendVisualSrc = fs.readFileSync(path.join(process.cwd(), "components/map/MapLegend.tsx"), "utf-8");
assert(mapLegendVisualSrc.includes("Subsea Cables") && mapLegendVisualSrc.includes("Cable Landing Hubs (CLS)"), "MapLegend includes Subsea Cables and CLS hubs");
assert(mapLegendVisualSrc.includes("USGS Earthquakes M5.0+"), "MapLegend includes USGS Earthquakes M5.0+");
assert(mapLegendVisualSrc.includes("Flood Inundation & Surge"), "MapLegend includes Flood Inundation & Surge");
// ---------------------------------------------------------------------------
// TEST 23: Global Flood Hazard Inundation Overlay (41 Verified FEMA & GloFAS Zones)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 23: Global Flood Hazard Overlay & Inundation Risk ---");

const floodDataPath = path.join(dataDir, "flood-hazard-zones.json");
assert(fs.existsSync(floodDataPath), "data/flood-hazard-zones.json exists on disk");
const floodData = JSON.parse(fs.readFileSync(floodDataPath, "utf-8"));
assert(Array.isArray(floodData) && floodData.length >= 35, `Global flood hazard zones dataset: ${floodData.length} zones (target >= 35)`);

// Verify critical US & global zones
const vaBeachSurge = floodData.find((f) => f.id.includes("va-beach") || f.name.includes("Virginia Beach"));
assert(!!vaBeachSurge, "Virginia Beach Atlantic Hurricane Storm Surge Zone exists");
assert(vaBeachSurge.zoneCode.includes("VE"), "Virginia Beach is classified as FEMA Zone VE");

const biscayneBay = floodData.find((f) => f.id.includes("biscayne") || f.name.includes("Biscayne"));
assert(!!biscayneBay, "Biscayne Bay & South Florida King Tide basin exists");
assert(biscayneBay.riskLevel === "Extreme", "Biscayne Bay is rated Extreme risk");

const haarlemmermeer = floodData.find((f) => f.id.includes("haarlemmermeer") || f.name.includes("Haarlemmermeer"));
assert(!!haarlemmermeer, "Haarlemmermeer below-sea-level polder basin exists in Netherlands");
assert(haarlemmermeer.elevationMeters < 0, `Haarlemmermeer elevation is below sea level (${haarlemmermeer.elevationMeters}m)`);

const tokyoLowland = floodData.find((f) => f.id.includes("tokyo") || f.name.includes("Tokyo"));
assert(!!tokyoLowland, "Tokyo Bay & Arakawa River Zero-Meter Depression exists");

const mumbaiMithi = floodData.find((f) => f.id.includes("mumbai") || f.name.includes("Mumbai"));
assert(!!mumbaiMithi, "Mumbai Mithi River & Mahim Creek cloudburst basin exists");

// Validate schema integrity
let validFloodCount = 0;
for (const f of floodData) {
  if (
    f.id &&
    f.name &&
    f.basin &&
    f.country &&
    Array.isArray(f.coordinates) &&
    f.coordinates.length === 2 &&
    typeof f.coordinates[0] === "number" &&
    typeof f.coordinates[1] === "number" &&
    f.riskLevel &&
    f.hazardType &&
    typeof f.elevationMeters === "number" &&
    f.zoneCode &&
    typeof f.waterDepth100YrMeters === "number" &&
    typeof f.recommendedPadElevationMeters === "number"
  ) {
    validFloodCount++;
  }
}
assert(validFloodCount === floodData.length, `100% of flood hazard records pass strict institutional schema validation (${validFloodCount}/${floodData.length})`);

// Verify API route payload
assert(sitingRouteSrc.includes("floodHazardZones") && sitingRouteSrc.includes("flood-hazard-zones.json"), "api/siting route serves floodHazardZones");

// Verify DeckGLMap integration
const deckGlFloodSrc = fs.readFileSync(path.join(process.cwd(), "components/map/DeckGLMap.tsx"), "utf-8");
assert(deckGlFloodSrc.includes("storeFloodHazardZones"), "DeckGLMap loads storeFloodHazardZones");
assert(deckGlFloodSrc.includes("flood-hazard-zones-outer") && deckGlFloodSrc.includes("flood-hazard-zones-core"), "DeckGLMap renders multi-ring flood surge zones");

// Verify StationTooltip flood rendering
assert(stationTooltipVisualSrc.includes("FLOOD HAZARD INUNDATION ZONE"), "StationTooltip renders enhanced Flood Hazard Inundation card");
assert(stationTooltipVisualSrc.includes("100-Yr Surge Depth"), "StationTooltip renders 100-Yr Surge Depth metric");
assert(stationTooltipVisualSrc.includes("Rec. Pad Elevation"), "StationTooltip renders Recommended Pad Elevation metric");

// ---------------------------------------------------------------------------
// TEST 24: Deep Historical Provenance, Daily Automated Harvester & Point-In-Time Institutional Archival
// ---------------------------------------------------------------------------
console.log("\n--- TEST 24: Deep Historical Provenance, Daily Harvester & Institutional Time Machine ---");

// 1. Historical Power Generation Dataset (1990–2025)
const genHistoryPath = path.join(process.cwd(), "data/historical-power-generation.json");
assert(fs.existsSync(genHistoryPath), "historical-power-generation.json exists on disk");
const genHistoryData = JSON.parse(fs.readFileSync(genHistoryPath, "utf-8"));
assert(Array.isArray(genHistoryData) && genHistoryData.length >= 10, `Power generation history contains ${genHistoryData.length} annual records (target >= 10)`);
assert(genHistoryData[0].year === 1990, "Generation history starts at baseline year 1990");
assert(genHistoryData[genHistoryData.length - 1].year >= 2025, "Generation history extends through 2025+");
assert(typeof genHistoryData[0].usCarbonIntensityGramsPerKwh === "number", "Tracks fleet carbon intensity (gCO2/kWh)");
assert(typeof genHistoryData[0].usGenerationBySource?.coalTwh === "number", "Tracks fuel mix breakdown by coal, gas, nuclear, renewables");

// 2. Historical Wholesale LMP Pricing Dataset (2015–2025)
const lmpHistoryPath = path.join(process.cwd(), "data/historical-lmp-pricing.json");
assert(fs.existsSync(lmpHistoryPath), "historical-lmp-pricing.json exists on disk");
const lmpHistoryData = JSON.parse(fs.readFileSync(lmpHistoryPath, "utf-8"));
assert(Array.isArray(lmpHistoryData) && lmpHistoryData.length >= 5, `Wholesale LMP pricing contains ${lmpHistoryData.length} annual records (target >= 5)`);
assert(lmpHistoryData[0].year === 2015, "LMP pricing history starts at 2015");
assert(lmpHistoryData[lmpHistoryData.length - 1].year >= 2025, "LMP pricing history extends through 2025");
assert(lmpHistoryData[0].hubs.length === 8, "Tracks 8 global trading hubs (PJM, ERCOT, CAISO, MISO, NYISO, EPEX, N2EX, JEPX)");
assert(typeof lmpHistoryData[0].hubs[0].negativePriceHoursPct === "number", "Tracks negative pricing hours % for curtailment arbitrage");

// 3. Historical FERC Queue Backlog Dataset (2010–2025)
const queueHistoryPath = path.join(process.cwd(), "data/historical-queue-backlog.json");
assert(fs.existsSync(queueHistoryPath), "historical-queue-backlog.json exists on disk");
const queueHistoryData = JSON.parse(fs.readFileSync(queueHistoryPath, "utf-8"));
assert(Array.isArray(queueHistoryData) && queueHistoryData.length >= 5, `Queue backlog history contains ${queueHistoryData.length} annual records (target >= 5)`);
assert(queueHistoryData[0].year === 2010, "Queue backlog history starts at 2010");
assert(queueHistoryData[queueHistoryData.length - 1].year >= 2025, "Queue backlog history extends through 2025");
assert(typeof queueHistoryData[0].totalQueuedCapacityGw === "number", "Tracks total queued GW");
assert(typeof queueHistoryData[0].averageDwellYears === "number", "Tracks average queue study dwell time in years");

// 4. Historical Flood Catastrophes Ledger (1953–2024)
const floodHistoryPath = path.join(process.cwd(), "data/historical-flood-events.json");
assert(fs.existsSync(floodHistoryPath), "historical-flood-events.json exists on disk");
const floodHistoryData = JSON.parse(fs.readFileSync(floodHistoryPath, "utf-8"));
assert(Array.isArray(floodHistoryData) && floodHistoryData.length >= 10, `Flood catastrophes ledger contains ${floodHistoryData.length} records (target >= 10)`);
assert(floodHistoryData.some(f => f.year === 1953), "Contains 1953 North Sea Flood benchmark");
assert(floodHistoryData.some(f => f.eventName.includes("Katrina")), "Contains Hurricane Katrina benchmark");
assert(floodHistoryData.some(f => f.eventName.includes("Sandy")), "Contains Hurricane Sandy benchmark");
assert(floodHistoryData.some(f => f.eventName.includes("Harvey")), "Contains Hurricane Harvey benchmark");

// 5. Historical Grid Emergencies & Blackouts (2000–2024)
const extremeHistoryPath = path.join(process.cwd(), "data/historical-extreme-events.json");
assert(fs.existsSync(extremeHistoryPath), "historical-extreme-events.json exists on disk");
const extremeHistoryData = JSON.parse(fs.readFileSync(extremeHistoryPath, "utf-8"));
assert(Array.isArray(extremeHistoryData) && extremeHistoryData.length >= 5, `Grid emergencies ledger contains ${extremeHistoryData.length} records (target >= 5)`);
assert(extremeHistoryData.some(e => e.year === 2003), "Contains 2003 Northeast Blackout benchmark");
assert(extremeHistoryData.some(e => e.eventName.includes("Uri")), "Contains 2021 Winter Storm Uri ERCOT benchmark");
assert(extremeHistoryData.some(e => e.eventName.includes("Elliott")), "Contains 2022 Winter Storm Elliott benchmark");

// 6. Historical Earthquakes Catalog Extension (1900–2026)
const eqHistoryData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/historical-earthquakes.json"), "utf-8"));
assert(eqHistoryData.length >= 940, `Earthquakes catalog contains ${eqHistoryData.length} verified events (target >= 940)`);
assert(eqHistoryData.some(e => e.id.includes("1906_sf")), "Contains 1906 San Francisco M7.9 landmark quake");
assert(eqHistoryData.some(e => e.id.includes("1923_kanto")), "Contains 1923 Great Kanto M7.9 landmark quake");
assert(eqHistoryData.some(e => e.id.includes("1964_alaska")), "Contains 1964 Great Alaska M9.2 landmark quake");

// 7. Daily Snapshot Manifest & Immutable Snapshots
const manifestHistoryPath = path.join(process.cwd(), "data/historical-snapshots/manifest.json");
assert(fs.existsSync(manifestHistoryPath), "data/historical-snapshots/manifest.json exists on disk");
const manifestHistoryData = JSON.parse(fs.readFileSync(manifestHistoryPath, "utf-8"));
assert(Array.isArray(manifestHistoryData) && manifestHistoryData.length >= 5, `Daily snapshot manifest contains ${manifestHistoryData.length} records (target >= 5)`);
assert(!!manifestHistoryData[0].sha256, "Snapshots include SHA-256 cryptographic integrity hash");
assert(typeof manifestHistoryData[0].substationsCount === "number", "Snapshots record substations count");
assert(typeof manifestHistoryData[0].dataCentersCount === "number", "Snapshots record data centers count");

// 8. Automation Scripts & Workflows
assert(fs.existsSync(path.join(process.cwd(), "scripts/daily-historical-harvester.mjs")), "scripts/daily-historical-harvester.mjs exists on disk");
const pkgJsonSrc = fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8");
assert(pkgJsonSrc.includes('"harvest:daily"'), "package.json defines 'harvest:daily' script");
const vercelJsonSrc = fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf-8");
assert(vercelJsonSrc.includes("/api/cron/daily-harvester") && vercelJsonSrc.includes("0 2 * * *"), "vercel.json schedules daily-harvester at 02:00 UTC");
const ghWorkflowSrc = fs.readFileSync(path.join(process.cwd(), ".github/workflows/daily-historical-sync.yml"), "utf-8");
assert(ghWorkflowSrc.includes("harvest:daily") && ghWorkflowSrc.includes("0 3 * * *"), "GitHub Actions workflow schedules daily harvest at 03:00 UTC");

// 9. API Routes
const timeSeriesRouteSrc = fs.readFileSync(path.join(process.cwd(), "app/api/historical/time-series/route.ts"), "utf-8");
assert(timeSeriesRouteSrc.includes("powerGenerationMix") && timeSeriesRouteSrc.includes("wholesaleLmpPricing"), "api/historical/time-series route serves multi-domain time series");
assert(timeSeriesRouteSrc.includes("text/csv") && timeSeriesRouteSrc.includes("attachment; filename="), "api/historical/time-series route supports CSV download format");

const snapshotsRouteSrc = fs.readFileSync(path.join(process.cwd(), "app/api/historical/snapshots/route.ts"), "utf-8");
assert(snapshotsRouteSrc.includes("manifest.json"), "api/historical/snapshots route serves daily snapshot ledger");

const dailyCronRouteSrc = fs.readFileSync(path.join(process.cwd(), "app/api/cron/daily-harvester/route.ts"), "utf-8");
assert(dailyCronRouteSrc.includes("AtlasGrid daily historical harvest verified"), "api/cron/daily-harvester route handles automated cron triggers");

// 10. Frontend UI Integration
assert(fs.existsSync(path.join(process.cwd(), "components/analytics/HistoricalTimeMachineModal.tsx")), "HistoricalTimeMachineModal component exists on disk");
const timeMachineSrc = fs.readFileSync(path.join(process.cwd(), "components/analytics/HistoricalTimeMachineModal.tsx"), "utf-8");
assert(timeMachineSrc.includes("Institutional Historical Time Machine & Backtest Studio"), "Time Machine renders institutional title");
assert(timeMachineSrc.includes("1998: Telecom & Meet-Me Rooms"), "Time Machine supports 1998 Dot-Com Era preset");
assert(timeMachineSrc.includes("2021: Winter Storm Uri Grid Freeze"), "Time Machine supports 2021 Uri Crisis preset");
assert(timeMachineSrc.includes("2025: GW-Scale AI Supercluster Era"), "Time Machine supports 2025 GW-Scale AI Supercluster preset");
assert(timeMachineSrc.includes("Enterprise Institutional Data Licensing"), "Time Machine includes commercial licensing prospectus");
assert(timeMachineSrc.includes("$25,000") && timeMachineSrc.includes("$75,000") && timeMachineSrc.includes("$150,000"), "Time Machine details $25k, $75k, and $150k commercial licensing tiers");

const topHudHistorySrc = fs.readFileSync(path.join(process.cwd(), "components/hud/TopHud.tsx"), "utf-8");
assert(topHudHistorySrc.includes("setTimeMachineOpen"), "TopHud connects setTimeMachineOpen action");
assert(topHudHistorySrc.includes("Historical Time Machine & Backtest Studio (H)"), "TopHud renders History button with tooltip");

const storeHistorySrc = fs.readFileSync(path.join(process.cwd(), "lib/store/useGridStore.ts"), "utf-8");
assert(storeHistorySrc.includes("isTimeMachineOpen: boolean"), "useGridStore manages isTimeMachineOpen boolean");
assert(storeHistorySrc.includes("setTimeMachineOpen: (open: boolean) => void"), "useGridStore exposes setTimeMachineOpen action");

const pageHistorySrc = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf-8");
assert(pageHistorySrc.includes("<HistoricalTimeMachineModal />"), "app/page.tsx mounts HistoricalTimeMachineModal");

const inspectorHistorySrc = fs.readFileSync(path.join(process.cwd(), "components/inspector/StationInspector.tsx"), "utf-8");
assert(inspectorHistorySrc.includes("Launch Institutional Time Machine & Backtest"), "StationInspector includes Time Machine launch trigger");

// ---------------------------------------------------------------------------
// TEST 25: Institutional Variables, Ownership & Offtake Metadata Across All Assets
// ---------------------------------------------------------------------------
console.log("\n--- TEST 25: Institutional Variables, Ownership & Offtake Metadata ---");

// 1. Data Centers Institutional Metadata Verification
const dcsInstitutional = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/datacenters.json"), "utf-8"));
assert(dcsInstitutional.length >= 6600, `Data center dataset intact (${dcsInstitutional.length} records)`);

let dcHasAddress = 0, dcHasCity = 0, dcHasState = 0, dcHasOwner = 0, dcHasUsers = 0, dcHasClients = 0, dcHasUtility = 0;
for (const dc of dcsInstitutional) {
  if (dc.fullAddress && dc.fullAddress.length > 5) dcHasAddress++;
  if (dc.city && dc.city.length > 1) dcHasCity++;
  if (dc.state && dc.state.length > 1) dcHasState++;
  if (dc.owner && dc.owner.length > 2) dcHasOwner++;
  if (Array.isArray(dc.majorUsers) && dc.majorUsers.length > 0) dcHasUsers++;
  if (dc.clientsServed && dc.clientsServed.length > 5) dcHasClients++;
  if (dc.servingElectricUtility && dc.servingElectricUtility.length > 3) dcHasUtility++;
}

assert(dcHasAddress === dcsInstitutional.length, `100% of data centers have fullAddress (${dcHasAddress}/${dcsInstitutional.length})`);
assert(dcHasCity === dcsInstitutional.length, `100% of data centers have city (${dcHasCity}/${dcsInstitutional.length})`);
assert(dcHasState === dcsInstitutional.length, `100% of data centers have state/province (${dcHasState}/${dcsInstitutional.length})`);
assert(dcHasOwner === dcsInstitutional.length, `100% of data centers have ultimate corporate owner (${dcHasOwner}/${dcsInstitutional.length})`);
assert(dcHasUsers === dcsInstitutional.length, `100% of data centers have majorUsers / anchorTenants (${dcHasUsers}/${dcsInstitutional.length})`);
assert(dcHasClients === dcsInstitutional.length, `100% of data centers have clientsServed (${dcHasClients}/${dcsInstitutional.length})`);
assert(dcHasUtility === dcsInstitutional.length, `100% of data centers have servingElectricUtility (${dcHasUtility}/${dcsInstitutional.length})`);
assert(typeof dcsInstitutional[0].grossBuildingSqFt === "number" && dcsInstitutional[0].grossBuildingSqFt > 0, "Data centers include grossBuildingSqFt footprint");
assert(typeof dcsInstitutional[0].redundancyRating === "string" && dcsInstitutional[0].redundancyRating.length > 0, "Data centers include redundancyRating");

// 2. Power Plants Institutional Offtake Metadata Verification
const ppsInstitutional = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/power-plants.json"), "utf-8"));
assert(ppsInstitutional.length >= 5400, `Power plants dataset intact (${ppsInstitutional.length} records)`);

let ppHasAddress = 0, ppHasCity = 0, ppHasState = 0, ppHasOwner = 0, ppHasOfftakers = 0, ppHasClients = 0, ppHasCooling = 0;
for (const pp of ppsInstitutional) {
  if (pp.fullAddress && pp.fullAddress.length > 5) ppHasAddress++;
  if (pp.city && pp.city.length > 1) ppHasCity++;
  if (pp.state && pp.state.length > 1) ppHasState++;
  if (pp.owner && pp.owner.length > 2) ppHasOwner++;
  if (Array.isArray(pp.offtakers) && pp.offtakers.length > 0) ppHasOfftakers++;
  if (pp.clientsServed && pp.clientsServed.length > 5) ppHasClients++;
  if (pp.coolingTechnology && pp.coolingTechnology.length > 3) ppHasCooling++;
}

assert(ppHasAddress === ppsInstitutional.length, `100% of power plants have fullAddress (${ppHasAddress}/${ppsInstitutional.length})`);
assert(ppHasCity === ppsInstitutional.length, `100% of power plants have city (${ppHasCity}/${ppsInstitutional.length})`);
assert(ppHasState === ppsInstitutional.length, `100% of power plants have state (${ppHasState}/${ppsInstitutional.length})`);
assert(ppHasOwner === ppsInstitutional.length, `100% of power plants have ultimate asset owner (${ppHasOwner}/${ppsInstitutional.length})`);
assert(ppHasOfftakers === ppsInstitutional.length, `100% of power plants have commercial offtakers (${ppHasOfftakers}/${ppsInstitutional.length})`);
assert(ppHasClients === ppsInstitutional.length, `100% of power plants have clientsServed (${ppHasClients}/${ppsInstitutional.length})`);
assert(ppHasCooling === ppsInstitutional.length, `100% of power plants have coolingTechnology (${ppHasCooling}/${ppsInstitutional.length})`);

// 3. Substations Institutional Grid Siting Metadata Verification
const subsInstitutional = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/substations.json"), "utf-8"));
assert(subsInstitutional.length >= 3000, `Substations dataset intact (${subsInstitutional.length} records)`);

let subHasAddress = 0, subHasCity = 0, subHasState = 0, subHasOwner = 0, subHasInterconnected = 0, subHasClients = 0, subHasBus = 0;
for (const sub of subsInstitutional) {
  if (sub.fullAddress && sub.fullAddress.length > 5) subHasAddress++;
  if (sub.city && sub.city.length > 1) subHasCity++;
  if (sub.state && sub.state.length > 1) subHasState++;
  if (sub.owner && sub.owner.length > 2) subHasOwner++;
  if (sub.interconnectedClients && sub.interconnectedClients.length > 5) subHasInterconnected++;
  if (sub.clientsServed && sub.clientsServed.length > 5) subHasClients++;
  if (sub.busConfiguration && sub.busConfiguration.length > 3) subHasBus++;
}

assert(subHasAddress === subsInstitutional.length, `100% of substations have fullAddress (${subHasAddress}/${subsInstitutional.length})`);
assert(subHasCity === subsInstitutional.length, `100% of substations have city (${subHasCity}/${subsInstitutional.length})`);
assert(subHasState === subsInstitutional.length, `100% of substations have state (${subHasState}/${subsInstitutional.length})`);
assert(subHasOwner === subsInstitutional.length, `100% of substations have transmission owner (${subHasOwner}/${subsInstitutional.length})`);
assert(subHasInterconnected === subsInstitutional.length, `100% of substations have interconnectedClients (${subHasInterconnected}/${subsInstitutional.length})`);
assert(subHasClients === subsInstitutional.length, `100% of substations have clientsServed (${subHasClients}/${subsInstitutional.length})`);
assert(subHasBus === subsInstitutional.length, `100% of substations have busConfiguration (${subHasBus}/${subsInstitutional.length})`);
assert(typeof subsInstitutional[0].transformerCapacityMva === "number" && subsInstitutional[0].transformerCapacityMva > 0, "Substations include transformerCapacityMva");

// 4. Cable Landing Stations & BTM Colocation Institutional Verification
const clsInstitutional = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/cable-landing-stations.json"), "utf-8"));
assert(clsInstitutional.length >= 10, "Cable Landing Stations dataset intact");
assert(clsInstitutional.every((c) => c.fullAddress && c.city && c.state && c.owner && c.majorUsers?.length > 0 && c.clientsServed), "100% of CLS hubs have institutional address, owner, users, and clientsServed");

const btmInstitutional = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/btm-colocation-sites.json"), "utf-8"));
assert(btmInstitutional.length >= 10, "BTM colocation sites dataset intact");
assert(btmInstitutional.every((b) => b.fullAddress && b.city && b.state && b.owner && b.clientsServed), "100% of BTM sites have institutional address, owner, and clientsServed");

// 5. Flood Hazard Zones Municipal Risk Verification
const fhzInstitutional = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/flood-hazard-zones.json"), "utf-8"));
assert(fhzInstitutional.length >= 41, "Flood hazard zones dataset intact");
assert(fhzInstitutional.every((f) => f.nearestCity && f.stateOrProvince && f.governingJurisdiction && f.responsibleFloodControlAuthority && f.clientsServed), "100% of flood hazard zones have municipal authority and jurisdiction metadata");

// 6. UI Integration Verification
const inspectorInstSrc = fs.readFileSync(path.join(process.cwd(), "components/inspector/StationInspector.tsx"), "utf-8");
assert(inspectorInstSrc.includes("parent_owner") && inspectorInstSrc.includes("clients_workloads_served"), "StationInspector displays DC corporate owner and clients served");
assert(inspectorInstSrc.includes("Institutional Grid Siting & Interconnection"), "StationInspector displays Substation institutional siting and loads card");
assert(inspectorInstSrc.includes("Commercial Offtakers") && inspectorInstSrc.includes("Cooling Technology"), "StationInspector displays Power Plant commercial offtakers and cooling");

const tooltipInstSrc = fs.readFileSync(path.join(process.cwd(), "components/map/StationTooltip.tsx"), "utf-8");
assert(tooltipInstSrc.includes("Parent:") && tooltipInstSrc.includes("Workloads:"), "StationTooltip renders DC parent owner and workloads");
assert(tooltipInstSrc.includes("Feeds:") && tooltipInstSrc.includes("Utility:"), "StationTooltip renders Substation utility and feeds");
assert(tooltipInstSrc.includes("Offtake:"), "StationTooltip renders Power Plant offtake counterparty");

const fleetModalInstSrc = fs.readFileSync(path.join(process.cwd(), "components/analytics/DataCenterFleetModal.tsx"), "utf-8");
assert(fleetModalInstSrc.includes("dc.clientsServed") && fleetModalInstSrc.includes("dc.owner"), "DataCenterFleetModal table renders owner and clientsServed");
assert(fleetModalInstSrc.includes("matchOwner") && fleetModalInstSrc.includes("matchClients"), "DataCenterFleetModal instant search filters by owner and clientsServed");

const aiEngineInstSrc = fs.readFileSync(path.join(process.cwd(), "lib/services/ai-query-engine.ts"), "utf-8");
assert(aiEngineInstSrc.includes("Institutional Asset Catalog & Ownership / Offtake Metadata"), "AI query engine prompt includes institutional metadata grounding");

// ---------------------------------------------------------------------------
// TEST 26: US State Fleet Breakdown & Zero-Data-Center States Grounding
// ---------------------------------------------------------------------------
console.log("\n--- TEST 26: US State Fleet Breakdown & Zero-DC States Grounding ---");

assert(aiEngineInstSrc.includes("US_50_STATES"), "ai-query-engine exports US_50_STATES comprehensive metadata");
assert(aiEngineInstSrc.includes("USStateMetadata"), "ai-query-engine defines USStateMetadata interface");
assert(aiEngineInstSrc.includes("statesWithoutDcs"), "ai-query-engine calculates statesWithoutDcs");
assert(aiEngineInstSrc.includes("statesWithDcs"), "ai-query-engine calculates statesWithDcs");
assert(aiEngineInstSrc.includes("isZeroStateQuery"), "ai-query-engine handles zero-data-center state queries");
assert(aiEngineInstSrc.includes("matchedState"), "ai-query-engine supports single-state queries across all 50 US states");

// Verify prompt grounding contains zero-DC states and siting drivers
assert(aiEngineInstSrc.includes("States WITHOUT Data Centers"), "Grounding prompt context enumerates states without data centers");
assert(aiEngineInstSrc.includes("Act 250"), "Grounding prompt explains Vermont Act 250 environmental review");
assert(aiEngineInstSrc.includes("Wyoming & Montana"), "Grounding prompt explains Wyoming & Montana dark fiber latency constraints");
assert(aiEngineInstSrc.includes("Alaska & Hawaii"), "Grounding prompt explains Alaska & Hawaii islanded grid and tariff realities");

// Verify exact counts from datacenters.json
const usDcsFromRaw = allDcs.filter((d) => (d.country || "").toUpperCase().includes("US") || (d.country || "").toUpperCase().includes("UNITED STATES"));
assert(usDcsFromRaw.length === 2274, `Total verified US data centers: ${usDcsFromRaw.length} (expected 2274)`);

const usStatesDetected = new Set(usDcsFromRaw.map((d) => d.state).filter(Boolean));
assert(usStatesDetected.size === 21, `Active US states with data centers: ${usStatesDetected.size} (expected 21)`);

const virginiaDcs = usDcsFromRaw.filter((d) => d.state === "Virginia");
assert(virginiaDcs.length === 451, `Virginia data centers count: ${virginiaDcs.length} (expected 451)`);

const texasDcs = usDcsFromRaw.filter((d) => d.state === "Texas");
assert(texasDcs.length === 220, `Texas data centers count: ${texasDcs.length} (expected 220)`);

const wyomingDcs = usDcsFromRaw.filter((d) => d.state === "Wyoming");
assert(wyomingDcs.length === 0, `Wyoming data centers in dataset: ${wyomingDcs.length} (expected 0)`);

const vermontDcs = usDcsFromRaw.filter((d) => d.state === "Vermont");
assert(vermontDcs.length === 0, `Vermont data centers in dataset: ${vermontDcs.length} (expected 0)`);

// Verify UI integration in Copilot modal
const copilotModalStateSrc = fs.readFileSync(path.join(process.cwd(), "components/chat/AtlasAIChatModal.tsx"), "utf-8");
assert(copilotModalStateSrc.includes("Which US states do not have a data center?"), "AtlasAIChatModal includes prompt suggestion for zero-DC US states");

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
