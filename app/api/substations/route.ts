import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Substation } from "@/lib/types/power-plant";

export const dynamic = "force-dynamic";

let cachedSubstations: Substation[] | null = null;

function getSubstations(): Substation[] {
  if (cachedSubstations) return cachedSubstations;
  try {
    const filePath = path.join(process.cwd(), "data", "substations.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      cachedSubstations = JSON.parse(data);
      return cachedSubstations || [];
    }
  } catch (err) {
    console.error("Error reading substations.json:", err);
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minKv = searchParams.get("minKv") ? parseInt(searchParams.get("minKv")!, 10) : 0;
    const region = searchParams.get("region");
    const country = searchParams.get("country");
    const query = searchParams.get("q")?.toLowerCase();

    let list = getSubstations();

    if (minKv > 0) {
      list = list.filter((s) => s.voltageKv >= minKv);
    }
    if (region && region !== "GLOBAL") {
      list = list.filter((s) => s.gridRegion === region || s.region === region);
    }
    if (country) {
      list = list.filter((s) => s.country.toLowerCase() === country.toLowerCase());
    }
    if (query) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.operator.toLowerCase().includes(query) ||
          s.countryName.toLowerCase().includes(query)
      );
    }

    return NextResponse.json(
      {
        data: list,
        total: list.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Failed to query substations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
