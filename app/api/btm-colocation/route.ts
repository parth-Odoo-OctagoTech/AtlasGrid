import { NextRequest, NextResponse } from "next/server";
import { getBtmColocationSites, findNearestBtmColocation } from "@/lib/services/btm-colocation-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const targetMwStr = searchParams.get("targetMw");

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const targetMw = targetMwStr ? parseFloat(targetMwStr) : 250;

      if (!isNaN(lat) && !isNaN(lng)) {
        const nearest = findNearestBtmColocation(lat, lng, targetMw);
        return NextResponse.json({
          status: "success",
          analysis: nearest,
        });
      }
    }

    const allSites = getBtmColocationSites();
    return NextResponse.json({
      status: "success",
      total: allSites.length,
      data: allSites,
    });
  } catch (err: any) {
    console.error("Failed to query BTM co-location sites:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
