import { NextRequest, NextResponse } from "next/server";
import { calculateWaterCoolingMetrics, WaterCoolingAnalysisInput } from "@/lib/services/water-cooling-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dcLoadMw = parseFloat(searchParams.get("loadMw") || "250");
    const designWetBulbC = searchParams.get("wetBulb") ? parseFloat(searchParams.get("wetBulb")!) : undefined;
    const freeCoolingHoursPct = searchParams.get("economizerPct") ? parseFloat(searchParams.get("economizerPct")!) : undefined;
    const localElectricityCostPerMwh = searchParams.get("powerCost") ? parseFloat(searchParams.get("powerCost")!) : undefined;
    const waterUtilityCostPerThousandGallons = searchParams.get("waterCost") ? parseFloat(searchParams.get("waterCost")!) : undefined;

    const input: WaterCoolingAnalysisInput = {
      dcLoadMw,
      designWetBulbC,
      freeCoolingHoursPct,
      localElectricityCostPerMwh,
      waterUtilityCostPerThousandGallons,
    };

    const report = calculateWaterCoolingMetrics(input);
    return NextResponse.json({
      status: "success",
      report,
    });
  } catch (err: any) {
    console.error("Failed to run cooling analysis:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
