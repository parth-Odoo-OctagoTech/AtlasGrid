import { NextRequest, NextResponse } from "next/server";
import { analyzeTransmissionRedundancy } from "@/lib/services/transmission-redundancy-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "39.0438");
    const lng = parseFloat(searchParams.get("lng") || "-77.4874");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Valid lat and lng required" }, { status: 400 });
    }

    const redundancy = analyzeTransmissionRedundancy(lat, lng);

    return NextResponse.json({
      status: "success",
      coordinates: { latitude: lat, longitude: lng },
      redundancy,
    });
  } catch (error: any) {
    console.error("Error in transmission redundancy API:", error);
    return NextResponse.json(
      { error: "Failed to evaluate transmission redundancy", details: error.message },
      { status: 500 }
    );
  }
}
