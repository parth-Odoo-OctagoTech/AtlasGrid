import { NextRequest, NextResponse } from "next/server";
import { getAllDataCenters, getDataCenterSummary } from "@/lib/db/datacenter-repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const operator = searchParams.get("operator");
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const search = searchParams.get("q");
    const summary = searchParams.get("summary");

    if (summary === "true") {
      return NextResponse.json(getDataCenterSummary());
    }

    let list = getAllDataCenters();

    if (operator) {
      const lowOp = operator.toLowerCase();
      list = list.filter((dc) => dc.operator.toLowerCase().includes(lowOp));
    }

    if (category) {
      list = list.filter((dc) => dc.category === category);
    }

    if (region && region !== "GLOBAL") {
      list = list.filter((dc) => dc.region === region || dc.country === region);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (dc) =>
          dc.name.toLowerCase().includes(q) ||
          dc.operator.toLowerCase().includes(q) ||
          dc.country.toLowerCase().includes(q) ||
          dc.region.toLowerCase().includes(q)
      );
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10000;
    const result = list.slice(0, limit);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch datacenters:", error);
    return NextResponse.json(
      { error: "Internal server error fetching datacenters" },
      { status: 500 }
    );
  }
}
