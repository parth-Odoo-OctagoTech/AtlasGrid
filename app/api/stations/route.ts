import { NextRequest, NextResponse } from "next/server";
import { plantRepository } from "@/lib/db/plant-repository";
import { FilterState } from "@/lib/types/filters";
import { FuelType, StationStatus } from "@/lib/types/power-plant";
import { checkIpRateLimit } from "@/lib/middleware/rateLimiter";
import { db } from "@/lib/db/pool";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // Rate Limiting Check (100 req/min per IP)
  const rateLimit = checkIpRateLimit(ip, 100, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait before retrying." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    // Parse & validate limit (Clamp to 5000 maximum to mitigate DoS risks)
    const limitParam = searchParams.get("limit");
    let limit = limitParam ? parseInt(limitParam, 10) : 5000;
    if (isNaN(limit) || limit <= 0) limit = 1000;
    if (limit > 5000) limit = 5000; // Security hardening clamp

    const offsetParam = searchParams.get("offset");
    let offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (isNaN(offset) || offset < 0) offset = 0;

    // Parse filters
    const fuelsParam = searchParams.get("fuels");
    const statusesParam = searchParams.get("statuses");
    const minCap = searchParams.get("minCapacity");
    const maxCap = searchParams.get("maxCapacity");
    const region = searchParams.get("region");
    const priceFilter = searchParams.get("priceFilter") as FilterState["priceFilter"];
    const searchQuery = searchParams.get("q") || "";
    const bboxParam = searchParams.get("bbox");

    const filters: Partial<FilterState> = {};
    if (fuelsParam) {
      filters.fuelTypes = fuelsParam.split(",") as FuelType[];
    }
    if (statusesParam) {
      filters.statuses = statusesParam.split(",") as StationStatus[];
    }
    if (minCap) {
      const parsedMin = parseFloat(minCap);
      if (!isNaN(parsedMin)) filters.minCapacityMw = parsedMin;
    }
    if (maxCap) {
      const parsedMax = parseFloat(maxCap);
      if (!isNaN(parsedMax)) filters.maxCapacityMw = parsedMax;
    }
    if (region) {
      filters.region = region;
    }
    if (priceFilter) {
      filters.priceFilter = priceFilter;
    }
    if (searchQuery) {
      filters.searchQuery = searchQuery.slice(0, 100); // Sanitize query length
    }

    // Validate Bounding Box Coordinates: [-180, -90, 180, 90]
    let bbox: [number, number, number, number] | undefined = undefined;
    if (bboxParam) {
      const parts = bboxParam.split(",").map(Number);
      if (
        parts.length === 4 &&
        !parts.some(isNaN) &&
        parts[0] >= -180 && parts[0] <= 180 &&
        parts[1] >= -90 && parts[1] <= 90 &&
        parts[2] >= -180 && parts[2] <= 180 &&
        parts[3] >= -90 && parts[3] <= 90
      ) {
        bbox = [parts[0], parts[1], parts[2], parts[3]];
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid bbox parameters. Longitude must be [-180, 180], Latitude [-90, 90]." },
          { status: 400 }
        );
      }
    }

    const result = plantRepository.queryPlants({
      filters,
      bbox,
      limit,
      offset,
    });

    const latency = Date.now() - startTime;

    // Record audit entry
    db.query("INSERT INTO audit_log (endpoint, status, latency_ms, user_id, ip, error_message) VALUES ($1, $2, $3, $4, $5, $6)", [
      "/api/stations",
      200,
      latency,
      null,
      ip,
      null,
    ]).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        total: result.total,
        count: result.plants.length,
        limit,
        offset,
        data: result.plants,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-Data-Delay-Disclaimer": "Locational Marginal Pricing (LMP) and dispatch metrics are subject to a 15-minute verification delay.",
        },
      }
    );
  } catch (error) {
    logger.error("Error fetching power stations:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
