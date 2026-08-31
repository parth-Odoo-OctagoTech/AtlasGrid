import { NextRequest, NextResponse } from "next/server";
import { plantRepository } from "@/lib/db/plant-repository";
import { gridPhysicsEngine } from "@/lib/simulator/grid-physics-engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plant = plantRepository.getPlantById(id);

    if (!plant) {
      return NextResponse.json(
        { success: false, error: `Station with ID '${id}' not found` },
        { status: 404 }
      );
    }

    // Generate real-time & 24h dispatch history
    const history24h = gridPhysicsEngine.getStation24hTimeSeries(plant);
    
    // Filter alerts for this station or region
    const allAlerts = gridPhysicsEngine.getAlerts();
    const recentAlerts = allAlerts.filter(
      (a) => a.stationId === id || a.region === plant.gridRegion
    );

    // Nearby interconnectors within same region
    const allInterconnectors = plantRepository.getInterconnectors();
    const nearbyInterconnectors = allInterconnectors.filter(
      (ic) =>
        ic.fromRegion.toLowerCase().includes(plant.gridRegion.toLowerCase()) ||
        ic.toRegion.toLowerCase().includes(plant.gridRegion.toLowerCase()) ||
        ic.name.toLowerCase().includes(plant.country.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      data: {
        station: plant,
        history24h,
        recentAlerts,
        nearbyInterconnectors,
      },
    });
  } catch (error) {
    console.error("Error fetching station detail:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
