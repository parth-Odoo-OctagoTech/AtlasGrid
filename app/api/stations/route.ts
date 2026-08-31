import { NextRequest, NextResponse } from "next/server";
import { plantRepository } from "@/lib/db/plant-repository";
import { FilterState } from "@/lib/types/filters";
import { FuelType, StationStatus } from "@/lib/types/power-plant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse filters
    const fuelsParam = searchParams.get("fuels");
    const statusesParam = searchParams.get("statuses");
    const minCap = searchParams.get("minCapacity");
    const maxCap = searchParams.get("maxCapacity");
    const region = searchParams.get("region");
    const priceFilter = searchParams.get("priceFilter") as FilterState["priceFilter"];
    const searchQuery = searchParams.get("q") || "";
    const bboxParam = searchParams.get("bbox");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const filters: Partial<FilterState> = {};
    if (fuelsParam) {
      filters.fuelTypes = fuelsParam.split(",") as FuelType[];
    }
    if (statusesParam) {
      filters.statuses = statusesParam.split(",") as StationStatus[];
    }
    if (minCap) {
      filters.minCapacityMw = parseFloat(minCap);
    }
    if (maxCap) {
      filters.maxCapacityMw = parseFloat(maxCap);
    }
    if (region) {
      filters.region = region;
    }
    if (priceFilter) {
      filters.priceFilter = priceFilter;
    }
    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }

    let bbox: [number, number, number, number] | undefined = undefined;
    if (bboxParam) {
      const parts = bboxParam.split(",").map(Number);
      if (parts.length === 4 && !parts.some(isNaN)) {
        bbox = [parts[0], parts[1], parts[2], parts[3]];
      }
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10000;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const result = plantRepository.queryPlants({
      filters,
      bbox,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      total: result.total,
      count: result.plants.length,
      data: result.plants,
    });
  } catch (error) {
    console.error("Error fetching power stations:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
