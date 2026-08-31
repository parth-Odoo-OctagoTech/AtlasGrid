import { NextRequest, NextResponse } from "next/server";
import cablesData from "@/data/submarine-cables.json";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(cablesData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Failed to fetch cables:", error);
    return NextResponse.json(
      { error: "Internal server error fetching cables" },
      { status: 500 }
    );
  }
}
