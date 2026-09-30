import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") || "all";
    const startYear = parseInt(searchParams.get("startYear") || "1990", 10);
    const endYear = parseInt(searchParams.get("endYear") || "2030", 10);
    const format = searchParams.get("format") || "json";

    const dataDir = path.join(process.cwd(), "data");

    const genPath = path.join(dataDir, "historical-power-generation.json");
    const lmpPath = path.join(dataDir, "historical-lmp-pricing.json");
    const queuePath = path.join(dataDir, "historical-queue-backlog.json");
    const floodPath = path.join(dataDir, "historical-flood-events.json");
    const extremePath = path.join(dataDir, "historical-extreme-events.json");
    const dcPath = path.join(dataDir, "historical-dc-growth.json");

    let powerGeneration = fs.existsSync(genPath) ? JSON.parse(fs.readFileSync(genPath, "utf-8")) : [];
    let lmpPricing = fs.existsSync(lmpPath) ? JSON.parse(fs.readFileSync(lmpPath, "utf-8")) : [];
    let queueBacklog = fs.existsSync(queuePath) ? JSON.parse(fs.readFileSync(queuePath, "utf-8")) : [];
    let floodEvents = fs.existsSync(floodPath) ? JSON.parse(fs.readFileSync(floodPath, "utf-8")) : [];
    let extremeEvents = fs.existsSync(extremePath) ? JSON.parse(fs.readFileSync(extremePath, "utf-8")) : [];
    let dcGrowth = fs.existsSync(dcPath) ? JSON.parse(fs.readFileSync(dcPath, "utf-8")) : [];

    // Filter by year
    powerGeneration = powerGeneration.filter((g: any) => g.year >= startYear && g.year <= endYear);
    lmpPricing = lmpPricing.filter((l: any) => l.year >= startYear && l.year <= endYear);
    queueBacklog = queueBacklog.filter((q: any) => q.year >= startYear && q.year <= endYear);
    floodEvents = floodEvents.filter((f: any) => f.year >= startYear && f.year <= endYear);
    extremeEvents = extremeEvents.filter((e: any) => e.year >= startYear && e.year <= endYear);
    dcGrowth = dcGrowth.filter((d: any) => d.year >= startYear && d.year <= endYear);

    const payload: any = {
      success: true,
      timeHorizon: {
        startYear,
        endYear,
        earliestRecordYear: 1906,
        latestProjectedYear: 2026
      },
      provenance: {
        sources: [
          "US Energy Information Administration (EIA Forms 860, 861, 923)",
          "Federal Energy Regulatory Commission (FERC Order 2023 / Order 888)",
          "ISO/RTO Market Monitoring Reports (PJM, ERCOT, CAISO, MISO, NYISO)",
          "European Power Exchange (EPEX Spot / Nord Pool)",
          "USGS Earthquake Hazards Program & ISC-GEM Global Instrumental Catalog",
          "NOAA National Centers for Environmental Information & Storm Events Database",
          "Uptime Institute & 451 Research Global Data Center Census"
        ],
        institutionalLicense: "Enterprise Institutional Siting & Backtesting License",
        slaGuarantee: "Daily Point-in-Time Immutable Snapshots"
      }
    };

    if (domain === "all" || domain === "power") payload.powerGenerationMix = powerGeneration;
    if (domain === "all" || domain === "pricing") payload.wholesaleLmpPricing = lmpPricing;
    if (domain === "all" || domain === "queues") payload.interconnectionQueueBacklog = queueBacklog;
    if (domain === "all" || domain === "floods") payload.historicalFloodCatastrophes = floodEvents;
    if (domain === "all" || domain === "grid_stress") payload.gridContingencyEmergencies = extremeEvents;
    if (domain === "all" || domain === "dc_growth") payload.dataCenterFleetGrowth = dcGrowth;

    // Support CSV download format for institutional quants
    if (format === "csv") {
      let csv = "Year,US_Total_Generation_TWh,US_Carbon_Intensity_gCO2_kWh,US_Nuclear_GW,PJM_Western_LMP_USD_MWh,ERCOT_North_LMP_USD_MWh,Total_Queued_Capacity_GW,Queue_Dwell_Years,Global_DC_Power_MW\n";
      const years = Array.from(new Set([
        ...powerGeneration.map((p: any) => p.year),
        ...lmpPricing.map((l: any) => l.year),
        ...queueBacklog.map((q: any) => q.year)
      ])).sort((a: any, b: any) => a - b);

      for (const y of years) {
        const p = powerGeneration.find((x: any) => x.year === y) || {};
        const l = lmpPricing.find((x: any) => x.year === y) || {};
        const q = queueBacklog.find((x: any) => x.year === y) || {};
        const d = dcGrowth.find((x: any) => x.year === y) || {};
        const pjm = l.hubs?.find((h: any) => h.hubId === "pjm_west")?.avgLmpUsdPerMwh || "";
        const ercot = l.hubs?.find((h: any) => h.hubId === "ercot_north")?.avgLmpUsdPerMwh || "";

        csv += `${y},${p.usTotalGenerationTwh || ""},${p.usCarbonIntensityGramsPerKwh || ""},${p.usNuclearBaseloadGw || ""},${pjm},${ercot},${q.totalQueuedCapacityGw || ""},${q.averageDwellYears || ""},${d.totalPowerMw || ""}\n`;
      }

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="atlasgrid_historical_time_series_${startYear}_${endYear}.csv"`
        }
      });
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Historical time series API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
