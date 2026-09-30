import { NextRequest, NextResponse } from "next/server";
import {
  getHistoricalEarthquakes,
  getHistoricalStorms,
  getHistoricalClimate,
  getAllClimateRecords,
  getDataCenterGrowthTimeline,
  getFacilityHistoricalRisk,
  getHistoricalPowerGeneration,
  getHistoricalLmpPricing,
  getHistoricalQueueBacklog,
  getHistoricalFloodCatastrophes,
  getHistoricalGridEmergencies,
  getDailySnapshotManifest
} from "@/lib/db/historical-repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all_summary";

    if (type === "earthquakes") {
      const minMag = searchParams.get("minMag") ? parseFloat(searchParams.get("minMag")!) : undefined;
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
      const bboxParam = searchParams.get("bbox");
      const bbox = bboxParam
        ? (bboxParam.split(",").map(Number) as [number, number, number, number])
        : undefined;

      const earthquakes = getHistoricalEarthquakes({ minMag, bbox, limit });
      return NextResponse.json({
        success: true,
        count: earthquakes.length,
        earthquakes
      });
    }

    if (type === "storms") {
      const eventType = searchParams.get("eventType") || undefined;
      const minCategory = searchParams.get("minCategory") ? parseInt(searchParams.get("minCategory")!, 10) : undefined;
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
      const bboxParam = searchParams.get("bbox");
      const bbox = bboxParam
        ? (bboxParam.split(",").map(Number) as [number, number, number, number])
        : undefined;

      const storms = getHistoricalStorms({ eventType, minCategory, bbox, limit });
      return NextResponse.json({
        success: true,
        count: storms.length,
        storms
      });
    }

    if (type === "climate") {
      const region = searchParams.get("region");
      if (region) {
        const record = getHistoricalClimate(region);
        if (!record) {
          return NextResponse.json({ success: false, error: "Region not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, climate: record });
      }
      const allRecords = getAllClimateRecords();
      return NextResponse.json({ success: true, count: allRecords.length, regions: allRecords });
    }

    if (type === "dc_growth") {
      const timeline = getDataCenterGrowthTimeline();
      return NextResponse.json({
        success: true,
        count: timeline.length,
        growthTimeline: timeline
      });
    }

    if (type === "power") {
      const startYear = searchParams.get("startYear") ? parseInt(searchParams.get("startYear")!, 10) : undefined;
      const endYear = searchParams.get("endYear") ? parseInt(searchParams.get("endYear")!, 10) : undefined;
      const records = getHistoricalPowerGeneration({ startYear, endYear });
      return NextResponse.json({ success: true, count: records.length, powerGenerationMix: records });
    }

    if (type === "pricing") {
      const startYear = searchParams.get("startYear") ? parseInt(searchParams.get("startYear")!, 10) : undefined;
      const endYear = searchParams.get("endYear") ? parseInt(searchParams.get("endYear")!, 10) : undefined;
      const records = getHistoricalLmpPricing({ startYear, endYear });
      return NextResponse.json({ success: true, count: records.length, wholesaleLmpPricing: records });
    }

    if (type === "queues") {
      const startYear = searchParams.get("startYear") ? parseInt(searchParams.get("startYear")!, 10) : undefined;
      const endYear = searchParams.get("endYear") ? parseInt(searchParams.get("endYear")!, 10) : undefined;
      const records = getHistoricalQueueBacklog({ startYear, endYear });
      return NextResponse.json({ success: true, count: records.length, interconnectionQueueBacklog: records });
    }

    if (type === "floods") {
      const minYear = searchParams.get("minYear") ? parseInt(searchParams.get("minYear")!, 10) : undefined;
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
      const records = getHistoricalFloodCatastrophes({ minYear, limit });
      return NextResponse.json({ success: true, count: records.length, floodCatastrophes: records });
    }

    if (type === "grid_stress") {
      const eventType = searchParams.get("eventType") || undefined;
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
      const records = getHistoricalGridEmergencies({ eventType, limit });
      return NextResponse.json({ success: true, count: records.length, gridContingencies: records });
    }

    if (type === "snapshots") {
      const manifest = getDailySnapshotManifest();
      return NextResponse.json({ success: true, count: manifest.length, snapshots: manifest });
    }

    if (type === "facility_risk") {
      const lat = parseFloat(searchParams.get("lat") || "0");
      const lon = parseFloat(searchParams.get("lon") || "0");
      const radiusKm = parseFloat(searchParams.get("radiusKm") || "100");
      const id = searchParams.get("id") || "query_location";
      const name = searchParams.get("name") || "Target Facility";

      if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json(
          { success: false, error: "Valid lat and lon parameters are required" },
          { status: 400 }
        );
      }

      const riskProfile = getFacilityHistoricalRisk(id, name, lat, lon, radiusKm);
      return NextResponse.json({
        success: true,
        riskProfile
      });
    }

    // Default summary
    const earthquakes = getHistoricalEarthquakes({ limit: 10 });
    const storms = getHistoricalStorms({ limit: 10 });
    const growth = getDataCenterGrowthTimeline();
    const climateRegions = getAllClimateRecords();

    return NextResponse.json({
      success: true,
      summary: {
        totalEarthquakesIndexed: getHistoricalEarthquakes().length,
        totalSevereStormsIndexed: getHistoricalStorms().length,
        climateMarketBaselines: climateRegions.length,
        dcGrowthSpanYears: growth.length,
        powerGenerationYearsSpan: getHistoricalPowerGeneration().length,
        wholesaleLmpYearsSpan: getHistoricalLmpPricing().length,
        interconnectionQueueYearsSpan: getHistoricalQueueBacklog().length,
        floodCatastrophesIndexed: getHistoricalFloodCatastrophes().length,
        gridEmergenciesIndexed: getHistoricalGridEmergencies().length,
        dailySnapshotsArchived: getDailySnapshotManifest().length,
        sampleEarthquakes: earthquakes,
        sampleStorms: storms
      }
    });
  } catch (error: any) {
    console.error("Historical API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query historical data" },
      { status: 500 }
    );
  }
}
