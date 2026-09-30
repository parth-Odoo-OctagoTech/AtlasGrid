import { NextRequest, NextResponse } from "next/server";
import { getInterconnectionQueues, findNearestInterconnectionQueue } from "@/lib/services/interconnection-queue-service";

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
        const nearest = findNearestInterconnectionQueue(lat, lng, targetMw);
        return NextResponse.json({
          status: "success",
          analysis: nearest,
        });
      }
    }

    const allQueues = getInterconnectionQueues();
    return NextResponse.json({
      status: "success",
      total: allQueues.length,
      data: allQueues,
    });
  } catch (err: any) {
    console.error("Failed to query interconnection queues:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
