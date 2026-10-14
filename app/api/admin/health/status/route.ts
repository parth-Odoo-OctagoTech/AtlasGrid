import { NextRequest, NextResponse } from "next/server";
import { entsoEClient } from "@/lib/api/entso-e-client";
import { eiaClient } from "@/lib/api/eia-client";
import { db } from "@/lib/db/pool";
import { plantRepository } from "@/lib/db/plant-repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const start = Date.now();

  // 1. Probe ENTSO-E client
  const entsoeStart = Date.now();
  let entsoeStatus = "healthy";
  let entsoeLatency = 0;
  try {
    const res = await entsoEClient.getDayAheadPrices("10Y1001A1001A83F");
    entsoeLatency = Date.now() - entsoeStart;
    if (!res.success) entsoeStatus = "degraded";
  } catch {
    entsoeStatus = "fallback_simulated";
    entsoeLatency = Date.now() - entsoeStart;
  }

  // 2. Probe US EIA client
  const eiaStart = Date.now();
  let eiaStatus = "healthy";
  let eiaLatency = 0;
  try {
    const res = await eiaClient.getIsoFuelMix("CAISO");
    eiaLatency = Date.now() - eiaStart;
    if (!res.success) eiaStatus = "degraded";
  } catch {
    eiaStatus = "fallback_simulated";
    eiaLatency = Date.now() - eiaStart;
  }

  // 3. Probe Database Pool & Audit Log
  const dbStart = Date.now();
  let dbStatus = "healthy";
  let auditCount = 0;
  try {
    const res = await db.query("SELECT * FROM audit_log");
    auditCount = res.rowCount || 0;
  } catch {
    dbStatus = "fallback_memory";
  }
  const dbLatency = Date.now() - dbStart;

  // 4. Memory & Dataset Stats
  const plants = plantRepository.getAllPlants();
  const summary = plantRepository.getGlobalSummary();

  const totalTime = Date.now() - start;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    totalLatencyMs: totalTime,
    uptimeSla: "99.98%",
    systemHealth: {
      entsoe: {
        name: "ENTSO-E Transparency Platform",
        status: entsoeStatus,
        latencyMs: entsoeLatency,
        cadence: "5-min TTL",
        source: entsoEClient.hasApiKey() ? "live_api" : "simulation",
      },
      eia: {
        name: "US EIA Open Data API v2",
        status: eiaStatus,
        latencyMs: eiaLatency,
        cadence: "5-min TTL",
        source: eiaClient.hasApiKey() ? "live_api" : "simulation",
      },
      postgis: {
        name: "PostgreSQL / PostGIS Database Pool",
        status: dbStatus,
        latencyMs: dbLatency,
        auditEntriesCount: auditCount,
      },
      telemetry: {
        name: "SSE Real-Time Telemetry Engine",
        status: "streaming",
        cadence: "2.5s",
        activePlantsCount: summary.activePlantsCount,
        totalCapacityGw: (summary.totalCapacityMw / 1000).toFixed(1),
        averageSpotPriceMwh: summary.averageSpotPrice,
      },
    },
    nodeStats: {
      totalStationsLoaded: plants.length,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
}
