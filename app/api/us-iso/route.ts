import { NextRequest, NextResponse } from "next/server";
import { usIsoClient } from "@/lib/api/us-iso-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const iso = (searchParams.get("iso") || "CAISO") as "CAISO" | "ERCOT" | "PJM" | "MISO" | "NYISO";

    const result = await usIsoClient.getIsoFuelMix(iso);
    return NextResponse.json(result);
  } catch (err) {
    console.error("US ISO API route error:", err);
    return NextResponse.json(
      { success: false, error: "US ISO Integration Failed" },
      { status: 500 }
    );
  }
}
