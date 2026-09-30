import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");

    const fiberPath = path.join(dataDir, "dark-fiber-corridors.json");
    const faultsPath = path.join(dataDir, "seismic-faults.json");
    const flightPath = path.join(dataDir, "flight-corridors.json");
    const hazardPath = path.join(dataDir, "hazard-corridors.json");
    const eqPath = path.join(dataDir, "historical-earthquakes.json");
    const clsPath = path.join(dataDir, "cable-landing-stations.json");
    const floodPath = path.join(dataDir, "flood-hazard-zones.json");

    const darkFiberCorridors = fs.existsSync(fiberPath)
      ? JSON.parse(fs.readFileSync(fiberPath, "utf-8"))
      : [];
    const seismicFaults = fs.existsSync(faultsPath)
      ? JSON.parse(fs.readFileSync(faultsPath, "utf-8"))
      : [];
    const flightCorridors = fs.existsSync(flightPath)
      ? JSON.parse(fs.readFileSync(flightPath, "utf-8"))
      : [];
    const hazardCorridors = fs.existsSync(hazardPath)
      ? JSON.parse(fs.readFileSync(hazardPath, "utf-8"))
      : [];
    const earthquakes = fs.existsSync(eqPath)
      ? JSON.parse(fs.readFileSync(eqPath, "utf-8"))
      : [];
    const cableLandingStations = fs.existsSync(clsPath)
      ? JSON.parse(fs.readFileSync(clsPath, "utf-8"))
      : [];
    const floodHazardZones = fs.existsSync(floodPath)
      ? JSON.parse(fs.readFileSync(floodPath, "utf-8"))
      : [];

    return NextResponse.json(
      {
        darkFiberCorridors,
        seismicFaults,
        flightCorridors,
        hazardCorridors,
        earthquakes,
        cableLandingStations,
        floodHazardZones,
        summary: {
          darkFiberCount: darkFiberCorridors.length,
          seismicFaultCount: seismicFaults.length,
          flightCorridorCount: flightCorridors.length,
          hazardCorridorCount: hazardCorridors.length,
          earthquakeCount: earthquakes.length,
          cableLandingStationCount: cableLandingStations.length,
          floodHazardZoneCount: floodHazardZones.length,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error: any) {
    console.error("Error loading siting hazard layers:", error);
    return NextResponse.json(
      { error: "Failed to load siting hazard layers", details: error.message },
      { status: 500 }
    );
  }
}
