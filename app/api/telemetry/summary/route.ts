import { NextResponse } from "next/server";
import { plantRepository } from "@/lib/db/plant-repository";
import { gridPhysicsEngine } from "@/lib/simulator/grid-physics-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = plantRepository.getGlobalSummary();
    const frequencies = gridPhysicsEngine.getFrequencies();
    const alerts = gridPhysicsEngine.getAlerts();

    const response = {
      ...summary,
      frequencyUsHz: frequencies.frequencyUsHz,
      frequencyEuHz: frequencies.frequencyEuHz,
      activeAlertCount: alerts.length,
      carbonIntensityAvg: 312.4, // g CO2/kWh global average
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error generating telemetry summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
