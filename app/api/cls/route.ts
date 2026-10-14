import { NextRequest, NextResponse } from "next/server";
import { getCableLandingStations, findNearestCableLandingStation } from "@/lib/services/subsea-backhaul-service";
import { getCableLandingStationsByBounds, getNearestCableLandingStationFromDb } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const minLngParam = searchParams.get("minLng");
    const minLatParam = searchParams.get("minLat");
    const maxLngParam = searchParams.get("maxLng");
    const maxLatParam = searchParams.get("maxLat");
    const countryParam = searchParams.get("country")?.toUpperCase();
    const queryParam = searchParams.get("q")?.toLowerCase();
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 100 : limitParam), 500);

    // 1. Nearest neighbor query
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ error: "Invalid latitude [-90, 90] or longitude [-180, 180]" }, { status: 400 });
      }

      const nearestAnalysis = findNearestCableLandingStation(lat, lng);
      return NextResponse.json(
        {
          status: "success",
          query: { latitude: lat, longitude: lng },
          analysis: nearestAnalysis,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    // 2. Bounding Box spatial query
    if (minLngParam && minLatParam && maxLngParam && maxLatParam) {
      const minLng = parseFloat(minLngParam);
      const minLat = parseFloat(minLatParam);
      const maxLng = parseFloat(maxLngParam);
      const maxLat = parseFloat(maxLatParam);

      if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
        const spatialResult = await getCableLandingStationsByBounds(
          { minLng, minLat, maxLng, maxLat },
          { limit }
        );
        return NextResponse.json(
          {
            status: "success",
            bounds: { minLng, minLat, maxLng, maxLat },
            total: spatialResult.total,
            stations: spatialResult.stations,
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          }
        );
      }
    }

    // 3. Global list with optional country and keyword filters
    let stations = getCableLandingStations();

    if (countryParam) {
      stations = stations.filter((s) => s.country.toUpperCase() === countryParam);
    }

    if (queryParam) {
      stations = stations.filter(
        (s) =>
          s.name.toLowerCase().includes(queryParam) ||
          s.operator.toLowerCase().includes(queryParam) ||
          (s.city && s.city.toLowerCase().includes(queryParam)) ||
          s.activeSubseaSystems.some((sys) => sys.toLowerCase().includes(queryParam))
      );
    }

    const total = stations.length;
    const paginated = stations.slice(0, limit);

    return NextResponse.json(
      {
        status: "success",
        total,
        count: paginated.length,
        stations: paginated,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /api/cls route:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Cable Landing Stations", details: error.message },
      { status: 500 }
    );
  }
}
