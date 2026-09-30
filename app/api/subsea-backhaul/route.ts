import { NextRequest, NextResponse } from "next/server";
import { findNearestCableLandingStation, getCableLandingStations } from "@/lib/services/subsea-backhaul-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listAll = searchParams.get("list") === "true";

    if (listAll) {
      return NextResponse.json({
        status: "success",
        landingStations: getCableLandingStations(),
      });
    }

    const lat = parseFloat(searchParams.get("lat") || "39.0438");
    const lng = parseFloat(searchParams.get("lng") || "-77.4874");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Valid lat and lng required" }, { status: 400 });
    }

    const analysis = findNearestCableLandingStation(lat, lng);

    return NextResponse.json({
      status: "success",
      coordinates: { latitude: lat, longitude: lng },
      analysis,
    });
  } catch (error: any) {
    console.error("Error in subsea backhaul API:", error);
    return NextResponse.json(
      { error: "Failed to evaluate subsea backhaul", details: error.message },
      { status: 500 }
    );
  }
}
