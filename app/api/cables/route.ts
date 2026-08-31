import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

let cachedCables: any = null;

export async function GET(request: NextRequest) {
  try {
    if (cachedCables) {
      return NextResponse.json(cachedCables);
    }

    const filePath = path.join(process.cwd(), "data", "submarine-cables.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ type: "FeatureCollection", features: [] });
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    cachedCables = JSON.parse(raw);

    return NextResponse.json(cachedCables, {
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
