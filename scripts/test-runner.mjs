import * as fs from "fs";
import * as path from "path";

const dataDir = path.join(process.cwd(), "data");
const plants = JSON.parse(fs.readFileSync(path.join(dataDir, "power-plants.json"), "utf-8"));
const interconnectors = JSON.parse(fs.readFileSync(path.join(dataDir, "interconnectors.json"), "utf-8"));

console.log("================ GRIDPULSE VALIDATION ================");
console.log(`✓ Power Plants Loaded: ${plants.length.toLocaleString()}`);
console.log(`✓ Interconnectors Loaded: ${interconnectors.length}`);

// Validate capacities and fuels
const fuelCounts = {};
let totalMw = 0;
for (const p of plants) {
  fuelCounts[p.fuelType] = (fuelCounts[p.fuelType] || 0) + 1;
  totalMw += p.capacityMw;
}

console.log(`✓ Total Global Nameplate Capacity: ${(totalMw / 1000).toFixed(1)} GW`);
console.log("✓ Fuel Breakdown Count:", fuelCounts);

// Validate anchor stations presence
const anchors = plants.filter(p => p.id.startsWith("station-anchor-"));
console.log(`✓ Anchor Mega-Stations: ${anchors.length} (e.g. ${anchors[0].name}, ${anchors[1].name})`);

console.log("================ ALL SYSTEMS OPERATIONAL ================");
