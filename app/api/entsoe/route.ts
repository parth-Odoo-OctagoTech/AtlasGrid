import { NextRequest, NextResponse } from "next/server";
import { entsoeClient } from "@/lib/api/entsoe-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const areaCode = searchParams.get("area") || "10Y1001A1001A83F"; // Germany/France
    const type = searchParams.get("type") || "generation";

    if (type === "prices") {
      const result = await entsoeClient.getDayAheadPrices(areaCode);
      return NextResponse.json(result);
    }

    const now = new Date();
    const startStr = now.toISOString().slice(0, 10).replace(/-/g, "") + "0000";
    const endStr = now.toISOString().slice(0, 10).replace(/-/g, "") + "2300";

    const result = await entsoeClient.getActualGeneration({
      areaCode,
      periodStart: startStr,
      periodEnd: endStr,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("ENTSO-E API route error:", err);
    return NextResponse.json(
      { success: false, error: "ENTSO-E Integration Failed" },
      { status: 500 }
    );
  }
}
