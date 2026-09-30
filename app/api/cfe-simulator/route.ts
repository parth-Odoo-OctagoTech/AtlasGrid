import { NextRequest, NextResponse } from "next/server";
import { run247CfeSimulation, CfeSimulationInput } from "@/lib/services/cfe-simulation-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDcLoadMw = parseFloat(searchParams.get("loadMw") || "250");
    const solarInstalledMw = searchParams.get("solarMw") ? parseFloat(searchParams.get("solarMw")!) : undefined;
    const windInstalledMw = searchParams.get("windMw") ? parseFloat(searchParams.get("windMw")!) : undefined;
    const cleanFirmContractedMw = searchParams.get("firmMw") ? parseFloat(searchParams.get("firmMw")!) : undefined;
    const bessCapacityMwh = searchParams.get("bessMwh") ? parseFloat(searchParams.get("bessMwh")!) : undefined;
    const regionGridIntensityGPerKwh = searchParams.get("gridIntensity") ? parseFloat(searchParams.get("gridIntensity")!) : undefined;

    const input: CfeSimulationInput = {
      targetDcLoadMw,
      solarInstalledMw,
      windInstalledMw,
      cleanFirmContractedMw,
      bessCapacityMwh,
      regionGridIntensityGPerKwh,
    };

    const result = run247CfeSimulation(input);
    return NextResponse.json({
      status: "success",
      simulation: result,
    });
  } catch (err: any) {
    console.error("Failed to run 24/7 CFE simulation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
