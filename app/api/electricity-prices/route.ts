import { NextRequest, NextResponse } from "next/server";
import {
  getGlobalElectricityPrices,
  getElectricityPriceForLocation,
  getElectricityPriceSummaryStats,
} from "@/lib/services/electricity-price-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const country = searchParams.get("country") || undefined;
    const state = searchParams.get("state") || undefined;
    const mwStr = searchParams.get("mw");
    const summary = searchParams.get("summary");

    if (summary === "true") {
      const stats = getElectricityPriceSummaryStats();
      return NextResponse.json({
        status: "success",
        stats,
      });
    }

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const mw = mwStr ? parseFloat(mwStr) : 100;

      if (!isNaN(lat) && !isNaN(lng)) {
        const result = getElectricityPriceForLocation(lat, lng, country, state, isNaN(mw) ? 100 : mw);
        return NextResponse.json({
          status: "success",
          lookup: result,
        });
      }
    }

    const allPrices = getGlobalElectricityPrices();
    return NextResponse.json({
      status: "success",
      total: allPrices.length,
      data: allPrices,
    });
  } catch (err: any) {
    console.error("Failed to query electricity prices:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
