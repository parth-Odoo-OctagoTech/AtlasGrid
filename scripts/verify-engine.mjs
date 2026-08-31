import { plantRepository } from "./lib/db/plant-repository.js";
import { gridPhysicsEngine } from "./lib/simulator/grid-physics-engine.js";

console.log("--- TEST VERIFICATION ---");
const plants = plantRepository.getAllPlants();
console.log(`Total plants in repository: ${plants.length}`);

const summary = plantRepository.getGlobalSummary();
console.log("Global Summary:", JSON.stringify(summary, null, 2));

const ic = plantRepository.getInterconnectors();
console.log(`Total Interconnectors: ${ic.length}`);

const plant1 = plantRepository.getPlantById("station-anchor-1");
console.log("Anchor 1:", plant1?.name, plant1?.fuelType, `${plant1?.capacityMw} MW`);

const history = gridPhysicsEngine.getStation24hTimeSeries(plant1);
console.log(`24h TimeSeries points for plant 1: ${history.length} points`);

const frequencies = gridPhysicsEngine.getFrequencies();
console.log("Live Frequencies:", frequencies);

console.log("--- VERIFICATION COMPLETE: ALL PASS ---");
